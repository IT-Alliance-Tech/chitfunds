const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const paymentService = require("../services/paymentService");
const Payment = require("../models/Payment");
const Chit = require("../models/Chit");
const Member = require("../models/Member");
const { generateInvoicePDF } = require("../utils/invoicePdf");
const sendResponse = require("../utils/responseHandler");

/* ================= CREATE / UPDATE PAYMENT ================= */
const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createMonthlyPayment(req.body);

  const chit = await Chit.findById(payment.chitId);
  if (!chit) {
    res.status(404);
    throw new Error("Chit not found");
  }

  const payments = await Payment.find({
    chitId: payment.chitId,
    memberId: payment.memberId,
  });

  // GROUP BY MONTH
  const monthlySummary = {};

  payments.forEach((p) => {
    if (!monthlySummary[p.paymentMonth]) {
      monthlySummary[p.paymentMonth] = {
        paymentMonth: p.paymentMonth,
        payments: [],
        totalPaid: 0,
        status: "unpaid",
      };
    }

    monthlySummary[p.paymentMonth].payments.push(p);
    monthlySummary[p.paymentMonth].totalPaid += p.paidAmount;
  });

  // CALCULATE STATUS PER MONTH
  Object.values(monthlySummary).forEach((m) => {
    if (m.totalPaid >= chit.monthlyPayableAmount) m.status = "paid";
    else if (m.totalPaid > 0) m.status = "partial";
  });

  const totalPaidForChit = payments.reduce((sum, p) => sum + p.paidAmount, 0);

  return sendResponse(res, 201, true, "Payment saved successfully", {
    payment,
    monthlySummary: Object.values(monthlySummary),
    chitSummary: {
      totalMonths: chit.duration,
      paidMonths: Object.values(monthlySummary).filter(
        (m) => m.status === "paid"
      ).length,
      remainingMonths: Math.max(
        chit.duration -
          Object.values(monthlySummary).filter((m) => m.status === "paid")
            .length,
        0
      ),
      totalChitAmount: chit.amount,
      totalPaidForChit,
      remainingTotalChitAmount: Math.max(chit.amount - totalPaidForChit, 0),
    },
  });
});

/* ================= GET ALL PAYMENTS ================= */
const getPayments = asyncHandler(async (req, res) => {
  const {
    chitId,
    memberId,
    paymentMode,
    status,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
  const skip = (pageNum - 1) * limitNum;

  const matchStage = {};

  if (chitId && mongoose.Types.ObjectId.isValid(chitId)) {
    matchStage.chitId = new mongoose.Types.ObjectId(chitId);
  }

  if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
    matchStage.memberId = new mongoose.Types.ObjectId(memberId);
  }

  if (paymentMode) {
    matchStage.paymentMode = paymentMode;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "chits",
        localField: "chitId",
        foreignField: "_id",
        as: "chitDetails",
      },
    },
    { $unwind: "$chitDetails" },
    {
      $lookup: {
        from: "members",
        localField: "memberId",
        foreignField: "_id",
        as: "memberDetails",
      },
    },
    { $unwind: "$memberDetails" },
    {
      $addFields: {
        totalPaid: { $add: ["$paidAmount", "$penaltyAmount"] },
        computedStatus: {
          $cond: {
            if: { $gte: ["$paidAmount", "$chitDetails.monthlyPayableAmount"] },
            then: "paid",
            else: {
              $cond: {
                if: { $lt: ["$dueDate", new Date()] },
                then: "overdue",
                else: {
                  $cond: {
                    if: { $gt: ["$paidAmount", 0] },
                    then: "partial",
                    else: "pending",
                  },
                },
              },
            },
          },
        },
      },
    },
  ];

  // Add status filter to pipeline if provided
  if (status) {
    pipeline.push({ $match: { computedStatus: status } });
  }

  // Count before pagination but after status filter
  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await Payment.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  // Final pipeline with sorting and pagination
  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limitNum });
  pipeline.push({
    $project: {
      _id: 1,
      invoiceNumber: 1,
      paidAmount: 1,
      penaltyAmount: 1,
      totalPaid: 1,
      paymentMonth: 1,
      paymentYear: 1,
      paymentDate: 1,
      dueDate: 1,
      paymentMode: 1,
      status: "$computedStatus",
      chitId: {
        _id: "$chitDetails._id",
        chitName: "$chitDetails.chitName",
        amount: "$chitDetails.amount",
        duration: "$chitDetails.duration",
        location: "$chitDetails.location",
      },
      memberId: {
        _id: "$memberDetails._id",
        name: "$memberDetails.name",
        phone: "$memberDetails.phone",
        address: "$memberDetails.address",
      },
    },
  });

  const payments = await Payment.aggregate(pipeline);

  return sendResponse(res, 200, true, "Payments fetched successfully", {
    items: payments,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

/* ================= GET PAYMENT BY ID ================= */
const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Payment ID");
  }

  const payment = await Payment.findById(id)
    .populate(
      "chitId",
      "chitName amount duration monthlyPayableAmount location"
    )
    .populate("memberId", "name phone address");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  // Status calculation (same as aggregation)
  if (payment.paidAmount >= payment.chitId?.monthlyPayableAmount) {
    payment.status = "paid";
  } else if (new Date(payment.dueDate) < new Date()) {
    payment.status = "overdue";
  } else if (payment.paidAmount > 0) {
    payment.status = "partial";
  } else {
    payment.status = "pending";
  }

  payment.totalPaid = (payment.paidAmount || 0) + (payment.penaltyAmount || 0);

  return sendResponse(res, 200, true, "Payment fetched successfully", {
    payment,
  });
});

/* ================= PAYMENT HISTORY ================= */
/* ================= PAYMENT HISTORY ================= */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { memberId, chitId } = req.query;

  if (!memberId || !chitId) {
    res.status(400);
    throw new Error("memberId and chitId are required");
  }

  const chit = await Chit.findById(chitId);
  if (!chit) {
    res.status(404);
    throw new Error("Chit not found");
  }

  const payments = await Payment.find({ memberId, chitId }).sort({
    paymentYear: -1,
    paymentMonth: -1,
  });

  // Enrich payments with computed fields
  const enrichedPayments = payments.map((p) => {
    const payment = p.toObject();
    payment.totalPaid =
      (payment.paidAmount || 0) + (payment.penaltyAmount || 0);

    // Provide monthly payable for frontend reference
    payment.monthlyPayableAmount = chit.monthlyPayableAmount;

    // Calculate Status
    if (payment.paidAmount >= chit.monthlyPayableAmount) {
      payment.status = "paid";
    } else if (new Date(payment.dueDate) < new Date()) {
      payment.status = "overdue";
    } else if (payment.paidAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "pending";
    }

    return payment;
  });

  return sendResponse(res, 200, true, "Payment history fetched successfully", {
    payments: enrichedPayments,
  });
});

/* ================= EXPORT INVOICE PDF ================= */
const exportInvoicePdf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate("chitId")
    .populate("memberId");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  // Calculate missing fields for PDF generator
  payment.totalPaid = (payment.paidAmount || 0) + (payment.penaltyAmount || 0);
  if (payment.paidAmount >= payment.chitId?.monthlyPayableAmount) {
    payment.status = "paid";
  } else if (new Date(payment.dueDate) < new Date()) {
    payment.status = "overdue";
  } else if (payment.paidAmount > 0) {
    payment.status = "partial";
  } else {
    payment.status = "pending";
  }

  // PDF stream response (no sendResponse here)
  generateInvoicePDF(res, payment);
});

/* ================= ADMIN CONFIRM PAYMENT ================= */
const confirmPaymentByAdmin = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.isAdminConfirmed) {
    res.status(400);
    throw new Error("Payment already confirmed");
  }

  payment.isAdminConfirmed = true;
  await payment.save();

  return sendResponse(res, 200, true, "Payment confirmed by admin", {
    payment,
  });
});

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentHistory,
  exportInvoicePdf,
  confirmPaymentByAdmin,
};

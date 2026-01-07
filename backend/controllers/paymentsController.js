const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Chit = require("../models/Chit");
const Member = require("../models/Member");
const { generateInvoicePDF } = require("../utils/invoicePdf");
const sendResponse = require("../utils/response");

// Helper: Normalize Date to 00:00:00
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper: Get Month and Year
const getMonthYear = (date = new Date()) => {
  const d = new Date(date);
  return {
    paymentMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`,
    paymentYear: d.getFullYear(),
  };
};

// create payment
const createPayment = async (req, res) => {
  try {
    const {
      chitId,
      memberId,
      paymentDate: pDate,
      paidAmount,
      penaltyAmount,
      interestPercent,
      dueDate,
      paymentMode,
      slotsPaid,
    } = req.body;

    const chit = await Chit.findById(chitId);
    if (!chit) {
      return sendResponse(
        res,
        404,
        "error",
        "Chit not found",
        null,
        "Resource Missing"
      );
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return sendResponse(res, 404, "error", "Member not found");
    }

    const chitAssignment = member?.chits?.find(
      (c) => c.chitId.toString() === chitId.toString()
    );
    const totalAssignedSlots = chitAssignment?.slots || 1;
    const finalSlotsPaid = Number(slotsPaid || totalAssignedSlots);

    const dateObj = pDate ? new Date(pDate) : new Date();
    let finalDueDate = dueDate;

    if (
      typeof dueDate === "number" ||
      (!isNaN(Number(dueDate)) && String(dueDate).length <= 2)
    ) {
      const d = new Date(dateObj);
      d.setDate(Number(dueDate));
      d.setHours(0, 0, 0, 0);
      finalDueDate = d;
    } else if (typeof dueDate === "string" && dueDate !== "") {
      finalDueDate = normalizeDate(dueDate);
    } else {
      finalDueDate = normalizeDate(chit.calculatedDueDate || dateObj);
    }

    let calculatedPenalty = Number(penaltyAmount || 0);
    const normalizedPaymentDate = normalizeDate(dateObj);
    const normalizedDueDate = normalizeDate(finalDueDate);

    if (normalizedPaymentDate > normalizedDueDate) {
      const effectiveInterest = Number(interestPercent || 10);
      calculatedPenalty =
        (Number(chit.monthlyPayableAmount) *
          finalSlotsPaid *
          effectiveInterest) /
        100;
    }
    let { paymentMonth, paymentYear } = getMonthYear(dateObj);

    // If paymentMonth is provided in format "YYYY-MM", use it directly
    if (req.body.paymentMonth && req.body.paymentMonth.includes("-")) {
      paymentMonth = req.body.paymentMonth;
      paymentYear = Number(paymentMonth.split("-")[0]);
    }

    const payment = await Payment.create({
      chitId,
      memberId,
      paymentMonth: String(paymentMonth),
      paymentYear: Number(paymentYear),
      slots: finalSlotsPaid,
      paidAmount: Number(paidAmount),
      penaltyAmount: calculatedPenalty,
      dueDate: finalDueDate,
      paymentMode,
      paymentDate: dateObj,
      invoiceNumber: `INV-${Date.now()}`,
      isAdminConfirmed: false,
    });

    const payments = await Payment.find({ chitId, memberId });

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
      const totalRequired = chit.monthlyPayableAmount * totalAssignedSlots;
      if (m.totalPaid >= totalRequired) m.status = "paid";
      else if (m.totalPaid > 0) m.status = "partial";
    });

    const totalPaidForChit = payments.reduce((sum, p) => sum + p.paidAmount, 0);

    return sendResponse(res, 201, "success", "Payment saved successfully", {
      payment,
      monthlySummary: Object.values(monthlySummary),
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// get payments
const getPayments = async (req, res) => {
  try {
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
              if: {
                $gte: [
                  "$paidAmount",
                  {
                    $multiply: ["$chitDetails.monthlyPayableAmount", "$slots"],
                  },
                ],
              },
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

    if (status) {
      pipeline.push({ $match: { computedStatus: status } });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Payment.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });
    pipeline.push({
      $project: {
        _id: 1,
        paymentId: 1,
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
          monthlyPayableAmount: "$chitDetails.monthlyPayableAmount",
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

    return sendResponse(res, 200, "success", "Payments fetched successfully", {
      items: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// get payment by id
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(
        res,
        400,
        "error",
        "Invalid Payment ID",
        null,
        "Bad Request"
      );
    }

    const payment = await Payment.findById(id)
      .populate(
        "chitId",
        "chitName amount duration monthlyPayableAmount location"
      )
      .populate("memberId", "name phone address");

    if (!payment) {
      return sendResponse(
        res,
        404,
        "error",
        "Payment not found",
        null,
        "Resource Missing"
      );
    }

    if (payment.paidAmount >= payment.chitId?.monthlyPayableAmount) {
      payment.status = "paid";
    } else if (new Date(payment.dueDate) < new Date()) {
      payment.status = "overdue";
    } else if (payment.paidAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "pending";
    }

    payment.totalPaid =
      (payment.paidAmount || 0) + (payment.penaltyAmount || 0);

    return sendResponse(res, 200, "success", "Payment fetched successfully", {
      payment,
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const { memberId, chitId } = req.query;

    if (!memberId || !chitId) {
      return sendResponse(
        res,
        400,
        "error",
        "memberId and chitId are required",
        null,
        "Validation Error"
      );
    }

    const chit = await Chit.findById(chitId);
    if (!chit) {
      return sendResponse(
        res,
        404,
        "error",
        "Chit not found",
        null,
        "Resource Missing"
      );
    }

    const payments = await Payment.find({ memberId, chitId }).sort({
      paymentYear: -1,
      paymentMonth: -1,
    });

    const enrichedPayments = payments.map((p) => {
      const payment = p.toObject();
      const slots = payment.slots || 1;
      const totalRequired = chit.monthlyPayableAmount * slots;

      payment.totalPaid =
        (payment.paidAmount || 0) + (payment.penaltyAmount || 0);
      payment.monthlyPayableAmount = totalRequired;

      if (payment.paidAmount >= totalRequired) {
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

    return sendResponse(
      res,
      200,
      "success",
      "Payment history fetched successfully",
      {
        payments: enrichedPayments,
      }
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// export invoice pdf
const exportInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate("chitId")
      .populate("memberId");

    if (!payment) {
      return sendResponse(
        res,
        404,
        "error",
        "Payment not found",
        null,
        "Resource Missing"
      );
    }

    payment.totalPaid =
      (payment.paidAmount || 0) + (payment.penaltyAmount || 0);

    const monthlyPayable = payment.chitId?.monthlyPayableAmount || 0;
    const slots = payment.slots || 1;
    const totalRequired = monthlyPayable * slots;

    if (payment.paidAmount >= totalRequired) {
      payment.status = "paid";
    } else if (new Date(payment.dueDate) < new Date()) {
      payment.status = "overdue";
    } else if (payment.paidAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "pending";
    }

    return await generateInvoicePDF(res, payment);
  } catch (error) {
    console.error("Error in exportInvoicePdf:", error);
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// confirm payment by admin
const confirmPaymentByAdmin = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return sendResponse(
        res,
        404,
        "error",
        "Payment not found",
        null,
        "Resource Missing"
      );
    }

    if (payment.isAdminConfirmed) {
      return sendResponse(
        res,
        400,
        "error",
        "Payment already confirmed",
        null,
        "Validation Error"
      );
    }

    payment.isAdminConfirmed = true;
    await payment.save();

    return sendResponse(res, 200, "success", "Payment confirmed by admin", {
      payment,
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

const { generatePaymentsExcel } = require("../utils/excelExport");

// export payments to excel
const exportPaymentsExcel = async (req, res) => {
  try {
    const { chitId, memberId, paymentMode, status } = req.query;

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
          computedStatus: {
            $cond: {
              if: {
                $gte: [
                  "$paidAmount",
                  {
                    $multiply: [
                      "$chitDetails.monthlyPayableAmount",
                      { $ifNull: ["$slots", 1] },
                    ],
                  },
                ],
              },
            },
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
    ];

    if (status) {
      pipeline.push({ $match: { computedStatus: status } });
    }

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({
      $project: {
        _id: 1,
        invoiceNumber: 1,
        paidAmount: 1,
        penaltyAmount: 1,
        paymentDate: 1,
        dueDate: 1,
        paymentMode: 1,
        status: "$computedStatus",
        chitId: { chitName: "$chitDetails.chitName" },
        memberId: {
          name: "$memberDetails.name",
          phone: "$memberDetails.phone",
        },
      },
    });

    const payments = await Payment.aggregate(pipeline);

    const buffer = await generatePaymentsExcel(payments);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `Payments_Report_${Date.now()}.xlsx`
    );

    return res.end(buffer);
  } catch (error) {
    console.error("Excel Export Error:", error);
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// get payment status for a member in a specific month
const getPaymentStatus = async (req, res) => {
  try {
    const { chitId, memberId, paymentMonth } = req.query;

    if (!chitId || !memberId || !paymentMonth) {
      return sendResponse(
        res,
        400,
        "error",
        "chitId, memberId, and paymentMonth are required"
      );
    }

    let query = { chitId, memberId, paymentMonth };
    if (paymentMonth.includes("-")) {
      const parts = paymentMonth.split("-");
      const year = Number(parts[0]);
      const month = parts[1];
      query = {
        chitId,
        memberId,
        $or: [{ paymentMonth }, { paymentMonth: month, paymentYear: year }],
      };
    }

    const [chit, member, previousPayments] = await Promise.all([
      Chit.findById(chitId).lean(),
      Member.findById(memberId).lean(),
      Payment.find(query).lean(),
    ]);

    if (!chit || !member) {
      return sendResponse(res, 404, "error", "Chit or Member not found");
    }

    const chitAssignment = member.chits?.find(
      (c) => (c.chitId?._id || c.chitId).toString() === chitId.toString()
    );
    const totalSlots = chitAssignment?.slots || 1;
    const paidSlots = previousPayments.reduce(
      (sum, p) => sum + (p.slots || 1),
      0
    );
    const totalPaidAmount = previousPayments.reduce(
      (sum, p) => sum + p.paidAmount,
      0
    );

    // Also check for any unpaid months prior to this one
    // We'll simplify: just check if there are any months between chit start and current month that don't have full payments
    // This is more complex, but let's start with basic status for now.

    const status = {
      totalSlots,
      paidSlots,
      remainingSlots: Math.max(0, totalSlots - paidSlots),
      monthlyAmount: chit.monthlyPayableAmount,
      totalPaidAmount,
      isFullyPaid: paidSlots >= totalSlots,
      dueDate: chit.dueDate,
      calculatedDueDate: chit.calculatedDueDate,
    };

    return sendResponse(res, 200, "success", "Payment status fetched", status);
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentHistory,
  exportInvoicePdf,
  exportPaymentsExcel,
  confirmPaymentByAdmin,
  getPaymentStatus,
};

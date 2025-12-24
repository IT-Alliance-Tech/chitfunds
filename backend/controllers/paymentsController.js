const asyncHandler = require("express-async-handler");

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
  const payments = await Payment.find()
    .populate("chitId", "chitName amount duration")
    .populate("memberId", "name phone")
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, true, "Payments fetched successfully", {
    payments,
  });
});

/* ================= GET PAYMENT BY ID ================= */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("chitId", "chitName amount duration")
    .populate("memberId", "name phone");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  return sendResponse(res, 200, true, "Payment fetched successfully", {
    payment,
  });
});

/* ================= PAYMENT HISTORY ================= */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { memberId, chitId } = req.query;

  if (!memberId || !chitId) {
    res.status(400);
    throw new Error("memberId and chitId are required");
  }

  const payments = await paymentService.getPaymentsByMemberAndChit(
    memberId,
    chitId
  );

  return sendResponse(res, 200, true, "Payment history fetched successfully", {
    payments,
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

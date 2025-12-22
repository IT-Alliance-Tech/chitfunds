const asyncHandler = require("express-async-handler");
const paymentService = require("../services/paymentService");
const Payment = require("../models/Payment");
const Chit = require("../models/Chit");
const Member = require("../models/Member");
const { generateInvoicePDF } = require("../utils/invoicePdf");
const sendResponse = require("../utils/responseHandler");

// create or update payment
const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.upsertMonthlyPayment(req.body);

  const chit = await Chit.findById(payment.chitId);
  if (!chit) {
    res.status(404);
    throw new Error("Chit not found");
  }

  const payments = await Payment.find({
    chitId: payment.chitId,
    memberId: payment.memberId,
  });

  const totalPaidForChit = payments.reduce((sum, p) => sum + p.paidAmount, 0);

  return sendResponse(res, 201, true, "Payment saved successfully", {
    ...payment.toObject(),
    summary: {
      totalMonths: chit.duration,
      paidMonths: payments.length,
      remainingMonths: Math.max(chit.duration - payments.length, 0),
      totalChitAmount: chit.amount,
      // lateFee: payment.penaltyAmount || 0,
      totalPaidForChit,
      remainingTotalChitAmount: Math.max(chit.amount - totalPaidForChit, 0),
    },
  });
});

// get all payments
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("chitId", "chitName amount duration")
    .populate("memberId", "name phone")
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, true, "Payments fetched successfully", {
    payments,
  });
});

// get payment by id
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

// get payment history
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

// export invoice pdf
const exportInvoicePdf = asyncHandler(async (req, res) => {
  const { id } = req.params; 

  const payment = await Payment.findById(id)
    .populate("chitId")
    .populate("memberId");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  generateInvoicePDF(res, payment);
});

// admin confirm payment
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

  return sendResponse(res, 200, true, "Payment confirmed by admin", payment);
});

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentHistory,
  exportInvoicePdf,
  confirmPaymentByAdmin,
};

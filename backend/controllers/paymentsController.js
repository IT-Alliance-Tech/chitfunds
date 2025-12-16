const asyncHandler = require("express-async-handler");
const paymentService = require("../services/paymentService");
const Payment = require("../models/Payment");
const Chit = require("../models/Chit");

const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.upsertMonthlyPayment(req.body);

  const chit = await Chit.findById(payment.chitId);
  const payments = await Payment.find({
    chitId: payment.chitId,
    memberId: payment.memberId,
  });

  const totalPaidForChit = payments.reduce((sum, p) => sum + p.paidAmount, 0);

  res.status(201).json({
    success: true,
    data: {
      ...payment.toObject(),
      summary: {
        totalMonths: chit.duration,
        paidMonths: payments.length,
        remainingMonths: Math.max(chit.duration - payments.length, 0),
        totalChitAmount: chit.amount,
        totalPaidForChit,
        remainingTotalChitAmount: Math.max(chit.amount - totalPaidForChit, 0),
      },
    },
  });
});

const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("chitId", "chitName amount duration")
    .populate("memberId", "name phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: payments });
});

const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("chitId", "chitName amount duration")
    .populate("memberId", "name phone");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  res.json({ success: true, data: payment });
});

const getPaymentHistory = asyncHandler(async (req, res) => {
  const { memberId, chitId } = req.query;

  if (!memberId || !chitId) {
    return res.status(400).json({
      success: false,
      message: "memberId and chitId are required",
    });
  }

  const payments = await paymentService.getPaymentsByMemberAndChit(
    memberId,
    chitId
  );

  res.json({ success: true, data: payments });
});

const exportInvoicePdf = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Invoice export not implemented yet",
  });
});

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentHistory,
  exportInvoicePdf,
};

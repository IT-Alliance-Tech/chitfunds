const asyncHandler = require("express-async-handler");
const paymentService = require("../services/paymentService");
const Payment = require("../models/Payment");
const Chit = require("../models/Chit");

// create payment
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
    message: "Payment saved successfully",
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

//list payments
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("chitId", "chitName amount duration")
    .populate("memberId", "name phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: payments });
});

// view payment
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("chitId", "chitName amount duration")
    .populate("memberId", "name phone");

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  res.json({ success: true, data: payment });
});

// Member history

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

// Export invoice

const exportInvoicePdf = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Invoice export not implemented yet",
  });
});

// Admin confirm

const confirmPaymentByAdmin = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  if (payment.isAdminConfirmed) {
    return res.status(400).json({
      success: false,
      message: "Payment already confirmed",
    });
  }

  //  Admin confirmation
  payment.isAdminConfirmed = true;
  await payment.save();

  res.status(200).json({
    success: true,
    message: "Payment confirmed by admin",
    data: payment,
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

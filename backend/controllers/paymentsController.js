const asyncHandler = require("express-async-handler");
const paymentService = require("../services/paymentService");
const Payment = require("../models/Payment");
const Chit = require("../models/Chit");


exports.createPayment = asyncHandler(async (req, res) => {
  //  Create monthly payment
  const payment = await paymentService.createPayment(req.body);

  // Fetch chit
  const chit = await Chit.findById(payment.chitId);

  //  Fetch all payments for this member + chit
  const payments = await Payment.find({
    chitId: payment.chitId,
    memberId: payment.memberId,
  });

  //  Derive summary values (INLINE – no new files)
  const paidMonths = payments.length;

  const remainingMonths = Math.max(chit.duration - paidMonths, 0);

  const totalPaidForChit = payments.reduce(
    (sum, p) => sum + p.paidAmount,
    0
  );

  const remainingTotalChitAmount = Math.max(
    chit.amount - totalPaidForChit,
    0
  );

  // Response
  res.status(201).json({
    success: true,
    data: {
      ...payment.toObject(),
      summary: {
        totalMonths: chit.duration,
        paidMonths,
        remainingMonths,
        totalChitAmount: chit.amount,
        totalPaidForChit,
        remainingTotalChitAmount,
      },
    },
  });
});


exports.getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("chitId", "chitName amount monthlyPayableAmount duration")
    .populate("memberId", "name phone")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: payments });
});


exports.getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate("chitId", "chitName amount monthlyPayableAmount duration")
    .populate("memberId", "name phone");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  res.json({ success: true, data: payment });
});


exports.exportInvoicePdf = asyncHandler(async (req, res) => {
  res
    .status(501)
    .json({ success: false, message: "Invoice export not implemented yet" });
});

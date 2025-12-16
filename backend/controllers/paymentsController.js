const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');

const sendResponse = require("../utils/responseHandler");

// create payment
exports.createPayment = asyncHandler(async (req, res) => {
  const payload = req.body;
  const p = new Payment(payload);
  await p.save();
  return sendResponse(res, 201, true, "Payment created", { result: p });
});

// list payments
exports.getPayments = asyncHandler(async (req, res) => {
  const items = await Payment.find().populate('member chit');
  return sendResponse(res, 200, true, "Payments retrieved", { result: items });
});

// get payment
exports.getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const p = await Payment.findById(id).populate('member chit');
  if (!p) {
    res.status(404);
    throw new Error("Payment not found");
  }
  return sendResponse(res, 200, true, "Payment retrieved", { result: p });
});

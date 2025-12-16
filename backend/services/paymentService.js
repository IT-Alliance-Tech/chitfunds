const Payment = require("../models/Payment");
const Chit = require("../models/Chit");
exports.createPayment = async (payload) => {
  const chit = await Chit.findById(payload.chitId);
  if (!chit) throw new Error("Chit not found");

  const monthlyPayableAmount = chit.monthlyPayableAmount;

  // 🔍 Check if payment for this month already exists
  const existingPayment = await Payment.findOne({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth: payload.paymentMonth,
  });

  // Convert numbers safely
  const newPaidAmount = Number(payload.paidAmount);
  const newPenalty = Number(payload.penaltyAmount || 0);

  if (existingPayment) {
    // 🟢 UPDATE EXISTING MONTH
    const updatedPaidAmount = existingPayment.paidAmount + newPaidAmount;
    const updatedPenalty = existingPayment.penaltyAmount + newPenalty;

    const balanceAmount = Math.max(monthlyPayableAmount - updatedPaidAmount, 0);

    const status =
      updatedPaidAmount === 0
        ? "unpaid"
        : balanceAmount === 0
        ? "paid"
        : "partial";

    existingPayment.paidAmount = updatedPaidAmount;
    existingPayment.penaltyAmount = updatedPenalty;
    existingPayment.balanceAmount = balanceAmount;
    existingPayment.totalPaid = updatedPaidAmount + updatedPenalty;
    existingPayment.status = status;

    await existingPayment.save();
    return existingPayment;
  }

  
  const balanceAmount = Math.max(monthlyPayableAmount - newPaidAmount, 0);

  const status =
    newPaidAmount === 0 ? "unpaid" : balanceAmount === 0 ? "paid" : "partial";

  return Payment.create({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth: payload.paymentMonth,
    paymentYear: payload.paymentYear,
    monthlyPayableAmount,
    paidAmount: newPaidAmount,
    penaltyAmount: newPenalty,
    balanceAmount,
    totalPaid: newPaidAmount + newPenalty,
    status,
    dueDate: payload.dueDate,
    paymentMode: payload.paymentMode,
    invoiceNumber: `INV-${Date.now()}`,
  });
};

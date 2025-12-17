const Payment = require("../models/Payment");
const Chit = require("../models/Chit");

const calculateStatus = (monthlyAmount, paidAmount) => {
  if (paidAmount === 0) return "unpaid";
  if (paidAmount >= monthlyAmount) return "paid";
  return "partial";
};

const upsertMonthlyPayment = async (payload) => {
  const chit = await Chit.findById(payload.chitId);
  if (!chit) throw new Error("Chit not found");

  const monthlyPayableAmount = chit.monthlyPayableAmount;
  const paidAmount = Number(payload.paidAmount);
  const penaltyAmount = Number(payload.penaltyAmount || 0);

  const existingPayment = await Payment.findOne({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth: payload.paymentMonth,
  });

  if (existingPayment) {
    const updatedPaid = existingPayment.paidAmount + paidAmount;
    const updatedPenalty = existingPayment.penaltyAmount + penaltyAmount;

    existingPayment.paidAmount = updatedPaid;
    existingPayment.penaltyAmount = updatedPenalty;
    existingPayment.balanceAmount = Math.max(
      monthlyPayableAmount - updatedPaid,
      0
    );
    existingPayment.totalPaid = updatedPaid + updatedPenalty;
    existingPayment.status = calculateStatus(monthlyPayableAmount, updatedPaid);
    existingPayment.isAdminConfirmed = false;

    return existingPayment.save();
  }

  return Payment.create({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth: payload.paymentMonth,
    paymentYear: payload.paymentYear,
    monthlyPayableAmount,
    paidAmount,
    penaltyAmount,
    balanceAmount: Math.max(monthlyPayableAmount - paidAmount, 0),
    totalPaid: paidAmount + penaltyAmount,
    status: calculateStatus(monthlyPayableAmount, paidAmount),
    dueDate: payload.dueDate,
    paymentMode: payload.paymentMode,
    invoiceNumber: `INV-${Date.now()}`,
    isAdminConfirmed: false,
  });
};

const getPaymentsByMemberAndChit = (memberId, chitId) => {
  return Payment.find({ memberId, chitId }).sort({
    paymentYear: 1,
    paymentMonth: 1,
  });
};

module.exports = {
  upsertMonthlyPayment,
  getPaymentsByMemberAndChit,
};

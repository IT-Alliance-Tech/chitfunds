const Payment = require("../models/Payment");
const Chit = require("../models/Chit");

const calculateStatus = (monthlyAmount, totalPaidForMonth) => {
  if (totalPaidForMonth === 0) return "unpaid";
  if (totalPaidForMonth >= monthlyAmount) return "paid";
  return "partial";
};

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

/**
 * IMPORTANT:
 * Function name kept as upsertMonthlyPayment
 * BUT it always CREATES a new payment
 */
const upsertMonthlyPayment = async (payload) => {
  const chit = await Chit.findById(payload.chitId);
  if (!chit) throw new Error("Chit not found");

  const paymentDate = payload.paymentDate
    ? new Date(payload.paymentDate)
    : new Date();

  const { paymentMonth, paymentYear } = getMonthYear(paymentDate);

  const existingPayments = await Payment.find({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth,
  });

  const totalPaidBefore = existingPayments.reduce(
    (sum, p) => sum + p.paidAmount,
    0
  );

  const paidAmount = Number(payload.paidAmount || 0);
  const penaltyAmount = Number(payload.penaltyAmount || 0);
  const totalPaidAfter = totalPaidBefore + paidAmount;

  return Payment.create({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth,
    paymentYear,
    monthlyPayableAmount: chit.monthlyPayableAmount,
    paidAmount,
    penaltyAmount,
    balanceAmount: Math.max(chit.monthlyPayableAmount - totalPaidAfter, 0),
    totalPaid: totalPaidAfter + penaltyAmount,
    status: calculateStatus(chit.monthlyPayableAmount, totalPaidAfter),
    dueDate: payload.dueDate,
    paymentMode: payload.paymentMode,
    invoiceNumber: `INV-${Date.now()}`,
    isAdminConfirmed: false,
    paymentDate,
  });
};

const getPaymentsByMemberAndChit = (memberId, chitId) => {
  return Payment.find({ memberId, chitId }).sort({
    paymentYear: 1,
    paymentMonth: 1,
    createdAt: 1,
  });
};

module.exports = {
  upsertMonthlyPayment,
  getPaymentsByMemberAndChit,
};

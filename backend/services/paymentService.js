const Payment = require("../models/Payment");
const Chit = require("../models/Chit");

/* ================= HELPERS ================= */
const calculateStatus = (monthlyAmount, totalPaidForMonth) => {
  if (totalPaidForMonth === 0) return "unpaid";
  if (totalPaidForMonth >= monthlyAmount) return "paid";
  return "partial";
};

const getPaymentMonthYear = (date = new Date()) => {
  const d = new Date(date);
  return {
    paymentMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`,
    paymentYear: d.getFullYear(),
  };
};

/* ================= CREATE PAYMENT (NO UPSERT) ================= */
const createMonthlyPayment = async (payload) => {
  const chit = await Chit.findById(payload.chitId);
  if (!chit) throw new Error("Chit not found");

  const monthlyPayableAmount = chit.monthlyPayableAmount;
  const paidAmount = Number(payload.paidAmount || 0);
  const penaltyAmount = Number(payload.penaltyAmount || 0);

  const paymentDate = payload.paymentDate
    ? new Date(payload.paymentDate)
    : new Date();

  const { paymentMonth, paymentYear } = getPaymentMonthYear(paymentDate);

  // 🔹 Calculate total paid so far in THIS MONTH (before this payment)
  const existingMonthPayments = await Payment.find({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth,
  });

  const totalPaidBefore = existingMonthPayments.reduce(
    (sum, p) => sum + p.paidAmount,
    0
  );

  const totalPaidAfter = totalPaidBefore + paidAmount;

  return Payment.create({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth,
    paymentYear,
    monthlyPayableAmount,
    paidAmount,
    penaltyAmount,
    balanceAmount: Math.max(monthlyPayableAmount - totalPaidAfter, 0),
    totalPaid: totalPaidAfter + penaltyAmount,
    status: calculateStatus(monthlyPayableAmount, totalPaidAfter),
    dueDate: payload.dueDate,
    paymentMode: payload.paymentMode,
    invoiceNumber: `INV-${Date.now()}`,
    isAdminConfirmed: false, // admin must confirm each entry
    paymentDate,
  });
};

/* ================= GET PAYMENT HISTORY ================= */
const getPaymentsByMemberAndChit = (memberId, chitId) => {
  return Payment.find({ memberId, chitId }).sort({
    paymentYear: 1,
    paymentMonth: 1,
    createdAt: 1,
  });
};

module.exports = {
  createMonthlyPayment,
  getPaymentsByMemberAndChit,
};

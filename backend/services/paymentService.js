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

const createMonthlyPayment = async (payload) => {
  const chit = await Chit.findById(payload.chitId);
  if (!chit) throw new Error("Chit not found");

  const paymentDate = payload.paymentDate
    ? new Date(payload.paymentDate)
    : new Date();

  const { paymentMonth, paymentYear } = getMonthYear(paymentDate);

  return Payment.create({
    chitId: payload.chitId,
    memberId: payload.memberId,
    paymentMonth,
    paymentYear,
    paidAmount: Number(payload.paidAmount),
    penaltyAmount: Number(payload.penaltyAmount || 0),
    dueDate: payload.dueDate,
    paymentMode: payload.paymentMode,
    paymentDate,
    invoiceNumber: `INV-${Date.now()}`,
    isAdminConfirmed: false,
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
  createMonthlyPayment,
  getPaymentsByMemberAndChit,
};
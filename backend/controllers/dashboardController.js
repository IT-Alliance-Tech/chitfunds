const asyncHandler = require("express-async-handler");

const Chit = require("../models/Chit");
const Member = require("../models/Member");
const Payment = require("../models/Payment");
const sendResponse = require("../utils/responseHandler");

// ================= DASHBOARD ANALYTICS =================
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalChits, activeChits, closedChits, allChits, chitAmountAgg] =
    await Promise.all([
      Chit.countDocuments(),
      Chit.countDocuments({ status: "Active" }),
      Chit.countDocuments({ status: { $in: ["Closed", "Completed"] } }),
      Chit.find().select("_id amount duration"),
      Chit.aggregate([
        {
          $group: {
            _id: null,
            totalChitAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

  const totalChitAmount = chitAmountAgg[0]?.totalChitAmount || 0;

  const activeChitIds = await Chit.find({ status: "Active" }).distinct("_id");

  const [totalMembers, activeMembers, inactiveMembers, membersInActiveChits] =
    await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: "Active" }),
      Member.countDocuments({ status: "Inactive" }),
      Member.countDocuments({
        "chits.chitId": { $in: activeChitIds },
      }),
    ]);

  const [paymentAgg, monthlyCollectionAgg] = await Promise.all([
    Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$paidAmount" },
          paymentsMade: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          collectedThisMonth: { $sum: "$paidAmount" },
        },
      },
    ]),
  ]);

  const totalPaid = paymentAgg[0]?.totalPaid || 0;
  const paymentsMade = paymentAgg[0]?.paymentsMade || 0;
  const collectedThisMonth = monthlyCollectionAgg[0]?.collectedThisMonth || 0;

  let remainingMonths = 0;

  // Remaining months calculation
  for (const chit of allChits) {
    const paidMonths = await Payment.countDocuments({
      chitId: chit._id,
    });
    remainingMonths += Math.max(chit.duration - paidMonths, 0);
  }

  const remainingTotalChitAmount = Math.max(totalChitAmount - totalPaid, 0);

  const [recentChits, recentMembers, recentPayments] = await Promise.all([
    Chit.find().sort({ createdAt: -1 }).limit(3).select("chitName createdAt"),

    Member.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("name status createdAt"),

    Payment.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("paidAmount createdAt"),
  ]);

  const recentActivities = [
    ...recentChits.map((c) => ({
      type: "CHIT",
      action: "CREATED",
      title: c.chitName,
      date: c.createdAt,
    })),
    ...recentMembers.map((m) => ({
      type: "MEMBER",
      action: "CREATED",
      title: m.name,
      status: m.status,
      date: m.createdAt,
    })),
    ...recentPayments.map((p) => ({
      type: "PAYMENT",
      action: "PAID",
      amount: p.paidAmount,
      date: p.createdAt,
    })),
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, 7);

  return sendResponse(res, 200, true, "Dashboard analytics fetched", {
    totalChits,
    activeChits,
    closedChits,
    totalChitAmount,

    totalMembers,
    activeMembers,
    inactiveMembers,
    membersInActiveChits,

    paymentsMade,
    totalPaid,
    remainingTotalChitAmount,
    remainingMonths,
    collectedThisMonth,

    recentActivities,
  });
});

module.exports = {
  getDashboardAnalytics,
};

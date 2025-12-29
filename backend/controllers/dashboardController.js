const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const Chit = require("../models/Chit");
const Member = require("../models/Member");
const Payment = require("../models/Payment");
const sendResponse = require("../utils/responseHandler");

// ================= DASHBOARD ANALYTICS =================
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. COMBINED CHIT AGGREGATION (Counts, Total Amount)
  const chitStats = await Chit.aggregate([
    {
      $facet: {
        counts: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
              },
              closed: {
                $sum: {
                  $cond: [{ $in: ["$status", ["Closed", "Completed"]] }, 1, 0],
                },
              },
              totalAmount: { $sum: "$amount" },
            },
          },
        ],
        activeIds: [{ $match: { status: "Active" } }, { $project: { _id: 1 } }],
      },
    },
  ]);

  const stats = chitStats[0]?.counts?.[0] || {
    total: 0,
    active: 0,
    closed: 0,
    totalAmount: 0,
  };
  const activeChitIds = (chitStats[0]?.activeIds || [])
    .map((c) => c?._id)
    .filter((id) => !!id);

  // 2. COMBINED MEMBER AGGREGATION
  const memberStats = await Member.aggregate([
    {
      $facet: {
        counts: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
              },
              inactive: {
                $sum: { $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0] },
              },
            },
          },
        ],
        activeChitMembers: [
          { $match: { "chits.chitId": { $in: activeChitIds } } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const mStats = memberStats[0]?.counts?.[0] || {
    total: 0,
    active: 0,
    inactive: 0,
  };
  const membersInActiveChits =
    memberStats[0]?.activeChitMembers?.[0]?.count || 0;

  // 3. COMBINED PAYMENT AGGREGATION
  const paymentStats = await Payment.aggregate([
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalPaid: { $sum: "$paidAmount" },
              count: { $sum: 1 },
            },
          },
        ],
        monthly: [
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, collected: { $sum: "$paidAmount" } } },
        ],
        remainingMonthsAgg: [
          {
            $group: {
              _id: "$chitId",
              paidMonths: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const pStats = paymentStats[0]?.overall?.[0] || { totalPaid: 0, count: 0 };
  const collectedThisMonth = paymentStats[0]?.monthly?.[0]?.collected || 0;

  // Optimized Remaining Months Calculation
  const allChits = await Chit.find().select("_id duration");
  const paidMonthsMap = (paymentStats[0]?.remainingMonthsAgg || []).reduce(
    (acc, curr) => {
      if (curr && curr._id) {
        acc[String(curr._id)] = curr.paidMonths || 0;
      }
      return acc;
    },
    {}
  );

  let remainingMonths = 0;
  for (const chit of allChits) {
    if (chit && chit._id) {
      const paid = paidMonthsMap[String(chit._id)] || 0;
      remainingMonths += Math.max((chit.duration || 0) - paid, 0);
    }
  }

  // 4. RECENT ACTIVITIES
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
    totalChits: stats.total,
    activeChits: stats.active,
    closedChits: stats.closed,
    totalChitAmount: stats.totalAmount,

    totalMembers: mStats.total,
    activeMembers: mStats.active,
    inactiveMembers: mStats.inactive,
    membersInActiveChits,

    paymentsMade: pStats.count,
    totalPaid: pStats.totalPaid,
    remainingTotalChitAmount: Math.max(stats.totalAmount - pStats.totalPaid, 0),
    remainingMonths,
    collectedThisMonth,

    recentActivities,
  });
});

module.exports = {
  getDashboardAnalytics,
};

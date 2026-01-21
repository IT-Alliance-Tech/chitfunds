const mongoose = require("mongoose");
const Chit = require("../models/Chit");
const Member = require("../models/Member");
const Payment = require("../models/Payment");
const sendResponse = require("../utils/response");

// ================= DASHBOARD ANALYTICS =================
const getDashboardAnalytics = async (req, res, next) => {
  const startTotal = Date.now();
  const timings = {};

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Fetch Active Chits (needed for dependent queries)
    const activeChitsData = await Chit.find({ status: "Active" })
      .select("_id duration")
      .lean();
    const activeChitIds = activeChitsData.map((c) => c._id);
    timings.fetchActiveChitIds = Date.now() - startTotal;

    const parallelStart = Date.now();

    // 2. Optimized Parallel Aggregations
    const [
      statsResult,
      mStatsResult,
      pStatsResult,
      monthlyCollectedResult,
      paidMonthsAgg,
      expectedCollectionResult,
      recentData,
    ] = await Promise.all([
      // A. CHIT AGGREGATION
      Chit.aggregate([
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
      ]).option({ maxTimeMS: 5000 }),

      // B. MEMBER AGGREGATION
      Member.aggregate([
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
            slotsInActiveChits: {
              $sum: {
                $reduce: {
                  input: "$chits",
                  initialValue: 0,
                  in: {
                    $add: [
                      "$$value",
                      {
                        $cond: [
                          { $in: ["$$this.chitId", activeChitIds] },
                          { $ifNull: ["$$this.slots", 1] },
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ]).option({ maxTimeMS: 5000 }),

      // C. PAYMENT TOTAL STATS
      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalPaid: { $sum: "$paidAmount" },
            count: { $sum: 1 },
          },
        },
      ]).option({ maxTimeMS: 5000 }),

      // D. PAYMENT MONTHLY STATS (Separate for efficiency)
      Payment.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            collectedThisMonth: { $sum: "$paidAmount" },
          },
        },
      ]).option({ maxTimeMS: 5000 }),

      // E. PAID MONTHS Grouping
      Payment.aggregate([
        { $match: { chitId: { $in: activeChitIds } } },
        { $group: { _id: "$chitId", paidMonths: { $sum: 1 } } },
      ]).option({ maxTimeMS: 5000 }),

      // G. EXPECTED COLLECTION THIS MONTH
      Member.aggregate([
        { $unwind: "$chits" },
        {
          $match: {
            "chits.chitId": { $in: activeChitIds },
            "chits.status": "Active",
          },
        },
        {
          $lookup: {
            from: "chits",
            localField: "chits.chitId",
            foreignField: "_id",
            as: "chitInfo",
          },
        },
        { $unwind: "$chitInfo" },
        {
          $group: {
            _id: null,
            expectedAmount: {
              $sum: {
                $multiply: [
                  "$chitInfo.monthlyPayableAmount",
                  { $ifNull: ["$chits.slots", 1] },
                ],
              },
            },
          },
        },
      ]).option({ maxTimeMS: 5000 }),

      // F. RECENT ACTIVITIES (Optimized with lean and projection)
      Promise.all([
        Chit.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select("chitName location amount createdAt status")
          .lean(),
        Member.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("chits.chitId", "chitName amount location")
          .select("name address chits createdAt status")
          .lean(),
        Payment.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate({
            path: "memberId",
            select: "name chits",
          })
          .populate("chitId", "chitName location monthlyPayableAmount")
          .select(
            "paidAmount penaltyAmount status dueDate createdAt chitId memberId slots paymentMonth"
          )
          .lean(),
      ]),
    ]);

    timings.parallelAggrs = Date.now() - parallelStart;

    const stats = statsResult[0] || {
      total: 0,
      active: 0,
      closed: 0,
      totalAmount: 0,
    };
    const mStats = mStatsResult[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      slotsInActiveChits: 0,
    };
    const pStats = pStatsResult[0] || {
      totalPaid: 0,
      count: 0,
    };
    const collectedThisMonth =
      monthlyCollectedResult[0]?.collectedThisMonth || 0;
    const expectedThisMonth = expectedCollectionResult[0]?.expectedAmount || 0;

    // 3. REMAINING MONTHS CALCULATION
    const calcStart = Date.now();
    const paidMonthsMap = (paidMonthsAgg || []).reduce((acc, curr) => {
      acc[String(curr._id)] = curr.paidMonths || 0;
      return acc;
    }, {});

    let remainingMonths = 0;
    for (const chit of activeChitsData) {
      const paid = paidMonthsMap[String(chit._id)] || 0;
      remainingMonths += Math.max((chit.duration || 0) - paid, 0);
    }
    timings.remainingMonthsCalc = Date.now() - calcStart;

    // 4. FORMAT RECENT ACTIVITIES
    const [recentChitsData, recentMembersData, recentPaymentsData] = recentData;

    // Fetch monthly records for recent payments to decide status
    const recentPaymentSummaries = await Promise.all(
      recentPaymentsData.map(async (p) => {
        const memberTotalSlots =
          p.memberId?.chits?.find(
            (c) => String(c.chitId) === String(p.chitId?._id)
          )?.slots || 1;

        // Count how many records for this member/chit/month
        const paidSlotsCount = await Payment.countDocuments({
          memberId: p.memberId?._id,
          chitId: p.chitId?._id,
          paymentMonth: p.paymentMonth,
        });

        const totalRequired = p.chitId?.monthlyPayableAmount || 0;
        let calculatedStatus = "pending";

        if (
          p.paidAmount >= totalRequired &&
          paidSlotsCount >= memberTotalSlots
        ) {
          calculatedStatus = "paid";
        } else if (p.paidAmount > 0 || paidSlotsCount > 0) {
          calculatedStatus = "partial";
        } else if (new Date(p.dueDate) < new Date()) {
          calculatedStatus = "overdue";
        }

        return {
          ...p,
          memberId: { _id: p.memberId?._id, name: p.memberId?.name },
          totalPaid: (p.paidAmount || 0) + (p.penaltyAmount || 0),
          status: calculatedStatus,
        };
      })
    );

    const recentMembers = recentMembersData.map((m) => {
      const primaryChit = m.chits?.[0]?.chitId || {};
      return {
        ...m,
        chitName: primaryChit.chitName || "-",
        location: primaryChit.location || "-",
        chitAmount: primaryChit.amount || "-",
      };
    });

    return sendResponse(res, 200, "success", "Dashboard analytics fetched", {
      totalChits: stats.total,
      activeChits: stats.active,
      closedChits: stats.closed,
      totalChitAmount: stats.totalAmount,

      totalMembers: mStats.total,
      activeMembers: mStats.active,
      inactiveMembers: mStats.inactive,
      membersInActiveChits: mStats.slotsInActiveChits,

      paymentsMade: pStats.count,
      totalPaid: pStats.totalPaid,
      remainingTotalChitAmount: Math.max(
        stats.totalAmount - pStats.totalPaid,
        0
      ),
      remainingMonths,
      collectedThisMonth: collectedThisMonth,
      expectedToCollect: expectedThisMonth,

      recentChits: recentChitsData,
      recentMembers,
      recentPayments: recentPaymentSummaries,
      _debug: process.env.NODE_ENV !== "production" ? timings : undefined,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
};

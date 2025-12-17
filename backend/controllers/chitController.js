const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const Chit = require("../models/Chit");
const Member = require("../models/Member");

const sendResponse = require("../utils/responseHandler");

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const computeStatus = (startDate, requestedStatus) => {
  if (requestedStatus === "Closed" || requestedStatus === "Completed") {
    return requestedStatus;
  }

  const today = normalizeDate(new Date());
  const start = normalizeDate(startDate);

  if (today < start) return "Upcoming";
  if (today.getTime() === start.getTime()) return "Ongoing";

  return "Ongoing";
};

// Add chits
const createChit = asyncHandler(async (req, res) => {
  const {
    chitName,
    location,
    amount,
    monthlyPayableAmount,
    duration,
    membersLimit,
    startDate,
    cycleDay,
    status,
  } = req.body;

  const finalStatus = computeStatus(startDate, status);

  const chit = new Chit({
    chitName,
    location,
    amount,
    monthlyPayableAmount,
    duration,
    membersLimit,
    startDate,
    cycleDay,
    status: finalStatus,
  });

  await chit.save();

  return sendResponse(res, 201, true, "Chit created successfully", { chit });
});

// get all chits with filtering
const getChits = asyncHandler(async (req, res) => {
  const {
    chitName,
    duration,
    membersCount,
    startDate,
    location,
    status,
    page,
    limit,
  } = req.query;

  const query = {};

  if (chitName) {
    query.chitName = { $regex: chitName, $options: "i" };
  }

  if (duration) {
    query.duration = Number(duration);
  }

  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  if (status) {
    query.status = status;
  }

  if (startDate) {
    const start = normalizeDate(startDate);
    const nextDay = new Date(start);
    nextDay.setDate(start.getDate() + 1);
    query.startDate = { $gte: start, $lt: nextDay };
  }

  // Handle members count filtering
  let finalQuery = { ...query };

  if (membersCount !== undefined) {
    const countNum = Number(membersCount);
    // Aggregate to find chits with specific member count
    const memberAgg = await Member.aggregate([
      {
        $group: {
          _id: "$chitId",
          membersCount: { $sum: 1 },
        },
      },
      {
        $match: {
          membersCount: countNum,
        },
      },
    ]);

    const chitIds = memberAgg.map((item) => item._id);

    // If we are filtering by membersCount and found no matches, we can return early or force empty result
    if (chitIds.length === 0) {
      // Force no results if no chits match the member count
      // We can use a non-existent ID or similar strategy, or just return empty now
      // But to keep consistency with "find", let's just make the query impossible or use $in []
      finalQuery._id = { $in: [] };
    } else {
      // If we already had other filters, we must intersect.
      // But easier is just to say: ID must be in this list AND satisfy other props
      finalQuery._id = { $in: chitIds };
    }
  }

  const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
  const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
  const skip = (pageNum - 1) * limitNum;

  const [chits, total] = await Promise.all([
    Chit.find(finalQuery).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Chit.countDocuments(finalQuery),
  ]);

  // Enrich chits with member counts
  const enrichedChits = await Promise.all(
    chits.map(async (chit) => {
      const membersCount = await Member.countDocuments({ chitId: chit._id });
      const chitObj = chit.toObject();
      return {
        ...chitObj,
        membersCount,
        remainingSlots: chit.membersLimit - membersCount,
      };
    })
  );

  return sendResponse(res, 200, true, "Chits fetched successfully", {
    items: enrichedChits,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// single chit

const getChitById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Chit ID");
  }

  const chit = await Chit.findById(id);
  if (!chit) {
    res.status(404);
    throw new Error("Chit not found");
  }

  const members = await Member.find({ chitId: chit._id })
    .select("name phone status createdAt")
    .sort({ createdAt: 1 });

  const membersCount = members.length;

  const formattedMembers = members.map((m) => ({
    memberId: m._id,
    name: m.name,
    phone: m.phone,
    joinedAt: m.createdAt,
    status: m.status,
  }));

  const chitObj = chit.toObject();

  const enrichedChit = {
    ...chitObj,
    membersCount,
    remainingSlots: chit.membersLimit - membersCount,
    members: formattedMembers,
  };

  return sendResponse(res, 200, true, "Chit details fetched successfully", {
    chit: enrichedChit,
  });
});
// edit chit
const updateChit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  let chit = null;

  chit = await Chit.findOne({ _id: id });

  if (!chit) {
    res.status(404);
    throw new Error("Chit not found");
  }

  // Prevent updating _id directly
  delete updateData.id;
  delete updateData._id;

  // Apply updates
  Object.keys(updateData).forEach((key) => {
    chit[key] = updateData[key];
  });

  // Recalculate status based on (possibly updated) startDate and requested status
  if (updateData.startDate || updateData.status) {
    chit.status = computeStatus(
      chit.startDate,
      updateData.status || chit.status
    );
  }

  await chit.save();

  return sendResponse(res, 200, true, "Chit updated successfully", { chit });
});

//delete chit
const deleteChit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let chit = null;

  chit = await Chit.findOne({ _id: id });

  if (!chit) {
    res.status(404);
    throw new Error("Chit not found");
  }

  await Chit.deleteOne({ _id: chit._id });

  await Member.deleteMany({ chitId: chit._id });

  return sendResponse(
    res,
    200,
    true,
    "Chit and related members deleted successfully",
    null
  );
});

module.exports = {
  createChit,
  getChits,
  getChitById,
  updateChit,
  deleteChit,
};

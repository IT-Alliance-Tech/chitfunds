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

// create chit
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

  const chit = await Chit.create({
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

  return sendResponse(res, 201, true, "Chit created successfully", chit);
});

// get chits with pagination and filters
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

  let finalQuery = { ...query };

  if (membersCount !== undefined) {
    const countNum = Number(membersCount);

    const memberAgg = await Member.aggregate([
      {
        $group: {
          _id: "$chitId",
          membersCount: { $sum: 1 },
        },
      },
      { $match: { membersCount: countNum } },
    ]);

    const chitIds = memberAgg.map((item) => item._id);
    finalQuery._id = { $in: chitIds.length ? chitIds : [] };
  }

  const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
  const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
  const skip = (pageNum - 1) * limitNum;

  const [chits, total] = await Promise.all([
    Chit.find(finalQuery).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Chit.countDocuments(finalQuery),
  ]);

  const enrichedChits = await Promise.all(
    chits.map(async (chit) => {
      const membersCount = await Member.countDocuments({ chitId: chit._id });
      return {
        ...chit.toObject(),
        membersCount,
        remainingSlots: chit.membersLimit - membersCount,
      };
    })
  );

  return sendResponse(res, 200, true, "Chits fetched successfully", {
    chits: enrichedChits,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// get chit by id
const getChitById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendResponse(res, 400, false, "Invalid Chit ID", null);
  }

  const chit = await Chit.findById(id);
  if (!chit) {
    return sendResponse(res, 404, false, "Chit not found", null);
  }

   const members = await Member.find({
    "chits.chitId": chit._id,
  });

  const response = {
    ...chit.toObject(),
    members,
  };

  return sendResponse(
    res,
    200,
    true,
    "Chit details with members fetched successfully",
    response
  );
});

// update chit
const updateChit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const chit = await Chit.findById(id);
  if (!chit) {
    res.status(404);
    throw new Error("Chit not found");
  }

  delete updateData.id;
  delete updateData._id;

  Object.keys(updateData).forEach((key) => {
    chit[key] = updateData[key];
  });

  if (updateData.startDate || updateData.status) {
    chit.status = computeStatus(
      chit.startDate,
      updateData.status || chit.status
    );
  }

  await chit.save();

  return sendResponse(res, 200, true, "Chit updated successfully", chit);
});

// delete chit
const deleteChit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const chit = await Chit.findById(id);
  if (!chit) {
    res.status(404);
    throw new Error("Chit not found");
  }

  await Chit.deleteOne({ _id: chit._id });
  await Member.deleteMany({ chitId: chit._id });

  return sendResponse(res, 200, true, "Chit deleted successfully", null);
});

module.exports = {
  createChit,
  getChits,
  getChitById,
  updateChit,
  deleteChit,
};

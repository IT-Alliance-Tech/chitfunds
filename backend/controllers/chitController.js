const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const Chit = require("../models/Chit");
const Member = require("../models/Member");
const sendResponse = require("../utils/responseHandler");

// --------------------
// HELPERS
// --------------------
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
  return "Ongoing";
};

// create chit
const createChit = asyncHandler(async (req, res) => {
  const finalStatus = computeStatus(req.body.startDate, req.body.status);

  const chit = await Chit.create({
    ...req.body,
    status: finalStatus,
  });

  return sendResponse(res, 201, true, "Chit created successfully", chit);
});
//get chits
const getChits = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.chitName)
    query.chitName = { $regex: req.query.chitName, $options: "i" };
  if (req.query.location)
    query.location = { $regex: req.query.location, $options: "i" };
  if (req.query.status) query.status = req.query.status;
  if (req.query.duration) query.duration = Number(req.query.duration);

  const [chits, total] = await Promise.all([
    Chit.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Chit.countDocuments(query),
  ]);

  return sendResponse(res, 200, true, "Chits fetched successfully", {
    chits,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

//get chit by id
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

  return sendResponse(res, 200, true, "Chit with members fetched", {
    ...chit.toObject(),
    members,
  });
});

// update chit
const updateChit = asyncHandler(async (req, res) => {
  const chit = await Chit.findById(req.params.id);
  if (!chit) {
    return sendResponse(res, 404, false, "Chit not found", null);
  }

  Object.assign(chit, req.body);

  if (req.body.startDate || req.body.status) {
    chit.status = computeStatus(chit.startDate, req.body.status);
  }

  await chit.save();

  return sendResponse(res, 200, true, "Chit updated successfully", chit);
});

// delete chit
const deleteChit = asyncHandler(async (req, res) => {
  const chit = await Chit.findById(req.params.id);
  if (!chit) {
    return sendResponse(res, 404, false, "Chit not found", null);
  }

  await Chit.deleteOne({ _id: chit._id });

  // remove chit reference from members
  await Member.updateMany(
    { "chits.chitId": chit._id },
    { $pull: { chits: { chitId: chit._id } } }
  );

  return sendResponse(res, 200, true, "Chit deleted successfully", null);
});

module.exports = {
  createChit,
  getChits,
  getChitById,
  updateChit,
  deleteChit,
};

const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

const Chit = require("../models/Chit");
const Member = require("../models/Member");
const sendResponse = require("../utils/responseHandler");

/* ================= DATE HELPERS ================= */
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Accepted statuses: Upcoming, Active, Ongoing, Closed, Completed
const computeStatus = (startDate, requestedStatus) => {
  if (requestedStatus === "Closed" || requestedStatus === "Completed") {
    return requestedStatus;
  }

  const today = normalizeDate(new Date());
  const start = normalizeDate(startDate);

  if (start.getTime() === today.getTime()) return "Active";
  if (start > today) return "Upcoming";

  return "Ongoing";
};

/* ================= CREATE CHIT ================= */
const createChit = asyncHandler(async (req, res) => {
  const finalStatus = computeStatus(req.body.startDate, req.body.status);

  const chit = await Chit.create({
    ...req.body,
    status: finalStatus,
  });

  return sendResponse(res, 201, true, "Chit created successfully", { chit });
});

/* ================= GET CHITS ================= */
const getChits = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.chitName) {
    query.chitName = { $regex: req.query.chitName, $options: "i" };
  }

  if (req.query.location) {
    query.location = { $regex: req.query.location, $options: "i" };
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.duration) {
    query.duration = Number(req.query.duration);
  }

  const [chits, totalItems] = await Promise.all([
    Chit.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Chit.countDocuments(query),
  ]);

  return sendResponse(res, 200, true, "Chits fetched successfully", {
    items: chits,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
});

/* ================= GET CHIT BY ID ================= */
const getChitById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendResponse(res, 400, false, "Invalid chit ID");
  }

  const chit = await Chit.findById(id);
  if (!chit) {
    return sendResponse(res, 404, false, "Chit not found");
  }

  const members = await Member.find({
    "chits.chitId": chit._id,
  }).sort({ createdAt: 1 });

  return sendResponse(res, 200, true, "Chit details fetched successfully", {
    chit,
    members,
  });
});

/* ================= UPDATE CHIT ================= */
const updateChit = asyncHandler(async (req, res) => {
  const chit = await Chit.findById(req.params.id);

  if (!chit) {
    return sendResponse(res, 404, false, "Chit not found");
  }

  Object.assign(chit, req.body);

  if (req.body.startDate || req.body.status) {
    chit.status = computeStatus(chit.startDate, req.body.status);
  }

  await chit.save();

  return sendResponse(res, 200, true, "Chit updated successfully", { chit });
});

/* ================= DELETE CHIT ================= */
const deleteChit = asyncHandler(async (req, res) => {
  const chit = await Chit.findById(req.params.id);

  if (!chit) {
    return sendResponse(res, 404, false, "Chit not found");
  }

  await Promise.all([
    Chit.deleteOne({ _id: chit._id }),
    Member.updateMany(
      { "chits.chitId": chit._id },
      { $pull: { chits: { chitId: chit._id } } }
    ),
  ]);

  return sendResponse(res, 200, true, "Chit deleted successfully");
});

module.exports = {
  createChit,
  getChits,
  getChitById,
  updateChit,
  deleteChit,
};

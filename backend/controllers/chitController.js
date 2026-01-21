const mongoose = require("mongoose");
const Chit = require("../models/Chit");
const Member = require("../models/Member");
const sendResponse = require("../utils/response");

// Helper: Normalize Date
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper: Compute Status
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

// 1. Create Chit
const createChit = async (req, res, next) => {
  try {
    const { startDate, dueDate, status } = req.body;
    const finalStatus = computeStatus(startDate, status);

    let calculatedDueDate = req.body.calculatedDueDate;
    if (startDate && dueDate) {
      const d = new Date(startDate);
      // Explicitly set to next month's due date
      calculatedDueDate = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        Number(dueDate)
      );
      calculatedDueDate.setHours(0, 0, 0, 0);
    }

    const chit = await Chit.create({
      ...req.body,
      status: finalStatus,
      calculatedDueDate: calculatedDueDate || startDate,
    });

    return sendResponse(res, 201, "success", "Chit created successfully", {
      chit,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Chits
const getChits = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.chitName)
      query.chitName = { $regex: req.query.chitName, $options: "i" };
    if (req.query.location)
      query.location = { $regex: req.query.location, $options: "i" };
    if (req.query.status) query.status = req.query.status;
    if (req.query.duration) query.duration = Number(req.query.duration);
    if (req.query.totalSlots) query.totalSlots = Number(req.query.totalSlots);
    if (req.query.startDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.query.startDate);
      end.setHours(23, 59, 59, 999);
      query.startDate = { $gte: start, $lte: end };
    }

    const [chits, totalItems] = await Promise.all([
      Chit.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Chit.countDocuments(query),
    ]);

    return sendResponse(res, 200, "success", "Chits fetched successfully", {
      items: chits,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Chit By ID
const getChitById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.chitId = id;
    }

    const chit = await Chit.findOne(query).lean();
    if (!chit) {
      return sendResponse(
        res,
        404,
        "error",
        "Chit not found",
        null,
        "Resource Missing"
      );
    }

    const members = await Member.find({ "chits.chitId": chit._id })
      .sort({ createdAt: 1 })
      .lean();

    return sendResponse(
      res,
      200,
      "success",
      "Chit details fetched successfully",
      {
        chit,
        members,
      }
    );
  } catch (error) {
    next(error);
  }
};

// 4. Update Chit
const updateChit = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.chitId = id;
    }

    const chit = await Chit.findOne(query);

    if (!chit) {
      return sendResponse(
        res,
        404,
        "error",
        "Chit not found",
        null,
        "Resource Missing"
      );
    }

    Object.assign(chit, req.body);

    if (req.body.startDate || req.body.status) {
      chit.status = computeStatus(chit.startDate, req.body.status);
    }

    if (req.body.startDate || req.body.dueDate) {
      const startDate = req.body.startDate || chit.startDate;
      const dueDate = req.body.dueDate || chit.dueDate;

      if (startDate && dueDate) {
        const d = new Date(startDate);
        // Explicitly set to next month's due date
        const newD = new Date(
          d.getFullYear(),
          d.getMonth() + 1,
          Number(dueDate)
        );
        newD.setHours(0, 0, 0, 0);
        chit.calculatedDueDate = newD;
      }
    }

    await chit.save();

    return sendResponse(res, 200, "success", "Chit updated successfully", {
      chit,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Chit
const deleteChit = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.chitId = id;
    }

    const chit = await Chit.findOne(query);

    if (!chit) {
      return sendResponse(
        res,
        404,
        "error",
        "Chit not found",
        null,
        "Resource Missing"
      );
    }

    await Promise.all([
      Chit.deleteOne({ _id: chit._id }),
      Member.updateMany(
        { "chits.chitId": chit._id },
        { $pull: { chits: { chitId: chit._id } } }
      ),
    ]);

    return sendResponse(res, 200, "success", "Chit deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChit,
  getChits,
  getChitById,
  updateChit,
  deleteChit,
};

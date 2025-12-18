const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const Member = require("../models/Member");
const Chit = require("../models/Chit");
const sendResponse = require("../utils/responseHandler");

// add member
const addMember = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    chitId,
    chitIds = [],
    securityDocuments,
  } = req.body;

  const finalChitIds = chitIds.length ? chitIds : chitId ? [chitId] : [];

  if (finalChitIds.length === 0) {
    res.status(400);
    throw new Error("At least one chit must be selected");
  }

  const chits = [];

  for (const cid of finalChitIds) {
    if (!mongoose.Types.ObjectId.isValid(cid)) {
      res.status(400);
      throw new Error("Invalid Chit ID");
    }

    const chit = await Chit.findById(cid);
    if (!chit) {
      res.status(404);
      throw new Error("Chit not found");
    }

    const currentCount = await Member.countDocuments({
      "chits.chitId": cid,
    });

    if (currentCount >= chit.membersLimit) {
      res.status(400);
      throw new Error(`Chit member limit reached for ${chit.chitName}`);
    }

    chits.push({ chitId: cid, status: "Active" });
  }

  const member = await Member.create({
    name,
    phone,
    email,
    address,
    securityDocuments: securityDocuments || [],
    status: "Active",
    chits,
  });

  return sendResponse(res, 201, true, "Member added successfully", {
    member,
  });
});

// get members with pagination and filters
const getMembers = asyncHandler(async (req, res) => {
  const { chitId, page = 1, limit = 10, search, status } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};

  if (chitId && mongoose.Types.ObjectId.isValid(chitId)) {
    query["chits.chitId"] = chitId;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    const regex = { $regex: search, $options: "i" };
    query.$or = [{ name: regex }, { phone: regex }, { email: regex }];
  }

  const [members, total] = await Promise.all([
    Member.find(query)
      .populate(
        "chits.chitId",
        "chitName location amount duration membersLimit monthlyPayableAmount"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Member.countDocuments(query),
  ]);

  return sendResponse(res, 200, true, "Members fetched successfully", {
    items: members,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// get member by id
const getMemberById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Member ID");
  }

  const member = await Member.findById(id).populate(
    "chits.chitId",
    "chitName location amount duration membersLimit monthlyPayableAmount"
  );

  if (!member) {
    res.status(404);
    throw new Error("Member not found");
  }

  return sendResponse(res, 200, true, "Member details fetched successfully", {
    member,
  });
});

// update member
const updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    email,
    address,
    securityDocuments,
    status,
    chitIds = [],
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Member ID");
  }

  const member = await Member.findById(id);
  if (!member) {
    res.status(404);
    throw new Error("Member not found");
  }

  if (Array.isArray(chitIds) && chitIds.length > 0) {
    for (const cid of chitIds) {
      if (!mongoose.Types.ObjectId.isValid(cid)) {
        res.status(400);
        throw new Error("Invalid Chit ID");
      }

      const chit = await Chit.findById(cid);
      if (!chit) {
        res.status(404);
        throw new Error("Chit not found");
      }

      const alreadyJoined = member.chits.some(
        (c) => c.chitId.toString() === cid
      );
      if (alreadyJoined) continue;

      const count = await Member.countDocuments({
        "chits.chitId": cid,
      });

      if (count >= chit.membersLimit) {
        res.status(400);
        throw new Error(`Chit member limit reached for ${chit.chitName}`);
      }

      member.chits.push({ chitId: cid, status: "Active" });
    }
  }

  if (name) member.name = name;
  if (phone) member.phone = phone;
  if (email) member.email = email;
  if (address) member.address = address;
  if (securityDocuments) member.securityDocuments = securityDocuments;
  if (status) member.status = status;

  await member.save();

  return sendResponse(res, 200, true, "Member updated successfully", {
    member,
  });
});

// delete member
const deleteMember = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Member ID");
  }

  const member = await Member.findById(id);
  if (!member) {
    res.status(404);
    throw new Error("Member not found");
  }

  await Member.deleteOne({ _id: id });

  return sendResponse(res, 200, true, "Member deleted successfully", null);
});

module.exports = {
  addMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
};

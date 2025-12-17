const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const Member = require("../models/Member");
const Chit = require("../models/Chit");

// add member
const addMember = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    chitIds = [],
    securityDocuments,
  } = req.body;

  if (!Array.isArray(chitIds) || chitIds.length === 0) {
    res.status(400);
    throw new Error("At least one chit must be selected");
  }

  // Validate all chit IDs
  for (const chitId of chitIds) {
    if (!mongoose.Types.ObjectId.isValid(chitId)) {
      res.status(400);
      throw new Error(`Invalid Chit ID: ${chitId}`);
    }

    const chit = await Chit.findById(chitId);
    if (!chit) {
      res.status(404);
      throw new Error("Chit not found");
    }

    const count = await Member.countDocuments({
      "chits.chitId": chitId,
    });

    if (count >= chit.membersLimit) {
      res.status(400);
      throw new Error(`Chit member limit reached for ${chit.chitName}`);
    }
  }

  // Find existing member
  let member = await Member.findOne({ phone });

  if (!member) {
    member = await Member.create({
      name,
      phone,
      email,
      address,
      securityDocuments: securityDocuments || [],
      chits: [],
    });
  }

  // Add chits
  chitIds.forEach((chitId) => {
    const alreadyJoined = member.chits.some(
      (c) => c.chitId.toString() === chitId
    );

    if (!alreadyJoined) {
      member.chits.push({
        chitId,
        status: "Active",
      });
    }
  });

  await member.save();

  res.status(201).json({
    success: true,
    statusCode: 201,
    error: null,
    data: { member },
  });
});

// get members with pagination and filtering
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
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [members, total] = await Promise.all([
    Member.find(query)
      .populate("chits.chitId", "chitName amount duration membersLimit")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Member.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    data: {
      members,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
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
    "chitName amount duration membersLimit"
  );

  if (!member) {
    res.status(404);
    throw new Error("Member not found");
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    data: { member },
  });
});

// update member
const updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address, securityDocuments, status } = req.body;

  const member = await Member.findById(id);
  if (!member) {
    res.status(404);
    throw new Error("Member not found");
  }

  if (name) member.name = name;
  if (phone) member.phone = phone;
  if (email) member.email = email;
  if (address) member.address = address;
  if (securityDocuments) member.securityDocuments = securityDocuments;
  if (status) member.status = status;

  await member.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    data: { member },
  });
});

// remove member from chit
const removeMemberFromChit = asyncHandler(async (req, res) => {
  const { memberId, chitId } = req.params;

  const member = await Member.findById(memberId);
  if (!member) {
    res.status(404);
    throw new Error("Member not found");
  }

  member.chits = member.chits.filter((c) => c.chitId.toString() !== chitId);

  await member.save();

  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    message: "Member removed from chit successfully",
  });
});
// delete member
const deleteMember = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const member = await Member.findById(id);
  if (!member) {
    res.status(404);
    throw new Error("Member not found");
  }

  await Member.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    data: { member },
  });
});

module.exports = {
  addMember,
  getMembers,
  getMemberById,
  updateMember,
  removeMemberFromChit,
  deleteMember,
};

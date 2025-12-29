const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const Member = require("../models/Member");
const Chit = require("../models/Chit");
const sendResponse = require("../utils/responseHandler");
const sendEmail = require("../utils/sendEmail");
const { generateWelcomePDFBuffer } = require("../utils/welcomePdf");

const formatFileName = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

/* ================= ADD MEMBER ================= */
const addMember = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    chitId,
    chitIds = [],
    securityDocuments,
    sendEmail: shouldSendEmail,
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

  // Handle Welcome Email
  if (shouldSendEmail && member.email) {
    try {
      // Re-populate member with chit details for the PDF
      const populatedMember = await Member.findById(member._id).populate(
        "chits.chitId"
      );
      const pdfBuffer = await generateWelcomePDFBuffer(populatedMember);
      const safeName = formatFileName(member.name);
      await sendEmail({
        to: member.email,
        subject: "Welcome to IT ALLIANCE TECH - Chit Assignment Details",
        html: `
          <p>Dear ${member.name},</p>
          <p>Welcome to IT ALLIANCE TECH! We are pleased to have you as a member of our Chit Fund.</p>
          <p>Please find attached your membership details and the information regarding the chits assigned to you.</p>
          <p>Best Regards,<br/>IT ALLIANCE TECH Team</p>
        `,
        attachments: [
          {
            filename: `${safeName}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // We don't throw error here to not fail the member creation because of email
    }
  }

  return sendResponse(res, 201, true, "Member added successfully", {
    member,
  });
});

/* ================= GET MEMBERS ================= */
const getMembers = asyncHandler(async (req, res) => {
  const { chitId, page = 1, limit = 10, search, status } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
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

/* ================= GET MEMBER BY ID ================= */
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

/* ================= UPDATE MEMBER ================= */
const updateMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    phone,
    email,
    address,
    securityDocuments,
    status,
    chitIds,
    sendEmail: shouldSendEmail,
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

  if (Array.isArray(chitIds)) {
    const newChits = [];

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

      const count = await Member.countDocuments({
        "chits.chitId": cid,
      });

      if (
        count >= chit.membersLimit &&
        !member.chits.some((c) => c.chitId.toString() === cid)
      ) {
        res.status(400);
        throw new Error(`Chit member limit reached for ${chit.chitName}`);
      }

      newChits.push({
        chitId: cid,
        status: "Active",
        joinedAt: new Date(),
      });
    }

    member.chits = newChits;
  }

  if (name) member.name = name;
  if (phone) member.phone = phone;
  if (email) member.email = email;
  if (address) member.address = address;
  if (securityDocuments) member.securityDocuments = securityDocuments;
  if (status) member.status = status;

  await member.save();

  // Handle Welcome Email on Update
  if (shouldSendEmail && member.email) {
    try {
      // Re-populate member with all chit details (including updated ones)
      const populatedMember = await Member.findById(member._id).populate(
        "chits.chitId"
      );
      const pdfBuffer = await generateWelcomePDFBuffer(populatedMember);
      const safeName = formatFileName(member.name);
      await sendEmail({
        to: member.email,
        subject: "Updated Membership Details - IT ALLIANCE TECH",
        html: `
          <p>Dear ${member.name},</p>
          <p>Your membership details at IT ALLIANCE TECH have been updated.</p>
          <p>Please find attached the updated information regarding all chits currently assigned to you.</p>
          <p>Best Regards,<br/>IT ALLIANCE TECH Team</p>
        `,
        attachments: [
          {
            filename: `${safeName}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    } catch (emailError) {
      console.error("Failed to send update email:", emailError);
    }
  }

  return sendResponse(res, 200, true, "Member updated successfully", {
    member,
  });
});

/* ================= DELETE MEMBER ================= */
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

  return sendResponse(res, 200, true, "Member deleted successfully");
});

module.exports = {
  addMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
};

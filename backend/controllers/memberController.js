const mongoose = require("mongoose");
const Member = require("../models/Member");
const Chit = require("../models/Chit");
const Payment = require("../models/Payment");
const sendResponse = require("../utils/response");
const sendEmail = require("../utils/sendEmail");
const { generateWelcomePDFBuffer } = require("../utils/welcomePdf");

const formatFileName = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

// 1. Add Member
const addMember = async (req, res, next) => {
  try {
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
      return sendResponse(
        res,
        400,
        "error",
        "At least one chit must be selected",
        null,
        "Bad Request",
      );
    }

    const chits = [];
    for (const assignment of finalChitIds) {
      const cid =
        typeof assignment === "object" ? assignment.chitId : assignment;
      const slots =
        typeof assignment === "object" ? Number(assignment.slots || 1) : 1;

      if (!mongoose.Types.ObjectId.isValid(cid)) {
        return sendResponse(
          res,
          400,
          "error",
          "Invalid Chit ID",
          null,
          "Bad Request",
        );
      }

      const chit = await Chit.findById(cid);
      if (!chit) {
        return sendResponse(
          res,
          404,
          "error",
          "Chit not found",
          null,
          "Resource Missing",
        );
      }

      // Check total slots taken for this chit
      const membersInChit = await Member.find({ "chits.chitId": cid });
      const totalSlotsTaken = membersInChit.reduce((sum, m) => {
        const chitEntry = m.chits.find(
          (c) => c.chitId.toString() === cid.toString(),
        );
        return sum + (chitEntry?.slots || 1);
      }, 0);

      if (totalSlotsTaken + slots > chit.totalSlots) {
        return sendResponse(
          res,
          400,
          "error",
          "already slots are filled",
          null,
          "Validation Error",
        );
      }

      chits.push({ chitId: cid, slots, status: "Active" });
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

    if (shouldSendEmail && member.email) {
      // Move slow PDF generation and email sending to background
      setImmediate(async () => {
        try {
          const populatedMember = await Member.findById(member._id).populate(
            "chits.chitId",
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
            attachments: [{ filename: `${safeName}.pdf`, content: pdfBuffer }],
          });
        } catch (delayedError) {
          console.error("Background welcome email failed:", delayedError);
        }
      });
    }

    return sendResponse(res, 201, "success", "Member added successfully", {
      member,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Members
const getMembers = async (req, res, next) => {
  try {
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
      // Handle case where search might be an array (duplicate query params)
      const searchString = Array.isArray(search) ? search[0] : search;
      const escapedSearch = escapeRegExp(searchString);
      const regex = { $regex: escapedSearch, $options: "i" };
      query.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }

    const [members, total] = await Promise.all([
      Member.find(query)
        .populate(
          "chits.chitId",
          "chitName location amount duration totalSlots monthlyPayableAmount chitImage",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Member.countDocuments(query),
    ]);

    return sendResponse(res, 200, "success", "Members fetched successfully", {
      items: members,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Member By ID
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.memberId = id;
    }

    const member = await Member.findOne(query).populate(
      "chits.chitId",
      "chitName location amount duration totalSlots monthlyPayableAmount chitImage",
    );

    if (!member) {
      return sendResponse(
        res,
        404,
        "error",
        "Member not found",
        null,
        "Resource Missing",
      );
    }

    return sendResponse(
      res,
      200,
      "success",
      "Member details fetched successfully",
      { member },
    );
  } catch (error) {
    next(error);
  }
};

// 4. Update Member
const updateMember = async (req, res, next) => {
  try {
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

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.memberId = id;
    }

    const member = await Member.findOne(query);
    if (!member) {
      return sendResponse(
        res,
        404,
        "error",
        "Member not found",
        null,
        "Resource Missing",
      );
    }

    if (Array.isArray(chitIds)) {
      const newChits = [];
      for (const assignment of chitIds) {
        const cid =
          typeof assignment === "object" ? assignment.chitId : assignment;
        const slots =
          typeof assignment === "object" ? Number(assignment.slots || 1) : 1;

        if (!mongoose.Types.ObjectId.isValid(cid)) {
          return sendResponse(
            res,
            400,
            "error",
            "Invalid Chit ID",
            null,
            "Bad Request",
          );
        }

        const chit = await Chit.findById(cid);
        if (!chit) {
          return sendResponse(
            res,
            404,
            "error",
            "Chit not found",
            null,
            "Resource Missing",
          );
        }

        // Calculate slots already taken in this chit by OTHER members
        const otherMembersInChit = await Member.find({
          _id: { $ne: id },
          "chits.chitId": cid,
        });

        const totalOtherSlots = otherMembersInChit.reduce((sum, m) => {
          const chitEntry = m.chits.find(
            (c) => c.chitId.toString() === cid.toString(),
          );
          return sum + (chitEntry?.slots || 1);
        }, 0);

        if (totalOtherSlots + slots > chit.totalSlots) {
          return sendResponse(
            res,
            400,
            "error",
            "already slots are filled",
            null,
            "Validation Error",
          );
        }

        newChits.push({
          chitId: cid,
          slots,
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

    if (shouldSendEmail && member.email) {
      // Move slow PDF generation and email sending to background
      setImmediate(async () => {
        try {
          const populatedMember = await Member.findById(member._id).populate(
            "chits.chitId",
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
            attachments: [{ filename: `${safeName}.pdf`, content: pdfBuffer }],
          });
        } catch (delayedError) {
          console.error("Background update email failed:", delayedError);
        }
      });
    }

    return sendResponse(res, 200, "success", "Member updated successfully", {
      member,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Member
const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.memberId = id;
    }

    const member = await Member.findOne(query);
    if (!member) {
      return sendResponse(
        res,
        404,
        "error",
        "Member not found",
        null,
        "Resource Missing",
      );
    }

    await Member.deleteOne({ _id: id });

    return sendResponse(res, 200, "success", "Member deleted successfully");
  } catch (error) {
    next(error);
  }
};

// 6. Get Member PDF Report
const getMemberReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { chitId } = req.query;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.memberId = id;
    }

    const member = await Member.findOne(query).populate(
      "chits.chitId",
      "chitName location amount duration startDate totalSlots monthlyPayableAmount chitImage",
    );

    if (!member) {
      return sendResponse(res, 404, "error", "Member not found");
    }

    // Filter chits if chitId is provided
    if (chitId && mongoose.Types.ObjectId.isValid(chitId)) {
      member.chits = member.chits.filter(
        (c) => c.chitId._id.toString() === chitId.toString(),
      );
    }

    // Fetch payment history
    const paymentQuery = { memberId: member._id };
    if (chitId) {
      if (mongoose.Types.ObjectId.isValid(chitId)) {
        paymentQuery.chitId = chitId;
      } else {
        const chit = await Chit.findOne({ chitId }).select("_id");
        if (chit) paymentQuery.chitId = chit._id;
      }
    }

    const payments = await Payment.find(paymentQuery)
      .populate("chitId", "chitName")
      .sort({ paymentDate: -1 })
      .lean();

    const pdfBuffer = await generateWelcomePDFBuffer(member, payments);
    const safeName = formatFileName(member.name);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=Member_Report_${safeName}.pdf`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Report Gen Error:", error);
    next(error);
  }
};

module.exports = {
  addMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getMemberReport,
};

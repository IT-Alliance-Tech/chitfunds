const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

const Member = require("../models/Member");
const Chit = require("../models/Chit");
const sendResponse = require("../utils/responseHandler");

// 1. Add Member
const addMember = asyncHandler(async (req, res) => {
    const { name, phone, email, address, chitId, securityDocuments } = req.body;



    // Check if chit exists
    if (!mongoose.Types.ObjectId.isValid(chitId)) {
        res.status(400);
        throw new Error("Invalid Chit ID");
    }
    const chit = await Chit.findById(chitId);
    if (!chit) {
        res.status(404);
        throw new Error("Chit not found");
    }

    // Check capacity
    const currentCount = await Member.countDocuments({ chitId });
    if (currentCount >= chit.membersLimit) {
        res.status(400);
        throw new Error("Chit member limit reached");
    }

    const member = await Member.create({
        name,
        phone,
        email,
        address,
        chitId,
        securityDocuments: securityDocuments || [],
        status: "Active"
    });

    const memberObj = member.toObject();
    memberObj.chit = chit;

    return sendResponse(res, 201, true, "Member added successfully", { member: memberObj });
});

// 2. Get Members (All or filtered by chitId, status, search)
const getMembers = asyncHandler(async (req, res) => {
    const { chitId, page, limit, search, status } = req.query;

    const pageNum = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    const limitNum = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (chitId) {
        query.chitId = chitId;
    }

    if (status) {
        query.status = status;
    }

    if (search) {
        const searchRegex = { $regex: search, $options: "i" };
        query.$or = [
            { name: searchRegex },
            { email: searchRegex },
            { phone: searchRegex }
        ];
    }

    const [members, total] = await Promise.all([
        Member.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Member.countDocuments(query)
    ]);

    const enrichedMembers = await Promise.all(members.map(async (m) => {
        let c = null;
        if (mongoose.Types.ObjectId.isValid(m.chitId)) {
            c = await Chit.findById(m.chitId).select("chitName location amount duration membersLimit monthlyPayableAmount");
        }
        const mObj = m.toObject();
        return {
            ...mObj,
            chitDetails: c || null
        };
    }));

    return sendResponse(res, 200, true, "Members fetched successfully", {
        items: enrichedMembers,
        pagination: {
            page: pageNum,
            limit: limitNum,
            totalItems: total,
            totalPages: Math.ceil(total / limitNum) || 1,
        }
    });
});

// 3. Get Member By ID
const getMemberById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const member = await Member.findById(id);
    if (!member) {
        res.status(404);
        throw new Error("Member not found");
    }

    // Fetch Chit Details
    let chit = null;
    if (member.chitId && mongoose.Types.ObjectId.isValid(member.chitId)) {
        chit = await Chit.findById(member.chitId);
    }

    // Logic for "how many members 10/20"
    let chitInfo = null;
    if (chit) {
        const currentCount = await Member.countDocuments({ chitId: member.chitId });
        chitInfo = {
            ...chit.toObject(),
            currentMembersCount: currentCount,
            remainingSlots: chit.membersLimit - currentCount,
            capacityString: `${currentCount}/${chit.membersLimit}`
        };
    }

    return sendResponse(res, 200, true, "Member details fetched successfully", {
        member: {
            ...member.toObject(),
            chitDetails: chitInfo
        }
    });
});

// 4. Update Member
const updateMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, address, securityDocuments, status } = req.body;

    const member = await Member.findById(id);
    if (!member) {
        res.status(404);
        throw new Error("Member not found");
    }

    if (req.body.chitId && req.body.chitId !== member.chitId) {
        if (!mongoose.Types.ObjectId.isValid(req.body.chitId)) {
            res.status(400);
            throw new Error("Invalid New Chit ID");
        }
        const newChit = await Chit.findById(req.body.chitId);
        if (!newChit) {
            res.status(404);
            throw new Error("New Chit not found");
        }
        const count = await Member.countDocuments({ chitId: req.body.chitId });
        if (count >= newChit.membersLimit) {
            res.status(400);
            throw new Error("New Chit member limit reached");
        }
        member.chitId = req.body.chitId;
    }

    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (email) member.email = email;
    if (address) member.address = address;
    if (securityDocuments) member.securityDocuments = securityDocuments;
    if (status) member.status = status;

    await member.save();

    return sendResponse(res, 200, true, "Member updated successfully", { member });
});

// 5. Delete Member
const deleteMember = asyncHandler(async (req, res) => {
    const { id } = req.params;
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
    deleteMember
};

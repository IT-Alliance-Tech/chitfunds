const express = require("express");
const router = express.Router();
const {
    addMember,
    getMembers,
    getMemberById,
    updateMember,
    deleteMember,
} = require("../controllers/memberController");
const authMiddleware = require("../middleware/auth"); // Assuming admin must be logged in

const { createMemberSchema, updateMemberSchema } = require("../validators/memberValidator");
const validate = require("../middleware/validate");

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post("/create", validate(createMemberSchema), addMember);
router.get("/list", getMembers);
router.get("/details/:id", getMemberById);
router.put("/update/:id", validate(updateMemberSchema), updateMember);
router.delete("/delete/:id", deleteMember);

module.exports = router;

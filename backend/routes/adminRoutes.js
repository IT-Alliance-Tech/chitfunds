// routes/adminAuth.routes.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

const { loginSchema, forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema } = require("../validators/adminValidator");
const validate = require("../middleware/validate");

// Routes
// POST /api/admin/login
router.post("/login", validate(loginSchema), adminController.login);

// POST /api/admin/forgot-password
router.post("/forgot-password", validate(forgotPasswordSchema), adminController.forgotPassword);

// POST /api/admin/verify-otp
router.post("/verify-otp", validate(verifyOTPSchema), adminController.verifyOTP);

// POST /api/admin/reset-password
router.post("/reset-password", validate(resetPasswordSchema), adminController.resetPassword);

module.exports = router;

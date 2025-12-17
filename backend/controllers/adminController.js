const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const Admin = require("../models/Admin");
const AdminOTP = require("../models/AdminOTP");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");
const sendResponse = require("../utils/responseHandler");

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);
const JWT_SECRET = process.env.JWT_SECRET || "replace_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Admin Login
const login = asyncHandler(async (req, res) => {
  const { email, password, accessKey } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const passwordMatch = await bcrypt.compare(password, admin.password);
  if (!passwordMatch) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  if (accessKey !== admin.accessKey) {
    res.status(401);
    throw new Error("Invalid accessKey");
  }

  const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const adminData = {
    _id: admin._id,
    email: admin.email,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };

  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    data: {
      admin: adminData,
      token,
    },
  });
});

//  Forgot Password - Send OTP
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  // Generate OTP and expiry (5 minutes)
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Save OTP to AdminOTP collection - remove previous OTPs for email first
  await AdminOTP.deleteMany({ email: admin.email });
  await AdminOTP.create({
    email: admin.email,
    otp,
    expiresAt,
  });

  const subject = "Your OTP for Admin Password Reset";
  const text = `Your OTP for password reset is: ${otp}. It expires in 5 minutes.`;
  const html = `<p>Your OTP for password reset is: <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`;

  await sendEmail({ to: admin.email, subject, text, html });

  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    message: "OTP sent successfully",
  });
});

//  Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await AdminOTP.findOne({
    email: email.toLowerCase().trim(),
    otp,
  });
  if (!otpRecord) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  if (otpRecord.expiresAt < new Date()) {
    res.status(400);
    throw new Error("OTP expired");
  }

  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    message: "OTP verified",
  });
});

//  Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  const otpRecord = await AdminOTP.findOne({
    email: email.toLowerCase().trim(),
  });
  if (!otpRecord) {
    res.status(400);
    throw new Error("No OTP request found for this email");
  }

  if (otpRecord.expiresAt < new Date()) {
    res.status(400);
    throw new Error("OTP expired");
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const updated = await Admin.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: { password: hashed } },
    { new: true }
  );

  if (!updated) {
    res.status(404);
    throw new Error("Admin not found");
  }

  // Delete OTP record after reset
  await AdminOTP.deleteMany({ email: email.toLowerCase().trim() });
  res.status(200).json({
    success: true,
    statusCode: 200,
    error: null,
    message: "Password reset successful",
  });
});
module.exports = {
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
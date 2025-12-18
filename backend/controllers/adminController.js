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

// admin login
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

  return sendResponse(res, 200, true, "Login successful", {
    admin: adminData,
    token,
  });
});

// forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

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

  return sendResponse(res, 200, true, "OTP sent successfully", null);
});

// verify otp
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

  return sendResponse(res, 200, true, "OTP verified successfully", null);
});

// reset password
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

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const updatedAdmin = await Admin.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { $set: { password: hashedPassword } },
    { new: true }
  );

  if (!updatedAdmin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  await AdminOTP.deleteMany({ email: email.toLowerCase().trim() });

  return sendResponse(res, 200, true, "Password reset successful", null);
});

module.exports = {
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
};

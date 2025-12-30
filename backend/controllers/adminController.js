const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const AdminOTP = require("../models/AdminOTP");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");
const sendResponse = require("../utils/response");

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);
const JWT_SECRET = process.env.JWT_SECRET || "replace_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// 1. Admin Login
const login = async (req, res) => {
  try {
    const { email, password, accessKey } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return sendResponse(
        res,
        401,
        "error",
        "Invalid credentials",
        null,
        "Admin not found"
      );
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return sendResponse(
        res,
        401,
        "error",
        "Invalid credentials",
        null,
        "Password mismatch"
      );
    }

    if (accessKey !== admin.accessKey) {
      return sendResponse(
        res,
        401,
        "error",
        "Invalid accessKey",
        null,
        "Access key mismatch"
      );
    }

    const token = jwt.sign({ id: admin._id, email: admin.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return sendResponse(res, 200, "success", "Login successful", {
      admin: {
        _id: admin._id,
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      token,
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// 2. Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return sendResponse(
        res,
        404,
        "error",
        "Admin not found",
        null,
        "Email not registered"
      );
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await AdminOTP.deleteMany({ email: admin.email });
    await AdminOTP.create({
      email: admin.email,
      otp,
      expiresAt,
    });

    await sendEmail({
      to: admin.email,
      subject: "Your OTP for Admin Password Reset",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
    });

    return sendResponse(res, 200, "success", "OTP sent successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// 3. Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await AdminOTP.findOne({
      email: email.toLowerCase().trim(),
      otp,
      expiresAt: { $gte: new Date() },
    });

    if (!otpRecord) {
      return sendResponse(
        res,
        400,
        "error",
        "Invalid or expired OTP",
        null,
        "OTP verification failed"
      );
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return sendResponse(res, 200, "success", "OTP verified successfully");
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// 4. Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const otpRecord = await AdminOTP.findOne({
      email: email.toLowerCase().trim(),
      isVerified: true,
      expiresAt: { $gte: new Date() },
    });

    if (!otpRecord) {
      return sendResponse(
        res,
        400,
        "error",
        "OTP not verified or expired",
        null,
        "Reset password blocked"
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const updatedAdmin = await Admin.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedAdmin) {
      return sendResponse(
        res,
        404,
        "error",
        "Admin not found",
        null,
        "Email missing during reset"
      );
    }

    await AdminOTP.deleteMany({ email: email.toLowerCase().trim() });

    return sendResponse(res, 200, "success", "Password reset successful");
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

module.exports = {
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
};

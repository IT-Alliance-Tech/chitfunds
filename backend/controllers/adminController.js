const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const AdminOTP = require("../models/AdminOTP");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");
const sendResponse = require("../utils/response");
const { getOTPTemplate } = require("../utils/emailTemplates");

const {
  SALT_ROUNDS,
  JWT_SECRET,
  JWT_EXPIRES_IN,
} = require("../config/constants");

// 1. Admin Login
const login = async (req, res, next) => {
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
        "Admin not found",
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
        "Password mismatch",
      );
    }

    if (accessKey !== admin.accessKey) {
      return sendResponse(
        res,
        401,
        "error",
        "Invalid accessKey",
        null,
        "Access key mismatch",
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
    next(error);
  }
};

// 2. Forgot Password
const forgotPassword = async (req, res, next) => {
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
        "Email not registered",
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
      html: getOTPTemplate(otp, "5 minutes"),
    });

    return sendResponse(res, 200, "success", "OTP sent successfully");
  } catch (error) {
    next(error);
  }
};

// 3. Verify OTP
const verifyOTP = async (req, res, next) => {
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
        "OTP verification failed",
      );
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return sendResponse(res, 200, "success", "OTP verified successfully");
  } catch (error) {
    next(error);
  }
};

// 4. Reset Password
const resetPassword = async (req, res, next) => {
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
        "Reset password blocked",
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const updatedAdmin = await Admin.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { password: hashedPassword },
      { new: true },
    );

    if (!updatedAdmin) {
      return sendResponse(
        res,
        404,
        "error",
        "Admin not found",
        null,
        "Email missing during reset",
      );
    }

    await AdminOTP.deleteMany({ email: email.toLowerCase().trim() });

    return sendResponse(res, 200, "success", "Password reset successful");
  } catch (error) {
    next(error);
  }
};

// 5. Test Email Configuration
const testEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendResponse(res, 400, "error", "Recipient email is required");
    }

    await sendEmail({
      to: email,
      subject: "LNS Chitfunds - Email System Test",
      text: "This is a test email from the LNS Chitfunds Management System. If you are receiving this, your Gmail API configuration is working correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb;">Email System Test</h2>
          <p>This is a test email from the <strong>LNS Chitfunds Management System</strong>.</p>
          <p>If you are receiving this, your Gmail API configuration is working correctly.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    return sendResponse(
      res,
      200,
      "success",
      `Test email sent successfully to ${email}`,
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  testEmail,
};

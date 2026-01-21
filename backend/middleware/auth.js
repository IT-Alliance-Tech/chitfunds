// middleware/auth.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const JWT_SECRET = process.env.JWT_SECRET || "replace_me";

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized - missing token" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized - invalid token" });
    }

    const admin = await Admin.findById(decoded.id)
      .select("-password -accessKey")
      .lean();
    if (!admin) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized - admin not found" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      status: false,
      message: "Unauthorized",
      error: { message: error.message },
    });
  }
}

module.exports = authMiddleware;

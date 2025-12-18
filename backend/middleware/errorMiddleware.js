const sendResponse = require("../utils/responseHandler");

// GLOBAL ERROR HANDLER
const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Log error stack in development
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  return sendResponse(
    res,
    statusCode,
    false,
    null,
    null,
    err.message || "Internal Server Error"
  );
};

// 404 HANDLER
const notFound = (req, res, next) => {
  res.status(404);
  const error = new Error(`Route not found - ${req.originalUrl}`);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};

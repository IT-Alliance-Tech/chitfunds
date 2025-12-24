const { ZodError } = require("zod");
const sendResponse = require("../utils/responseHandler");

// ❗ MUST have 4 parameters (err, req, res, next)
const errorHandler = (err, req, res, next) => {
  let statusCode =
    err.statusCode ||
    (res.statusCode !== 200 ? res.statusCode : 500);

  let errorMessage = err.message || "Internal Server Error";

  // ✅ Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    errorMessage = err.errors[0].message;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return sendResponse(
    res,
    statusCode,
    false,
    null,
    null,
    errorMessage
  );
};

// 404 handler
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFound,
};

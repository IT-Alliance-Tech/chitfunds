const { ZodError } = require("zod");
const sendResponse = require("../utils/response");

// GLOBAL ERROR HANDLER
const errorHandler = (err, req, res, next) => {
  let statusCode =
    err.statusCode ||
    (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  let errorMessage = err.message || "Internal Server Error";

  // ✅ Handle Zod validation errors SAFELY
  if (err instanceof ZodError) {
    statusCode = 400;

    const issues = err.issues || err.errors || [];
    errorMessage = issues.length > 0 ? issues[0].message : "Validation error";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return sendResponse(
    res,
    statusCode,
    "error",
    errorMessage,
    null,
    process.env.NODE_ENV === "development" ? err : null
  );
};

// 404 HANDLER
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFound,
};

/**
 * Standardized API Response Helper
 */
const sendResponse = (
  res,
  statusCode,
  status,
  message,
  data = null,
  error = null
) => {
  return res.status(statusCode).json({
    statusCode,
    status, // "success" | "error"
    message,
    data,
    error,
  });
};

module.exports = sendResponse;

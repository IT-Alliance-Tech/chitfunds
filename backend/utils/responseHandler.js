const sendResponse = (
  res,
  statusCode,
  success,
  message = null,
  data = null,
  error = null
) => {
  return res.status(statusCode).json({
    statusCode,
    success,
    error: success
      ? null
      : {
          message: error,
        },
    data: success
      ? {
          message,
          ...data,
        }
      : null,
  });
};

module.exports = sendResponse;

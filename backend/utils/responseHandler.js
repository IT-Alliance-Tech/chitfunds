const sendResponse = (
  res,
  statusCode,
  success,
  message = null,
  data = null,
  error = null
) => {
  const response = {
    success,
    statusCode,
    error: success ? null : error,
    message: success ? message : null,
    data: success ? data : null,
  };

  return res.status(statusCode).json(response);
};

module.exports = sendResponse;

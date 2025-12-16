const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
    const response = {
        success,
        message,
        error,
        data
        
    };

    return res.status(statusCode).json(response);
};

module.exports = sendResponse;

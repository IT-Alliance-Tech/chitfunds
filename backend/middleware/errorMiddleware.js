const sendResponse = require("../utils/responseHandler");

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log the error stack for debugging in non-production
    if (process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }

    return sendResponse(
        res,
        statusCode,
        false,
        err.message || "Internal Server Error",
        null,
        process.env.NODE_ENV === "production" ? null : { stack: err.stack }
    );
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };

const { z } = require('zod');
const sendResponse = require('../utils/responseHandler');

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (e) {
        if (e instanceof z.ZodError) {
            // Format Zod errors
            const errors = e.errors || e.issues;
            const formattedErrors = errors.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));
            return sendResponse(res, 400, false, "Validation Error", null, formattedErrors);
        }
        next(e);
    }
};

module.exports = validate;

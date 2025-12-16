const { z } = require('zod');

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
        accessKey: z.string().min(1, 'Access Key is required'),
    })
});

const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
    })
});

const verifyOTPSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        otp: z.string().length(6, 'OTP must be 6 characters'),
    })
});

const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    })
});

module.exports = {
    loginSchema,
    forgotPasswordSchema,
    verifyOTPSchema,
    resetPasswordSchema,
};

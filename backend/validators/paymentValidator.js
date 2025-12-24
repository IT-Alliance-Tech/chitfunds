const { z } = require("zod");

const paymentBody = z.object({
  chitId: z.string().min(1, "Chit ID is required"),

  memberId: z.string().min(1, "Member ID is required"),

  paidAmount: z.number().min(1, "Paid amount must be greater than 0"),

  penaltyAmount: z.number().min(0).optional().default(0),

  dueDate: z
    .string()
    .or(z.date())
    .transform((v) => new Date(v)),

  paymentDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),

  paymentMode: z.enum(["cash", "online"]),
});

const createPaymentSchema = z.object({
  body: paymentBody,
});

module.exports = {
  createPaymentSchema,
};

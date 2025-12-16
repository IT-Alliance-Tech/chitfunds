const { z } = require("zod");

const paymentBody = z.object({
  chitId: z.string().min(1, "Chit ID is required"),
  memberId: z.string().min(1, "Member ID is required"),

  paymentMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "paymentMonth must be YYYY-MM"),

  paymentYear: z.number().int(),

  paidAmount: z.number().min(0),

  penaltyAmount: z.number().min(0).optional().default(0),

  dueDate: z.string().min(1),

  paymentMode: z.enum(["cash", "online"]),
});

const createPaymentSchema = z.object({
  body: paymentBody,
});

module.exports = {
  createPaymentSchema,
};

const { z } = require("zod");

const slotPaymentSchema = z.object({
  slotNumber: z.coerce.number().min(1, "Slot number is required"),
  paidAmount: z.coerce.number().min(0, "Paid amount must be at least 0"),
  penaltyAmount: z.coerce.number().min(0).optional().default(0),
  interestPercent: z.coerce.number().min(0).optional().default(0),
  paymentMonth: z.string().optional(),
  paymentDate: z
    .any()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  paymentMode: z.enum(["cash", "online"]),
});

const createPaymentSchema = z.object({
  body: z.object({
    chitId: z.string().min(1, "Chit ID is required"),
    memberId: z.string().min(1, "Member ID is required"),
    slotPayments: z
      .array(slotPaymentSchema)
      .min(1, "At least one slot payment is required"),
  }),
});

module.exports = {
  createPaymentSchema,
};

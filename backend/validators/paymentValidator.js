const { z } = require("zod");

const paymentBody = z.object({
  chitId: z.string().min(1, "Chit ID is required"),
  memberId: z.string().min(1, "Member ID is required"),
  paidAmount: z.coerce.number().min(1, "Paid amount must be greater than 0"),
  penaltyAmount: z.coerce.number().min(0).optional().default(0),
  interestPercent: z.coerce.number().min(0).optional().default(0),
  paymentMonth: z.string().optional(),
  dueDate: z
    .any()
    .optional()
    .transform((v) => {
      if (v instanceof Date) return v;
      if (typeof v === "number") return v;
      if (typeof v === "string" && v !== "") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? v : d;
      }
      return v;
    }),
  paymentDate: z
    .any()
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

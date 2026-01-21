const { z } = require("zod");

const chitBody = z.object({
  chitName: z.string().min(1, "Chit name is required"),
  location: z.string().min(1, "Location is required"),
  amount: z.number().min(0, "Amount must be positive"),
  monthlyPayableAmount: z.number().min(0),
  duration: z.number().min(1),
  calculatedDueDate: z
    .string()
    .or(z.date())
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  totalSlots: z.number().min(1),
  startDate: z
    .string()
    .or(z.date())
    .transform((v) => new Date(v)),
  dueDate: z.number().min(1).max(31),
  status: z
    .enum(["Upcoming", "Ongoing", "Active", "Closed", "Completed"])
    .optional(),
});

const createChitSchema = z.object({
  body: chitBody,
});

const updateChitSchema = z.object({
  body: chitBody.partial(),
});

module.exports = {
  createChitSchema,
  updateChitSchema,
};

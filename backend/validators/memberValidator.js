const { z } = require("zod");

const memberBody = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  chitIds: z
    .array(
      z.union([
        z.string().min(1, "Chit ID is missing"),
        z.object({
          chitId: z.string().min(1, "Chit selection is required"),
          slots: z.number().min(1, "At least 1 slot is required").default(1),
        }),
      ])
    )
    .min(1, "Please assign at least one Chit to this member"),
  securityDocuments: z.array(z.string()).optional(),
  status: z
    .enum(["Active", "Inactive"], {
      errorMap: () => ({ message: "Status must be either Active or Inactive" }),
    })
    .optional(),
});

const createMemberSchema = z.object({
  body: memberBody,
});

const updateMemberSchema = z.object({
  body: memberBody.partial(),
});
// Export schemas
module.exports = {
  createMemberSchema,
  updateMemberSchema,
};

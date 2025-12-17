const { z } = require("zod");

const memberBody = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  chitIds: z.array(z.string()).min(1, "At least one chit is required"),
  securityDocuments: z.array(z.string()).optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
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

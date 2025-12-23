const { z } = require('zod');

const chitBody = z.object({
    chitName: z.string().min(1, 'Chit Name is required'),
    location: z.string().min(1, 'Location is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    monthlyPayableAmount: z.number().min(0, 'Monthly payable amount must be positive'),
    duration: z.number().min(1, 'Duration must be at least 1 month'),
    membersLimit: z.number().min(1, 'Members limit must be at least 1'),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    cycleDay: z.number().min(1).max(31, 'Cycle day must be between 1 and 31'),
    status: z.enum(["Upcoming", "Ongoing", "Active", "Closed", "Completed"]).optional(),
});
// Export schemas
const createChitSchema = z.object({
    body: chitBody
});

const updateChitSchema = z.object({
    body: chitBody.partial()
});
// Export schemas
module.exports = {
    createChitSchema,
    updateChitSchema,
};

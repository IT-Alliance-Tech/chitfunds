const mongoose = require("mongoose");

const chitSchema = new mongoose.Schema(
  {
    chitId: {
      type: String,
      unique: true,
      index: true,
    },
    chitName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    monthlyPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    calculatedDueDate: {
      type: Date,
    },
    membersLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Active", "Closed", "Completed"],
      default: "Upcoming",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

chitSchema.index({ createdAt: -1 });

// Pre-save hook to auto-generate chitId
chitSchema.pre("save", async function (next) {
  if (!this.chitId) {
    try {
      // Find the latest chit by chitId
      const lastChit = await mongoose
        .model("Chit")
        .findOne({ chitId: { $exists: true } })
        .sort({ chitId: -1 })
        .select("chitId")
        .lean();

      let nextNumber = 1;
      if (lastChit && lastChit.chitId) {
        // Extract number from CID001 format
        const match = lastChit.chitId.match(/CID(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Generate new chitId with zero-padding
      this.chitId = `CID${String(nextNumber).padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Chit", chitSchema);

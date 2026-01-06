const mongoose = require("mongoose");

const chitSchema = new mongoose.Schema(
  {
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

module.exports = mongoose.model("Chit", chitSchema);

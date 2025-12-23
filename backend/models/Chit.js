const mongoose = require("mongoose");

const chitSchema = new mongoose.Schema(
  {
    chitName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
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
    duedate: {
      type: Date,
      required: true,
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
    cycleDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    status: {
      type: String,
      enum: ["Upcoming", "Ongoing", "Active", "Closed", "Completed"],
      default: "Upcoming",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chit", chitSchema);

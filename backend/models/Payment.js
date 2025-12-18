const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    chitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chit",
      required: true,
      index: true,
    },

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },

    paymentMonth: {
      // Example: 2025-01 (YYYY-MM)
      type: String,
      required: true,
      index: true,
    },

    paymentYear: {
      type: Number,
      required: true,
      index: true,
    },

    monthlyPayableAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    penaltyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPaid: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["paid", "partial", "unpaid"],
      required: true,
      index: true,
    },

    isAdminConfirmed: {
      type: Boolean,
      default: false,
      index: true,
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "online"],
      required: true,
    },

    invoiceNumber: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index(
  { chitId: 1, memberId: 1, paymentMonth: 1 },
  { unique: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

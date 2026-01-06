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
      type: String, // 2025-03
      required: true,
      index: true,
    },

    paymentYear: {
      type: Number,
      required: true,
      index: true,
    },

    slots: {
      type: Number,
      required: true,
      default: 1,
    },
    paidAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    penaltyAmount: {
      type: Number,
      default: 0,
      min: 0,
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
      index: true,
    },

    isAdminConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ chitId: 1, memberId: 1 });
paymentSchema.index({ paymentYear: 1, paymentMonth: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);

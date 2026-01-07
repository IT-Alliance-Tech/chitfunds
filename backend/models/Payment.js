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

    paymentId: {
      type: String,
      unique: true,
      index: true,
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

// Pre-save hook to auto-generate paymentId
paymentSchema.pre("save", async function (next) {
  if (!this.paymentId) {
    try {
      const lastPayment = await mongoose
        .model("Payment")
        .findOne({ paymentId: { $exists: true } })
        .sort({ paymentId: -1 })
        .select("paymentId")
        .lean();

      let nextNumber = 1;
      if (lastPayment && lastPayment.paymentId) {
        const match = lastPayment.paymentId.match(/PID(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      this.paymentId = `PID${String(nextNumber).padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);

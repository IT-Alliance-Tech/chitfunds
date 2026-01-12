const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["transaction", "transfer"],
      default: "transaction",
      index: true,
    },
    chitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chit",
      required: true,
      index: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: function () {
        return this.type === "transaction";
      },
      index: true,
    },
    transferFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: function () {
        return this.type === "transfer";
      },
      index: true,
    },
    transferTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: function () {
        return this.type === "transfer";
      },
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    imageProofUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["paid", "pending", "failed"],
      default: "paid",
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate transactionId
transactionSchema.pre("save", async function (next) {
  if (!this.transactionId) {
    try {
      const lastTransaction = await mongoose
        .model("Transaction")
        .findOne({ transactionId: { $exists: true } })
        .sort({ transactionId: -1 })
        .select("transactionId")
        .lean();

      let nextNumber = 1;
      if (lastTransaction && lastTransaction.transactionId) {
        const match = lastTransaction.transactionId.match(/TRN(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      this.transactionId = `TRN${String(nextNumber).padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);

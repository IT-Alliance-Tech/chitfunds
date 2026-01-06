const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    chits: [
      {
        chitId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chit",
          required: true,
          index: true,
        },
        slots: {
          type: Number,
          default: 1,
          min: 1,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["Active", "Completed", "Left"],
          default: "Active",
        },
      },
    ],

    securityDocuments: [
      {
        type: String,
        trim: true,
      },
    ],

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

memberSchema.index({ "chits.chitId": 1, status: 1 });
memberSchema.index({ createdAt: -1 });

// Pre-save hook to auto-generate memberId
memberSchema.pre("save", async function (next) {
  if (!this.memberId) {
    try {
      // Find the latest member by memberId
      const lastMember = await mongoose
        .model("Member")
        .findOne({ memberId: { $exists: true } })
        .sort({ memberId: -1 })
        .select("memberId")
        .lean();

      let nextNumber = 1;
      if (lastMember && lastMember.memberId) {
        // Extract number from MID001 format
        const match = lastMember.memberId.match(/MID(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Generate new memberId with zero-padding
      this.memberId = `MID${String(nextNumber).padStart(3, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model("Member", memberSchema);

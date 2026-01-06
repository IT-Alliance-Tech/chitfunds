const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
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

module.exports = mongoose.model("Member", memberSchema);

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

module.exports = mongoose.model("Member", memberSchema);

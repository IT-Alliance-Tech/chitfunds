const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    termsAndConditions: {
      type: [String],
      default: [
        "Members must pay the monthly installment amount on or before the specified due date.",
        "A penalty for late payment will be charged as per the management's policy (Standard 10%).",
        "Members are not permitted to withdraw or leave the chit midway without settling all outstanding dues.",
        "LNS CHITFUND reserves the right to take legal action in case of consistent payment defaults.",
        "All disputes are subject to the jurisdiction of the local courts in Bangalore, Karnataka.",
      ],
    },
    // Future settings can be added here
    companyName: {
      type: String,
      default: "LNS CHITFUND",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);

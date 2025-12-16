const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Member",
            required: true,
        },
        chit: {
            type: mongoose.Schema.Types.ObjectId, // Or String chitId if that's what we use, but ref implies ObjectId. 
            // Controller uses populate("member chit"), so these MUST be ObjectIds with refs.
            ref: "Chit",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentDate: {
            type: Date,
            default: Date.now,
        },
        method: {
            type: String,
            enum: ["Cash", "Bank Transfer", "UPI", "Other"],
            default: "Cash",
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Payment", paymentSchema);

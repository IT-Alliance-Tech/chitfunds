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
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        chitId: {
            type: String, // Storing chitId string (e.g., CHT-001) for consistency with Chit model
            required: true,
            ref: "Chit",
        },

        securityDocuments: [{
            type: String, 
            trim: true
        }],
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        }
    },
    {
        timestamps: true,
    }
);

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;

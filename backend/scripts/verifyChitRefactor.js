const mongoose = require("mongoose");
const Chit = require("../models/Chit");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const runVerification = async () => {
    try {
        console.log("Loading .env from:", path.join(__dirname, "../.env"));

        // Check if MONGO_URI is loaded
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found in environment variables");
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");


        // Cleanup first
        await Chit.deleteOne({ _id: testId });

        console.log("Creating new Chit with custom ID:", testId);
        const newChit = new Chit({
            _id: testId,
            chitName: "Test Chit Scheme",
            location: "Test Location",
            amount: 100000,
            monthlyPayableAmount: 5000,
            duration: 20,
            membersLimit: 20,
            startDate: new Date(),
            cycleDay: 5,
            status: "Upcoming"
        });

        await newChit.save();
        console.log("Chit created successfully.");

        console.log("Fetching Chit by ID...");
        const fetchedChit = await Chit.findOne({ _id: testId });

        if (fetchedChit && fetchedChit._id === testId) {
            console.log("Verification SUCCESS: Fetched Chit matches created ID.");
            console.log("Fetched Chit:", fetchedChit.chitName);
        } else {
            throw new Error("Verification FAILED: Could not fetch chit or ID mismatch.");
        }

        // Cleanup
        console.log("Cleaning up...");
        await Chit.deleteOne({ _id: testId });
        console.log("Cleanup done.");

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error("Error during verification:", error);
        try { await mongoose.connection.close(); } catch (e) { }
        process.exit(1);
    }
};

runVerification();

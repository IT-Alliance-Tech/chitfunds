const mongoose = require("mongoose");
const Chit = require("../models/Chit");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const listChits = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);

        const chits = await Chit.find({}).limit(5);

        console.log("--- EXISTING CHITS ---");
        if (chits.length === 0) {
            console.log("No Chits found in the database. You need to create one first.");
        } else {
            chits.forEach(c => {
                console.log(`ID: ${c._id} | Name: ${c.chitName} | Status: ${c.status}`);
            });
        }
        console.log("----------------------");

        await mongoose.connection.close();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

listChits();

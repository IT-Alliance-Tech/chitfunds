const Settings = require("../models/Settings");
const sendResponse = require("../utils/response");

// 1. Get Settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({});
    }
    return sendResponse(res, 200, "success", "Settings fetched successfully", {
      settings,
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// 2. Update Settings
const updateSettings = async (req, res) => {
  try {
    const { termsAndConditions, companyName, paymentDueDate } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    if (termsAndConditions !== undefined) {
      settings.termsAndConditions = termsAndConditions;
    }
    if (companyName !== undefined) {
      settings.companyName = companyName;
    }
    if (paymentDueDate !== undefined) {
      settings.paymentDueDate = paymentDueDate;
    }

    await settings.save();

    return sendResponse(res, 200, "success", "Settings updated successfully", {
      settings,
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

module.exports = {
  getSettings,
  updateSettings,
};

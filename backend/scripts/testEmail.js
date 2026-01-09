// scripts/testEmail.js
require("dotenv").config();
const sendEmail = require("../utils/sendEmail");

async function runTest() {
  console.log("🚀 Starting Gmail API Diagnostic Test...");

  const testOptions = {
    to: process.env.GOOGLE_USER || "test@example.com",
    subject: "ChitFunds Diagnostic Test Email",
    text: "If you receive this, your Gmail API configuration is working correctly!",
    html: "<h1>Diagnostic Success!</h1><p>Your Gmail API configuration is working correctly.</p>",
  };

  try {
    console.log(`📧 Attempting to send test email to: ${testOptions.to}`);
    const result = await sendEmail(testOptions);
    console.log("✅ Diagnostic Test Passed!");
    console.log("   Result:", JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("❌ Diagnostic Test Failed!");
    // The sendEmail util already logs details, but we'll add a bit more here
    console.error("   Error Name:", err.name);
    console.error("   Error Message:", err.message);
    if (err.response) {
      console.error(
        "   Hint: This is often caused by an invalid Refresh Token or revoked OAuth scopes."
      );
    }
    process.exit(1);
  }
}

runTest();

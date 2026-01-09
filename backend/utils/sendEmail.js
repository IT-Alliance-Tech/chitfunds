// utils/sendEmail.js
const { google } = require("googleapis");
const nodemailer = require("nodemailer");

/**
 * Sends an email using the Gmail API (OAuth2)
 * @param {Object} options - { to, subject, text, html, attachments }
 */
async function sendEmail({ to, subject, text, html, attachments }) {
  try {
    const requiredEnv = [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REDIRECT_URI",
      "GOOGLE_REFRESH_TOKEN",
      "GOOGLE_USER",
    ];
    const missing = requiredEnv.filter((key) => !process.env[key]);

    console.log("📬 [DEBUG] Email Environment Check:");
    requiredEnv.forEach((key) => {
      const val = process.env[key];
      console.log(
        `   - ${key}: ${
          val
            ? key.includes("SECRET") || key.includes("TOKEN")
              ? "EXISTS (MASKED)"
              : val
            : "MISSING"
        }`
      );
    });

    if (missing.length > 0) {
      console.error(
        "❌ [ERROR] Gmail API credentials missing:",
        missing.join(", ")
      );
      throw new Error(`Missing email credentials: ${missing.join(", ")}`);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Build the raw MIME message using nodemailer's stream transport
    // This handles complex headers and attachments automatically
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });

    const mailOptions = {
      from: process.env.GOOGLE_USER,
      to,
      subject,
      text,
      html,
      attachments: attachments || [],
    };

    const { message } = await transporter.sendMail(mailOptions);

    // Encode the raw message in base64url format as required by the Gmail API
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(
      "✅ [SUCCESS] Email sent successfully via Gmail API. ID:",
      result.data.id
    );
    return result.data;
  } catch (error) {
    console.error("❌ [GMAIL ERROR] Full details:");
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    // Specific hint for common OAuth2 issues
    if (
      error.message?.includes("invalid_grant") ||
      JSON.stringify(error.response?.data)?.includes("invalid_grant")
    ) {
      console.error(
        "   💡 [HINT] 'invalid_grant' usually means the Refresh Token is invalid or has expired. Try generating a new one in the Google OAuth Playground."
      );
    }
    throw error;
  }
}

module.exports = sendEmail;

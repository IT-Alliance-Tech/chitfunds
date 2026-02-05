// utils/sendEmail.js
const { google } = require("googleapis");
const nodemailer = require("nodemailer");

const { GMAIL_CREDENTIALS } = require("../config/constants");

/**
 * Sends an email using the Gmail API (OAuth2)
 *
 * This function handles the complex MIME structure (using nodemailer's streamTransport)
 * and encodes it for the Google Gmail API. It supports HTML, text, and attachments.
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {Array<Object>} [options.attachments] - Array of attachment objects { filename, content/path }
 * @returns {Promise<Object>} - The result from the Gmail API
 * @throws {Error} - If credentials are missing or API call fails
 */
async function sendEmail({ to, subject, text, html, attachments }) {
  try {
    const credentials = GMAIL_CREDENTIALS;

    const missing = Object.entries(credentials)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      console.error(
        "❌ [EMAIL ERROR] Gmail API credentials missing:",
        missing.join(", "),
      );
      throw new Error(`Missing email credentials: ${missing.join(", ")}`);
    }

    console.log(`[DEBUG] Gmail: Sending "${subject}" to ${to}`);

    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri,
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Build the raw MIME message using nodemailer's stream transport
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });

    const mailOptions = {
      from: credentials.user,
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

    console.log(`✅ [EMAIL SUCCESS] Sent to ${to}. ID: ${result.data.id}`);
    return result.data;
  } catch (error) {
    console.error(`❌ [EMAIL FAILURE] To: ${to} | Error: ${error.message}`);

    if (error.response) {
      console.error(
        "   Details:",
        JSON.stringify(error.response.data, null, 2),
      );
    }

    // Specific hint for common OAuth2 issues
    const errorString =
      error.message + JSON.stringify(error.response?.data || "");
    if (errorString.includes("invalid_grant")) {
      console.error(
        "   💡 [HINT] 'invalid_grant' usually means the Refresh Token is invalid or expired. Update it in .env",
      );
    }

    throw error;
  }
}

module.exports = sendEmail;

// utils/sendEmail.js
const { google } = require("googleapis");
const nodemailer = require("nodemailer");

/**
 * Sends an email using the Gmail API (OAuth2)
 * @param {Object} options - { to, subject, text, html, attachments }
 */
async function sendEmail({ to, subject, text, html, attachments }) {
  try {
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

    return result.data;
  } catch (error) {
    console.error(
      "Gmail API Send Error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = sendEmail;

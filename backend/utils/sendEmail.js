// utils/sendEmail.js
const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, text, html }) {
  // Create transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  };

  // send mail
  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = sendEmail;

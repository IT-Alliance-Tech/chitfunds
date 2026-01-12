/**
 * Application Constants
 */
module.exports = {
  // Authentication
  SALT_ROUNDS: Number(process.env.SALT_ROUNDS || 10),
  JWT_SECRET: process.env.JWT_SECRET || "replace_me_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Email Configuration (Gmail API / OAuth2)
  GMAIL_CREDENTIALS: {
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
    clientSecret:
      process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI || process.env.GMAIL_REDIRECT_URI,
    refreshToken:
      process.env.GOOGLE_REFRESH_TOKEN || process.env.GMAIL_REFRESH_TOKEN,
    user:
      process.env.GOOGLE_USER ||
      process.env.GMAIL_USER ||
      process.env.FROM_EMAIL,
  },

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,

  // Company Information
  COMPANY_NAME: "LNS CHITFUND",
  COMPANY_TAGLINE: "Expert Chit Fund Management & Financial Services",
  COMPANY_EMAIL: "contact@lnschitfund.com",
  COMPANY_WEBSITE: "www.lnschitfund.com",
  COMPANY_ADDRESS:
    "No. 456, 2nd Floor, Gold Plaza, RR Nagar, Bangalore, Karnataka - 560098",

  // File Paths
  LOGO_FILENAME: "logo.png",
};

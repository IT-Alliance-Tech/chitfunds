/**
 * Generates a responsive HTML email template for OTP
 * @param {string} otp - The 6-digit OTP code
 * @param {string} expiry - Expiration message (e.g., "5 minutes")
 * @returns {string} HTML content
 */
const getOTPTemplate = (otp, expiry = "5 minutes") => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Admin Password Reset OTP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style type="text/css">
        body, table, td, a { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        a[x-apple-data-detectors] { font-family: inherit !important; font-size: inherit !important; font-weight: inherit !important; line-height: inherit !important; color: inherit !important; text-decoration: none !important; }
        div[style*="margin: 16px 0;"] { margin: 0 !important; }
        body { width: 100% !important; height: 100% !important; padding: 0 !important; margin: 0 !important; }
        table { border-collapse: collapse !important; }
        a { color: #2563eb; }
        img { height: auto; line-height: 100%; text-decoration: none; border: 0; outline: none; }
    </style>
</head>
<body style="background-color: #f8fafc;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" bgcolor="#f8fafc">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" valign="top" style="padding: 40px 10px 10px 10px;">
                            <h1 style="margin: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -1px; line-height: 48px; color: #1e293b;">
                                Admin Security
                            </h1>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td align="center" bgcolor="#f8fafc">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="left" bgcolor="#ffffff" style="padding: 30px; font-family: 'Helvetica', Arial, sans-serif; font-size: 16px; line-height: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #475569; font-weight: 400;">
                                Hello Admin,
                            </p>
                            <p style="margin: 20px 0; color: #475569;">
                                We received a request to reset your password. Use the following Verification Code (OTP) to proceed. This code is valid for <strong>${expiry}</strong>.
                            </p>
                            <div align="center" style="margin: 30px 0;">
                                <table border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center" bgcolor="#eff6ff" style="border-radius: 12px; border: 2px dashed #3b82f6;">
                                            <span style="display: inline-block; padding: 16px 32px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; color: #1e40af; letter-spacing: 8px;">
                                                ${otp}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
                                If you didn't request a password reset, you can safely ignore this email. Someone else might have entered your email address by mistake.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td align="center" bgcolor="#f8fafc" style="padding: 24px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                    <tr>
                        <td align="center" bgcolor="#f8fafc" style="font-family: 'Helvetica', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #94a3b8;">
                            <p style="margin: 0;">&copy; ${new Date().getFullYear()} ChitFunds Management System. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

module.exports = { getOTPTemplate };

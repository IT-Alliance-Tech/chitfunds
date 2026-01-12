const PDFDocument = require("pdfkit");
const path = require("path");
const Settings = require("../models/Settings");

/* =========================
   UTILITIES
   ========================= */

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${d.getFullYear()}`;
};

const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const scales = ["", "Thousand", "Lakh", "Crore"];

  const convertLessThanOneThousand = (n) => {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + " " + ones[n % 10] + " ";
    return (
      ones[Math.floor(n / 100)] +
      " Hundred " +
      convertLessThanOneThousand(n % 100)
    );
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = "";
  let n = integerPart;

  if (n >= 10000000) {
    result += convertLessThanOneThousand(Math.floor(n / 10000000)) + "Crore ";
    n %= 10000000;
  }
  if (n >= 100000) {
    result += convertLessThanOneThousand(Math.floor(n / 100000)) + "Lakh ";
    n %= 100000;
  }
  if (n >= 1000) {
    result += convertLessThanOneThousand(Math.floor(n / 1000)) + "Thousand ";
    n %= 1000;
  }
  result += convertLessThanOneThousand(n);

  result = result.trim() + " Rupees Only";

  if (decimalPart > 0) {
    result +=
      " and " + convertLessThanOneThousand(decimalPart).trim() + " Paise Only";
  }

  return result;
};

const drawLine = (doc, y, color = "#000", width = 1) => {
  doc.moveTo(50, y).lineTo(550, y).strokeColor(color).lineWidth(width).stroke();
};

const drawTableFrame = (doc, y, height) => {
  doc
    .rect(50, y, 500, height)
    .strokeColor("#e2e8f0") // Subtle gray border
    .lineWidth(0.8)
    .stroke();
};

const drawFooter = (doc) => {
  const footerY = 750; // Higher up to ensure it's on the same page
  doc.save();

  // Top line
  doc
    .moveTo(50, footerY)
    .lineTo(550, footerY)
    .strokeColor("#000")
    .lineWidth(0.5)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#000")
    .text(
      "LNS CHITFUND | www.lnschitfund.com | contact@lnschitfund.com",
      50,
      footerY + 10,
      { align: "center", width: 500 }
    );

  doc.text(
    "Page 1 of 1 | E. & O.E. | This is a system-generated document.",
    50,
    footerY + 22,
    { align: "center", width: 500 }
  );

  // Bottom line
  doc
    .moveTo(50, footerY + 35)
    .lineTo(550, footerY + 35)
    .strokeColor("#000")
    .lineWidth(0.5)
    .stroke();

  doc.restore();
};

/* =========================
   MAIN CONTENT GENERATOR
   ========================= */

const generateDocumentContent = async (doc, payment) => {
  const settings = await Settings.findOne();
  const LOGO_PATH = path.join(__dirname, "logo.png");

  // --- HEADER SECTION ---
  const headerY = 45;

  // Left side: Logo
  try {
    doc.image(LOGO_PATH, 50, headerY - 10, { width: 60 });
  } catch (err) {
    // console.error("Logo not found at:", LOGO_PATH);
    // Draw a placeholder or just skip
  }

  // Right side: Company Name & Tagline (Aligned horizontally with logo)
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("LNS CHITFUND", 200, headerY, { align: "right", width: 350 });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#444")
    .text(
      "Expert Chit Fund Management & Financial Services",
      200,
      headerY + 25,
      {
        align: "right",
        width: 350,
      }
    );

  doc.fillColor("#000");

  let y = headerY + 55;
  // Thin horizontal line below header
  drawLine(doc, y, "#000", 0.5);
  y += 25;

  // --- INVOICE TITLE ---
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(
      `TAX INVOICE / PAYMENT RECEIPT - SLOT ${payment.slotNumber || 1}`,
      50,
      y,
      { align: "center", width: 500 }
    );

  y += 35;

  // --- INVOICE DETAILS (TWO COLUMN) ---
  const detailsY = y;
  const leftColX = 50;
  const rightColX = 320;
  const labelWidth = 90;

  const drawDetailRow = (label, value, x) => {
    doc.font("Helvetica-Bold").fontSize(9).text(label, x, y);
    doc.font("Helvetica").text(`: ${value || "N/A"}`, x + labelWidth, y);
    y += 15;
  };

  drawDetailRow("Invoice Number", payment.invoiceNumber, leftColX);
  y = detailsY; // Reset Y for right col
  drawDetailRow("Invoice Date", formatDate(payment.paymentDate), rightColX);

  y = detailsY + 15;
  drawDetailRow("Member ID", payment.memberId?.memberId || "N/A", leftColX);
  y = detailsY + 15;
  drawDetailRow(
    "Payment Mode",
    (payment.paymentMode || "online").toUpperCase(),
    rightColX
  );

  y = detailsY + 30;
  drawDetailRow("Slot Number", `Slot ${payment.slotNumber || 1}`, leftColX);

  y += 20;
  drawLine(doc, y, "#eee", 1);
  y += 20;

  // --- COMPANY & BILL TO SECTIONS ---
  const sectionY = y;

  // COMPANY DETAILS
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("COMPANY DETAILS", leftColX, sectionY);
  doc
    .moveTo(leftColX, sectionY + 12)
    .lineTo(leftColX + 100, sectionY + 12)
    .strokeColor("#cbd5e1")
    .lineWidth(0.5)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#1e293b")
    .text("LNS CHITFUND", leftColX, sectionY + 22);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#475569")
    .text("No.456, Gold Plaza, RR Nagar,", leftColX, sectionY + 36);
  doc.text("Bangalore, Karnataka - 560098", leftColX, sectionY + 48);
  doc.font("Helvetica-Bold").text("GSTIN: ", leftColX, sectionY + 60);
  doc.font("Helvetica").text("29LNSCF1234F1Z5", leftColX + 35, sectionY + 60);
  doc.font("Helvetica-Bold").text("Email: ", leftColX, sectionY + 72);
  doc
    .font("Helvetica")
    .text("contact@lnschitfund.com", leftColX + 35, sectionY + 72);
  doc.fillColor("#000");

  // BILL TO (MEMBER DETAILS) in Table Format
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("BILL TO (MEMBER DETAILS)", rightColX, sectionY);
  doc
    .moveTo(rightColX, sectionY + 12)
    .lineTo(rightColX + 150, sectionY + 12)
    .strokeColor("#cbd5e1")
    .lineWidth(0.5)
    .stroke();

  const memberData = [
    ["Name", payment.memberId?.name],
    ["Phone", payment.memberId?.phone],
    ["Email", payment.memberId?.email],
    ["Address", payment.memberId?.address],
  ];

  let memberY = sectionY + 22;
  memberData.forEach(([label, value]) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#1e293b")
      .text(label, rightColX, memberY, { width: 50 });
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text(`: ${value || "N/A"}`, rightColX + 50, memberY, { width: 180 });
    memberY += 14;
  });
  doc.fillColor("#000");

  y = Math.max(sectionY + 85, memberY + 10);
  y += 10;

  // --- DESCRIPTION TABLE ---
  const tableY = y;
  const headerHeight = 22;

  // Header Background
  doc.rect(50, tableY, 500, headerHeight).fill("#f1f5f9");
  doc.fillColor("#1e293b"); // Modern dark text

  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("Description / Chit Name", 65, tableY + 7);
  doc.text("Location", 280, tableY + 7);
  doc.text("Date", 380, tableY + 7);
  doc.text("Amount (INR)", 475, tableY + 7, { width: 65, align: "right" });

  y = tableY + headerHeight;

  // Row content (Alternating)
  doc.font("Helvetica").fontSize(9).fillColor("#000");
  const rowHeight = 28;

  // Example for alternating row (if we had multiple, we would loop)
  // doc.rect(50, y, 500, rowHeight).fill("#fafafa"); // Very light stripe
  doc.fillColor("#000");

  doc.text(payment.chitId?.chitName || "N/A", 65, y + 10, { width: 195 });
  doc.text(payment.chitId?.location || "N/A", 280, y + 10, { width: 85 });
  doc.text(formatDate(payment.paymentDate), 380, y + 10);
  doc
    .font("Helvetica-Bold")
    .text(Number(payment.paidAmount || 0).toFixed(2), 475, y + 10, {
      width: 65,
      align: "right",
    });

  y += rowHeight;

  // Table Border & Lines (Subtle Slate)
  doc.save();
  doc.strokeColor("#94a3b8").lineWidth(0.6); // Slightly darker slate for frame

  // Frame
  doc.rect(50, tableY, 500, y - tableY).stroke();

  // Horizontal Line after header
  doc
    .moveTo(50, tableY + headerHeight)
    .lineTo(550, tableY + headerHeight)
    .stroke();

  // Vertical Column Separators (Clean design)
  const colLines = [270, 370, 470];
  colLines.forEach((lx) => {
    doc.moveTo(lx, tableY).lineTo(lx, y).stroke();
  });
  doc.restore();

  y += 20;

  // --- SUMMARY CALCULATION ---
  const subTotal = Number(payment.paidAmount || 0);
  const penalty = Number(payment.penaltyAmount || 0);
  const interest = 0;
  const grandTotal = subTotal + penalty + interest;

  // --- TOTAL IN WORDS ---
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#1e293b")
    .text("Total Amount in Words:", 50, y);
  doc
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor("#475569")
    .text(numberToWords(grandTotal), 50, y + 12, { width: 280 });
  doc.fillColor("#000");

  // --- SUMMARY TOTALS UI ---
  const summaryX = 350;
  const summaryValueX = 470;

  const drawSummaryRow = (label, value, isBold = false) => {
    doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    doc.text(label, summaryX, y);
    doc.text(value.toFixed(2), summaryValueX, y, { width: 70, align: "right" });
    y += 18;
  };

  drawSummaryRow("Sub Total", subTotal);
  drawSummaryRow("Interest", interest);
  drawSummaryRow("Penalty Charges", penalty);

  y -= 5;
  doc
    .moveTo(summaryX, y)
    .lineTo(550, y)
    .strokeColor("#000")
    .lineWidth(0.5)
    .stroke();
  y += 8;

  // GRAND TOTAL highlight
  doc.rect(summaryX - 5, y - 4, 205, 22).fill("#1e293b"); // Deep slate background
  doc.fillColor("#ffffff"); // White text for grand total
  drawSummaryRow("GRAND TOTAL", grandTotal, true);
  doc.fillColor("#000000");

  y += 20;

  // --- DECLARATION ---
  doc.font("Helvetica-Bold").fontSize(9).text("DECLARATION", 50, y);
  y += 15;
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#475569")
    .text(
      "I/We hereby certify that my/our registration certificate under the Goods and Service Tax Act 2017 is in force on the date on which the supply of the services specified in this tax invoice is made by me/us and that the transaction of service covered by this tax invoice has been effected by me/us and it shall be accounted for in the turnover while filing of return and the due tax, if any, payable on the service has been paid or shall be paid.",
      50,
      y,
      { width: 500, align: "justify" }
    );
  doc.fillColor("#000");
  y += 40;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("FOR LNS CHITFUND", 400, y, { align: "right", width: 150 });
  y += 15;
  doc
    .font("Helvetica-Oblique")
    .fontSize(8)
    .text("(Digitally Signed)", 400, y, { align: "right", width: 150 });

  y += 35;

  // --- TERMS AND CONDITIONS ---
  doc.font("Helvetica-Bold").fontSize(9).text("TERMS AND CONDITIONS", 50, y);
  y += 15;
  const terms = [
    "Payment should be made within the due date to avoid penalties.",
    "The management is not responsible for any cash payments made without a valid receipt.",
    "Chit installments are subject to the rules and regulations of the Chit Fund Act.",
    "Membership cannot be transferred or cancelled without prior written approval.",
    "All disputes are subject to the jurisdiction of the local courts in Bangalore.",
    "This is a system-generated document and does not require a physical signature.",
  ];

  terms.forEach((term, i) => {
    doc
      .font("Helvetica")
      .fontSize(7)
      .text(`${i + 1}. ${term}`, 50, y, { width: 500 });
    y += 12;
  });

  // FINAL FOOTER (Locked at bottom)
  drawFooter(doc);
};

/* =========================
   EXPORTS
   ========================= */

exports.generateInvoicePDF = async (res, payment) => {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 60, left: 50, right: 50 },
    bufferPages: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=receipt-${payment.invoiceNumber}.pdf`
  );

  doc.pipe(res);
  await generateDocumentContent(doc, payment);
  doc.end();
};

exports.generateInvoicePDFBuffer = async (payment) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 60, left: 50, right: 50 },
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      await generateDocumentContent(doc, payment);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

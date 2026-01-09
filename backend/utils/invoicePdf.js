const PDFDocument = require("pdfkit");
const path = require("path");
const Settings = require("../models/Settings");

/**
 * Format date to DD-MM-YYYY
 */
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/**
 * Helper to draw a table row with borders
 */
const drawTableRow = (doc, y, columns, options = {}) => {
  const {
    height = 18,
    fontSize = 9,
    font = "Helvetica",
    fillColor = "#333",
    backgroundColor = null,
    showBorders = true,
    borderBottom = true,
  } = options;

  if (backgroundColor) {
    doc.rect(50, y, 500, height).fill(backgroundColor);
  }

  doc.fontSize(fontSize).font(font).fillColor(fillColor);

  columns.forEach((col) => {
    doc.text(col.text || "", col.x, y + (height - fontSize) / 2, {
      width: col.width,
      align: col.align || "left",
      lineBreak: false,
    });
  });

  if (showBorders && borderBottom) {
    doc
      .moveTo(50, y + height)
      .lineTo(550, y + height)
      .strokeColor("#ccc")
      .lineWidth(0.5)
      .stroke();
  }

  return y + height;
};

// Shared Layout Settings
const LOGO_PATH = path.join(__dirname, "logo.png");
const PRIMARY_COLOR = "#000000";
const SECONDARY_COLOR = "#444444";
const LIGHT_GREY = "#f9f9f9";

const drawHeader = (doc) => {
  doc.save();
  try {
    doc.image(LOGO_PATH, 50, 40, { width: 55 });
  } catch (err) {
    console.error("Logo image not found for PDF:", err);
  }
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor(PRIMARY_COLOR)
    .text("LNS CHITFUND", 115, 55, { align: "left" });
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(SECONDARY_COLOR)
    .text("Expert Chit Fund Management & Financial Services", 115, 73, {
      align: "left",
    });
  doc.restore();
};

const drawFooter = (doc, pageNum, totalPages) => {
  doc.save();
  const footerY = doc.page.height - 60;
  doc
    .moveTo(50, footerY)
    .lineTo(550, footerY)
    .strokeColor("#ccc")
    .lineWidth(0.5)
    .stroke();
  doc.fontSize(8).font("Helvetica").fillColor("#999");
  doc.text(
    "LNS CHITFUND | www.lnschitfund.com | contact@lnschitfund.com",
    50,
    footerY + 8,
    { align: "center", width: 500 }
  );
  doc.text(
    `Page ${pageNum} of ${totalPages} | E. & O.E. | This is a system-generated document.`,
    50,
    footerY + 18,
    { align: "center", width: 500 }
  );
  doc.restore();
};

/**
 * Generates a professional table-based Invoice PDF
 * @param {Object} res - Express response object
 * @param {Object} payment - Payment object with populated memberId and chitId
 */
exports.generateInvoicePDF = async (res, payment) => {
  console.log(
    `🚀 [DEBUG] Generating Invoice PDF for ${payment.invoiceNumber} (Fixed Drawing Order)`
  );
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 120, bottom: 85, left: 50, right: 50 },
        font: "Helvetica",
        bufferPages: true,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=invoice-${payment.invoiceNumber}.pdf`
      );

      doc.pipe(res);
      res.on("finish", () => resolve());
      res.on("error", (err) => reject(err));
      doc.on("error", (err) => reject(err));

      const settings = await Settings.findOne();
      const termsAndConditions = settings?.termsAndConditions || [];

      /* ================= TITLE ================= */
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text(
          `TAX INVOICE / PAYMENT RECEIPT ${
            payment.slotNumber ? `- SLOT ${payment.slotNumber}` : ""
          }`,
          50,
          doc.y,
          { align: "center" }
        );
      doc.moveDown(0.8);

      /* ================= REFERENCE DETAILS ================= */
      let currentY = doc.y;
      const refCols = [
        ["Invoice Number", payment.invoiceNumber || "N/A"],
        ["Invoice Date", formatDate(payment.paymentDate)],
        ["Member ID", payment.memberId?.memberId || "N/A"],
        ["Payment Mode", (payment.paymentMode || "N/A").toUpperCase()],
        [
          "Slot Number",
          payment.slotNumber ? `Slot ${payment.slotNumber}` : "N/A",
        ],
      ];

      refCols.forEach((row, i) => {
        currentY = drawTableRow(
          doc,
          currentY,
          [
            { x: 50, width: 120, text: row[0] },
            { x: 170, width: 10, text: "|" },
            { x: 185, width: 170, text: row[1] },
          ],
          {
            font: i === 0 ? "Helvetica-Bold" : "Helvetica",
            height: 16,
            borderBottom: i === refCols.length - 1,
          }
        );
      });
      doc.moveDown(1);

      /* ================= COMPANY DETAILS ================= */
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("COMPANY DETAILS", 50);
      doc.font("Helvetica").fontSize(9).fillColor(SECONDARY_COLOR);
      doc.text("LNS CHITFUND", 50);
      doc.text(
        "No. 456, 2nd Floor, Gold Plaza, RR Nagar, Bangalore, Karnataka - 560098",
        50
      );
      doc.text("GSTIN: 29LNSCF1234F1Z5 | Email: contact@lnschitfund.com", 50);
      doc.moveDown(1.2);

      /* ================= BILL TO ================= */
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("BILL TO (MEMBER DETAILS)", 50);
      doc.moveDown(0.3);
      currentY = doc.y;
      const memberDetails = [
        ["Name", payment.memberId?.name || "N/A"],
        ["Phone", payment.memberId?.phone || "N/A"],
        ["Email", payment.memberId?.email || "N/A"],
        ["Address", payment.memberId?.address || "N/A"],
      ];
      memberDetails.forEach((detail, index) => {
        currentY = drawTableRow(
          doc,
          currentY,
          [
            { x: 50, width: 80, text: detail[0] },
            { x: 130, width: 10, text: "|" },
            { x: 145, width: 405, text: detail[1] },
          ],
          { height: 16, borderBottom: index === memberDetails.length - 1 }
        );
      });
      doc.moveDown(1.5);

      /* ================= DESCRIPTION ================= */
      const gridCols = [
        { x: 50, width: 190, text: "DESCRIPTION / CHIT NAME", align: "left" },
        { x: 240, width: 100, text: "LOCATION", align: "left" },
        { x: 340, width: 100, text: "DATE", align: "right" },
        { x: 440, width: 110, text: "AMOUNT (INR)", align: "right" },
      ];

      currentY = drawTableRow(doc, doc.y, gridCols, {
        font: "Helvetica-Bold",
        backgroundColor: LIGHT_GREY,
        fillColor: PRIMARY_COLOR,
        height: 20,
      });
      const chit = payment.chitId || {};
      currentY = drawTableRow(
        doc,
        currentY,
        [
          {
            x: 50,
            width: 190,
            text: chit.chitName || "Monthly Installment",
            align: "left",
          },
          { x: 240, width: 100, text: chit.location || "N/A", align: "left" },
          {
            x: 340,
            width: 100,
            text: formatDate(payment.paymentDate),
            align: "right",
          },
          {
            x: 440,
            width: 110,
            text: `INR ${Number(payment.paidAmount || 0).toLocaleString(
              "en-IN"
            )}.00`,
            align: "right",
          },
        ],
        { height: 20 }
      );
      doc.moveDown(0.8);

      /* ================= SUMMARY ================= */
      const summaryX = 350;
      const grandTotal =
        Number(payment.paidAmount || 0) +
        Number(payment.penaltyAmount || 0) +
        Number(payment.interestAmount || 0);
      const summaryRows = [
        [
          "Sub Total",
          `INR ${Number(payment.paidAmount || 0).toLocaleString("en-IN")}.00`,
        ],
        [
          "Interest",
          `INR ${Number(payment.interestAmount || 0).toLocaleString(
            "en-IN"
          )}.00`,
        ],
        [
          "Penalty Charges",
          `INR ${Number(payment.penaltyAmount || 0).toLocaleString(
            "en-IN"
          )}.00`,
        ],
        ["GRAND TOTAL", `INR ${grandTotal.toLocaleString("en-IN")}.00`],
      ];

      summaryRows.forEach((row, i) => {
        currentY = drawTableRow(
          doc,
          currentY,
          [
            { x: summaryX, width: 100, text: row[0], align: "left" },
            { x: summaryX + 100, width: 10, text: "|" },
            { x: summaryX + 110, width: 90, text: row[1], align: "right" },
          ],
          {
            height: i === 3 ? 20 : 16,
            font: i === 3 ? "Helvetica-Bold" : "Helvetica",
            backgroundColor: i === 3 ? LIGHT_GREY : null,
            borderBottom: false,
          }
        );
      });
      doc.moveDown(1.5);

      /* ================= DECLARATION ================= */
      if (doc.y > doc.page.height - 100) doc.addPage();
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("DECLARATION", 50);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(SECONDARY_COLOR)
        .text(
          "We hereby declare that this invoice shows the actual price of the services described and that all particulars are true and correct.",
          50,
          doc.y + 3,
          { width: 500 }
        );
      doc.moveDown(1.5);

      /* ================= SIGNATURE ================= */
      if (doc.y > doc.page.height - 120) doc.addPage();
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("FOR LNS CHITFUND", 400, doc.y, { align: "right" });
      doc.moveDown(1.5);
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .text("(Digitally Signed)", 400, doc.y + 2, { align: "right" });
      doc.moveDown(1.5);

      /* ================= TERMS ================= */
      if (termsAndConditions.length > 0) {
        if (doc.y > doc.page.height - 150) doc.addPage();
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(PRIMARY_COLOR)
          .text("TERMS AND CONDITIONS", 50);
        doc.moveDown(0.3);
        termsAndConditions.forEach((term, i) => {
          if (doc.y > doc.page.height - 80) doc.addPage();
          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor(SECONDARY_COLOR)
            .text(`${i + 1}. ${term}`, 50, doc.y + 1, { width: 500 });
        });
      }

      // Final pass: Draw headers and footers on ALL pages before ending the stream
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawHeader(doc);
        drawFooter(doc, i + 1, range.count);
      }

      doc.end();
    } catch (error) {
      console.error("PDF Generation Error:", error);
      if (!res.headersSent) res.status(500).send("Internal Error");
      reject(error);
    }
  });
};

/**
 * Generates an Invoice PDF as a Buffer for email attachments
 */
exports.generateInvoicePDFBuffer = async (payment) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 120, bottom: 85, left: 50, right: 50 },
        font: "Helvetica",
        bufferPages: true,
      });

      let chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", (err) => reject(err));

      const settings = await Settings.findOne();

      // ... Generation logic for Buffer (simplified but stable) ...
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text(
          `TAX INVOICE / PAYMENT RECEIPT ${
            payment.slotNumber ? `- SLOT ${payment.slotNumber}` : ""
          }`,
          { align: "center" }
        );
      doc.moveDown(1);

      let currentY = doc.y;
      const refDetails = [
        ["Invoice No", payment.invoiceNumber],
        ["Date", formatDate(payment.paymentDate)],
        ["Member ID", payment.memberId?.memberId || "N/A"],
        ["Chit Name", payment.chitId?.chitName || "N/A"],
        [
          "Slot Details",
          `Slot ${payment.slotNumber || "N/A"} of ${
            payment.chitId?.totalSlots || "N/A"
          }`,
        ],
      ];

      refDetails.forEach((row, i) => {
        currentY = drawTableRow(
          doc,
          currentY,
          [
            { x: 50, width: 100, text: row[0] },
            { x: 150, width: 10, text: ":" },
            { x: 165, width: 385, text: row[1] },
          ],
          { height: 16, borderBottom: i === refDetails.length - 1 }
        );
      });
      doc.moveDown(1);

      doc.font("Helvetica-Bold").text("MEMBER DETAILS");
      doc.font("Helvetica").text(`Name: ${payment.memberId?.name}`);
      doc.text(`Phone: ${payment.memberId?.phone}`);
      doc.moveDown(1);

      doc.font("Helvetica-Bold").text("PAYMENT DETAILS");
      const grandTotal =
        (payment.paidAmount || 0) +
        (payment.interestAmount || 0) +
        (payment.penaltyAmount || 0);
      const payRows = [
        ["Paid Amount", `INR ${payment.paidAmount}`],
        ["Interest", `INR ${payment.interestAmount || 0}`],
        ["Penalty", `INR ${payment.penaltyAmount || 0}`],
        ["Total Paid", `INR ${grandTotal}`],
      ];

      payRows.forEach((row, i) => {
        doc
          .font(i === payRows.length - 1 ? "Helvetica-Bold" : "Helvetica")
          .text(`${row[0]}: ${row[1]}`);
      });
      doc.moveDown(2);
      doc.fontSize(8).text("This is an electronically generated invoice.");

      // Final pass: Branding
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawHeader(doc);
        drawFooter(doc, i + 1, range.count);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

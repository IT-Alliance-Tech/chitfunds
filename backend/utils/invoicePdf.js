const PDFDocument = require("pdfkit");
const path = require("path");

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
    doc.text(col.text, col.x, y + (height - fontSize) / 2, {
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

/**
 * Generates a professional table-based Invoice PDF
 * @param {Object} res - Express response object
 * @param {Object} payment - Payment object with populated memberId and chitId
 */
exports.generateInvoicePDF = (res, payment) => {
  console.log(
    `🚀 [DEBUG] Generating Invoice PDF for ${payment.invoiceNumber} (Multi-Page Fix)`
  );
  try {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      font: "Helvetica",
      bufferPages: true,
    });

    // Headers for PDF download/viewing
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=invoice-${payment.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    const primaryColor = "#000000";
    const secondaryColor = "#444444";
    const lightGrey = "#f9f9f9";

    /* ================= 1. HEADER ================= */
    const logoPath = path.join(__dirname, "logo.png");

    try {
      doc.image(logoPath, 250, 45, { width: 100 });
      doc.moveDown(4.5);
    } catch (err) {
      console.error("Logo image not found for PDF:", err);
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("LNS CHITFUND", { align: "center" });
      doc.moveDown(0.5);
    }

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("LNS CHITFUND", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(secondaryColor)
      .text("Expert Chit Fund Management & Financial Services", {
        align: "center",
      });
    doc.moveDown(1.5);

    /* ================= 2. TITLE ================= */
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("TAX INVOICE / PAYMENT RECEIPT", {
        align: "center",
        underline: false,
      });
    doc.moveDown(0.8);

    /* ================= 3. REFERENCE DETAILS ================= */
    let currentY = doc.y;
    const refCols = [
      { x: 50, width: 120, text: "Invoice Number" },
      { x: 170, width: 10, text: "|" },
      { x: 185, width: 170, text: payment.invoiceNumber || "N/A" },
    ];
    currentY = drawTableRow(doc, currentY, refCols, {
      font: "Helvetica-Bold",
      height: 16,
      borderBottom: false,
    });

    const dateCols = [
      { x: 50, width: 120, text: "Invoice Date" },
      { x: 170, width: 10, text: "|" },
      { x: 185, width: 170, text: formatDate(payment.paymentDate) },
    ];
    currentY = drawTableRow(doc, currentY, dateCols, {
      height: 16,
      borderBottom: false,
    });

    const memberIdCols = [
      { x: 50, width: 120, text: "Member ID" },
      { x: 170, width: 10, text: "|" },
      {
        x: 185,
        width: 170,
        text: payment.memberId?._id
          ? payment.memberId._id.toString().slice(-8).toUpperCase()
          : "N/A",
      },
    ];
    currentY = drawTableRow(doc, currentY, memberIdCols, {
      height: 16,
      borderBottom: false,
    });

    const modeCols = [
      { x: 50, width: 120, text: "Payment Mode" },
      { x: 170, width: 10, text: "|" },
      {
        x: 185,
        width: 170,
        text: (payment.paymentMode || "N/A").toUpperCase(),
      },
    ];
    currentY = drawTableRow(doc, currentY, modeCols, {
      height: 16,
      borderBottom: true,
    });
    doc.moveDown(1.2);

    /* ================= 4. COMPANY DETAILS ================= */
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("COMPANY DETAILS", 50);
    doc.font("Helvetica").fontSize(9).fillColor(secondaryColor);
    doc.text("LNS CHITFUND", 50);
    doc.text(
      "No. 456, 2nd Floor, Gold Plaza, RR Nagar, Bangalore, Karnataka - 560098",
      50
    );
    doc.text("GSTIN: 29LNSCF1234F1Z5 | Email: contact@lnschitfund.com", 50);
    doc.moveDown(1.2);

    /* ================= 5. BILL TO – MEMBER DETAILS ================= */
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
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
      const cols = [
        { x: 50, width: 80, text: detail[0] },
        { x: 130, width: 10, text: "|" },
        { x: 145, width: 405, text: detail[1] },
      ];
      currentY = drawTableRow(doc, currentY, cols, {
        height: 16,
        borderBottom: index === memberDetails.length - 1,
      });
    });
    doc.moveDown(1.5);

    /* ================= 6. DESCRIPTION TABLE ================= */
    const gridTop = doc.y;
    const gridCols = [
      { x: 50, width: 190, text: "DESCRIPTION / CHIT NAME", align: "left" },
      { x: 240, width: 100, text: "LOCATION", align: "left" },
      { x: 340, width: 100, text: "DATE", align: "right" },
      { x: 440, width: 110, text: "AMOUNT (INR)", align: "right" },
    ];

    // Header
    currentY = drawTableRow(doc, gridTop, gridCols, {
      font: "Helvetica-Bold",
      backgroundColor: lightGrey,
      fillColor: primaryColor,
      height: 20,
    });

    // Body
    const chit = payment.chitId || {};
    const bodyCols = [
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
    ];
    currentY = drawTableRow(doc, currentY, bodyCols, { height: 20 });
    doc.moveDown(0.8);

    /* ================= 7. SUMMARY TABLE ================= */
    const summaryX = 350;

    const subTotalCols = [
      { x: summaryX, width: 100, text: "Sub Total", align: "left" },
      { x: summaryX + 100, width: 10, text: "|" },
      {
        x: summaryX + 110,
        width: 90,
        text: `INR ${Number(payment.paidAmount || 0).toLocaleString(
          "en-IN"
        )}.00`,
        align: "right",
      },
    ];
    currentY = drawTableRow(doc, currentY, subTotalCols, {
      height: 16,
      borderBottom: false,
    });

    const penaltyCols = [
      { x: summaryX, width: 100, text: "Penalty Charges", align: "left" },
      { x: summaryX + 100, width: 10, text: "|" },
      {
        x: summaryX + 110,
        width: 90,
        text: `INR ${Number(payment.penaltyAmount || 0).toLocaleString(
          "en-IN"
        )}.00`,
        align: "right",
      },
    ];
    currentY = drawTableRow(doc, currentY, penaltyCols, {
      height: 16,
      borderBottom: false,
    });

    const grandTotal =
      Number(payment.paidAmount || 0) + Number(payment.penaltyAmount || 0);
    const totalCols = [
      { x: summaryX, width: 100, text: "GRAND TOTAL", align: "left" },
      { x: summaryX + 100, width: 10, text: "|" },
      {
        x: summaryX + 110,
        width: 90,
        text: `INR ${grandTotal.toLocaleString("en-IN")}.00`,
        align: "right",
      },
    ];
    currentY = drawTableRow(doc, currentY, totalCols, {
      font: "Helvetica-Bold",
      height: 20,
      backgroundColor: lightGrey,
    });
    doc.moveDown(1.5);

    /* ================= 8. TERMS & CONDITIONS ================= */
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("TERMS & CONDITIONS", 50);
    const terms = [
      "This receipt is valid only subject to the realization of the payment instrument.",
      "Monthly installments must be paid on or before the due date.",
      "Delayed payments attract penalty charges (10%) as per company policy.",
      "All disputes are subject to the jurisdiction of courts in Bangalore.",
      "Please preserve this document for all future correspondence.",
    ];
    terms.forEach((term, i) => {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text(`${i + 1}. ${term}`, 50, doc.y + 1, { width: 500 });
    });
    doc.moveDown(1.2);

    /* ================= 9. DECLARATION ================= */
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("DECLARATION", 50);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(secondaryColor)
      .text(
        "We hereby declare that this invoice shows the actual price of the services described and that all particulars are true and correct.",
        50,
        doc.y + 3,
        { width: 500 }
      );
    doc.moveDown(1.5);

    /* ================= 10. SIGNATURE SECTION ================= */
    const sigY = doc.y;
    if (sigY > doc.page.height - 120) {
      doc.addPage();
    }
    const finalSigY = doc.y;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("FOR LNS CHITFUND", 400, finalSigY, { align: "right" });
    doc.moveDown(1.5);
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(secondaryColor)
      .text("Authorized Signatory", 400, doc.y + 8, { align: "right" });
    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .text("(Digitally Signed)", 400, doc.y + 2, { align: "right" });

    /* ================= 11. GLOBAL FOOTER (Applied to all pages) ================= */
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
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
        `Page ${i + 1} of ${
          range.count
        } | E. & O.E. | This is a system-generated document.`,
        50,
        footerY + 18,
        { align: "center", width: 500 }
      );
    }

    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    if (!res.headersSent) {
      res.status(500).send("Internal Server Error during PDF generation");
    }
  }
};

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

// Layout Constants
const PRIMARY_COLOR = "#000000";
const SECONDARY_COLOR = "#444444";
const LIGHT_GREY = "#f9f9f9";
const LOGO_PATH = path.join(__dirname, "logo.png");

// Internal shared branding helpers
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
    `Page ${pageNum} of ${totalPages} | Generated on ${new Date().toLocaleDateString()}`,
    50,
    footerY + 18,
    { align: "center", width: 500 }
  );
  doc.text(
    "This is a system-generated document and does not require a physical signature.",
    50,
    footerY + 28,
    { align: "center", width: 500 }
  );
  doc.restore();
};

/**
 * Generates a Welcome PDF and returns it as a Buffer
 * @param {Object} member - Member object with populated chits
 * @param {Array} payments - Optional payment history array
 * @returns {Promise<Buffer>}
 */
exports.generateWelcomePDFBuffer = (member, payments = []) => {
  console.log(
    `🚀 [DEBUG] Generating Welcome PDF for ${member.name} (Buffered Order Fix)`
  );
  return new Promise(async (resolve, reject) => {
    try {
      const settings = await Settings.findOne();
      const termsAndConditions =
        settings?.termsAndConditions?.length > 0
          ? settings.termsAndConditions
          : [
              "Members must pay the monthly installment amount on or before the specified due date.",
              "A penalty for late payment will be charged as per the management's policy (Standard 10%).",
              "Members are not permitted to withdraw or leave the chit midway without settling all outstanding dues.",
              "LNS CHITFUND reserves the right to take legal action in case of consistent payment defaults.",
              "All disputes are subject to the jurisdiction of the local courts in Bangalore, Karnataka.",
            ];

      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 120, bottom: 85, left: 50, right: 50 },
        font: "Helvetica",
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", (err) => reject(err));

      /* ================= 1. PAGE TITLE ================= */
      const isSingleChit = member.chits?.length === 1;
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text(
          isSingleChit
            ? "MEMBER CHIT ASSIGNMENT & PAYMENT SUMMARY"
            : "MEMBERSHIP & CHIT ASSIGNMENT DETAILS",
          { align: "center" }
        );
      doc.moveDown(0.8);

      /* ================= 2. WELCOME MESSAGE ================= */
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text(`Welcome, ${member.name}!`, 50);
      doc.moveDown(0.2);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(SECONDARY_COLOR)
        .text(
          "Thank you for joining our Chit Fund. Below are your membership and assigned chit details for your records.",
          50
        );
      doc.moveDown(1);

      /* ================= 3. MEMBER PROFILE ================= */
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("MEMBER PROFILE", 50);
      doc.moveDown(0.3);
      let currentY = doc.y;
      const profile = [
        [
          "Member ID",
          member._id ? member._id.toString().slice(-8).toUpperCase() : "N/A",
        ],
        ["Full Name", member.name || "N/A"],
        ["Phone", member.phone || "N/A"],
        ["Email", member.email || "N/A"],
        ["Address", member.address || "N/A"],
        ["Status", (member.status || "Active").toUpperCase()],
      ];
      profile.forEach((item, index) => {
        currentY = drawTableRow(
          doc,
          currentY,
          [
            { x: 50, width: 100, text: item[0] },
            { x: 150, width: 10, text: "|" },
            { x: 170, width: 380, text: item[1] },
          ],
          { height: 16, borderBottom: index === profile.length - 1 }
        );
      });
      doc.moveDown(1.2);

      /* ================= 4. ASSIGNED CHITS GRID ================= */
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("ASSIGNED CHITS / INVESTMENT DETAILS", 50);
      doc.moveDown(0.3);

      const gridCols = [
        { x: 50, width: 150, text: "CHIT NAME", align: "left" },
        { x: 200, width: 100, text: "LOCATION", align: "left" },
        { x: 300, width: 70, text: "AMOUNT", align: "right" },
        { x: 370, width: 60, text: "SLOTS", align: "right" },
        { x: 430, width: 70, text: "START DATE", align: "right" },
        { x: 500, width: 50, text: "DUR.", align: "right" },
      ];

      currentY = drawTableRow(doc, doc.y, gridCols, {
        font: "Helvetica-Bold",
        backgroundColor: LIGHT_GREY,
        fillColor: PRIMARY_COLOR,
        height: 20,
      });

      if (member.chits && member.chits.length > 0) {
        member.chits.forEach((c) => {
          const chit = c.chitId || {};
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = doc.y;
          }
          currentY = drawTableRow(
            doc,
            currentY,
            [
              {
                x: 50,
                width: 150,
                text: chit.chitName || "N/A",
                align: "left",
              },
              {
                x: 200,
                width: 100,
                text: (chit.location || "N/A").slice(0, 20),
                align: "left",
              },
              {
                x: 300,
                width: 70,
                text: `INR ${Number(chit.amount || 0).toLocaleString("en-IN")}`,
                align: "right",
              },
              { x: 370, width: 60, text: `${c.slots || 1}`, align: "right" },
              {
                x: 430,
                width: 70,
                text: formatDate(chit.startDate),
                align: "right",
              },
              {
                x: 500,
                width: 50,
                text: `${chit.duration || 0}M`,
                align: "right",
              },
            ],
            { height: 20 }
          );
        });
      }
      doc.moveDown(1.2);

      /* ================= 5. PAYMENT HISTORY ================= */
      if (payments && payments.length > 0) {
        if (doc.y > doc.page.height - 150) doc.addPage();
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .fillColor(PRIMARY_COLOR)
          .text("PAYMENT HISTORY (LAST 20 TRANSACTIONS)", 50);
        doc.moveDown(0.3);

        const payCols = [
          { x: 50, width: 80, text: "ID", align: "left" },
          { x: 130, width: 140, text: "CHIT", align: "left" },
          { x: 270, width: 80, text: "DATE", align: "left" },
          { x: 350, width: 60, text: "SLOT #", align: "center" },
          { x: 410, width: 140, text: "TOTAL PAID", align: "right" },
        ];

        currentY = drawTableRow(doc, doc.y, payCols, {
          font: "Helvetica-Bold",
          backgroundColor: LIGHT_GREY,
          fillColor: PRIMARY_COLOR,
          height: 18,
        });

        payments.slice(0, 20).forEach((p) => {
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = doc.y;
          }
          currentY = drawTableRow(
            doc,
            currentY,
            [
              { x: 50, width: 80, text: p.paymentId || "N/A", align: "left" },
              {
                x: 130,
                width: 140,
                text: (p.chitId?.chitName || "N/A").slice(0, 15),
                align: "left",
              },
              {
                x: 270,
                width: 80,
                text: formatDate(p.paymentDate),
                align: "left",
              },
              {
                x: 350,
                width: 60,
                text: p.slotNumber || "N/A",
                align: "center",
              },
              {
                x: 410,
                width: 140,
                text: `INR ${Number(p.paidAmount || 0).toLocaleString(
                  "en-IN"
                )}`,
                align: "right",
              },
            ],
            { height: 18 }
          );
        });
        doc.moveDown(1.2);
      }

      /* ================= 6. TERMS & CONDITIONS ================= */
      if (doc.y > doc.page.height - 150) doc.addPage();
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("TERMS AND CONDITIONS", 50);
      doc.moveDown(0.3);
      termsAndConditions.forEach((term, i) => {
        if (doc.y > doc.page.height - 60) doc.addPage();
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(SECONDARY_COLOR)
          .text(`${i + 1}. ${term}`, 50, doc.y + 1, { width: 500 });
      });
      doc.moveDown(1.2);

      /* ================= 7. DECLARATION ================= */
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
          "I hereby acknowledge that I have received, read and understood the terms and conditions mentioned above and I agree to abide by the same for the entire duration of the chit funds assigned to me.",
          50,
          doc.y + 3,
          { width: 500 }
        );
      doc.moveDown(2);

      /* ================= 8. SIGNATURE SECTION ================= */
      if (doc.y > doc.page.height - 120) doc.addPage();
      const finalSigY = doc.y;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("MEMBER SIGNATURE", 50, finalSigY);
      doc.text("FOR LNS CHITFUND", 400, finalSigY, { align: "right" });
      doc.moveDown(2);
      doc.fontSize(9).font("Helvetica").text("________________________", 50);
      doc.text("________________________", 400, doc.y - 12, { align: "right" });

      // Final pass: Branding logic
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawHeader(doc);
        drawFooter(doc, i + 1, range.count);
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

const PDFDocument = require("pdfkit");
const path = require("path");
const axios = require("axios");
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

/**
 * Generates a Welcome PDF and returns it as a Buffer
 * @param {Object} member - Member object with populated chits
 * @param {Array} payments - Optional payment history array
 * @returns {Promise<Buffer>}
 */
exports.generateWelcomePDFBuffer = async (member, payments = []) => {
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
        margins: { top: 50, bottom: 80, left: 50, right: 50 },
        font: "Helvetica",
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // --- HEADER ---
      try {
        doc.image(LOGO_PATH, 50, 40, { width: 50 });
      } catch (err) {
        console.error("Logo not found");
      }
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("LNS CHITFUND", 115, 45);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(SECONDARY_COLOR)
        .text("Expert Chit Fund Management & Financial Services", 115, 65);

      doc.moveDown(3);

      /* ================= TITLE ================= */
      const isSingleChit = member.chits?.length === 1;
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text(
          isSingleChit
            ? "MEMBER CHIT ASSIGNMENT & PAYMENT SUMMARY"
            : "MEMBERSHIP & CHIT ASSIGNMENT DETAILS",
          { align: "center" },
        );
      doc.moveDown(2);

      /* ================= WELCOME MESSAGE ================= */
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(PRIMARY_COLOR)
        .text(`Dear ${member.name},`);
      doc.moveDown(0.5);
      doc.text(
        "Thank you for choosing LNS CHITFUND. We are pleased to welcome you as a valued member. Below are the details of your membership and assigned chits for your reference.",
      );
      doc.moveDown(1.5);

      /* ================= MEMBER PROFILE ================= */
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("MEMBER PROFILE", 100);
      doc.moveDown(0.2);

      const startX = 100;
      const keyWidth = 120;
      const valueX = startX + keyWidth + 10;

      const profile = [
        [
          "Member ID",
          `:   ${
            member._id ? member._id.toString().slice(-8).toUpperCase() : "N/A"
          }`,
        ],
        ["Full Name", `:   ${member.name || "N/A"}`],
        ["Phone", `:   ${member.phone || "N/A"}`],
        ["Email", `:   ${member.email || "N/A"}`],
        ["Address", `:   ${member.address || "N/A"}`],
      ];

      profile.forEach((row) => {
        const y = doc.y;
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(SECONDARY_COLOR)
          .text(row[0], startX, y, { width: keyWidth });
        doc.text(row[1], valueX, y);
        doc.moveDown(0.5);
      });

      doc.moveDown(1);
      doc
        .moveTo(startX, doc.y)
        .lineTo(500, doc.y)
        .strokeColor("#e0e0e0")
        .stroke();
      doc.moveDown(1);

      /* ================= ASSIGNED CHITS ================= */
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("ASSIGNED CHITS / INVESTMENT DETAILS", 50);
      doc.moveDown(0.5);

      const gridCols = [
        { x: 50, width: 140, text: "CHIT NAME", align: "left" },
        { x: 190, width: 90, text: "LOCATION", align: "left" },
        { x: 280, width: 80, text: "AMOUNT", align: "right" },
        { x: 370, width: 60, text: "SLOTS", align: "right" },
        { x: 440, width: 110, text: "START DATE", align: "right" },
      ];

      let currentY = drawTableRow(doc, doc.y, gridCols, {
        font: "Helvetica-Bold",
        backgroundColor: LIGHT_GREY,
        fillColor: PRIMARY_COLOR,
        height: 20,
      });

      if (member.chits && member.chits.length > 0) {
        for (const c of member.chits) {
          const chit = c.chitId || {};
          if (currentY > doc.page.height - 120) {
            doc.addPage();
            currentY = doc.y;
          }

          // Fetch and Draw Image if available
          if (chit.chitImage) {
            try {
              const imageResponse = await axios.get(chit.chitImage, {
                responseType: "arraybuffer",
                timeout: 5000,
              });
              doc.image(imageResponse.data, 50, currentY + 2, {
                width: 40,
                height: 40,
              });
            } catch (imgError) {
              console.error("Failed to fetch chit image for PDF:", imgError);
            }
          }

          const rowStartX = chit.chitImage ? 100 : 50;
          const nameWidth = chit.chitImage ? 90 : 140;

          currentY = drawTableRow(
            doc,
            currentY,
            [
              {
                x: rowStartX,
                width: nameWidth,
                text: chit.chitName || "N/A",
                align: "left",
              },
              {
                x: 190,
                width: 90,
                text: (chit.location || "N/A").slice(0, 15),
                align: "left",
              },
              {
                x: 280,
                width: 80,
                text: `INR ${Number(chit.amount || 0).toLocaleString("en-IN")}`,
                align: "right",
              },
              { x: 370, width: 60, text: `${c.slots || 1}`, align: "right" },
              {
                x: 440,
                width: 110,
                text: formatDate(chit.startDate),
                align: "right",
              },
            ],
            { height: chit.chitImage ? 45 : 20 },
          );
        }
      }
      doc.moveDown(1.5);

      /* ================= PAYMENT HISTORY (Summary) ================= */
      if (payments && payments.length > 0) {
        if (doc.y > doc.page.height - 150) doc.addPage();
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor(PRIMARY_COLOR)
          .text("RECENT TRANSACTIONS (LAST 10)", 50);
        doc.moveDown(0.5);

        const payCols = [
          { x: 50, width: 100, text: "DATE", align: "left" },
          { x: 150, width: 150, text: "CHIT NAME", align: "left" },
          { x: 300, width: 100, text: "SLOT #", align: "left" },
          { x: 400, width: 150, text: "TOTAL PAID", align: "right" },
        ];

        currentY = drawTableRow(doc, doc.y, payCols, {
          font: "Helvetica-Bold",
          backgroundColor: LIGHT_GREY,
          fillColor: PRIMARY_COLOR,
          height: 20,
        });

        payments.slice(0, 10).forEach((p) => {
          if (currentY > doc.page.height - 80) {
            doc.addPage();
            currentY = doc.y;
          }
          currentY = drawTableRow(
            doc,
            currentY,
            [
              {
                x: 50,
                width: 100,
                text: formatDate(p.paymentDate),
                align: "left",
              },
              {
                x: 150,
                width: 150,
                text: (p.chitId?.chitName || "N/A").slice(0, 20),
                align: "left",
              },
              {
                x: 300,
                width: 100,
                text: `Slot ${p.slotNumber || 1}`,
                align: "left",
              },
              {
                x: 400,
                width: 150,
                text: `INR ${Number(p.paidAmount || 0).toLocaleString(
                  "en-IN",
                )}`,
                align: "right",
              },
            ],
            { height: 20 },
          );
        });
        doc.moveDown(1.5);
      }

      /* ================= TERMS ================= */
      if (doc.y > doc.page.height - 150) doc.addPage();
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("TERMS AND CONDITIONS", 50);
      doc.moveDown(0.3);
      termsAndConditions.forEach((term, i) => {
        if (doc.y > doc.page.height - 60) doc.addPage();
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(SECONDARY_COLOR)
          .text(`${i + 1}. ${term}`, 50, doc.y + 2, { width: 500 });
      });
      doc.moveDown(2);

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#888")
        .text("This is an electronically generated document.", 50);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

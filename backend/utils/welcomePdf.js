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
 * Generates a Welcome PDF and returns it as a Buffer
 * @param {Object} member - Member object with populated chits
 * @returns {Promise<Buffer>}
 */
exports.generateWelcomePDFBuffer = (member) => {
  console.log(
    `🚀 [DEBUG] Generating Welcome PDF for ${member.name} (Buffered Layout)`
  );
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        font: "Helvetica",
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      const primaryColor = "#000000";
      const secondaryColor = "#444444";
      const lightGrey = "#f9f9f9";

      /* ================= 1. HEADER ================= */
      const logoPath = path.join(__dirname, "logo.png");

      try {
        // Position logo at top-left
        doc.image(logoPath, 50, 40, { width: 55 });
      } catch (err) {
        console.error("Logo image not found for PDF:", err);
      }

      // Header text - vertically centered relative to the 55px logo
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("LNS CHITFUND", 115, 48, { align: "left" });
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text("Expert Chit Fund Management & Financial Services", 115, 66, {
          align: "left",
        });
      doc.moveDown(3.2);

      /* ================= 2. TITLE ================= */
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("MEMBERSHIP & CHIT ASSIGNMENT DETAILS", {
          align: "center",
          underline: false,
        });
      doc.moveDown(0.8);

      /* ================= 3. WELCOME MESSAGE ================= */
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text(`Welcome, ${member.name}!`, 50);
      doc.moveDown(0.2);
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text(
          "Thank you for joining our Chit Fund. Below are your membership and assigned chit details for your records.",
          50
        );
      doc.moveDown(1);

      /* ================= 4. MEMBER PROFILE ================= */
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
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
        const cols = [
          { x: 50, width: 100, text: item[0] },
          { x: 150, width: 10, text: "|" },
          { x: 170, width: 380, text: item[1] },
        ];
        currentY = drawTableRow(doc, currentY, cols, {
          height: 16,
          borderBottom: index === profile.length - 1,
        });
      });
      doc.moveDown(1.2);

      /* ================= 5. ASSIGNED CHITS GRID ================= */
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("ASSIGNED CHITS / INVESTMENT DETAILS", 50);
      doc.moveDown(0.3);

      const gridTop = doc.y;
      const gridCols = [
        { x: 50, width: 150, text: "CHIT NAME", align: "left" },
        { x: 200, width: 100, text: "LOCATION", align: "left" },
        { x: 300, width: 90, text: "AMOUNT", align: "right" },
        { x: 390, width: 90, text: "START DATE", align: "right" },
        { x: 480, width: 70, text: "DURATION", align: "right" },
      ];

      currentY = drawTableRow(doc, gridTop, gridCols, {
        font: "Helvetica-Bold",
        backgroundColor: lightGrey,
        fillColor: primaryColor,
        height: 20,
      });

      if (member.chits && member.chits.length > 0) {
        member.chits.forEach((c) => {
          const chit = c.chitId || {};
          const bodyCols = [
            { x: 50, width: 150, text: chit.chitName || "N/A", align: "left" },
            {
              x: 200,
              width: 100,
              text: (chit.location || "N/A").slice(0, 20),
              align: "left",
            },
            {
              x: 300,
              width: 90,
              text: `INR ${Number(chit.amount || 0).toLocaleString("en-IN")}`,
              align: "right",
            },
            {
              x: 390,
              width: 90,
              text: formatDate(chit.startDate),
              align: "right",
            },
            {
              x: 480,
              width: 70,
              text: `${chit.duration || 0} Months`,
              align: "right",
            },
          ];
          currentY = drawTableRow(doc, currentY, bodyCols, { height: 20 });
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = doc.y;
          }
        });
      } else {
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .text("No chits assigned yet.", 50, currentY + 5);
        currentY += 20;
      }
      doc.y = currentY;
      doc.moveDown(1.2);

      /* ================= 6. TERMS & CONDITIONS ================= */
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("TERMS AND CONDITIONS", 50);
      doc.moveDown(0.3);
      const terms = [
        "Members must pay the monthly installment amount on or before the specified due date.",
        "A penalty for late payment will be charged as per the management's policy (Standard 10%).",
        "Members are not permitted to withdraw or leave the chit midway without settling all outstanding dues.",
        "LNS CHITFUND reserves the right to take legal action in case of consistent payment defaults.",
        "All disputes are subject to the jurisdiction of the local courts in Bangalore, Karnataka.",
      ];
      terms.forEach((term, i) => {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(`${i + 1}. ${term}`, 50, doc.y + 1, { width: 500 });
      });
      doc.moveDown(1.2);

      /* ================= 7. DECLARATION ================= */
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
          "I hereby acknowledge that I have received, read and understood the terms and conditions mentioned above and I agree to abide by the same for the entire duration of the chit funds assigned to me.",
          50,
          doc.y + 3,
          { width: 500 }
        );
      doc.moveDown(2);

      /* ================= 8. SIGNATURE SECTION ================= */
      const sigY = doc.y;
      if (sigY > doc.page.height - 120) {
        doc.addPage();
      }
      const finalSigY = doc.y;
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(primaryColor)
        .text("MEMBER SIGNATURE", 50, finalSigY);
      doc.text("FOR LNS CHITFUND", 400, finalSigY, { align: "right" });
      doc.moveDown(2);
      doc.fontSize(9).font("Helvetica").text("________________________", 50);
      doc.text("________________________", 400, doc.y - 12, { align: "right" });

      /* ================= 9. GLOBAL FOOTER (Applied to all pages) ================= */
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
          } | Generated on ${new Date().toLocaleDateString()}`,
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
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

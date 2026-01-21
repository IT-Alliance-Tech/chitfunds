const PDFDocument = require("pdfkit");
const path = require("path");
const axios = require("axios");
const Settings = require("../models/Settings");

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

const LOGO_PATH = path.join(__dirname, "logo.png");
const SIGNATURE_PATH = path.join(__dirname, "signature.jpg");

// Branding Helpers
const drawLine = (doc, y, color = "#000", width = 1) => {
  doc.moveTo(50, y).lineTo(550, y).strokeColor(color).lineWidth(width).stroke();
};

const drawTableFrame = (doc, y, height) => {
  doc.rect(50, y, 500, height).strokeColor("#94a3b8").lineWidth(0.6).stroke();
};

const drawHeader = (doc) => {
  const headerY = 45;
  try {
    doc.image(LOGO_PATH, 50, headerY - 10, { width: 60 });
  } catch (err) {}

  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#000")
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
      },
    );

  doc.fillColor("#000");
  drawLine(doc, headerY + 55, "#000", 0.5);
};

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

      drawHeader(doc);
      doc.moveDown(4);

      // --- TITLE ---
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("MEMBER CHIT ASSIGNMENT & PAYMENT SUMMARY", 50, doc.y, {
          align: "center",
          width: 500,
        });
      doc.moveDown(2);

      // --- PROFILE ---
      const rightColX = 320;
      let startY = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Dear ${member.name},`, 50, startY);
      doc.moveDown(0.5);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#475569")
        .text(
          "We are pleased to welcome you as a valued member. Below are your membership details.",
          50,
          doc.y,
          { width: 250 },
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000")
        .text("MEMBER PROFILE", rightColX, startY);
      doc
        .moveTo(rightColX, startY + 12)
        .lineTo(rightColX + 150, startY + 12)
        .strokeColor("#cbd5e1")
        .lineWidth(0.5)
        .stroke();

      const profile = [
        ["Member ID", member.memberId || "N/A"],
        ["Phone", member.phone || "N/A"],
        ["Email", member.email || "N/A"],
        ["Address", (member.address || "N/A").slice(0, 40)],
      ];
      let pY = startY + 22;
      profile.forEach(([l, v]) => {
        doc
          .font("Helvetica-Bold")
          .fontSize(8)
          .fillColor("#1e293b")
          .text(l, rightColX, pY, { width: 50 });
        doc
          .font("Helvetica")
          .fillColor("#475569")
          .text(`: ${v}`, rightColX + 50, pY, { width: 180 });
        pY += 14;
      });

      doc.y = Math.max(doc.y, pY) + 20;
      drawLine(doc, doc.y, "#eee", 1);
      doc.moveDown(2);

      // --- CHITS TABLE ---
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000")
        .text("ASSIGNED CHITS / INVESTMENT DETAILS", 50);
      doc.moveDown(0.6);

      let tY = doc.y;
      const hH = 22;
      doc.rect(50, tY, 500, hH).fill("#f1f5f9");
      doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9);
      doc.text("Chit Name", 65, tY + 7);
      doc.text("Location", 220, tY + 7);
      doc.text("Amount", 310, tY + 7, { width: 60, align: "right" });
      doc.text("Slots", 400, tY + 7, { width: 30, align: "right" });
      doc.text("Start Date", 460, tY + 7, { width: 80, align: "right" });

      let curY = tY + hH;
      doc.font("Helvetica").fontSize(8.5).fillColor("#000");

      if (member.chits && member.chits.length > 0) {
        for (const c of member.chits) {
          const chit = c.chitId || {};
          const rowH = 28; // Standard height without image in row

          if (curY + rowH > doc.page.height - 100) {
            drawTableFrame(doc, tY, curY - tY);
            [210, 300, 390, 450].forEach((lx) =>
              doc
                .moveTo(lx, tY)
                .lineTo(lx, curY)
                .strokeColor("#94a3b8")
                .stroke(),
            );
            doc.addPage();
            drawHeader(doc);
            tY = doc.y + 20;
            doc.rect(50, tY, 500, hH).fill("#f1f5f9");
            curY = tY + hH;
          }

          doc.text(chit.chitName || "N/A", 65, curY + 10, { width: 140 });
          doc.text((chit.location || "N/A").slice(0, 15), 220, curY + 10);
          doc.text(
            Number(chit.amount || 0).toLocaleString("en-IN"),
            310,
            curY + 10,
            { width: 60, align: "right" },
          );
          doc.text(`${c.slots || 1}`, 400, curY + 10, {
            width: 30,
            align: "right",
          });
          doc.text(formatDate(chit.startDate), 460, curY + 10, {
            width: 80,
            align: "right",
          });
          curY += rowH;
        }
      }

      drawTableFrame(doc, tY, curY - tY);
      [210, 300, 390, 450].forEach((lx) =>
        doc.moveTo(lx, tY).lineTo(lx, curY).strokeColor("#94a3b8").stroke(),
      );

      doc.y = curY + 30;

      // --- PAYMENTS TABLE ---
      if (payments && payments.length > 0) {
        if (doc.y > doc.page.height - 150) {
          doc.addPage();
          drawHeader(doc);
          doc.y += 20;
        }

        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#000")
          .text("RECENT TRANSACTIONS", 50);
        doc.moveDown(0.5);
        let pTY = doc.y;
        doc.rect(50, pTY, 500, hH).fill("#f1f5f9");
        doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9);
        doc.text("Date", 65, pTY + 7);
        doc.text("Chit Name", 160, pTY + 7);
        doc.text("Amount", 460, pTY + 7, { width: 80, align: "right" });
        let pY = pTY + hH;
        payments.slice(0, 10).forEach((p) => {
          if (pY + 20 > doc.page.height - 80) {
            drawTableFrame(doc, pTY, pY - pTY);
            [150, 450].forEach((lx) =>
              doc
                .moveTo(lx, pTY)
                .lineTo(lx, pY)
                .strokeColor("#94a3b8")
                .stroke(),
            );
            doc.addPage();
            drawHeader(doc);
            pTY = doc.y + 20;
            doc.rect(50, pTY, 500, hH).fill("#f1f5f9");
            pY = pTY + hH;
          }
          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("#000")
            .text(formatDate(p.paymentDate), 65, pY + 8);
          doc.text(p.chitId?.chitName || "N/A", 160, pY + 8);
          doc.text(
            Number(p.paidAmount || 0).toLocaleString("en-IN"),
            460,
            pY + 8,
            { width: 80, align: "right" },
          );
          pY += 20;
        });
        drawTableFrame(doc, pTY, pY - pTY);
        [150, 450].forEach((lx) =>
          doc.moveTo(lx, pTY).lineTo(lx, pY).strokeColor("#94a3b8").stroke(),
        );
        doc.y = pY + 30;
      }

      // --- T&C ---
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
        drawHeader(doc);
        doc.y += 20;
      }
      doc.font("Helvetica-Bold").fontSize(12).text("TERMS AND CONDITIONS", 50);
      termsAndConditions.forEach((t, i) => {
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor("#475569")
          .text(`${i + 1}. ${t}`, 50, doc.y + 5, { width: 500 });
      });

      doc.moveDown(1);

      // Check if signature section will overlap with footer (footer starts at y=750)
      // Signature section needs ~56px, so check if current y + 56 > 750
      const signatureSectionHeight = 56;
      const footerStartY = 750;
      if (doc.y + signatureSectionHeight > footerStartY) {
        doc.addPage();
        drawHeader(doc);
        doc.y += 20;
      }

      // Company name
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#000")
        .text("FOR LNS CHITFUND", 400, doc.y, { align: "right", width: 150 });
      doc.y += 8; // Reduced from 12 to move image up

      // Signature image (right-aligned, compact)
      try {
        const signatureWidth = 55;
        const rightEdge = 550;
        const signatureX = rightEdge - signatureWidth;
        doc.image(SIGNATURE_PATH, signatureX, doc.y, { width: signatureWidth });
        doc.y += 40; // Increased from 32 to push text down
      } catch (err) {
        console.error("Signature image fail:", err.message);
        doc.y += 12;
      }

      // Digitally signed text
      doc
        .font("Helvetica-Oblique")
        .fontSize(8)
        .text("(Digitally Signed)", 400, doc.y, { align: "right", width: 150 });

      // --- CHIT PHOTOS ON PAGE 2 ---
      let hasImages = member.chits?.some((c) => c.chitId?.chitImage);
      if (hasImages) {
        // Always start on a new page for chit images
        doc.addPage();
        drawHeader(doc);
        doc.y += 30;

        doc
          .font("Helvetica-Bold")
          .fontSize(12)
          .fillColor("#1e293b")
          .text("CHIT SCHEME PHOTOS", 50, doc.y, {
            align: "center",
            width: 500,
          });
        doc.moveDown(2);

        for (const c of member.chits) {
          const chit = c.chitId || {};
          if (chit.chitImage) {
            // Check if we need a new page for this image
            const imageHeight = 350; // Larger images for page 2
            if (doc.y + imageHeight + 80 > doc.page.height - 100) {
              doc.addPage();
              drawHeader(doc);
              doc.y += 30;
            }

            // Chit name label
            doc
              .font("Helvetica-Bold")
              .fontSize(11)
              .fillColor("#1e293b")
              .text(chit.chitName || "Chit Image", 50);
            doc.moveDown(0.8);

            try {
              console.log(
                `FETCHING LARGE IMAGE for ${chit.chitName}: ${chit.chitImage}`,
              );
              const res = await axios.get(chit.chitImage, {
                responseType: "arraybuffer",
                timeout: 10000,
              });
              // Display image full width (500px) centered
              doc.image(res.data, 50, doc.y, { width: 500 });
              doc.y += 360; // Space after image
              doc.moveDown(2);
            } catch (err) {
              console.error(
                `PDF LARGE IMG FAIL [${chit.chitName}]:`,
                err.message,
              );
              doc
                .font("Helvetica-Oblique")
                .fontSize(9)
                .fillColor("#ef4444")
                .text("(Failed to load image)");
              doc.moveDown(2);
            }
          }
        }
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

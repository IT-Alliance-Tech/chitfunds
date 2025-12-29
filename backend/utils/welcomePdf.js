const PDFDocument = require("pdfkit");

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/**
 * Generates a Welcome PDF and returns it as a Buffer
 * @param {Object} member - Member object with populated chits
 * @returns {Promise<Buffer>}
 */
exports.generateWelcomePDFBuffer = (member) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      font: "Helvetica",
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    /* ================= HEADER ================= */
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("IT ALLIANCE TECH", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#555")
      .text("Chit Fund Management System", { align: "center" });
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(1);

    /* ================= WELCOME MESSAGE ================= */
    doc
      .fontSize(16)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text(`Welcome, ${member.name}!`, { align: "left" });
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text(
        "Thank you for joining our Chit Fund. Below are your membership and assigned chit details."
      );
    doc.moveDown(2);

    /* ================= MEMBER DETAILS ================= */
    doc.fontSize(14).font("Helvetica-Bold").text("Member Details");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Name: ${member.name}`);
    doc.text(`Phone: ${member.phone}`);
    doc.text(`Email: ${member.email || "N/A"}`);
    doc.text(`Address: ${member.address}`);
    doc.moveDown(2);

    /* ================= ASSIGNED CHITS ================= */
    doc.fontSize(14).font("Helvetica-Bold").text("Assigned Chit Information");
    doc.moveDown(1);

    if (member.chits && member.chits.length > 0) {
      member.chits.forEach((c, index) => {
        const chit = c.chitId;
        if (!chit) return;

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(`Chit ${index + 1}: ${chit.chitName}`);
        doc.fontSize(10).font("Helvetica");
        doc.text(`Location: ${chit.location}`);
        doc.text(`Total Amount: ₹${chit.amount.toLocaleString("en-IN")}`);
        doc.text(
          `Monthly Payable: ₹${chit.monthlyPayableAmount.toLocaleString(
            "en-IN"
          )}`
        );
        doc.text(`Duration: ${chit.duration} Months`);
        doc.text(`Start Date: ${formatDate(chit.startDate)}`);
        doc.text(`Joined On: ${formatDate(c.joinedAt)}`);
        doc.moveDown(1);
      });
    } else {
      doc.fontSize(10).font("Helvetica").text("No chits assigned yet.");
    }
    doc.moveDown(2);

    /* ================= TERMS & CONDITIONS ================= */
    doc.fontSize(14).font("Helvetica-Bold").text("Terms and Conditions");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica");

    const terms = [
      "1. Members must pay the monthly installment amount on or before the specified due date.",
      "2. A penalty for late payment will be charged as per the management's policy.",
      "3. Members are not permitted to withdraw or leave the chit midway without settling all outstanding dues.",
      "4. The management reserves the right to take necessary legal action in case of consistent defaults in payment.",
      "5. All disputes related to the chit fund are subject to the jurisdiction of the local courts where the management is based.",
    ];

    terms.forEach((term) => {
      doc.text(term, { indent: 15 });
      doc.moveDown(0.5);
    });

    /* ================= FOOTER ================= */
    const footerY = doc.page.height - 70;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor("#eee").stroke();
    doc
      .fontSize(9)
      .fillColor("#777")
      .text(
        "This is a system-generated document and does not require a physical signature.",
        50,
        footerY + 10,
        { align: "center" }
      );

    doc.end();
  });
};

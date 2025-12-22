const PDFDocument = require("pdfkit");

const formatDate = (date) => {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

exports.generateInvoicePDF = (res, payment) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    font: "Helvetica",
  });

  // ===== Headers =====
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${payment.invoiceNumber}.pdf`
  );

  doc.pipe(res);

  const paymentDate = formatDate(payment.paymentDate);
  const dueDate = formatDate(payment.dueDate);

  /* ================= HEADER ================= */
  doc.fontSize(18).font("Helvetica-Bold").text("IT ALLIANCE TECH");

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#555")
    .text("Chit Fund Management System");

  // Invoice meta (TOP RIGHT)
  doc
    .fontSize(10)
    .fillColor("#000")
    .text(`Invoice No: ${payment.invoiceNumber}`, 350, 50, { align: "right" })
    .text(`Payment Date: ${paymentDate}`, { align: "right" });

  doc.moveDown(2);
  doc.moveTo(50, 95).lineTo(550, 95).stroke();

  /* ================= BILL TO & CHIT INFO (2 COLUMNS) ================= */

  const leftX = 50;
  const rightX = 320;
  const startY = 110;

  // ----- Bill To -----
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#000")
    .text("Bill To", leftX, startY);

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(`Name  : ${payment.memberId.name}`, leftX, startY + 18)
    .text(`Phone : ${payment.memberId.phone}`, leftX, startY + 34);

  // ----- Chit Info -----
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Chit Information", rightX, startY);

  doc
    .font("Helvetica")
    .fontSize(10)
    .text(`Chit Name   : ${payment.chitId.chitName}`, rightX, startY + 18)
    .text(`Total Amount: ₹${payment.chitId.amount}`, rightX, startY + 34)
    .text(
      `Duration    : ${payment.chitId.duration} months`,
      rightX,
      startY + 50
    )
    .text(`Payment Mode: ${payment.paymentMode}`, rightX, startY + 66)
    .text(`Due Date    : ${dueDate}`, rightX, startY + 82);

  doc.moveDown(6);

  /* ================= PAYMENT STATUS ================= */
  const statusColor = payment.status === "paid" ? "#198754" : "#dc3545";

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(statusColor)
    .text(`Payment Status: ${payment.status.toUpperCase()}`, {
      align: "right",
    });

  doc.moveDown(1);

  /* ================= PAYMENT TABLE ================= */
  const tableTop = doc.y + 10;

  // Table Header
  doc.rect(50, tableTop, 500, 25).fill("#f1f1f1");

  doc
    .fillColor("#000")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Description", 60, tableTop + 7)
    .text("Amount (₹)", 430, tableTop + 7);

  doc.font("Helvetica").fontSize(10);

  const drawRow = (y, label, value, highlight = false) => {
    doc.fillColor("#000").text(label, 60, y);
    doc.fillColor(highlight ? "#dc3545" : "#000").text(`₹${value}`, 430, y);
  };

  let y = tableTop + 35;
  drawRow(y, "Monthly Payable Amount", payment.monthlyPayableAmount);
  y += 22;
  drawRow(y, "Paid Amount", payment.paidAmount);
  y += 22;
  drawRow(y, "Penalty Amount", payment.penaltyAmount);
  y += 22;
  drawRow(y, "Total Paid", payment.totalPaid);
  y += 22;
  drawRow(
    y,
    "Balance Amount",
    payment.balanceAmount,
    payment.balanceAmount > 0
  );

  doc.moveDown(4);

  /* ================= FOOTER ================= */
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#ccc").stroke();

  doc.moveDown(1);
  doc
    .fontSize(9)
    .fillColor("#555")
    .text("This is a system generated bill.", { align: "center" });

  doc.end();
};

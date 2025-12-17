const PDFDocument = require("pdfkit");

exports.generateInvoicePDF = (res, payment) => {
  const doc = new PDFDocument({ margin: 40 });

  // ===== HTTP HEADERS =====
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${payment.invoiceNumber}.pdf`
  );

  // ===== STREAM PDF TO RESPONSE =====
  doc.pipe(res);

  // ===== SAFE DATE HANDLING =====
  const paymentDate =
    payment.paymentDate || payment.createdAt || new Date();

  // ===== TITLE =====
  doc.fontSize(18).text("CHIT PAYMENT INVOICE", { align: "center" });
  doc.moveDown(2);

  // ===== INVOICE INFO =====
  doc.fontSize(12);
  doc.text(`Invoice No : ${payment.invoiceNumber}`);
  doc.text(`Payment Date : ${new Date(paymentDate).toDateString()}`);
  doc.moveDown();

  // ===== MEMBER INFO =====
  doc.text(`Member Name : ${payment.memberId.name}`);
  doc.text(`Phone       : ${payment.memberId.phone}`);
  doc.moveDown();

  // ===== CHIT INFO =====
  doc.text(`Chit Name         : ${payment.chitId.chitName}`);
  doc.text(`Monthly Payable  : ₹${payment.monthlyPayableAmount}`);
  doc.moveDown();

  // ===== PAYMENT INFO =====
  doc.text(`Paid Amount    : ₹${payment.paidAmount}`);
  doc.text(`Penalty Amount: ₹${payment.penaltyAmount}`);
  doc.text(`Total Paid     : ₹${payment.totalPaid}`);
  doc.text(`Balance Amount : ₹${payment.balanceAmount}`);
  doc.moveDown();

  // ===== STATUS =====
  doc.text(`Payment Status : ${payment.status.toUpperCase()}`);
  doc.moveDown(2);

  // ===== FOOTER =====
  doc.text("This is a system generated invoice.", { align: "center" });
  doc.text("Thank you for your payment.", { align: "center" });

  doc.end();
};

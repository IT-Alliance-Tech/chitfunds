const PDFDocument = require("pdfkit");

exports.generateInvoicePDF = (payment) => {
  const doc = new PDFDocument({ margin: 40 });

  doc.fontSize(18).text("CHIT PAYMENT INVOICE", { align: "center" });
  doc.moveDown(2);

  doc.fontSize(12);
  doc.text(`Invoice No: ${payment.invoiceNumber}`);
  doc.text(`Payment Date: ${payment.paymentDate.toDateString()}`);
  doc.moveDown();

  doc.text(`Member: ${payment.memberId.name}`);
  doc.text(`Phone: ${payment.memberId.phone}`);
  doc.moveDown();

  doc.text(`Chit: ${payment.chitId.name}`);
  doc.text(`Monthly Payable: ₹${payment.chitId.monthlyAmount}`);
  doc.text(`Total Chit Amount: ₹${payment.chitId.totalAmount}`);
  doc.moveDown();

  doc.text(`Paid Amount: ₹${payment.paidAmount}`);
  doc.text(`Penalty: ₹${payment.penaltyAmount}`);
  doc.text(`Total Paid (Invoice): ₹${payment.totalPaid}`);
  doc.moveDown();

  doc.text(`Remaining Amount: ₹${payment.remainingAmount}`);
  doc.text(`Remaining Months: ${payment.remainingMonths}`);

  doc.end();
  return doc;
};

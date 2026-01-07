const ExcelJS = require("exceljs");

/**
 * Generate Excel file from payment data
 * @param {Array} data - Array of payment objects
 * @returns {Buffer} - Excel file buffer
 */
const generatePaymentsExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Payments Report");

  // Define columns
  worksheet.columns = [
    { header: "Invoice No", key: "invoiceNumber", width: 20 },
    { header: "Chit Name", key: "chitName", width: 25 },
    { header: "Member Name", key: "memberName", width: 25 },
    { header: "Due Date (Every Month)", key: "dueDateEveryMonth", width: 20 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Payment Date", key: "paymentDate", width: 15 },
    { header: "Paid Amount", key: "paidAmount", width: 15 },
    { header: "Penalty", key: "penaltyAmount", width: 15 },
    { header: "Total Paid", key: "totalPaid", width: 15 },
    { header: "Mode", key: "paymentMode", width: 10 },
    { header: "Status", key: "status", width: 10 },
  ];

  // Formatting header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" }, // Deep Slate
  };
  worksheet.getRow(1).font = { color: { argb: "FFFFFFFF" }, bold: true };

  // Add rows
  data.forEach((p) => {
    worksheet.addRow({
      invoiceNumber: p.invoiceNumber || "-",
      chitName: p.chitId?.chitName || "-",
      memberName: p.memberId?.name || "-",
      dueDateEveryMonth: p.dueDate ? new Date(p.dueDate).getDate() : "-",
      phone: p.memberId?.phone || "-",
      paymentDate: p.paymentDate
        ? new Date(p.paymentDate).toLocaleDateString("en-IN")
        : "-",
      paidAmount: p.paidAmount || 0,
      penaltyAmount: p.penaltyAmount || 0,
      totalPaid: (p.paidAmount || 0) + (p.penaltyAmount || 0),
      paymentMode: p.paymentMode || "-",
      status: p.status || "pending",
    });
  });

  // Alternating row background colors
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = { generatePaymentsExcel };

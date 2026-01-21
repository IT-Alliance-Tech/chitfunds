const ExcelJS = require("exceljs");
const Chit = require("../models/Chit");
const Member = require("../models/Member");
const Payment = require("../models/Payment");
const sendResponse = require("../utils/response");

/**
 * Format Date to DD-MM-YYYY
 */
const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// 1. Export Chits Report
const exportChitsReport = async (req, res, next) => {
  try {
    const chits = await Chit.find().sort({ createdAt: -1 }).lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Total Chits");

    worksheet.columns = [
      { header: "Chit Name", key: "chitName", width: 25 },
      { header: "Location", key: "location", width: 20 },
      { header: "Amount (INR)", key: "amount", width: 15 },
      { header: "Duration (Months)", key: "duration", width: 15 },
      { header: "Due Date (Every Month)", key: "dueDate", width: 22 },
      { header: "Status", key: "status", width: 12 },
      { header: "Monthly Payable", key: "monthlyPayableAmount", width: 18 },
      { header: "Created Date", key: "createdAt", width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };

    chits.forEach((chit) => {
      worksheet.addRow({
        chitName: chit.chitName,
        location: chit.location,
        amount: chit.amount,
        duration: chit.duration,
        dueDate: chit.dueDate,
        status: chit.status,
        monthlyPayableAmount: chit.monthlyPayableAmount,
        createdAt: formatDate(chit.createdAt),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "chits-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Chits Error:", error);
    next(error);
  }
};

// 2. Export Members Report
const exportMembersReport = async (req, res, next) => {
  try {
    const members = await Member.find()
      .populate("chits.chitId")
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Total Members");

    worksheet.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Address", key: "address", width: 40 },
      { header: "Enrolled Chits", key: "enrolledChits", width: 30 },
      { header: "Joined Date", key: "createdAt", width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };

    members.forEach((member) => {
      const chitNames =
        member.chits
          ?.map((c) => c.chitId?.chitName)
          .filter(Boolean)
          .join(", ") || "None";
      worksheet.addRow({
        name: member.name,
        phone: member.phone,
        status: member.status,
        address: member.address,
        enrolledChits: chitNames,
        createdAt: formatDate(member.createdAt),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "members-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Members Error:", error);
    next(error);
  }
};

// 3. Export Total Paid Report (History)
const exportPaymentsReport = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate("chitId", "chitName")
      .populate("memberId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payment History");

    worksheet.columns = [
      { header: "Invoice", key: "invoiceNumber", width: 20 },
      { header: "Member", key: "memberName", width: 25 },
      { header: "Chit", key: "chitName", width: 25 },
      { header: "Paid Amount", key: "paidAmount", width: 15 },
      { header: "Penalty", key: "penaltyAmount", width: 12 },
      { header: "Total Paid", key: "totalPaid", width: 15 },
      { header: "Mode", key: "paymentMode", width: 12 },
      { header: "Payment Month", key: "paymentMonth", width: 15 },
      { header: "Date", key: "paymentDate", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };

    payments.forEach((p) => {
      worksheet.addRow({
        invoiceNumber: p.invoiceNumber,
        memberName: p.memberId?.name || "N/A",
        chitName: p.chitId?.chitName || "N/A",
        paidAmount: p.paidAmount,
        penaltyAmount: p.penaltyAmount,
        totalPaid: (p.paidAmount || 0) + (p.penaltyAmount || 0),
        paymentMode: p.paymentMode,
        paymentMonth: p.paymentMonth,
        paymentDate: formatDate(p.paymentDate),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "payments-history-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Payments Error:", error);
    next(error);
  }
};

// 4. Export Monthly Collections Report
const exportMonthlyReport = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const payments = await Payment.find({
      createdAt: { $gte: startOfMonth },
    })
      .populate("chitId", "chitName")
      .populate("memberId", "name")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Collections");

    worksheet.columns = [
      { header: "Invoice", key: "invoiceNumber", width: 20 },
      { header: "Member", key: "memberName", width: 25 },
      { header: "Chit", key: "chitName", width: 25 },
      { header: "Paid Amount", key: "paidAmount", width: 15 },
      { header: "Mode", key: "paymentMode", width: 12 },
      { header: "Date", key: "createdAt", width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE2E8F0" },
    };

    payments.forEach((p) => {
      worksheet.addRow({
        invoiceNumber: p.invoiceNumber,
        memberName: p.memberId?.name || "N/A",
        chitName: p.chitId?.chitName || "N/A",
        paidAmount: p.paidAmount,
        paymentMode: p.paymentMode,
        createdAt: formatDate(p.createdAt),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "monthly-collections-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Monthly Collections Error:", error);
    next(error);
  }
};

module.exports = {
  exportChitsReport,
  exportMembersReport,
  exportPaymentsReport,
  exportMonthlyReport,
};

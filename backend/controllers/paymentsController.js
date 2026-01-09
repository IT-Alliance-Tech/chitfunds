const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Chit = require("../models/Chit");
const Member = require("../models/Member");
const { generateInvoicePDF } = require("../utils/invoicePdf");
const sendResponse = require("../utils/response");

// Helper: Normalize Date to 00:00:00
const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper: Get Month and Year
const getMonthYear = (date = new Date()) => {
  const d = new Date(date);
  return {
    paymentMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`,
    paymentYear: d.getFullYear(),
  };
};

// create payment
const createPayment = async (req, res) => {
  try {
    const {
      chitId,
      memberId,
      slotPayments = [], // Expecting array of { slotNumber, paidAmount, interestAmount, penaltyAmount, paymentMode, paymentDate, paymentMonth, sendEmail }
    } = req.body;

    if (!Array.isArray(slotPayments) || slotPayments.length === 0) {
      return sendResponse(res, 400, "error", "No slot payments provided");
    }

    const chit = await Chit.findById(chitId);
    if (!chit) {
      return sendResponse(res, 404, "error", "Chit not found");
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return sendResponse(res, 404, "error", "Member not found");
    }

    const createdPayments = [];

    for (const slotPay of slotPayments) {
      const {
        slotNumber,
        paidAmount,
        interestAmount,
        interestPercent,
        penaltyAmount,
        paymentMode,
        paymentDate,
        paymentMonth,
        sendEmail: shouldSendEmail,
      } = slotPay;

      // Basic validation for existing payment for this slot/month
      const existing = await Payment.findOne({
        chitId,
        memberId,
        paymentMonth,
        slotNumber,
      });

      if (existing) {
        // Skip or handle error? The requirement says "no edit option give", so we should ideally skip or fail.
        continue;
      }

      const dateObj = paymentDate ? new Date(paymentDate) : new Date();
      let parts = paymentMonth.split("-");
      let paymentYear = Number(parts[0]);

      // Calculate Due Date based on Chit
      const d = new Date(dateObj);
      d.setDate(Number(chit.dueDate || 1));
      d.setHours(0, 0, 0, 0);
      const finalDueDate = d;

      const payment = await Payment.create({
        chitId,
        memberId,
        paymentMonth,
        paymentYear,
        slotNumber: Number(slotNumber) || 0,
        slots: 1, // Individual slot tracking
        paidAmount: isNaN(Number(paidAmount)) ? 0 : Number(paidAmount),
        interestAmount: isNaN(Number(interestAmount))
          ? 0
          : Number(interestAmount),
        interestPercent: isNaN(Number(interestPercent))
          ? 0
          : Number(interestPercent),
        penaltyAmount: isNaN(Number(penaltyAmount)) ? 0 : Number(penaltyAmount),
        dueDate: finalDueDate,
        paymentMode,
        paymentDate: dateObj,
        invoiceNumber: `INV-${Date.now()}-${slotNumber}`,
        isAdminConfirmed: false,
      });

      createdPayments.push(payment);

      // Handle Email if requested
      if (shouldSendEmail && member.email) {
        // We'll use a background task for email
        setImmediate(async () => {
          try {
            const populatedPayment = await Payment.findById(payment._id)
              .populate("chitId")
              .populate("memberId");

            // We need a way to get PDF buffer
            const { generateInvoicePDFBuffer } = require("../utils/invoicePdf");
            const pdfBuffer = await generateInvoicePDFBuffer(populatedPayment);

            const sendEmailUtil = require("../utils/sendEmail");
            await sendEmailUtil({
              to: member.email,
              subject: `Payment Invoice - ${chit.chitName} - Slot ${slotNumber}`,
              html: `
                <p>Dear ${member.name},</p>
                <p>Thank you for your payment for <b>${chit.chitName}</b> (Slot ${slotNumber}) for the month of ${paymentMonth}.</p>
                <p>Please find the attached invoice for your records.</p>
                <p>Best Regards,<br/>LNS CHITFUND Team</p>
              `,
              attachments: [
                {
                  filename: `Invoice_${payment.invoiceNumber}.pdf`,
                  content: pdfBuffer,
                },
              ],
            });
          } catch (emailErr) {
            console.error("Payment Email Failed:", emailErr);
          }
        });
      }
    }

    return sendResponse(
      res,
      201,
      "success",
      "Payments processed successfully",
      {
        count: createdPayments.length,
        payments: createdPayments,
      }
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// get payments
const getPayments = async (req, res) => {
  try {
    const {
      chitId,
      memberId,
      paymentMode,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};
    if (chitId && mongoose.Types.ObjectId.isValid(chitId)) {
      matchStage.chitId = new mongoose.Types.ObjectId(chitId);
    }
    if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
      matchStage.memberId = new mongoose.Types.ObjectId(memberId);
    }
    if (paymentMode) {
      matchStage.paymentMode = paymentMode;
    }

    const basePipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "chits",
          localField: "chitId",
          foreignField: "_id",
          as: "chitDetails",
        },
      },
      { $unwind: "$chitDetails" },
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "memberDetails",
        },
      },
      { $unwind: "$memberDetails" },
      {
        $addFields: {
          memberTotalSlots: {
            $let: {
              vars: {
                targetChit: {
                  $filter: {
                    input: "$memberDetails.chits",
                    as: "c",
                    cond: { $eq: ["$$c.chitId", "$chitId"] },
                  },
                },
              },
              in: { $ifNull: [{ $arrayElemAt: ["$$targetChit.slots", 0] }, 1] },
            },
          },
        },
      },
      {
        $lookup: {
          from: "payments",
          let: { mId: "$memberId", cId: "$chitId", month: "$paymentMonth" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$memberId", "$$mId"] },
                    { $eq: ["$chitId", "$$cId"] },
                    { $eq: ["$paymentMonth", "$$month"] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "monthlyPayments",
        },
      },
      {
        $addFields: {
          paidSlotsCount: {
            $ifNull: [{ $arrayElemAt: ["$monthlyPayments.count", 0] }, 0],
          },
        },
      },
      {
        $addFields: {
          totalPaid: { $add: ["$paidAmount", "$penaltyAmount"] },
          computedStatus: {
            $cond: {
              if: {
                $and: [
                  {
                    $gte: ["$paidAmount", "$chitDetails.monthlyPayableAmount"],
                  },
                  { $gte: ["$paidSlotsCount", "$memberTotalSlots"] },
                ],
              },
              then: "paid",
              else: {
                $cond: {
                  if: {
                    $or: [
                      { $gt: ["$paidAmount", 0] },
                      { $gt: ["$paidSlotsCount", 0] },
                    ],
                  },
                  then: "partial",
                  else: {
                    $cond: {
                      if: { $lt: ["$dueDate", new Date()] },
                      then: "overdue",
                      else: "pending",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ];

    if (status) {
      basePipeline.push({ $match: { computedStatus: status } });
    }

    // Count before pagination
    const countPipeline = [...basePipeline, { $count: "total" }];
    const countResult = await Payment.aggregate(countPipeline).option({
      maxTimeMS: 5000,
    });
    const total = countResult[0]?.total || 0;

    // Final result with pagination
    basePipeline.push({ $sort: { createdAt: -1 } });
    basePipeline.push({ $skip: skip });
    basePipeline.push({ $limit: limitNum });
    basePipeline.push({
      $project: {
        _id: 1,
        paymentId: 1,
        invoiceNumber: 1,
        paidAmount: 1,
        penaltyAmount: 1,
        totalPaid: 1,
        paymentMonth: 1,
        paymentYear: 1,
        paymentDate: 1,
        dueDate: 1,
        paymentMode: 1,
        status: "$computedStatus",
        chitId: {
          _id: "$chitDetails._id",
          chitName: "$chitDetails.chitName",
          amount: "$chitDetails.amount",
          monthlyPayableAmount: "$chitDetails.monthlyPayableAmount",
          duration: "$chitDetails.duration",
          location: "$chitDetails.location",
        },
        memberId: {
          _id: "$memberDetails._id",
          name: "$memberDetails.name",
          phone: "$memberDetails.phone",
          address: "$memberDetails.address",
        },
      },
    });

    const payments = await Payment.aggregate(basePipeline).option({
      maxTimeMS: 5000,
    });

    return sendResponse(res, 200, "success", "Payments fetched successfully", {
      items: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// get payment by id
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendResponse(
        res,
        400,
        "error",
        "Invalid Payment ID",
        null,
        "Bad Request"
      );
    }

    const payment = await Payment.findById(id)
      .populate(
        "chitId",
        "chitName amount duration monthlyPayableAmount location"
      )
      .populate("memberId", "name phone address");

    if (!payment) {
      return sendResponse(
        res,
        404,
        "error",
        "Payment not found",
        null,
        "Resource Missing"
      );
    }

    if (payment.paidAmount >= payment.chitId?.monthlyPayableAmount) {
      payment.status = "paid";
    } else if (new Date(payment.dueDate) < new Date()) {
      payment.status = "overdue";
    } else if (payment.paidAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "pending";
    }

    payment.totalPaid =
      (payment.paidAmount || 0) + (payment.penaltyAmount || 0);

    return sendResponse(res, 200, "success", "Payment fetched successfully", {
      payment,
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const { memberId, chitId } = req.query;

    if (!memberId || !chitId) {
      return sendResponse(
        res,
        400,
        "error",
        "memberId and chitId are required",
        null,
        "Validation Error"
      );
    }

    const chit = await Chit.findById(chitId);
    if (!chit) {
      return sendResponse(
        res,
        404,
        "error",
        "Chit not found",
        null,
        "Resource Missing"
      );
    }

    const payments = await Payment.find({ memberId, chitId }).sort({
      paymentYear: -1,
      paymentMonth: -1,
    });

    const enrichedPayments = payments.map((p) => {
      const payment = p.toObject();
      const slots = payment.slots || 1;
      const totalRequired = chit.monthlyPayableAmount * slots;

      payment.totalPaid =
        (payment.paidAmount || 0) + (payment.penaltyAmount || 0);
      payment.monthlyPayableAmount = totalRequired;

      if (payment.paidAmount >= totalRequired) {
        payment.status = "paid";
      } else if (new Date(payment.dueDate) < new Date()) {
        payment.status = "overdue";
      } else if (payment.paidAmount > 0) {
        payment.status = "partial";
      } else {
        payment.status = "pending";
      }

      return payment;
    });

    return sendResponse(
      res,
      200,
      "success",
      "Payment history fetched successfully",
      {
        payments: enrichedPayments,
      }
    );
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// export invoice pdf
const exportInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate("chitId")
      .populate("memberId");

    if (!payment) {
      return sendResponse(
        res,
        404,
        "error",
        "Payment not found",
        null,
        "Resource Missing"
      );
    }

    payment.totalPaid =
      (payment.paidAmount || 0) + (payment.penaltyAmount || 0);

    const monthlyPayable = payment.chitId?.monthlyPayableAmount || 0;
    const slots = payment.slots || 1;
    const totalRequired = monthlyPayable * slots;

    if (payment.paidAmount >= totalRequired) {
      payment.status = "paid";
    } else if (new Date(payment.dueDate) < new Date()) {
      payment.status = "overdue";
    } else if (payment.paidAmount > 0) {
      payment.status = "partial";
    } else {
      payment.status = "pending";
    }

    return await generateInvoicePDF(res, payment);
  } catch (error) {
    console.error("Error in exportInvoicePdf:", error);
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// confirm payment by admin
const confirmPaymentByAdmin = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return sendResponse(
        res,
        404,
        "error",
        "Payment not found",
        null,
        "Resource Missing"
      );
    }

    if (payment.isAdminConfirmed) {
      return sendResponse(
        res,
        400,
        "error",
        "Payment already confirmed",
        null,
        "Validation Error"
      );
    }

    payment.isAdminConfirmed = true;
    await payment.save();

    return sendResponse(res, 200, "success", "Payment confirmed by admin", {
      payment,
    });
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

const { generatePaymentsExcel } = require("../utils/excelExport");

// export payments to excel
const exportPaymentsExcel = async (req, res) => {
  try {
    const { chitId, memberId, paymentMode, status } = req.query;

    const matchStage = {};
    if (chitId && mongoose.Types.ObjectId.isValid(chitId)) {
      matchStage.chitId = new mongoose.Types.ObjectId(chitId);
    }
    if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
      matchStage.memberId = new mongoose.Types.ObjectId(memberId);
    }
    if (paymentMode) {
      matchStage.paymentMode = paymentMode;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "chits",
          localField: "chitId",
          foreignField: "_id",
          as: "chitDetails",
        },
      },
      { $unwind: "$chitDetails" },
      {
        $lookup: {
          from: "members",
          localField: "memberId",
          foreignField: "_id",
          as: "memberDetails",
        },
      },
      { $unwind: "$memberDetails" },
      {
        $addFields: {
          computedStatus: {
            $cond: {
              if: {
                $gte: [
                  "$paidAmount",
                  {
                    $multiply: [
                      "$chitDetails.monthlyPayableAmount",
                      { $ifNull: ["$slots", 1] },
                    ],
                  },
                ],
              },
            },
            then: "paid",
            else: {
              $cond: {
                if: { $lt: ["$dueDate", new Date()] },
                then: "overdue",
                else: {
                  $cond: {
                    if: { $gt: ["$paidAmount", 0] },
                    then: "partial",
                    else: "pending",
                  },
                },
              },
            },
          },
        },
      },
    ];

    if (status) {
      pipeline.push({ $match: { computedStatus: status } });
    }

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({
      $project: {
        _id: 1,
        invoiceNumber: 1,
        paidAmount: 1,
        penaltyAmount: 1,
        paymentDate: 1,
        dueDate: 1,
        paymentMode: 1,
        status: "$computedStatus",
        chitId: { chitName: "$chitDetails.chitName" },
        memberId: {
          name: "$memberDetails.name",
          phone: "$memberDetails.phone",
        },
      },
    });

    const payments = await Payment.aggregate(pipeline);

    const buffer = await generatePaymentsExcel(payments);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `Payments_Report_${Date.now()}.xlsx`
    );

    return res.end(buffer);
  } catch (error) {
    console.error("Excel Export Error:", error);
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

// get payment status for a member in a specific month
const getPaymentStatus = async (req, res) => {
  try {
    const { chitId, memberId, paymentMonth } = req.query;

    if (!chitId || !memberId || !paymentMonth) {
      return sendResponse(
        res,
        400,
        "error",
        "chitId, memberId, and paymentMonth are required"
      );
    }

    const [chit, member, previousPayments] = await Promise.all([
      Chit.findById(chitId).lean(),
      Member.findById(memberId).lean(),
      Payment.find({ chitId, memberId, paymentMonth }).lean(),
    ]);

    if (!chit || !member) {
      return sendResponse(res, 404, "error", "Chit or Member not found");
    }

    const chitAssignment = member.chits?.find(
      (c) => (c.chitId?._id || c.chitId).toString() === chitId.toString()
    );
    const totalSlots = chitAssignment?.slots || 1;

    // Map existing payments to slot numbers
    const paidSlotNumbers = previousPayments.map((p) => p.slotNumber);

    const status = {
      totalSlots,
      paidSlotNumbers,
      remainingSlots: Math.max(0, totalSlots - paidSlotNumbers.length),
      monthlyAmount: chit.monthlyPayableAmount,
      isFullyPaid: paidSlotNumbers.length >= totalSlots,
      dueDate: chit.dueDate,
      calculatedDueDate: chit.calculatedDueDate,
      previousPayments, // Send full details to help frontend show "Paid" info
    };

    return sendResponse(res, 200, "success", "Payment status fetched", status);
  } catch (error) {
    return sendResponse(
      res,
      500,
      "error",
      "Internal Server Error",
      null,
      error.message
    );
  }
};

module.exports = {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentHistory,
  exportInvoicePdf,
  exportPaymentsExcel,
  confirmPaymentByAdmin,
  getPaymentStatus,
};

const Transaction = require("../models/Transaction");
const sendResponse = require("../utils/response");
const Chit = require("../models/Chit");
const Member = require("../models/Member");

// @desc    Create new transaction
// @route   POST /api/transaction/create
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    const {
      type,
      chitId,
      transferFromChit,
      transferToChit,
      memberId,
      transferFrom,
      transferTo,
      amount,
      paymentMode,
      paymentDate,
      imageProofUrl,
      status,
      description,
    } = req.body;

    const transactionType = type || "transaction";
    console.log("--- STARTING TRANSACTION CREATION ---");
    console.log("Type:", transactionType);
    console.log("Payload:", JSON.stringify(req.body, null, 2));

    if (transactionType === "transaction") {
      if (!chitId || !memberId || !amount || !paymentMode) {
        return sendResponse(
          res,
          400,
          "error",
          `Missing fields for transaction: ${!chitId ? "chitId " : ""}${
            !memberId ? "memberId " : ""
          }${!amount ? "amount " : ""}${!paymentMode ? "paymentMode " : ""}`
        );
      }
    } else if (transactionType === "transfer") {
      if (
        !transferFromChit ||
        !transferToChit ||
        !transferFrom ||
        !transferTo ||
        !amount ||
        !paymentMode ||
        !description ||
        !imageProofUrl
      ) {
        return sendResponse(
          res,
          400,
          "error",
          `Missing fields for transfer: ${
            !transferFromChit ? "transferFromChit " : ""
          }${!transferToChit ? "transferToChit " : ""}${
            !transferFrom ? "transferFrom " : ""
          }${!transferTo ? "transferTo " : ""}${!amount ? "amount " : ""}${
            !paymentMode ? "paymentMode " : ""
          }${!description ? "description " : ""}${
            !imageProofUrl ? "imageProofUrl " : ""
          }`
        );
      }
    } else {
      return sendResponse(
        res,
        400,
        "error",
        `Invalid transaction type: ${transactionType}`
      );
    }

    const transaction = await Transaction.create({
      type: transactionType,
      chitId: transactionType === "transaction" ? chitId : transferFromChit,
      transferFromChit:
        transactionType === "transfer" ? transferFromChit : undefined,
      transferToChit:
        transactionType === "transfer" ? transferToChit : undefined,
      memberId: transactionType === "transaction" ? memberId : undefined,
      transferFrom: transactionType === "transfer" ? transferFrom : undefined,
      transferTo: transactionType === "transfer" ? transferTo : undefined,
      amount,
      paymentMode,
      paymentDate: paymentDate || Date.now(),
      imageProofUrl,
      status: status || "paid",
      description,
    });

    return sendResponse(
      res,
      201,
      "success",
      "Transaction created successfully",
      {
        transaction,
      }
    );
  } catch (error) {
    console.error("Create Transaction Error:", error);
    return sendResponse(res, 500, "error", error.message);
  }
};

// @desc    Get all transactions with filters
// @route   GET /api/transaction/list
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const {
      type,
      chitId,
      memberId,
      status,
      paymentMode,
      date,
      page = 1,
      limit = 10,
    } = req.query;
    const query = {};

    if (type) query.type = type;
    if (chitId) query.chitId = chitId;
    if (memberId) query.memberId = memberId;
    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.paymentDate = { $gte: startOfDay, $lte: endOfDay };
    }
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate("chitId", "chitName")
      .populate("transferFromChit", "chitName")
      .populate("transferToChit", "chitName")
      .populate("memberId", "name phone")
      .populate("transferFrom", "name phone")
      .populate("transferTo", "name phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return sendResponse(
      res,
      200,
      "success",
      "Transactions fetched successfully",
      {
        items: transactions,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      }
    );
  } catch (error) {
    console.error("Get Transactions Error:", error);
    return sendResponse(res, 500, "error", error.message);
  }
};

// @desc    Get single transaction details
// @route   GET /api/transaction/:id
// @access  Private
exports.getTransactionDetails = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("chitId", "chitName")
      .populate("transferFromChit", "chitName")
      .populate("transferToChit", "chitName")
      .populate("memberId", "name phone")
      .populate("transferFrom", "name phone")
      .populate("transferTo", "name phone");

    if (!transaction) {
      return sendResponse(res, 404, "error", "Transaction not found");
    }

    return sendResponse(res, 200, "success", "Transaction details fetched", {
      transaction,
    });
  } catch (error) {
    console.error("Get Transaction Details Error:", error);
    return sendResponse(res, 500, "error", error.message);
  }
};

const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const auth = require("../middleware/auth");

router.use(auth); // All transaction routes require authentication

router.post("/create", transactionController.createTransaction);
router.get("/list", transactionController.getTransactions);
router.get("/details/:id", transactionController.getTransactionDetails);

module.exports = router;

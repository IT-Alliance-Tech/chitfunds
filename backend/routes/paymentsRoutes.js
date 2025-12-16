const router = require("express").Router();

const {
  createPayment,
  getPayments,
  getPaymentById,
  exportInvoicePdf,
} = require("../controllers/paymentsController");

const authMiddleware = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createPaymentSchema } = require("../validators/paymentValidator");

router.use(authMiddleware);

router.post("/create", validate(createPaymentSchema), createPayment);
router.get("/list", getPayments);
router.get("/details/:id", getPaymentById);
router.get("/invoice/:id", exportInvoicePdf);
router.get("/history", authMiddleware, paymentController.getPaymentHistory);

module.exports = router;

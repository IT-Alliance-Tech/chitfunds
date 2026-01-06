const router = require("express").Router();

const {
  createPayment,
  getPayments,
  getPaymentById,
  exportInvoicePdf,
  exportPaymentsExcel,
  getPaymentHistory,
  confirmPaymentByAdmin,
} = require("../controllers/paymentsController");

const authMiddleware = require("../middleware/auth");
const adminAuth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createPaymentSchema } = require("../validators/paymentValidator");

router.use(authMiddleware);
// Create payment
router.post("/create", validate(createPaymentSchema), createPayment);
// List payments
router.get("/list", getPayments);
// Payment details
router.get("/details/:id", getPaymentById);
// Invoice placeholder
router.get("/invoice/:id", exportInvoicePdf);
// Export Excel
router.get("/export/excel", exportPaymentsExcel);
// Payment history
router.get("/history", getPaymentHistory);
//  Admin confirm payment
router.put("/confirm/:paymentId", confirmPaymentByAdmin);

module.exports = router;

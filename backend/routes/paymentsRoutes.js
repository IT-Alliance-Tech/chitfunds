const router = require("express").Router();

const {
  createPayment,
  getPayments,
  getPaymentById,
  exportInvoicePdf,
  getPaymentHistory,
  confirmPaymentByAdmin,
  getMembersForPayment
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
router.get("/payement/:id", getPaymentById);
// Invoice placeholder
router.get("/invoice/:id", exportInvoicePdf);
// Payment history
router.get("/history", getPaymentHistory);
//  Admin confirm payment
router.put("/confirm/:paymentId" ,confirmPaymentByAdmin);
// Get members list for payment
router.get("/members", getMembersForPayment);


module.exports = router;

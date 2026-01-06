const express = require("express");
const router = express.Router();
const {
  exportChitsReport,
  exportMembersReport,
  exportPaymentsReport,
  exportMonthlyReport,
} = require("../controllers/reportController");
const auth = require("../middleware/auth");

// All report routes are protected by auth
router.use(auth);

router.get("/chits", exportChitsReport);
router.get("/members", exportMembersReport);
router.get("/payments", exportPaymentsReport);
router.get("/monthly-collections", exportMonthlyReport);

module.exports = router;

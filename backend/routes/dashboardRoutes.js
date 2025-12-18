const express = require("express");
const router = express.Router();
const { getDashboardAnalytics } = require("../controllers/dashboardController");

router.get("/analytics", getDashboardAnalytics);

module.exports = router;

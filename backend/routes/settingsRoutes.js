const router = require("express").Router();
const {
  getSettings,
  updateSettings,
} = require("../controllers/settingsController");
const authMiddleware = require("../middleware/auth");

// All settings routes are protected
router.use(authMiddleware);

// Get Settings
router.get("/", getSettings);

// Update Settings
router.post("/update", updateSettings);

module.exports = router;

const express = require("express");
const {
  createChit,
  getChits,
  getChitById,
  updateChit,
  deleteChit,
} = require("../controllers/chitController");

const auth = require("../middleware/auth");
const router = express.Router();

router.use(auth);

const { createChitSchema, updateChitSchema } = require("../validators/chitValidator");
const validate = require("../middleware/validate");

// /api/chit
router.post("/create", validate(createChitSchema), createChit);
router.get("/list", getChits);
router.get("/details/:id", getChitById);
router.put("/update/:id", validate(updateChitSchema), updateChit);
router.delete("/delete/:id", deleteChit);

module.exports = router;

const router = require("express").Router();
const ctrl = require("../controllers/paymentsController");
const auth = require("../middleware/auth");

router.use(auth);

router.post("/", ctrl.createPayment);
router.get("/", ctrl.getPayments);
router.get("/:id", ctrl.getPayment);

module.exports = router;

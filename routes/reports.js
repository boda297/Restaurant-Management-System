const express = require("express");
const {
  getDailySales,
  getStockAlerts,
} = require("../controllers/reportController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/daily-sales", getDailySales);
router.get("/stock-alerts", getStockAlerts);

module.exports = router;

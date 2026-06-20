const express = require("express");
const {
  placeOrder,
  updateOrderStatus,
  getAllOrders,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, placeOrder);
router.patch("/:id/status", protect, updateOrderStatus);
router.get("/", protect, getAllOrders);

module.exports = router;

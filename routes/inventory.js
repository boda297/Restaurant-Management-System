const express = require("express");
const {
  getAllInventory,
  getLowStock,
  createInventoryItem,
  restockInventoryItem,
} = require("../controllers/inventoryController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", getAllInventory);
router.get("/low-stock", getLowStock);
router.post("/", createInventoryItem);
router.patch("/:id/restock", restockInventoryItem);

module.exports = router;

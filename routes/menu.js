const express = require("express");
const {
  getMenu,
  createMenuItem,
  updateMenuItem,
} = require("../controllers/menuController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", getMenu);
router.post("/", protect, adminOnly, createMenuItem);
router.patch("/:id", protect, adminOnly, updateMenuItem);

module.exports = router;

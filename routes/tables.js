const express = require("express");
const {
  getAllTables,
  getAvailableTables,
  createTable,
} = require("../controllers/tableController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", getAllTables);
router.get("/available", getAvailableTables);
router.post("/", protect, adminOnly, createTable);

module.exports = router;

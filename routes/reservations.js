const express = require("express");
const {
  createReservation,
  cancelReservation,
  getAllReservations,
} = require("../controllers/reservationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", createReservation);
router.delete("/:id", protect, cancelReservation);
router.get("/", protect, getAllReservations);

module.exports = router;

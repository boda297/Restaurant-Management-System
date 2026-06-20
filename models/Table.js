const mongoose = require("mongoose");
const tableSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: [true, "Table number is required"],
      unique: true,
      min: [1, "Table number must be at least 1"],
    },

    seatingCapacity: {
      type: Number,
      required: [true, "Seating capacity is required"],
      min: [1, "Seating capacity must be at least 1"],
    },

    status: {
      type: String,
      enum: {
        values: ["available", "occupied", "reserved"],
        message: "Status must be available, occupied, or reserved",
      },
      default: "available",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Table", tableSchema);

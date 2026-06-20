const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      unique: true,
      trim: true,
    },

    unit: {
      type: String,
      required: [true, "Unit of measurement is required"],
      trim: true,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      required: [true, "Low-stock threshold is required"],
      min: [0, "Threshold cannot be negative"],
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);

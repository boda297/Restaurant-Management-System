const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory item reference is required'],
    },
    amountUsed: {
      type: Number,
      required: [true, 'Amount used is required'],
      min: [0.001, 'Amount used must be greater than 0'],
    },
  },
  { _id: false } 
);

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: ['Starter', 'Main Course', 'Dessert', 'Beverage', 'Side'],
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    recipe: {
      type: [recipeIngredientSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);

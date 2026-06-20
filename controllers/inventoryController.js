const InventoryItem = require('../models/InventoryItem');

// GET /api/inventory — all stock items
const getAllInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ name: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('GET /inventory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/inventory/low-stock — items at or below their threshold
const getLowStock = async (req, res) => {
  try {
    const items = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    }).sort({ quantity: 1 }); // most critical first

    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('GET /inventory/low-stock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/inventory — add a new stock item
const createInventoryItem = async (req, res) => {
  try {
    const { name, unit, quantity, lowStockThreshold } = req.body;
    const item = await InventoryItem.create({ name, unit, quantity, lowStockThreshold });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'An inventory item with that name already exists' });
    }
    console.error('POST /inventory error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/inventory/:id/restock — add quantity after a delivery
const restockInventoryItem = async (req, res) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'amount is required (the quantity to add)' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number' });
    }

    const item = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity: amount }, lastUpdated: Date.now() },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    res.json({ success: true, message: `Restocked "${item.name}" by ${amount} ${item.unit}`, data: item });
  } catch (err) {
    console.error('PATCH /inventory/:id/restock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllInventory, getLowStock, createInventoryItem, restockInventoryItem };

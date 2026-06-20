const MenuItem = require('../models/MenuItem');
const InventoryItem = require('../models/InventoryItem');

// GET /api/menu — public, list available items
const getMenu = async (req, res) => {
  try {
    const items = await MenuItem.find({ isAvailable: true }).populate(
      'recipe.inventoryItem',
      'name unit'
    );
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('GET /menu error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/menu — admin only, add a menu item with recipe
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, recipe } = req.body;

    if (recipe && recipe.length > 0) {
      for (const ingredient of recipe) {
        const item = await InventoryItem.findById(ingredient.inventoryItem);
        if (!item) {
          return res.status(400).json({
            success: false,
            message: `Inventory item with id "${ingredient.inventoryItem}" not found`,
          });
        }
      }
    }

    const menuItem = await MenuItem.create({ name, description, price, category, isAvailable, recipe });
    await menuItem.populate('recipe.inventoryItem', 'name unit');

    res.status(201).json({ success: true, data: menuItem });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A menu item with that name already exists' });
    }
    console.error('POST /menu error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/menu/:id — admin only, update a menu item
const updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, isAvailable, recipe } = req.body;

    if (recipe && recipe.length > 0) {
      for (const ingredient of recipe) {
        const item = await InventoryItem.findById(ingredient.inventoryItem);
        if (!item) {
          return res.status(400).json({
            success: false,
            message: `Inventory item with id "${ingredient.inventoryItem}" not found`,
          });
        }
      }
    }

    const updated = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, isAvailable, recipe },
      { new: true, runValidators: true }
    ).populate('recipe.inventoryItem', 'name unit');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('PATCH /menu/:id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getMenu, createMenuItem, updateMenuItem };

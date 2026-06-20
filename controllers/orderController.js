const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const InventoryItem = require('../models/InventoryItem');

const placeOrder = async (req, res) => {
  try {
    const { tableId, items } = req.body;

    // ── Step 1: Basic input validation ──────────────────────────────────────
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tableId and a non-empty items array are required',
      });
    }

    // ── Step 2: Validate the table exists and is not already occupied ────────
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }
    if (table.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Table is already occupied — clear the current order first',
      });
    }

    // ── Step 3: Load and validate all menu items in a single query ───────────
    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).populate(
      'recipe.inventoryItem'
    );

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ success: false, message: 'One or more menu items were not found' });
    }

    const menuItemMap = {};
    for (const mi of menuItems) {
      if (!mi.isAvailable) {
        return res.status(400).json({ success: false, message: `"${mi.name}" is currently unavailable` });
      }
      menuItemMap[mi._id.toString()] = mi;
    }

    // ── Step 4: Aggregate total ingredient usage across the whole order ──────
    const ingredientUsage = {};

    for (const orderLine of items) {
      const menuItem = menuItemMap[orderLine.menuItemId.toString()];
      const qty = orderLine.quantity;

      for (const recipeEntry of menuItem.recipe) {
        const invId = recipeEntry.inventoryItem._id.toString();
        const needed = recipeEntry.amountUsed * qty;

        if (ingredientUsage[invId]) {
          ingredientUsage[invId].totalNeeded += needed;
        } else {
          ingredientUsage[invId] = {
            inventoryItem: recipeEntry.inventoryItem,
            totalNeeded: needed,
          };
        }
      }
    }

    // ── Step 5: Check every ingredient before touching any stock ─────────────
    for (const [, usage] of Object.entries(ingredientUsage)) {
      const { inventoryItem, totalNeeded } = usage;
      if (inventoryItem.quantity < totalNeeded) {
        return res.status(400).json({
          success: false,
          message:
            `Insufficient stock for "${inventoryItem.name}": ` +
            `need ${totalNeeded} ${inventoryItem.unit}, ` +
            `have ${inventoryItem.quantity} ${inventoryItem.unit}`,
        });
      }
    }

    // ── Step 6: Deduct inventory — all checks passed ─────────────────────────
    for (const [invId, usage] of Object.entries(ingredientUsage)) {
      await InventoryItem.findByIdAndUpdate(invId, {
        $inc: { quantity: -usage.totalNeeded },
        lastUpdated: Date.now(),
      });
    }

    // ── Step 7: Build line items and compute total server-side ───────────────
    let computedTotal = 0;
    const orderItems = items.map((orderLine) => {
      const menuItem = menuItemMap[orderLine.menuItemId.toString()];
      const linePrice = menuItem.price;
      computedTotal += linePrice * orderLine.quantity;
      return { menuItem: menuItem._id, quantity: orderLine.quantity, price: linePrice };
    });

    // ── Step 8: Create the order ─────────────────────────────────────────────
    const order = await Order.create({
      table: tableId,
      items: orderItems,
      total: computedTotal,
      createdBy: req.user.id,
    });

    // ── Step 9: Mark the table as occupied ───────────────────────────────────
    table.status = 'occupied';
    await table.save();

    await order.populate([
      { path: 'table', select: 'number seatingCapacity' },
      { path: 'items.menuItem', select: 'name price category' },
    ]);

    res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('POST /orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/orders/:id/status — advance order lifecycle
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'served', 'paid', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    if (status === 'paid' || status === 'cancelled') {
      await Table.findByIdAndUpdate(order.table, { status: 'available' });
    }

    await order.populate([
      { path: 'table', select: 'number status' },
      { path: 'items.menuItem', select: 'name price' },
    ]);

    res.json({ success: true, message: `Order status updated to "${status}"`, data: order });
  } catch (err) {
    console.error('PATCH /orders/:id/status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders — staff/admin view of all orders
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('table', 'number seatingCapacity status')
      .populate('items.menuItem', 'name price category')
      .populate('createdBy', 'name email');

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    console.error('GET /orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { placeOrder, updateOrderStatus, getAllOrders };

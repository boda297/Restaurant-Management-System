const Order = require('../models/Order');
const InventoryItem = require('../models/InventoryItem');

// GET /api/reports/daily-sales — total revenue and order count for today
const getDailySales = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await Order.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const data =
      result.length > 0
        ? { totalRevenue: result[0].totalRevenue, orderCount: result[0].orderCount }
        : { totalRevenue: 0, orderCount: 0 };

    res.json({ success: true, date: startOfDay.toISOString().split('T')[0], data });
  } catch (err) {
    console.error('GET /reports/daily-sales error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/reports/stock-alerts — dashboard-friendly low-stock list
const getStockAlerts = async (req, res) => {
  try {
    const items = await InventoryItem.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      count: items.length,
      message: items.length === 0 ? 'All stock levels are healthy' : `${items.length} item(s) need restocking`,
      data: items,
    });
  } catch (err) {
    console.error('GET /reports/stock-alerts error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDailySales, getStockAlerts };

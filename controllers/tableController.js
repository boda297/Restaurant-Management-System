const Table = require('../models/Table');

// GET /api/tables — list all tables with their current status
const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (err) {
    console.error('GET /tables error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/tables/available — list only free tables
const getAvailableTables = async (req, res) => {
  try {
    const tables = await Table.find({ status: 'available' }).sort({ number: 1 });
    res.json({ success: true, count: tables.length, data: tables });
  } catch (err) {
    console.error('GET /tables/available error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/tables — admin only, add a new table
const createTable = async (req, res) => {
  try {
    const { number, seatingCapacity } = req.body;
    const table = await Table.create({ number, seatingCapacity });
    res.status(201).json({ success: true, data: table });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A table with that number already exists' });
    }
    console.error('POST /tables error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getAllTables, getAvailableTables, createTable };

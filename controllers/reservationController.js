const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

// POST /api/reservations — create a reservation (public)
const createReservation = async (req, res) => {
  try {
    const { tableId, customerName, customerPhone, partySize, dateTime } = req.body;

    if (!tableId || !customerName || !customerPhone || !partySize || !dateTime) {
      return res.status(400).json({
        success: false,
        message: 'tableId, customerName, customerPhone, partySize, and dateTime are all required',
      });
    }

    // Step 1: Table must exist
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    // Step 2: Party size must not exceed seating capacity
    if (partySize > table.seatingCapacity) {
      return res.status(400).json({
        success: false,
        message: `Party size (${partySize}) exceeds the table's seating capacity (${table.seatingCapacity})`,
      });
    }

    // Step 3: No confirmed reservation at the exact same date/time for this table
    const reservationDate = new Date(dateTime);
    const conflicting = await Reservation.findOne({
      table: tableId,
      status: 'confirmed',
      dateTime: reservationDate,
    });

    if (conflicting) {
      return res.status(400).json({
        success: false,
        message: 'That table already has a confirmed reservation at that date/time',
      });
    }

    // Step 4: Table must not currently be occupied (mid-service)
    if (table.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Table is currently occupied and cannot be reserved',
      });
    }

    // Step 5: Create the reservation
    const reservation = await Reservation.create({
      table: tableId,
      customerName,
      customerPhone,
      partySize,
      dateTime: reservationDate,
    });

    // Step 6: Mark the table as reserved
    table.status = 'reserved';
    await table.save();

    await reservation.populate('table', 'number seatingCapacity');

    res.status(201).json({ success: true, message: 'Reservation created successfully', data: reservation });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    console.error('POST /reservations error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/reservations/:id — cancel and free the table
const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Reservation is already cancelled' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    await Table.findOneAndUpdate(
      { _id: reservation.table, status: 'reserved' },
      { status: 'available' }
    );

    res.json({ success: true, message: 'Reservation cancelled and table freed', data: reservation });
  } catch (err) {
    console.error('DELETE /reservations/:id error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/reservations — all reservations (staff/admin)
const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .sort({ dateTime: 1 })
      .populate('table', 'number seatingCapacity status');

    res.json({ success: true, count: reservations.length, data: reservations });
  } catch (err) {
    console.error('GET /reservations error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createReservation, cancelReservation, getAllReservations };

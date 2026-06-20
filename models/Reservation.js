const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Table reference is required'],
    },

    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },

    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
    },

    partySize: {
      type: Number,
      required: [true, 'Party size is required'],
      min: [1, 'Party size must be at least 1'],
    },

    dateTime: {
      type: Date,
      required: [true, 'Reservation date/time is required'],
    },

    status: {
      type: String,
      enum: {
        values: ['confirmed', 'cancelled', 'completed'],
        message: 'Status must be confirmed, cancelled, or completed',
      },
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reservation', reservationSchema);

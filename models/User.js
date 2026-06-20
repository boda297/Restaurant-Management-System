const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
    },

    role: {
      type: String,
      enum: {
        values: ['staff', 'admin'],
        message: 'Role must be either "staff" or "admin"',
      },
      default: 'staff',
    },
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model('User', userSchema);

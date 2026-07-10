const mongoose = require('mongoose');
const { ALL_ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // select: false so passwordHash never leaks out through a plain .find()/.findOne()
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ALL_ROLES },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    isActive: { type: Boolean, default: true },
    // Account lockout bookkeeping (brute-force protection)
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

module.exports = mongoose.model('User', userSchema);

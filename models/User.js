const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'chef', 'admin'], default: 'user' },
  chefRequest: {
    status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    submittedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

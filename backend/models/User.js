const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  walletAddress: {
    type: String,
    sparse: true
  },
  
  commitment: {
    type: String,
    unique: true
  },
  
  kycId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KYC'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  lastLogin: {
    type: Date
  }
});

module.exports = mongoose.model('User', userSchema);
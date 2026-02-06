const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Personal Details (Encrypted)
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true },

    // Document Details
    documentType: {
        type: String,
        enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE'],
        required: true
    },
    documentNumber: { type: String, required: true },
    documentHash: { type: String, required: true }, // Hash of uploaded doc

    // Address
    address: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: String
    },

    // Privacy Layer
    commitment: {
        type: String,
        required: true,
        unique: true
    }, // Poseidon(userId, secret)

    merkleTreeIndex: { type: Number },

    // Verification Status
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedAt: { type: Date },

    // Eligible Schemes
    eligibleSchemes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme'
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('KYC', kycSchema);
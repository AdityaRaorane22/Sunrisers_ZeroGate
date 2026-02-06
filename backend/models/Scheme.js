const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },

    description: { type: String },

    // Eligibility Criteria
    criteria: {
        minAge: { type: Number },
        maxAge: { type: Number },
        nationality: [{ type: String }], // ['INDIA', 'USA']
        requiredDocuments: [{ type: String }],
        incomeRange: {
            min: Number,
            max: Number
        }
    },

    // Blockchain Integration
    merkleRoot: { type: String }, // Root of eligible users
    contractAddress: { type: String },
    treeId: { type: Number },

    // Access Control
    isActive: {
        type: Boolean,
        default: true
    },

    // Stats
    totalEligible: {
        type: Number,
        default: 0
    },
    totalApplied: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Scheme', schemeSchema);
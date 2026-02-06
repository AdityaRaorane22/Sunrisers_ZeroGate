import mongoose from 'mongoose';

const schemeSchema = new mongoose.Schema({
    schemeId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    schemeName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requiredTier: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    eligibilityCriteria: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

const Scheme = mongoose.model('Scheme', schemeSchema);

export default Scheme;

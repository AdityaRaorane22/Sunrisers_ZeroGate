import mongoose from 'mongoose';

const proofSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    schemeId: {
        type: String,
        required: true,
        index: true
    },
    proof: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    publicSignals: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    nullifier: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    usedAt: {
        type: Date,
        default: null
    },
    isValid: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for user-scheme queries
proofSchema.index({ userId: 1, schemeId: 1, generatedAt: -1 });

const Proof = mongoose.model('Proof', proofSchema);

export default Proof;

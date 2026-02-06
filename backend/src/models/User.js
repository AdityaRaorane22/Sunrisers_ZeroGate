import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    personalDetails: {
        fullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: true
        },
        dateOfBirth: {
            type: Date,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        nationality: {
            type: String,
            required: true
        },
        idType: {
            type: String,
            enum: ['passport', 'driverLicense', 'nationalId', 'other'],
            required: true
        },
        idNumber: {
            type: String,
            required: true
        }
    },
    commitment: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    identitySecret: {
        type: String,
        required: true
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    verifiedBy: {
        type: String,
        default: null
    },
    verifiedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
    },
    tier: {
        type: Number,
        min: 0,
        max: 3,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
userSchema.index({ verificationStatus: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User;

import User from '../models/User.js';
import Scheme from '../models/Scheme.js';
import Proof from '../models/Proof.js';
import { buildPoseidon } from 'circomlibjs';
import crypto from 'crypto';

let poseidon;

// Initialize Poseidon hash
const initPoseidon = async () => {
    if (!poseidon) {
        poseidon = await buildPoseidon();
    }
    return poseidon;
};

// Generate commitment from user details
const generateCommitment = async (userId, secret) => {
    const p = await initPoseidon();

    // Convert strings to field elements
    const userIdHash = BigInt('0x' + crypto.createHash('sha256').update(userId).digest('hex')) % BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
    const secretHash = BigInt('0x' + crypto.createHash('sha256').update(secret).digest('hex')) % BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');

    const commitment = p.F.toString(p([userIdHash, secretHash]));
    return commitment;
};

// KYC Registration
export const registerUser = async (req, res) => {
    try {
        const { personalDetails } = req.body;

        // Validate required fields
        if (!personalDetails || !personalDetails.fullName || !personalDetails.email) {
            return res.status(400).json({ error: 'Missing required personal details' });
        }

        // Generate unique userId
        const userId = 'USER_' + crypto.randomBytes(8).toString('hex');

        // Generate secret (this should be done client-side in production)
        const secret = crypto.randomBytes(32).toString('hex');

        // Generate commitment
        const commitment = await generateCommitment(userId, secret);

        // Check if user with same email already exists
        const existingUser = await User.findOne({ 'personalDetails.email': personalDetails.email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Create new user
        const user = new User({
            userId,
            personalDetails,
            commitment,
            identitySecret: secret, // In production, encrypt this or don't store it
            verificationStatus: 'pending',
            tier: 0
        });

        await user.save();

        console.log(`✅ User registered: ${userId} with commitment: ${commitment}`);

        res.json({
            success: true,
            userId,
            commitment,
            secret, // Return to user (they must save this!)
            verificationStatus: 'pending',
            message: 'Registration successful. Please save your commitment key and secret!'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get pending verifications (Admin)
export const getPendingVerifications = async (req, res) => {
    try {
        const pendingUsers = await User.find({ verificationStatus: 'pending' })
            .select('-identitySecret') // Don't expose secret
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: pendingUsers.length,
            users: pendingUsers
        });

    } catch (error) {
        console.error('Get pending verifications error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Verify user (Admin)
export const verifyUser = async (req, res) => {
    try {
        const { userId, action, tier, rejectionReason, adminId } = req.body;

        if (!userId || !action) {
            return res.status(400).json({ error: 'Missing userId or action' });
        }

        if (action !== 'approve' && action !== 'reject') {
            return res.status(400).json({ error: 'Invalid action. Must be approve or reject' });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.verificationStatus !== 'pending') {
            return res.status(400).json({ error: 'User is not in pending status' });
        }

        if (action === 'approve') {
            if (!tier || tier < 1 || tier > 3) {
                return res.status(400).json({ error: 'Valid tier (1-3) required for approval' });
            }

            user.verificationStatus = 'approved';
            user.tier = tier;
            user.verifiedBy = adminId || 'admin';
            user.verifiedAt = new Date();

            console.log(`✅ User ${userId} approved with Tier ${tier}`);
        } else {
            user.verificationStatus = 'rejected';
            user.rejectionReason = rejectionReason || 'Not specified';
            user.verifiedBy = adminId || 'admin';
            user.verifiedAt = new Date();

            console.log(`❌ User ${userId} rejected: ${rejectionReason}`);
        }

        await user.save();

        res.json({
            success: true,
            userId,
            verificationStatus: user.verificationStatus,
            tier: user.tier,
            message: `User ${action}ed successfully`
        });

    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get available schemes
export const getSchemes = async (req, res) => {
    try {
        const { userId } = req.query;

        const schemes = await Scheme.find({ isActive: true }).sort({ requiredTier: 1 });

        // If userId provided, filter by user's tier
        if (userId) {
            const user = await User.findOne({ userId });
            if (user && user.verificationStatus === 'approved') {
                const eligibleSchemes = schemes.filter(s => s.requiredTier <= user.tier);
                return res.json({
                    success: true,
                    userTier: user.tier,
                    schemes: eligibleSchemes
                });
            }
        }

        res.json({
            success: true,
            schemes
        });

    } catch (error) {
        console.error('Get schemes error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get user status
export const getUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ userId })
            .select('-identitySecret'); // Don't expose secret

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                userId: user.userId,
                fullName: user.personalDetails.fullName,
                email: user.personalDetails.email,
                commitment: user.commitment,
                verificationStatus: user.verificationStatus,
                tier: user.tier,
                verifiedAt: user.verifiedAt,
                rejectionReason: user.rejectionReason,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get user status error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Save generated proof
export const saveProof = async (req, res) => {
    try {
        const { userId, schemeId, proof, publicSignals, nullifier } = req.body;

        if (!userId || !schemeId || !proof || !publicSignals || !nullifier) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if nullifier already used
        const existingProof = await Proof.findOne({ nullifier });
        if (existingProof) {
            return res.status(400).json({ error: 'Proof already used (nullifier exists)' });
        }

        // Verify user is approved
        const user = await User.findOne({ userId });
        if (!user || user.verificationStatus !== 'approved') {
            return res.status(403).json({ error: 'User not verified' });
        }

        // Verify scheme exists and user has required tier
        const scheme = await Scheme.findOne({ schemeId });
        if (!scheme) {
            return res.status(404).json({ error: 'Scheme not found' });
        }

        if (user.tier < scheme.requiredTier) {
            return res.status(403).json({ error: 'Insufficient tier for this scheme' });
        }

        // Save proof
        const proofDoc = new Proof({
            userId,
            schemeId,
            proof,
            publicSignals,
            nullifier,
            generatedAt: new Date(),
            isValid: true
        });

        await proofDoc.save();

        console.log(`✅ Proof saved for user ${userId} and scheme ${schemeId}`);

        res.json({
            success: true,
            proofId: proofDoc._id,
            message: 'Proof generated and saved successfully'
        });

    } catch (error) {
        console.error('Save proof error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Validate proof for scheme access
export const validateProofAccess = async (req, res) => {
    try {
        const { nullifier, schemeId } = req.body;

        if (!nullifier || !schemeId) {
            return res.status(400).json({ error: 'Missing nullifier or schemeId' });
        }

        // Find proof
        const proof = await Proof.findOne({ nullifier, schemeId });

        if (!proof) {
            return res.status(404).json({ error: 'Proof not found' });
        }

        if (!proof.isValid) {
            return res.status(403).json({ error: 'Proof is invalid' });
        }

        // Mark as used
        if (!proof.usedAt) {
            proof.usedAt = new Date();
            await proof.save();
        }

        console.log(`✅ Proof validated for scheme ${schemeId}`);

        res.json({
            success: true,
            message: 'Access granted',
            schemeId,
            generatedAt: proof.generatedAt,
            usedAt: proof.usedAt
        });

    } catch (error) {
        console.error('Validate proof access error:', error);
        res.status(500).json({ error: error.message });
    }
};

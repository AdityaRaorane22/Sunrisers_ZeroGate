const express = require('express');
const router = express.Router();
const KYC = require('../models/KYC');
const Scheme = require('../models/Scheme');
const proofService = require('../services/proof.service');
const crypto = require('crypto');

// Submit KYC
router.post('/submit', async (req, res) => {
    try {
        const {
            userId,
            fullName,
            dateOfBirth,
            nationality,
            documentType,
            documentNumber,
            address,
            secret
        } = req.body;

        // Check if KYC already exists
        const existing = await KYC.findOne({ userId });
        if (existing) {
            return res.status(400).json({ error: 'KYC already submitted' });
        }

        // Generate commitment
        const commitment = await proofService.generateCommitment(userId, secret);

        // Hash document number for privacy
        const documentHash = crypto.createHash('sha256')
            .update(documentNumber)
            .digest('hex');

        // Create KYC record
        const kyc = new KYC({
            userId,
            fullName,
            dateOfBirth,
            nationality,
            documentType,
            documentNumber,
            documentHash,
            address,
            commitment
        });

        await kyc.save();

        // Convert commitment to hex string for frontend
        const commitmentHex = '0x' + Buffer.from(commitment).toString('hex');

        res.json({
            success: true,
            message: 'KYC submitted successfully',
            kycId: kyc._id,
            commitment: commitmentHex
        });
    } catch (error) {
        console.error('KYC submission error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify KYC (Admin only - in production add auth)
router.post('/verify/:kycId', async (req, res) => {
    try {
        const { kycId } = req.params;

        const kyc = await KYC.findById(kycId);
        if (!kyc) {
            return res.status(404).json({ error: 'KYC not found' });
        }

        kyc.isVerified = true;
        kyc.verifiedAt = new Date();

        // Auto-assign eligible schemes based on criteria
        const schemes = await Scheme.find({ isActive: true });

        for (const scheme of schemes) {
            const age = Math.floor(
                (Date.now() - new Date(kyc.dateOfBirth)) / 31557600000
            );

            let isEligible = true;

            // Check age
            if (scheme.criteria.minAge && age < scheme.criteria.minAge) {
                isEligible = false;
            }
            if (scheme.criteria.maxAge && age > scheme.criteria.maxAge) {
                isEligible = false;
            }

            // Check nationality
            if (scheme.criteria.nationality?.length > 0) {
                if (!scheme.criteria.nationality.includes(kyc.nationality)) {
                    isEligible = false;
                }
            }

            if (isEligible) {
                kyc.eligibleSchemes.push(scheme._id);
                scheme.totalEligible++;
                await scheme.save();
            }
        }

        await kyc.save();

        res.json({
            success: true,
            message: 'KYC verified',
            eligibleSchemes: kyc.eligibleSchemes
        });
    } catch (error) {
        console.error('KYC verification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get KYC status
router.get('/status/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const kyc = await KYC.findOne({ userId })
            .populate('eligibleSchemes', 'name description')
            .select('-documentNumber'); // Don't expose sensitive data

        if (!kyc) {
            return res.status(404).json({ error: 'KYC not found' });
        }

        res.json({
            isVerified: kyc.isVerified,
            verifiedAt: kyc.verifiedAt,
            eligibleSchemes: kyc.eligibleSchemes,
            commitment: kyc.commitment
        });
    } catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
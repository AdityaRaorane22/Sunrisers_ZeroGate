const express = require('express');
const router = express.Router();
const proofService = require('../services/proof.service');
const blockchainService = require('../services/blockchain.service');
const Scheme = require('../models/Scheme');

// Generate proof for scheme application
router.post('/generate', async (req, res) => {
    try {
        const { userId, schemeId, secret } = req.body;

        // Generate proof data
        const proofData = await proofService.generateProofData(
            userId,
            schemeId,
            secret
        );

        // Verify locally first
        const isValid = proofService.verifyProofLocally(proofData);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid proof generated' });
        }

        // Generate ZK proof (mock for now)
        const zkProof = proofService.generateZKProof(proofData);

        res.json({
            success: true,
            proof: zkProof,
            nullifier: proofData.nullifier,
            actionId: proofData.actionId,
            epochTimestamp: proofData.epochTimestamp,
            root: proofData.root
        });
    } catch (error) {
        console.error('Proof generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit proof to blockchain
router.post('/submit', async (req, res) => {
    try {
        const { proof, nullifier, actionId, epochTimestamp, schemeId } = req.body;

        // Check if nullifier already used
        const isUsed = await blockchainService.checkNullifier(nullifier);
        if (isUsed) {
            return res.status(400).json({ error: 'Proof already used' });
        }

        // Submit to blockchain
        const result = await blockchainService.submitProof(
            proof,
            nullifier,
            actionId,
            epochTimestamp
        );

        // Update scheme stats
        await Scheme.findByIdAndUpdate(schemeId, {
            $inc: { totalApplied: 1 }
        });

        res.json({
            success: true,
            message: 'Access granted anonymously',
            txHash: result.txHash,
            blockNumber: result.blockNumber
        });
    } catch (error) {
        console.error('Proof submission error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Verify proof status
router.get('/verify/:nullifier', async (req, res) => {
    try {
        const { nullifier } = req.params;

        const isUsed = await blockchainService.checkNullifier(nullifier);

        res.json({
            isUsed,
            status: isUsed ? 'ACCESS_GRANTED' : 'NOT_USED'
        });
    } catch (error) {
        console.error('Verify proof error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
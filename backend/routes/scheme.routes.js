const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');
const merkleTreeService = require('../services/merkleTree.service');
const blockchainService = require('../services/blockchain.service');

// Create new scheme
router.post('/create', async (req, res) => {
    try {
        const { name, description, criteria } = req.body;

        const scheme = new Scheme({
            name,
            description,
            criteria
        });

        await scheme.save();

        res.json({
            success: true,
            message: 'Scheme created',
            schemeId: scheme._id
        });
    } catch (error) {
        console.error('Scheme creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all schemes
router.get('/all', async (req, res) => {
    try {
        const schemes = await Scheme.find({ isActive: true })
            .select('-merkleRoot -contractAddress');

        res.json({ schemes });
    } catch (error) {
        console.error('Get schemes error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get scheme details
router.get('/:schemeId', async (req, res) => {
    try {
        const { schemeId } = req.params;

        const scheme = await Scheme.findById(schemeId);
        if (!scheme) {
            return res.status(404).json({ error: 'Scheme not found' });
        }

        res.json({ scheme });
    } catch (error) {
        console.error('Get scheme error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Merkle tree for scheme
router.post('/:schemeId/update-tree', async (req, res) => {
    try {
        const { schemeId } = req.params;

        // Build tree with eligible users
        const { root, count } = await merkleTreeService.updateSchemeTree(schemeId);

        // Update on blockchain
        const txResult = await blockchainService.updateMerkleRoot(root);

        // Update scheme
        const scheme = await Scheme.findById(schemeId);
        scheme.merkleRoot = root;
        scheme.totalEligible = count;
        await scheme.save();

        res.json({
            success: true,
            root,
            totalEligible: count,
            txHash: txResult.txHash
        });
    } catch (error) {
        console.error('Update tree error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
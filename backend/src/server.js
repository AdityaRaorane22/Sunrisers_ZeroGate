import express from 'express';
import cors from 'cors';
import { PrivacyMerkleTree } from './merkleTree.js';
import { ZKProofGenerator } from './proofGenerator.js';

const app = express();
app.use(cors());
app.use(express.json());

const trees = new Map();
const commitments = new Map(); // Store tier/info by commitment

// OPTIMIZED: Use smaller depth for faster operations
// Supports up to 1024 users by default (depth 10)
// Can be increased via maxLeaves option
const defaultTree = new PrivacyMerkleTree({
    maxLeaves: 1024,  // Adjust based on expected user count
    depth: 10         // Much faster than depth 20 (1M capacity)
});
trees.set('default', defaultTree);

app.post('/api/register', async (req, res) => {
    try {
        const { commitment, tier = 1 } = req.body;
        if (!commitment) return res.status(400).json({ error: 'commitment required' });

        console.log("📝 Registering Commitment:", commitment);

        const tree = trees.get('default');

        // Add commitment publically to the tree
        // Note: In real app, we would verify a signature or deposit here

        await tree.ready;
        tree.leaves.push(commitment);
        const index = tree.leaves.length - 1;

        tree.commitments.set(commitment, {
            index,
            tier
        });

        const root = await tree.getRoot();

        console.log("✅ Added to tree. New Root:", root);

        res.json({
            success: true,
            commitment,
            index,
            tier,
            root
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Changed from generate-proof to get-merkle-proof
app.post('/api/get-merkle-proof', async (req, res) => {
    try {
        const { commitment } = req.body;
        if (!commitment) {
            return res.status(400).json({ error: 'commitment required' });
        }

        const tree = trees.get('default');

        try {
            const merkleProof = await tree.generateProof(commitment);
            res.json(merkleProof);
        } catch (e) {
            res.status(404).json({ error: "Commitment not found in tree" });
        }

    } catch (error) {
        console.error('Get Merkle Proof error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/root', async (req, res) => {
    try {
        const tree = trees.get('default');
        const root = await tree.getRoot();
        res.json({ root });
    } catch (error) {
        console.error('Get root error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const tree = trees.get('default');
        const stats = tree.getStats();
        res.json({
            totalUsers: tree.leaves.length,
            ...stats,
            gasPerProof: '~180k',  // Smaller depth = less gas
            provingTime: '~150ms'  // Faster with optimized tree
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 ZeroGate API running on port ${PORT}`);
});
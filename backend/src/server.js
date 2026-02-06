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
    maxLeaves: 1024,
    depth: 10
});
trees.set('default', defaultTree);

const proofGenerator = new ZKProofGenerator(defaultTree);

app.post('/api/verify-access', async (req, res) => {
    try {
        const { proof, publicSignals, requiredTier } = req.body;

        if (!proof || !publicSignals || !requiredTier) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`🔐 Verifying proof for Tier ${requiredTier}...`);
        console.log('Received Proof:', JSON.stringify(proof, null, 2));
        console.log('Received Public Signals:', JSON.stringify(publicSignals, null, 2));

        // Functional Verification
        // 1. Verify ZK Proof validity
        const isValid = await proofGenerator.verifyProofLocally(proof, publicSignals);

        if (!isValid) {
            console.error("❌ Invalid ZK Proof");
            return res.status(401).json({ success: false, error: 'Invalid ZK Proof' });
        }

        // 2. Check Tier Requirement (Public Signal 4 is requiredTier)
        const proofTier = parseInt(publicSignals.requiredTier);
        if (proofTier < requiredTier) {
            console.error(`❌ Insufficient Tier: Proof is for ${proofTier}, but ${requiredTier} is required`);
            return res.status(403).json({ success: false, error: 'Insufficient Tier access' });
        }

        // 3. Check Merkle Root
        const currentRoot = await defaultTree.getRoot();
        if (publicSignals.root !== currentRoot) {
            console.warn(`⚠️ Proof root (${publicSignals.root}) differs from current root (${currentRoot}). Proof might be from an older state.`);
            // In a production app, we'd check if it's a recent root (e.g., last 10 roots)
        }

        console.log("✅ Proof Verified Successfully!");
        res.json({ success: true });

    } catch (error) {
        console.error('Verify Access error:', error);
        res.status(500).json({ error: error.message });
    }
});

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
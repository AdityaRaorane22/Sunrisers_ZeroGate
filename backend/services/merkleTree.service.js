const { buildPoseidon } = require('circomlibjs');
const KYC = require('../models/KYC');
const Scheme = require('../models/Scheme');

let poseidon;

class MerkleTreeService {
    constructor(depth = 20) {
        this.depth = depth;
        this.zero = BigInt(0);
        this.zeroHashes = null;
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            poseidon = await buildPoseidon();
            this.zeroHashes = await this.generateZeroHashes();
            this.initialized = true;
        }
    }

    // Generate zero hashes for empty nodes
    async generateZeroHashes() {
        const hashes = [this.zero];
        for (let i = 1; i <= this.depth; i++) {
            hashes.push(poseidon([hashes[i - 1], hashes[i - 1]]));
        }
        return hashes;
    }

    // Hash two nodes
    hashPair(left, right) {
        return poseidon([BigInt(left), BigInt(right)]);
    }

    // Build Merkle tree from commitments
    async buildTree(commitments) {
        await this.initialize();
        const leaves = commitments.map(c => BigInt(c));
        let currentLevel = [...leaves];

        // Pad to power of 2
        const targetSize = Math.pow(2, Math.ceil(Math.log2(leaves.length)));
        while (currentLevel.length < targetSize) {
            currentLevel.push(this.zero);
        }

        const tree = [currentLevel];

        // Build tree bottom-up
        while (currentLevel.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                const left = currentLevel[i];
                const right = currentLevel[i + 1] || this.zero;
                nextLevel.push(this.hashPair(left, right));
            }
            currentLevel = nextLevel;
            tree.push(currentLevel);
        }

        return {
            root: tree[tree.length - 1][0].toString(),
            tree,
            leaves
        };
    }

    // Generate Merkle proof for a leaf
    generateProof(tree, leafIndex) {
        const proof = [];
        let index = leafIndex;

        for (let level = 0; level < tree.length - 1; level++) {
            const isLeft = index % 2 === 0;
            const siblingIndex = isLeft ? index + 1 : index - 1;

            const sibling = tree[level][siblingIndex] || this.zeroHashes[level];

            proof.push({
                sibling: sibling.toString(),
                isLeft
            });

            index = Math.floor(index / 2);
        }

        return proof;
    }

    // Verify Merkle proof
    verifyProof(leaf, proof, root) {
        let current = BigInt(leaf);

        for (const { sibling, isLeft } of proof) {
            const siblingBigInt = BigInt(sibling);
            current = isLeft
                ? this.hashPair(current, siblingBigInt)
                : this.hashPair(siblingBigInt, current);
        }

        return current.toString() === root;
    }

    // Update tree for a scheme with eligible users
    async updateSchemeTree(schemeId) {
        await this.initialize();
        const scheme = await Scheme.findById(schemeId);
        if (!scheme) throw new Error('Scheme not found');

        // Get all eligible KYC records
        const eligibleKYCs = await KYC.find({
            isVerified: true,
            eligibleSchemes: schemeId
        }).select('commitment userId');

        const commitments = eligibleKYCs.map(kyc => kyc.commitment);

        if (commitments.length === 0) {
            return { root: this.zeroHashes[this.depth].toString(), count: 0 };
        }

        const { root, tree } = await this.buildTree(commitments);

        // Update indices
        for (let i = 0; i < eligibleKYCs.length; i++) {
            eligibleKYCs[i].merkleTreeIndex = i;
            await eligibleKYCs[i].save();
        }

        return { root, tree, count: commitments.length };
    }
}

module.exports = new MerkleTreeService();
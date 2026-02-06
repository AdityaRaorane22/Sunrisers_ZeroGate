import { buildPoseidon } from 'circomlibjs';

class PrivacyMerkleTree {
    constructor(options = {}) {
        // Dynamic depth: calculate based on expected max leaves
        // Default to 10 (supports up to 1024 leaves) 
        this.maxLeaves = options.maxLeaves || 1024;
        this.depth = options.depth || Math.ceil(Math.log2(this.maxLeaves));

        this.leaves = [];
        this.commitments = new Map();
        this.poseidon = null;

        // OPTIMIZATION: Cache intermediate tree levels
        this.cachedLevels = new Map();
        this.rootCache = null;
        this.rootCacheValid = false;

        this.ready = this.initPoseidon();
    }

    async initPoseidon() {
        if (!this.poseidon) {
            this.poseidon = await buildPoseidon();
            this._zeroHashes = this._getZeroHashes();
        }
        return this.poseidon;
    }

    toFieldElement(value) {
        if (typeof value === 'string') {
            if (value.startsWith('0x')) {
                return BigInt(value);
            }
            if (/^\d+$/.test(value)) {
                return BigInt(value);
            }
            // Fallback for non-numeric strings
            return BigInt('0x' + Buffer.from(value).toString('hex')) % 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
        }
        return BigInt(value);
    }

    hash(inputs) {
        if (!this.poseidon) {
            throw new Error('Poseidon not initialized. Call initPoseidon() first.');
        }
        const F = this.poseidon.F;
        const hash = this.poseidon(inputs.map(x => this.toFieldElement(x)));
        return '0x' + F.toString(hash, 16).padStart(64, '0');
    }

    hashPair(left, right) {
        return this.hash([left, right]);
    }

    _getZeroHashes() {
        const hashes = [this.getZeroValue()];
        for (let i = 0; i < this.depth; i++) {
            hashes.push(this.hashPair(hashes[i], hashes[i]));
        }
        return hashes;
    }

    getZeroValue() {
        return '0x' + '0'.repeat(64);
    }

    // INNOVATIVE: Add commitment with tier level
    async addCommitment(identity, tier = 1) {
        await this.ready;

        // Hash identity + tier together to match frontend/circuit
        const commitment = this.hash([identity, tier]);

        this.leaves.push(commitment);
        this.commitments.set(commitment, {
            index: this.leaves.length - 1,
            identity,
            tier
        });

        // Invalidate caches
        this.rootCacheValid = false;
        this.cachedLevels.clear();

        return {
            commitment: commitment,
            index: this.leaves.length - 1,
            tier: tier
        };
    }

    // Fixed depth tree building
    buildFullTree() {
        if (this.cachedLevels.size > 0) {
            return this.cachedLevels;
        }

        const levels = new Map();
        let currentLevel = [...this.leaves];

        // Pad leaves to next power of 2 if needed for current calculations
        // but for fixed root we need to pad to 2^depth
        const targetSize = Math.pow(2, this.depth);
        const zeroVal = this.getZeroValue();

        // Fill up current level to full capacity
        while (currentLevel.length < targetSize) {
            currentLevel.push(zeroVal);
        }

        levels.set(0, currentLevel);

        // Build tree bottom-up to fixed depth
        for (let level = 0; level < this.depth; level++) {
            const nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                nextLevel.push(this.hashPair(currentLevel[i], currentLevel[i + 1]));
            }
            currentLevel = nextLevel;
            levels.set(level + 1, currentLevel);
        }

        this.cachedLevels = levels;
        return levels;
    }

    async generateProof(commitment) {
        await this.ready;

        const data = this.commitments.get(commitment);
        if (!data) throw new Error('Commitment not found');

        const levels = this.buildFullTree();
        const pathElements = [];
        const pathIndices = [];

        let currentIndex = data.index;

        for (let level = 0; level < this.depth; level++) {
            const currentLevel = levels.get(level);
            const isLeft = currentIndex % 2 === 0;
            const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;

            pathElements.push(currentLevel[siblingIndex]);
            pathIndices.push(isLeft ? 0 : 1);

            currentIndex = Math.floor(currentIndex / 2);
        }

        return {
            root: await this.getRoot(),
            pathElements,
            pathIndices,
            leaf: commitment,
            index: data.index,
            tier: data.tier
        };
    }

    async getRoot() {
        await this.ready;

        if (this.rootCacheValid && this.rootCache) {
            return this.rootCache;
        }

        const levels = this.buildFullTree();
        const topLevel = levels.get(this.depth);
        this.rootCache = topLevel[0];
        this.rootCacheValid = true;

        return this.rootCache;
    }

    // Get current tree statistics
    getStats() {
        return {
            leafCount: this.leaves.length,
            maxDepth: this.depth,
            maxCapacity: Math.pow(2, this.depth),
            utilizationPercent: (this.leaves.length / Math.pow(2, this.depth) * 100).toFixed(2)
        };
    }

    serialize() {
        return {
            depth: this.depth,
            maxLeaves: this.maxLeaves,
            root: this.getRoot(),
            commitments: Array.from(this.commitments.entries()),
            stats: this.getStats()
        };
    }
}

export { PrivacyMerkleTree };
const { ethers } = require('ethers');
require('dotenv').config();

const ACCESS_CONTROLLER_ABI = [
    "function updateRoot(bytes32 _newRoot) external",
    "function verifyAndExecute(tuple(uint[2] a, uint[2][2] b, uint[2] c) proof, bytes32 nullifier, bytes32 actionId, uint epochTimestamp) external returns (bool)",
    "function checkAccess(bytes32 nullifier) external view returns (bool)",
    "event AccessGranted(bytes32 indexed nullifier, uint timestamp)",
    "event RootUpdated(bytes32 newRoot)"
];

const MERKLE_REGISTRY_ABI = [
    "function createTree(uint tier, uint depth) external returns (uint)",
    "function updateRoot(uint treeId, bytes32 newRoot) external",
    "function addLeaf(uint treeId, bytes32 commitment) external",
    "function getTree(uint treeId) external view returns (tuple(bytes32 root, uint depth, uint leafCount, uint tier))"
];

class BlockchainService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(
            process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_KEY'
        );

        this.wallet = new ethers.Wallet(
            process.env.PRIVATE_KEY,
            this.provider
        );

        this.accessController = new ethers.Contract(
            process.env.ACCESS_CONTROLLER_ADDRESS || '0x61f83F5702FE4fc0fA727Ce7CAD560154385da1F',
            ACCESS_CONTROLLER_ABI,
            this.wallet
        );

        this.merkleRegistry = new ethers.Contract(
            process.env.MERKLE_REGISTRY_ADDRESS || '0xb20e43BFDA995C18b822AB173Ce1eF5365eC5789',
            MERKLE_REGISTRY_ABI,
            this.wallet
        );
    }

    // Update Merkle root on-chain
    async updateMerkleRoot(root) {
        try {
            const rootBytes32 = ethers.zeroPadValue(
                ethers.toBeHex(BigInt(root)),
                32
            );

            const tx = await this.accessController.updateRoot(rootBytes32);
            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash,
                root: rootBytes32
            };
        } catch (error) {
            console.error('Error updating root:', error);
            throw error;
        }
    }

    // Submit proof to blockchain
    async submitProof(proof, nullifier, actionId, epochTimestamp) {
        try {
            const nullifierBytes32 = ethers.zeroPadValue(
                ethers.toBeHex(BigInt(nullifier)),
                32
            );

            const actionIdBytes32 = ethers.zeroPadValue(
                ethers.toBeHex(BigInt('0x' + Buffer.from(actionId).toString('hex'))),
                32
            );

            const tx = await this.accessController.verifyAndExecute(
                proof,
                nullifierBytes32,
                actionIdBytes32,
                epochTimestamp
            );

            const receipt = await tx.wait();

            return {
                success: true,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error submitting proof:', error);
            throw error;
        }
    }

    // Check if nullifier was used
    async checkNullifier(nullifier) {
        try {
            const nullifierBytes32 = ethers.zeroPadValue(
                ethers.toBeHex(BigInt(nullifier)),
                32
            );

            const isUsed = await this.accessController.checkAccess(nullifierBytes32);
            return isUsed;
        } catch (error) {
            console.error('Error checking nullifier:', error);
            throw error;
        }
    }

    // Create new tree in registry
    async createTree(tier, depth = 20) {
        try {
            const tx = await this.merkleRegistry.createTree(tier, depth);
            const receipt = await tx.wait();

            // Extract treeId from logs
            const treeId = receipt.logs[0].topics[1];

            return {
                success: true,
                treeId: parseInt(treeId, 16),
                txHash: receipt.hash
            };
        } catch (error) {
            console.error('Error creating tree:', error);
            throw error;
        }
    }
}

module.exports = new BlockchainService();
const { buildPoseidon } = require('circomlibjs');
const crypto = require('crypto');
const merkleTreeService = require('./merkleTree.service');
const KYC = require('../models/KYC');
const Scheme = require('../models/Scheme');

let poseidon;

class ProofService {
    async initialize() {
        if (!poseidon) {
            poseidon = await buildPoseidon();
        }
    }

    // Generate commitment for KYC
    async generateCommitment(userId, secret) {
        await this.initialize();
        const userIdHash = BigInt('0x' + crypto.createHash('sha256')
            .update(userId)
            .digest('hex'));
        const secretHash = BigInt('0x' + crypto.createHash('sha256')
            .update(secret)
            .digest('hex'));

        return poseidon([userIdHash, secretHash]).toString();
    }

    // Generate nullifier (unique per action)
    async generateNullifier(commitment, actionId) {
        await this.initialize();
        const commitmentBigInt = BigInt(commitment);
        const actionHash = BigInt('0x' + crypto.createHash('sha256')
            .update(actionId)
            .digest('hex'));

        return poseidon([commitmentBigInt, actionHash]).toString();
    }

    // Generate proof data for scheme application
    async generateProofData(userId, schemeId, secret) {
        // Get KYC record
        const kyc = await KYC.findOne({ userId });
        if (!kyc || !kyc.isVerified) {
            throw new Error('KYC not verified');
        }

        // Check eligibility
        if (!kyc.eligibleSchemes.includes(schemeId)) {
            throw new Error('Not eligible for this scheme');
        }

        // Get scheme
        const scheme = await Scheme.findById(schemeId);
        if (!scheme) throw new Error('Scheme not found');

        // Verify commitment matches
        const expectedCommitment = this.generateCommitment(userId, secret);
        if (expectedCommitment !== kyc.commitment) {
            throw new Error('Invalid secret');
        }

        // Get all eligible commitments for this scheme
        const eligibleKYCs = await KYC.find({
            isVerified: true,
            eligibleSchemes: schemeId
        }).select('commitment userId').sort({ createdAt: 1 });

        const commitments = eligibleKYCs.map(k => k.commitment);
        const leafIndex = commitments.indexOf(kyc.commitment);

        if (leafIndex === -1) {
            throw new Error('Commitment not in tree');
        }

        // Build tree and generate proof
        const { root, tree } = await merkleTreeService.buildTree(commitments);
        const merklePath = merkleTreeService.generateProof(tree, leafIndex);

        // Generate nullifier for this action
        const actionId = `scheme_${schemeId}_${Date.now()}`;
        const nullifier = this.generateNullifier(kyc.commitment, actionId);

        return {
            commitment: kyc.commitment,
            nullifier,
            root,
            merklePath,
            actionId,
            epochTimestamp: Math.floor(Date.now() / 1000),
            leafIndex
        };
    }

    // Verify proof locally before blockchain submission
    verifyProofLocally(proofData) {
        const { commitment, merklePath, root } = proofData;

        return merkleTreeService.verifyProof(
            commitment,
            merklePath,
            root
        );
    }

    // Generate mock ZK proof (for demo - replace with real snarkjs)
    generateZKProof(proofData) {
        // In production, this would use snarkjs to generate actual Groth16 proof
        // For now, returning mock proof structure
        return {
            a: [
                '0x' + crypto.randomBytes(32).toString('hex'),
                '0x' + crypto.randomBytes(32).toString('hex')
            ],
            b: [
                [
                    '0x' + crypto.randomBytes(32).toString('hex'),
                    '0x' + crypto.randomBytes(32).toString('hex')
                ],
                [
                    '0x' + crypto.randomBytes(32).toString('hex'),
                    '0x' + crypto.randomBytes(32).toString('hex')
                ]
            ],
            c: [
                '0x' + crypto.randomBytes(32).toString('hex'),
                '0x' + crypto.randomBytes(32).toString('hex')
            ]
        };
    }
}

module.exports = new ProofService();
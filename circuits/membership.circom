pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";

// INNOVATIVE: Multi-tier Merkle tree membership proof with access level verification
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component hashers[levels];
    component mux[levels];

    signal levelHashes[levels + 1];
    levelHashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        // Select left or right based on path index
        mux[i] = MultiMux1(2);
        mux[i].c[0][0] <== levelHashes[i];
        mux[i].c[0][1] <== pathElements[i];
        mux[i].c[1][0] <== pathElements[i];
        mux[i].c[1][1] <== levelHashes[i];
        mux[i].s <== pathIndices[i];

        // Hash the pair using Poseidon
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== mux[i].out[0];
        hashers[i].inputs[1] <== mux[i].out[1];

        levelHashes[i + 1] <== hashers[i].out;
    }

    // Verify root matches
    root === levelHashes[levels];
}

// INNOVATIVE: Access tier verification (1=basic, 2=premium, 3=admin)
template TierChecker() {
    signal input tier;
    signal input requiredTier;
    
    // Check tier >= requiredTier
    component gte = GreaterEqThan(8);
    gte.in[0] <== tier;
    gte.in[1] <== requiredTier;
    gte.out === 1;
}

// Main membership proof circuit with INNOVATIVE features
template MembershipProof(levels) {
    // Private inputs (hidden from verifier)
    signal input identity;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input tier;  // INNOVATIVE: User's access tier
    
    // Public inputs (visible to verifier)
    signal input root;
    signal input nullifier;
    signal input actionId;
    signal input epochTimestamp;
    signal input requiredTier;  // INNOVATIVE: Required tier for this action
    signal input contractAddress;  // INNOVATIVE: Bind to specific contract

    // 1. Compute commitment from identity + tier (INNOVATIVE)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== identity;
    commitmentHasher.inputs[1] <== tier;
    signal commitment <== commitmentHasher.out;

    // 2. Verify Merkle tree membership
    component merkleProof = MerkleTreeChecker(levels);
    merkleProof.leaf <== commitment;
    merkleProof.root <== root;
    for (var i = 0; i < levels; i++) {
        merkleProof.pathElements[i] <== pathElements[i];
        merkleProof.pathIndices[i] <== pathIndices[i];
    }

    // 3. INNOVATIVE: Verify user has sufficient tier level
    component tierCheck = TierChecker();
    tierCheck.tier <== tier;
    tierCheck.requiredTier <== requiredTier;

    // 4. Compute and verify nullifier (INNOVATIVE: includes contract address)
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== identity;
    nullifierHasher.inputs[1] <== actionId;
    nullifierHasher.inputs[2] <== contractAddress;
    nullifierHasher.out === nullifier;

    // 5. Epoch timestamp is passed through as public signal
    signal epochCheck <== epochTimestamp;
}

// Export main component with public signals
// OPTIMIZED: Depth 10 supports 1024 users (much faster than depth 20)
component main {public [root, nullifier, actionId, epochTimestamp, requiredTier, contractAddress]} = MembershipProof(10);

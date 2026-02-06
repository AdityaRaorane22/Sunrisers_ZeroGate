import { PrivacyMerkleTree } from './src/merkleTree.js';

async function test() {
    const tree = new PrivacyMerkleTree({ depth: 10 });
    await tree.ready;

    console.log("Empty Root:", await tree.getRoot());

    const identity = "123456789";
    const tier = 1;
    const res = await tree.addCommitment(identity, tier);
    console.log("Added Commitment:", res);

    const root = await tree.getRoot();
    console.log("Root with 1 leaf:", root);

    const proof = await tree.generateProof(res.commitment);
    console.log("Proof generated. Path length:", proof.pathElements.length);

    // Verify logic: manual check of levels
    let current = tree.toFieldElement(res.commitment);
    const poseidon = tree.poseidon;
    const F = poseidon.F;

    for (let i = 0; i < proof.pathElements.length; i++) {
        const sibling = tree.toFieldElement(proof.pathElements[i]);
        if (proof.pathIndices[i] === 0) {
            // we are left
            current = poseidon([current, sibling]);
        } else {
            // we are right
            current = poseidon([sibling, current]);
        }
    }

    const calculatedRoot = '0x' + F.toString(current, 16).padStart(64, '0');
    console.log("Calculated Root from proof:", calculatedRoot);

    if (calculatedRoot === root) {
        console.log("✅ Merkle proof logic verified!");
    } else {
        console.error("❌ Merkle proof logic failed!");
    }
}

test().catch(console.error);

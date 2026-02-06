// import { buildPoseidon } from 'circomlibjs';
// import { groth16 } from 'snarkjs';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import fs from 'fs';
// import crypto from 'crypto';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// class ZKProofGenerator {
//     constructor(merkleTree) {
//         this.tree = merkleTree;
//         this.poseidon = null;
//         this.ready = this.initPoseidon();

//         // INNOVATIVE: Contract address for nullifier binding
//         this.contractAddress = '0x61f83F5702FE4fc0fA727Ce7CAD560154385da1F';
//     }

//     async initPoseidon() {
//         if (!this.poseidon) {
//             this.poseidon = await buildPoseidon();
//         }
//         return this.poseidon;
//     }

//     toFieldElement(value) {
//         if (typeof value === 'string') {
//             // 1. If it's already a 0x hex string, use it
//             if (value.startsWith('0x')) {
//                 try {
//                     return BigInt(value);
//                 } catch (e) {
//                     // Not a valid hex, fallback to hashing
//                 }
//             }

//             // 2. If it's a decimal string, use it
//             if (/^\d+$/.test(value)) {
//                 return BigInt(value);
//             }

//             // 3. For any other string (like "claim_reward_001"), 
//             // hash it to get a deterministic field element
//             const hash = crypto.createHash('sha256').update(value).digest('hex');
//             // Modulo by BN254 prime to stay in field
//             const prime = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
//             return BigInt('0x' + hash) % prime;
//         }
//         return BigInt(value);
//     }

//     hash(inputs) {
//         if (!this.poseidon) {
//             throw new Error('Poseidon not initialized');
//         }
//         const F = this.poseidon.F;
//         const hash = this.poseidon(inputs.map(x => this.toFieldElement(x)));
//         return '0x' + F.toString(hash, 16).padStart(64, '0');
//     }

//     async generateAccessProof(identity, actionId, requiredTier = 1) {
//         await this.ready;

//         // 1. Get user's tier from tree
//         const commitment = this.hash([identity, 1]); // Default tier 1 for demo

//         // 2. Get Merkle proof
//         const merkleProof = await this.tree.generateProof(commitment);

//         // 3. Compute nullifier (INNOVATIVE: includes contract address)
//         const actionIdField = this.toFieldElement(
//             this.hash([actionId])
//         );
//         const contractField = this.toFieldElement(this.contractAddress);
//         const nullifier = this.hash([identity, actionIdField, contractField]);

//         // 4. Get epoch timestamp
//         const epochTimestamp = Math.floor(Date.now() / 1000);

//         // 5. Prepare circuit inputs
//         const circuitInputs = {
//             // Private inputs
//             identity: this.toFieldElement(identity).toString(),
//             pathElements: merkleProof.pathElements.map(x =>
//                 this.toFieldElement(x).toString()
//             ),
//             pathIndices: merkleProof.pathIndices.map(x => x.toString()),
//             tier: '1', // User's tier

//             // Public inputs
//             root: this.toFieldElement(merkleProof.root).toString(),
//             nullifier: this.toFieldElement(nullifier).toString(),
//             actionId: actionIdField.toString(),
//             epochTimestamp: epochTimestamp.toString(),
//             requiredTier: requiredTier.toString(),
//             contractAddress: contractField.toString()
//         };

//         // 6. Check if circuit files exist
//         const wasmPath = path.join(__dirname, '../../circuits/build/membership_js/membership.wasm');
//         const zkeyPath = path.join(__dirname, '../../circuits/build/membership_final.zkey');

//         if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
//             console.warn('⚠️  Circuit files not found. Using mock proof for now.');
//             console.warn('   Run: cd circuits && npm run compile');
//             return this._generateMockProof(nullifier, actionId, epochTimestamp, merkleProof.root, requiredTier);
//         }

//         try {
//             // 7. Generate REAL ZK proof using SnarkJS
//             console.log('🔐 Generating real ZK proof...');
//             const { proof, publicSignals } = await groth16.fullProve(
//                 circuitInputs,
//                 wasmPath,
//                 zkeyPath
//             );

//             // 8. Format proof for Solidity
//             const solidityProof = {
//                 a: [proof.pi_a[0], proof.pi_a[1]],
//                 b: [
//                     [proof.pi_b[0][1], proof.pi_b[0][0]],
//                     [proof.pi_b[1][1], proof.pi_b[1][0]]
//                 ],
//                 c: [proof.pi_c[0], proof.pi_c[1]]
//             };

//             console.log('✅ Real ZK proof generated successfully!');

//             return {
//                 proof: solidityProof,
//                 nullifier: nullifier,
//                 actionId: actionId,
//                 epochTimestamp: epochTimestamp,
//                 requiredTier: requiredTier,
//                 publicSignals: {
//                     root: merkleProof.root,
//                     nullifier: nullifier,
//                     actionId: actionIdField.toString(),
//                     epochTimestamp: epochTimestamp.toString(),
//                     requiredTier: requiredTier.toString(),
//                     contractAddress: this.contractAddress
//                 },
//                 isReal: true
//             };
//         } catch (error) {
//             console.error('❌ ZK proof generation failed:', error.message);
//             console.warn('⚠️  Falling back to mock proof');
//             return this._generateMockProof(nullifier, actionId, epochTimestamp, merkleProof.root, requiredTier);
//         }
//     }

//     async _generateMockProof(nullifier, actionId, epochTimestamp, root, requiredTier) {
//         return {
//             proof: {
//                 a: [
//                     '0x' + crypto.randomBytes(32).toString('hex'),
//                     '0x' + crypto.randomBytes(32).toString('hex')
//                 ],
//                 b: [
//                     [
//                         '0x' + crypto.randomBytes(32).toString('hex'),
//                         '0x' + crypto.randomBytes(32).toString('hex')
//                     ],
//                     [
//                         '0x' + crypto.randomBytes(32).toString('hex'),
//                         '0x' + crypto.randomBytes(32).toString('hex')
//                     ]
//                 ],
//                 c: [
//                     '0x' + crypto.randomBytes(32).toString('hex'),
//                     '0x' + crypto.randomBytes(32).toString('hex')
//                 ]
//             },
//             nullifier: nullifier,
//             actionId: actionId,
//             epochTimestamp: epochTimestamp,
//             requiredTier: requiredTier,
//             publicSignals: {
//                 root: root,
//                 nullifier: nullifier,
//                 actionId: this.hash([actionId]).toString(),
//                 epochTimestamp: epochTimestamp.toString(),
//                 requiredTier: requiredTier.toString(),
//                 contractAddress: this.contractAddress
//             },
//             isReal: false
//         };
//     }

//     async verifyProofLocally(proof, publicSignals) {
//         const vkeyPath = path.join(__dirname, '../../circuits/build/verification_key.json');

//         if (!fs.existsSync(vkeyPath)) {
//             console.warn('⚠️  Verification key not found. Skipping local verification.');
//             return true;
//         }

//         try {
//             const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
//             return await groth16.verify(vkey, publicSignals, proof);
//         } catch (error) {
//             console.error('❌ Local verification failed:', error.message);
//             return false;
//         }
//     }
// }

// export { ZKProofGenerator };

//==========================================================================


import { buildPoseidon } from "circomlibjs";
import { groth16 } from "snarkjs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BN254 prime
const FIELD_PRIME = BigInt(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617"
);

class ZKProofGenerator {
  constructor(merkleTree) {
    this.tree = merkleTree;
    this.poseidon = null;
    this.ready = this.initPoseidon();

    this.contractAddress =
      "0x61f83F5702FE4fc0fA727Ce7CAD560154385da1F";
  }

  async initPoseidon() {
    if (!this.poseidon) {
      this.poseidon = await buildPoseidon();
    }
    return this.poseidon;
  }

  /* ------------------ FIELD HELPERS ------------------ */

  toFieldElement(value) {
    if (typeof value === "string") {
      if (value.startsWith("0x")) {
        return BigInt(value) % FIELD_PRIME;
      }

      if (/^\d+$/.test(value)) {
        return BigInt(value) % FIELD_PRIME;
      }

      const hash = crypto
        .createHash("sha256")
        .update(value)
        .digest("hex");

      return BigInt("0x" + hash) % FIELD_PRIME;
    }

    return BigInt(value) % FIELD_PRIME;
  }

  poseidonHash(inputs) {
    const F = this.poseidon.F;
    const res = this.poseidon(inputs.map((x) => this.toFieldElement(x)));
    return F.toObject(res);
  }

  /* ------------------ PROOF GENERATION ------------------ */

  async generateAccessProof(identity, actionId, requiredTier = 1) {
    await this.ready;

    // Hash identity to field-safe value
    const identityField = this.poseidonHash([identity]);

    // Commitment = Poseidon(identity, tier)
    const commitment = this.poseidonHash([identityField, 1]);

    // Merkle proof
    const merkleProof = await this.tree.generateProof(commitment);

    // Action ID field
    const actionIdField = this.poseidonHash([actionId]);

    // Contract address field
    const contractField = this.toFieldElement(this.contractAddress);

    // Nullifier = Poseidon(identity, actionId, contract)
    const nullifier = this.poseidonHash([
      identityField,
      actionIdField,
      contractField,
    ]);

    const epochTimestamp = Math.floor(Date.now() / 1000);

    const circuitInputs = {
      // private
      identity: identityField.toString(),
      tier: "1",
      pathElements: merkleProof.pathElements.map((x) =>
        this.toFieldElement(x).toString()
      ),
      pathIndices: merkleProof.pathIndices.map((x) => x.toString()),

      // public
      root: this.toFieldElement(merkleProof.root).toString(),
      nullifier: nullifier.toString(),
      actionId: actionIdField.toString(),
      epochTimestamp: epochTimestamp.toString(),
      requiredTier: requiredTier.toString(),
      contractAddress: contractField.toString(),
    };

    const wasmPath = path.join(
      __dirname,
      "../circuits/build/membership_js/membership.wasm"
    );
    const zkeyPath = path.join(
      __dirname,
      "../circuits/build/membership_final.zkey"
    );

    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
      throw new Error("Circuit files not found");
    }

    try {
      console.log("🔐 Generating ZK proof...");

      const { proof, publicSignals } = await groth16.fullProve(
        circuitInputs,
        wasmPath,
        zkeyPath
      );

      const solidityProof = {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
          [proof.pi_b[0][1], proof.pi_b[0][0]],
          [proof.pi_b[1][1], proof.pi_b[1][0]],
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
      };

      return {
        proof: solidityProof,
        publicSignals: {
          root: publicSignals[0],
          nullifier: publicSignals[1],
          actionId: publicSignals[2],
          epochTimestamp: publicSignals[3],
          requiredTier: publicSignals[4],
          contractAddress: publicSignals[5],
        },
        isReal: true,
      };
    } catch (err) {
      console.error("❌ Proof generation failed:");
      console.error(err);
      throw err;
    }
  }

  /* ------------------ LOCAL VERIFICATION ------------------ */

  async verifyProofLocally(proof, publicSignalsObj) {
    const vkeyPath = path.join(
      __dirname,
      "../circuits/build/verification_key.json"
    );

    const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"));

    const publicSignals = [
      publicSignalsObj.root,
      publicSignalsObj.nullifier,
      publicSignalsObj.actionId,
      publicSignalsObj.epochTimestamp,
      publicSignalsObj.requiredTier,
      publicSignalsObj.contractAddress,
    ];

    return await groth16.verify(vkey, publicSignals, proof);
  }
}

export { ZKProofGenerator };

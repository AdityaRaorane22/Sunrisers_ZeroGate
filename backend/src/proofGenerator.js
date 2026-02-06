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
    async generateAccessProof(identity, actionId, requiredTier) {
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
            "../../circuits/build/membership_js/membership.wasm"
        );
        const zkeyPath = path.join(
            __dirname,
            "../../circuits/build/membership_final.zkey"
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
            "../../circuits/build/verification_key.json"
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

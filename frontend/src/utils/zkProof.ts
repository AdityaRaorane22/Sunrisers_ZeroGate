import { buildPoseidon } from 'circomlibjs';
// @ts-ignore
import * as snarkjs from 'snarkjs';

const CIRCUIT_WASM = '/membership.wasm';
const ZKEY_FILE = '/membership_final.zkey';

interface ProofInput {
    identity: string;
    tier: number;
    schemeId: string;
    pathElements: string[];
    pathIndices: number[];
    root: string;
}

interface GeneratedProof {
    proof: any;
    publicSignals: string[];
}

/**
 * Generate ZK proof using snarkjs
 */
export async function generateZKProof(input: ProofInput): Promise<GeneratedProof> {
    try {
        console.log('🔐 Generating ZK proof with snarkjs...');

        // Prepare circuit inputs
        const circuitInputs = {
            identity: input.identity,
            tier: input.tier.toString(),
            pathElements: input.pathElements,
            pathIndices: input.pathIndices,
            root: input.root
        };

        console.log('Circuit inputs:', circuitInputs);

        // Generate witness and proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            circuitInputs,
            CIRCUIT_WASM,
            ZKEY_FILE
        );

        console.log('✅ Proof generated successfully');
        console.log('Public signals:', publicSignals);

        return { proof, publicSignals };
    } catch (error) {
        console.error('❌ Error generating proof:', error);
        throw new Error(`Proof generation failed: ${(error as Error).message}`);
    }
}

/**
 * Verify ZK proof using snarkjs
 */
export async function verifyZKProof(proof: any, publicSignals: string[]): Promise<boolean> {
    try {
        console.log('🔍 Verifying ZK proof...');

        // Load verification key
        const vKeyResponse = await fetch('/verification_key.json');
        const vKey = await vKeyResponse.json();

        // Verify proof
        const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);

        console.log(isValid ? '✅ Proof valid' : '❌ Proof invalid');
        return isValid;
    } catch (error) {
        console.error('❌ Error verifying proof:', error);
        return false;
    }
}

/**
 * Generate commitment from identity and tier using Poseidon hash
 */
export async function generateCommitment(identity: string, tier: number): Promise<string> {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const identityBigInt = BigInt(identity);
    const tierBigInt = BigInt(tier);

    const commitment = poseidon([identityBigInt, tierBigInt]);
    return F.toString(commitment);
}

/**
 * Generate nullifier for preventing double-spending
 */
export async function generateNullifier(identity: string, schemeId: string): Promise<string> {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Hash identity + schemeId to create unique nullifier
    const identityBigInt = BigInt(identity);
    const schemeHash = BigInt('0x' + Buffer.from(schemeId).toString('hex'));

    const nullifier = poseidon([identityBigInt, schemeHash]);
    return F.toString(nullifier);
}

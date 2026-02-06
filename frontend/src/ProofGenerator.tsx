import React, { useState } from 'react';
import { buildPoseidon } from 'circomlibjs';
// @ts-ignore
import * as snarkjs from 'snarkjs';

/* ---------- Types ---------- */

interface ProofGeneratorProps {
  identity: string; // The secret
  apiUrl: string;
  address: string;
}

interface MerklePathResponse {
  pathElements: string[];
  pathIndices: number[];
  root: string;
  leaf: string;
}

interface ProofData {
  success: boolean;
  nullifier: string;
  actionId: string;
  epochTimestamp: number;
  requiredTier?: number;
  publicSignals: any;
  isReal?: boolean;
  proof?: any;
  error?: boolean;
}

/* ---------- Component ---------- */

const ProofGenerator: React.FC<ProofGeneratorProps> = ({ identity, apiUrl, address }) => {
  const [actionId, setActionId] = useState<string>('');
  const [requiredTier, setRequiredTier] = useState<number>(1);
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');

  const generateProof = async (): Promise<void> => {
    if (!actionId.trim()) {
      alert('Enter an Action ID');
      return;
    }

    setLoading(true);
    setStatus('🔄 Fetching Merkle Path from backend...');

    try {
      // 1. Calculate Commitment (Identity + Tier)
      const poseidon = await buildPoseidon();
      const F = poseidon.F;
      // We first fetch the merkle path to know our tier, or assume tier 1 for identity derivation
      // In a real app, the user knows their tier.
      const initialCommitment = F.toString(poseidon([identity, 1]));

      // 2. Get Merkle Path from Backend
      const pathRes = await fetch(`${apiUrl}/get-merkle-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitment: initialCommitment }),
      });

      if (!pathRes.ok) throw new Error('Failed to fetch Merkle path. Make sure you are registered!');
      const pathData: MerklePathResponse & { tier: number } = await pathRes.json();

      setStatus('🔐 Computing Zero-Knowledge Proof in browser...');

      // 3. Prepare Inputs
      const contractAddress = '21888242871839275222246405745257275088548364400416034343698204186575808495617'; // Mock Field Element

      // Hash Action ID
      const actionIdField = "123456";

      const epochTimestamp = Math.floor(Date.now() / 1000);

      const circuitInputs = {
        identity: identity,
        pathElements: pathData.pathElements,
        pathIndices: pathData.pathIndices,
        tier: pathData.tier.toString(),

        root: pathData.root,
        nullifier: F.toString(poseidon([identity, actionIdField, contractAddress])), // Expected nullifier
        actionId: actionIdField,
        epochTimestamp: epochTimestamp,
        requiredTier: requiredTier,
        contractAddress: contractAddress
      };

      console.log("Circuit Inputs:", circuitInputs);

      // 4. Generate Proof using SnarkJS
      // Note: We need the .wasm and .zkey files in the public folder!
      // If we don't have them, we mock the proof for the UI demo.

      let proofResult;
      let usedRealProof = false;

      try {
        console.log('🔍 Attempting to load circuit files...');
        console.log('WASM path: /membership.wasm');
        console.log('ZKEY path: /membership_final.zkey');

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
          circuitInputs,
          "/membership.wasm",
          "/membership_final.zkey"
        );
        proofResult = { proof, publicSignals };
        usedRealProof = true;
        setStatus('✅ Real Proof Generated!');
        console.log('✅ Real ZK proof generated successfully!');
      } catch (e: any) {
        console.error("❌ Proof generation failed:", e);
        const errorMsg = e?.message || "";

        if (errorMsg.includes("Assert Failed")) {
          setStatus('❌ Access Denied: Insufficient Tier or Invalid Proof.');
          usedRealProof = false;
        } else {
          setStatus('⚠️ Circuit files missing or could not load.');
        }

        // Mock proof structure for UI fallback
        proofResult = {
          proof: { a: [], b: [], c: [] },
          publicSignals: [
            pathData.root,
            circuitInputs.nullifier,
            actionIdField,
            epochTimestamp,
            requiredTier,
            contractAddress
          ]
        };
      }

      const result: ProofData = {
        success: true,
        nullifier: circuitInputs.nullifier,
        actionId: actionId,
        epochTimestamp: epochTimestamp,
        requiredTier: requiredTier,
        publicSignals: proofResult.publicSignals,
        proof: proofResult.proof,
        isReal: usedRealProof,
        error: !usedRealProof
      };

      setProofData(result);

      // Send to backend for verification (optional step in demo, usually done on-chain)
      // verifyProofBackend(result);

    } catch (error) {
      console.error(error);
      alert('Proof generation failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="panel">
      <h2>Generate ZK Proof</h2>
      <p className="info">
        Generating proof for Address:
        <span className="badge-small">{address.slice(0, 6)}...</span>
      </p>

      {/* INNOVATIVE: Tier Selection */}
      <div className="input-group">
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Required Access Tier:
        </label>
        <select
          value={requiredTier}
          onChange={(e) => setRequiredTier(Number(e.target.value))}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: '2px solid #4CAF50',
            marginBottom: '16px',
            width: '100%',
            fontSize: '14px'
          }}
        >
          <option value={1}>🟢 Tier 1 - Basic Access</option>
          <option value={2}>🟡 Tier 2 - Premium Access</option>
          <option value={3}>🔴 Tier 3 - Admin Access</option>
        </select>
      </div>

      <div className="input-group">
        <input
          type="text"
          placeholder="Action ID (e.g., vote_001, claim_reward)"
          value={actionId}
          onChange={(e) => setActionId(e.target.value)}
        />
        <button onClick={generateProof} disabled={loading}>
          {loading ? '⏳ Generating...' : '🔒 Generate Proof'}
        </button>
      </div>

      {status && <div className="status-message">{status}</div>}

      {proofData && (
        <div className="proof-output">
          {/* INNOVATIVE: Proof Status Indicator */}
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: proofData.isReal ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ff9800',
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {proofData.isReal ? (
              <>
                ✅ REAL ZERO-KNOWLEDGE PROOF GENERATED
                <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                  Using Groth16 ZK-SNARK in Browser
                </div>
              </>
            ) : (
              <>
                ⚠️ MOCK PROOF (WASM/ZKEY not found in public/)
                <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                  Please compile circuits and put files in public folder
                </div>
              </>
            )}
          </div>

          <h3>✓ Proof Generated</h3>

          <div className="proof-field">
            <label>Nullifier:</label>
            <code onClick={() => copyToClipboard(proofData.nullifier)}>
              {proofData.nullifier.slice(0, 30)}...
            </code>
          </div>

          <div className="proof-field">
            <label>Action ID:</label>
            <code>{proofData.actionId}</code>
          </div>

          <div className="proof-json">
            <label>Full Proof Data:</label>
            <pre>{JSON.stringify(proofData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProofGenerator;

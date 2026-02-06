import React, { useState } from 'react';
import apiService from '../services/api.service';

interface ProofGeneratorProps {
  userId: string;
  schemeId: string;
  schemeName: string;
}

const ProofGenerator: React.FC<ProofGeneratorProps> = ({ userId, schemeId, schemeName }) => {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [proofData, setProofData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerateProof = async () => {
    setLoading(true);
    setError('');
    setProofData(null);

    try {
      const response = await apiService.generateProof(userId, schemeId, secret);
      setProofData(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate proof');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!proofData) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await apiService.submitProof({
        ...proofData,
        schemeId,
      });
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit proof');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '16px'
    },
    schemeInfo: {
      color: '#6b7280',
      marginBottom: '16px'
    },
    inputGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box' as const
    },
    button: {
      width: '100%',
      padding: '10px',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px'
    },
    proofBox: {
      backgroundColor: '#dbeafe',
      padding: '16px',
      borderRadius: '6px',
      marginBottom: '16px'
    },
    codeBlock: {
      backgroundColor: 'white',
      padding: '8px',
      marginTop: '4px',
      borderRadius: '4px',
      fontSize: '10px',
      wordBreak: 'break-all' as const
    },
    warningBox: {
      backgroundColor: '#fef3c7',
      padding: '12px',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '16px'
    },
    successBox: {
      backgroundColor: '#d1fae5',
      padding: '16px',
      borderRadius: '6px'
    },
    errorBox: {
      marginTop: '16px',
      padding: '12px',
      backgroundColor: '#fee2e2',
      border: '1px solid #fca5a5',
      borderRadius: '6px'
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Generate Anonymous Proof</h3>
      <p style={styles.schemeInfo}>Scheme: <strong>{schemeName}</strong></p>

      {!proofData && !result && (
        <div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Enter Your Secret Passphrase</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              style={styles.input}
              placeholder="Secret you used during KYC"
            />
          </div>

          <button
            onClick={handleGenerateProof}
            disabled={loading || !secret}
            style={{
              ...styles.button,
              backgroundColor: loading || !secret ? '#9ca3af' : '#9333ea',
              color: 'white',
              cursor: loading || !secret ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Generating Proof...' : 'Generate ZK Proof'}
          </button>
        </div>
      )}

      {proofData && !result && (
        <div>
          <div style={styles.proofBox}>
            <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
              ✅ Proof Generated!
            </h4>
            <div style={{ fontSize: '12px' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Nullifier:</strong>
                <code style={styles.codeBlock}>{proofData.nullifier}</code>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Action ID:</strong>
                <code style={styles.codeBlock}>{proofData.actionId}</code>
              </div>
              <div>
                <strong>Merkle Root:</strong>
                <code style={styles.codeBlock}>{proofData.root}</code>
              </div>
            </div>
          </div>

          <div style={styles.warningBox}>
            <p style={{ color: '#92400e' }}>
              ⚠️ Your identity remains hidden. Only the proof of eligibility will be verified on-chain.
            </p>
          </div>

          <button
            onClick={handleSubmitProof}
            disabled={submitting}
            style={{
              ...styles.button,
              backgroundColor: submitting ? '#9ca3af' : '#059669',
              color: 'white',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Submitting to Blockchain...' : 'Submit Proof to Blockchain'}
          </button>
        </div>
      )}

      {result && (
        <div style={styles.successBox}>
          <h4 style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
            🎉 Access Granted Anonymously!
          </h4>
          <div style={{ fontSize: '14px' }}>
            <p><strong>Transaction Hash:</strong></p>
            <code style={{ ...styles.codeBlock, fontSize: '11px' }}>{result.txHash}</code>
            <p style={{ marginTop: '12px' }}><strong>Block Number:</strong> {result.blockNumber}</p>
            
              href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563eb', fontSize: '14px', marginTop: '8px', display: 'inline-block' }}
            >
              View on Etherscan →
            </a>
          </div>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <p style={{ color: '#991b1b', fontSize: '14px' }}>{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProofGenerator;
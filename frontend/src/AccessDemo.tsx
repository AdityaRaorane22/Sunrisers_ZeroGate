import React, { useState } from 'react';

/* ---------- Types ---------- */

interface AccessDemoProps {
  apiUrl: string;
  proofData: any | null;
}

type GateStatus = 'locked' | 'verifying' | 'unlocked';

interface Asset {
  id: string;
  name: string;
  tier: number;
  status: GateStatus;
}

/* ---------- Component ---------- */

const AccessDemo: React.FC<AccessDemoProps> = ({ apiUrl, proofData }) => {
  const [assets, setAssets] = useState<Asset[]>([
    { id: 'asset1', name: 'Asset 1 (Tier 1)', tier: 1, status: 'locked' },
    { id: 'asset2', name: 'Asset 2 (Tier 2)', tier: 2, status: 'locked' },
    { id: 'asset3', name: 'Asset 3 (Tier 3)', tier: 3, status: 'locked' },
  ]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const verifyAndUnlock = async (asset: Asset): Promise<void> => {
    if (!proofData) {
      alert('Please generate a ZK proof first!');
      return;
    }

    setVerifyingId(asset.id);
    setMessage(`Verifying access for ${asset.name}...`);

    try {
      // Functional Verification against Backend
      const res = await fetch(`${apiUrl}/verify-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: proofData.proof,
          publicSignals: proofData.publicSignals,
          requiredTier: asset.tier
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Success!
        setAssets(prev => prev.map(a =>
          a.id === asset.id ? { ...a, status: 'unlocked' } : a
        ));
        setMessage(`✅ Access Granted to ${asset.name}!`);

        // Relock after 30 seconds as requested
        setTimeout(() => {
          setAssets(prev => prev.map(a =>
            a.id === asset.id ? { ...a, status: 'locked' } : a
          ));
        }, 30000);
      } else {
        // Failure
        setMessage(`❌ Access Denied: ${result.error || 'Invalid proof'}`);
        alert(`Access Denied: ${result.error || 'Invalid proof for this tier'}`);
      }
    } catch (error) {
      console.error(error);
      setMessage('❌ Verification failed: Server Error');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="panel">
      <h2>Functional Access Verification</h2>
      <p className="info">
        Try to unlock assets using your ZK proof. The backend verifies your tier membership without knowing who you are.
      </p>

      {message && (
        <div className={`status-banner ${message.startsWith('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="assets-grid">
        {assets.map(asset => (
          <div key={asset.id} className={`asset-card tier-${asset.tier} ${asset.status}`}>
            <div className="asset-icon">
              {asset.status === 'locked' ? '🔒' : asset.status === 'verifying' ? '⏳' : '🔓'}
            </div>
            <h3>{asset.name}</h3>
            <p>Required: <span className="badge-small">Tier {asset.tier}</span></p>

            <button
              className="unlock-btn"
              onClick={() => verifyAndUnlock(asset)}
              disabled={verifyingId !== null || asset.status === 'unlocked'}
            >
              {verifyingId === asset.id ? 'Verifying...' : asset.status === 'unlocked' ? 'Unlocked' : 'Unlock Asset'}
            </button>
          </div>
        ))}
      </div>

      <div className="demo-info">
        <h4>How it works:</h4>
        <ol>
          <li>Your proof contains a <strong>Commitment</strong> to a specific tier.</li>
          <li>The backend verifies the Merkle Proof against the root.</li>
          <li>The backend checks if your proof's tier ≥ asset's required tier.</li>
          <li>Access is granted <strong>temporarily (30s)</strong> for security.</li>
        </ol>
      </div>
    </div>
  );
};

export default AccessDemo;

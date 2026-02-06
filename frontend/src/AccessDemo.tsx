import React, { useState } from 'react';

/* ---------- Types ---------- */

interface AccessDemoProps {
  apiUrl: string; // kept for future real API verification
}

type GateStatus = 'locked' | 'verifying' | 'unlocked';

/* ---------- Component ---------- */

const AccessDemo: React.FC<AccessDemoProps> = ({ apiUrl }) => {
  const [gateStatus, setGateStatus] = useState<GateStatus>('locked');
  const [verifying, setVerifying] = useState<boolean>(false);

  const simulateVerification = async (): Promise<void> => {
    setVerifying(true);
    setGateStatus('verifying');

    // Simulate verification delay
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));

    // Mock verification success
    setGateStatus('unlocked');
    setVerifying(false);

    setTimeout(() => {
      setGateStatus('locked');
    }, 5000);
  };

  return (
    <div className="panel">
      <h2>Access Verification Demo</h2>
      <p className="info">
        Simulate on-chain proof verification and access control
      </p>

      <div className="gate-visualization">
        <div className={`gate ${gateStatus}`}>
          {gateStatus === 'locked' && <div className="lock">🔒</div>}
          {gateStatus === 'verifying' && <div className="lock">⏳</div>}
          {gateStatus === 'unlocked' && <div className="lock">✅</div>}
        </div>

        <div className="gate-status">
          <h3>Status: {gateStatus.toUpperCase()}</h3>
          {gateStatus === 'locked' && <p>Access Denied</p>}
          {gateStatus === 'verifying' && <p>Verifying ZK Proof...</p>}
          {gateStatus === 'unlocked' && <p>Access Granted Anonymously!</p>}
        </div>
      </div>

      <button
        className="verify-btn"
        onClick={simulateVerification}
        disabled={verifying || gateStatus === 'unlocked'}
      >
        {verifying ? 'Verifying...' : 'Submit Proof & Verify'}
      </button>

      <div className="demo-info">
        <h4>Verification Flow:</h4>
        <ol>
          <li>User submits ZK proof + nullifier</li>
          <li>Smart contract verifies proof validity</li>
          <li>Checks epoch timestamp (15-min window)</li>
          <li>Validates nullifier not used</li>
          <li>Grants access without revealing identity</li>
        </ol>
      </div>

      <div className="privacy-guarantee">
        <h4>🛡️ Privacy Guarantees:</h4>
        <ul>
          <li>✓ Zero identity disclosure</li>
          <li>✓ No transaction linkability</li>
          <li>✓ Action-bound proofs</li>
          <li>✓ Time-limited validity</li>
        </ul>
      </div>
    </div>
  );
};

export default AccessDemo;

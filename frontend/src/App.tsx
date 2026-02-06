import React, { useState, useEffect } from 'react';
import ProofGenerator from './ProofGenerator';
import AccessDemo from './AccessDemo';
import { ethers } from 'ethers';
import { buildPoseidon } from 'circomlibjs';
import './App.css';

const API_URL = 'http://localhost:3001/api';

/* ---------- Types ---------- */

interface Stats {
  totalUsers: number;
  gasPerProof: number;
  provingTime: number;
}

interface RegisterResponse {
  success: boolean;
  commitment: string;
  index: number;
  root: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

/* ---------- Component ---------- */

const App: React.FC = () => {
  // Wallet State
  const [address, setAddress] = useState<string>('');
  const [identity, setIdentity] = useState<string>(''); // Secret 
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);

  // App State
  const [registered, setRegistered] = useState<boolean>(false);
  const [userData, setUserData] = useState<RegisterResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'register' | 'proof' | 'verify'>('register');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  useEffect(() => {
    fetchStats();
    checkWalletConnection();
  }, []);

  const fetchStats = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/stats`);
      const data: Stats = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Stats fetch failed:', error);
    }
  };

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAddress(accounts[0].address);
          setIsWalletConnected(true);
        }
      } catch (err) {
        console.error("Wallet check failed", err);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      setIsWalletConnected(true);
    } catch (err) {
      console.error("Connection failed", err);
    }
  };

  const deriveIdentity = async (): Promise<string | null> => {
    if (!window.ethereum) return null;

    try {
      setLoading(true);
      setLoadingMessage('✍️ Please sign the message to derive your secret identity...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // We sign a constant message to get a deterministic signature which becomes our secret
      const signature = await signer.signMessage("Sign this message to derive your ZeroGate Identity. This signature will be your secret key.");

      // Hash the signature to get a scalar field element (simplification for demo)
      // Actual implementation would need to clamp to field size
      const poseidon = await buildPoseidon();
      const F = poseidon.F;

      // Use BigInt from signature hash
      const signatureBigInt = BigInt(ethers.keccak256(signature));
      const identityScalar = signatureBigInt % BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

      const idString = identityScalar.toString();
      setIdentity(idString);
      return idString;

    } catch (err) {
      console.error("Identity derivation failed", err);
      return null;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (!isWalletConnected) {
      alert('Please connect wallet first');
      return;
    }

    let currentIdentity = identity;
    if (!currentIdentity) {
      const derived = await deriveIdentity();
      if (!derived) return;
      currentIdentity = derived;
    }

    setLoading(true);
    setLoadingMessage('🔐 Initializing Poseidon hash function...');

    try {
      const poseidon = await buildPoseidon();
      const F = poseidon.F;

      // Show progress messages
      setTimeout(() => setLoadingMessage('🌳 Generating trusted commitment...'), 800);

      // Generate Commitment on Client Side! (Identity + Tier)
      // Tier is hardcoded to 1 for this demo
      const tier = 1;
      const commitmentHash = poseidon([currentIdentity, tier]);
      const commitment = F.toString(commitmentHash);

      setTimeout(() => setLoadingMessage('📝 Submitting anonymously to Merkle tree...'), 1800);

      // Send ONLY the commitment to the backend. Identity stays in browser.
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitment,
          tier
        }),
      });

      const data: RegisterResponse = await res.json();

      if (data.success) {
        setLoadingMessage('✅ Registration complete!');
        setTimeout(() => {
          setUserData(data);
          setRegistered(true);
          setActiveTab('proof');
          fetchStats();
          setLoadingMessage('');
          setLoading(false);
        }, 500);
      }
    } catch (error) {
      setLoadingMessage('');
      setLoading(false);
      alert('Registration failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🔐 ZeroGate</h1>
        <p>Privacy-Preserving Access Control</p>
        <div className="wallet-connect">
          {isWalletConnected ? (
            <span className="badge">🟢 {address.slice(0, 6)}...{address.slice(-4)}</span>
          ) : (
            <button onClick={connectWallet} className="connect-btn">Connect Wallet</button>
          )}
        </div>
      </header>

      {stats && (
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Users</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.gasPerProof}</span>
            <span className="stat-label">Gas/Proof</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.provingTime}</span>
            <span className="stat-label">Proving Time</span>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={activeTab === 'register' ? 'active' : ''}
          onClick={() => setActiveTab('register')}
        >
          1. Register (Identity)
        </button>

        <button
          className={activeTab === 'proof' ? 'active' : ''}
          onClick={() => setActiveTab('proof')}
          disabled={!registered}
        >
          2. Generate Proof (ZK)
        </button>

        <button
          className={activeTab === 'verify' ? 'active' : ''}
          onClick={() => setActiveTab('verify')}
          disabled={!registered}
        >
          3. Verify Access
        </button>
      </div>

      <div className="content">
        {activeTab === 'register' && (
          <div className="panel">
            <h2>Register Identity</h2>
            <p className="info">
              Sign a message to generate your secret identity. only the public commitment is stored on-chain.
            </p>

            <div className="input-group center-col">
              {!isWalletConnected ? (
                <button onClick={connectWallet} className="primary-btn">Connect Wallet to Start</button>
              ) : (
                <>
                  <p className="status-text">Wallet Connected: {address}</p>
                  <button onClick={handleRegister} disabled={registered || loading} className="primary-btn">
                    {loading ? '⏳ Processing...' : registered ? '✓ Registered' : '📝 Sign & Register'}
                  </button>
                </>
              )}

            </div>

            {loadingMessage && (
              <div className="loading-box">
                {loadingMessage}
              </div>
            )}

            {userData && (
              <div className="result">
                <h3>Identity Secured</h3>
                <p className="secret-warning">⚠️ Your Identity Secret is derived from your wallet signature. Do not change wallets!</p>
                <p>
                  <strong>Public Commitment:</strong><br />
                  <code className="break-all">{userData.commitment}</code>
                </p>
                <p>
                  <strong>Tree Index:</strong> {userData.index}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'proof' && (
          <ProofGenerator
            identity={identity}
            apiUrl={API_URL}
            address={address} // Pass address for context, not for proof
          />
        )}

        {activeTab === 'verify' && (
          <AccessDemo apiUrl={API_URL} />
        )}
      </div>

      <footer className="footer">
        <p>Zero-Knowledge Proofs • Merkle Trees • Anonymous Verification</p>
      </footer>
    </div>
  );
};

export default App;

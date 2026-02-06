import React, { useState } from 'react';
import { KYCRegistration } from './components/KYCRegistration';
import { AdminDashboard } from './components/AdminDashboard';
import { UserStatus } from './components/UserStatus';
import { SchemeSelector } from './components/SchemeSelector';
import './App.css';

type View = 'home' | 'register' | 'admin' | 'status' | 'schemes';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [userId, setUserId] = useState('');
  const [userSecret, setUserSecret] = useState('');
  const [userTier, setUserTier] = useState(0);

  const handleProofGeneration = (id: string, secret: string, tier: number) => {
    setUserId(id);
    setUserSecret(secret);
    setUserTier(tier);
    setCurrentView('schemes');
  };

  const renderView = () => {
    switch (currentView) {
      case 'register':
        return <KYCRegistration />;
      case 'admin':
        return <AdminDashboard />;
      case 'status':
        return (
          <div className="status-container">
            <div className="user-id-input">
              <h3>Enter Your User ID</h3>
              <input
                type="text"
                placeholder="USER_xxxxx"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="input-field"
              />
              {userId && <UserStatus userId={userId} onProofGeneration={handleProofGeneration} />}
            </div>
          </div>
        );
      case 'schemes':
        return userId && userSecret && userTier > 0 ? (
          <SchemeSelector userId={userId} userSecret={userSecret} userTier={userTier} />
        ) : (
          <div className="error-view">
            <p>Please check your status first and enter your secret.</p>
            <button onClick={() => setCurrentView('status')}>Go to Status</button>
          </div>
        );
      default:
        return (
          <div className="home-view">
            <div className="hero-section">
              <h1 className="hero-title">🔐 ZeroGate KYC System</h1>
              <p className="hero-subtitle">Privacy-Preserving KYC Validation & Verification</p>

              <div className="workflow-diagram">
                <div className="workflow-step">
                  <div className="step-number">1</div>
                  <h3>User Registration</h3>
                  <p>Register with personal details and receive your commitment key</p>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">2</div>
                  <h3>Admin Verification</h3>
                  <p>DAO admin reviews and approves/rejects your application</p>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">3</div>
                  <h3>Proof Generation</h3>
                  <p>Generate ZK proofs for schemes without revealing details</p>
                </div>
              </div>

              <div className="action-cards">
                <div className="action-card user-card" onClick={() => setCurrentView('register')}>
                  <div className="card-icon">👤</div>
                  <h3>User Portal</h3>
                  <p>Register and get verified</p>
                  <button className="card-btn">Register Now</button>
                </div>

                <div className="action-card admin-card" onClick={() => setCurrentView('admin')}>
                  <div className="card-icon">👨‍💼</div>
                  <h3>Admin Portal</h3>
                  <p>Verify user applications</p>
                  <button className="card-btn">Admin Dashboard</button>
                </div>

                <div className="action-card status-card" onClick={() => setCurrentView('status')}>
                  <div className="card-icon">📊</div>
                  <h3>Check Status</h3>
                  <p>View verification status</p>
                  <button className="card-btn">View Status</button>
                </div>
              </div>

              <div className="features-section">
                <h2>Key Features</h2>
                <div className="features-grid">
                  <div className="feature">
                    <span className="feature-icon">🔒</span>
                    <h4>Privacy-Preserving</h4>
                    <p>Zero-knowledge proofs ensure complete anonymity</p>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🎯</span>
                    <h4>Tiered Access</h4>
                    <p>Multi-level verification for different schemes</p>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">⚡</span>
                    <h4>Fast Verification</h4>
                    <p>Instant proof generation and validation</p>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🌐</span>
                    <h4>Decentralized</h4>
                    <p>No central authority stores your data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo" onClick={() => setCurrentView('home')}>
            <span className="logo-icon">🔐</span>
            <span className="logo-text">ZeroGate KYC</span>
          </div>
          <nav className="nav-menu">
            <button
              className={currentView === 'home' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentView('home')}
            >
              Home
            </button>
            <button
              className={currentView === 'register' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentView('register')}
            >
              Register
            </button>
            <button
              className={currentView === 'admin' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentView('admin')}
            >
              Admin
            </button>
            <button
              className={currentView === 'status' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setCurrentView('status')}
            >
              Status
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {renderView()}
      </main>

      <footer className="app-footer">
        <p>Built with Zero-Knowledge Proofs • MongoDB • React • Express</p>
        <p>Privacy-Preserving KYC Validation System</p>
      </footer>
    </div>
  );
};

export default App;

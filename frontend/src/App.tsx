import React, { useState } from 'react';
import KYCForm from './components/KYCForm';
import SchemeApply from './components/SchemeApply';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState<'kyc' | 'apply' | 'dashboard'>('kyc');

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #eff6ff, #f3e8ff)'
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    headerInner: {
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '16px 24px'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#6b7280'
    },
    tabContainer: {
      display: 'flex',
      gap: '8px'
    },
    tab: {
      padding: '8px 16px',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    tabActive: {
      backgroundColor: '#2563eb',
      color: 'white'
    },
    tabInactive: {
      backgroundColor: '#e5e7eb',
      color: '#374151'
    },
    main: {
      padding: '32px 0'
    },
    footer: {
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      marginTop: '48px'
    },
    footerInner: {
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '16px 24px',
      textAlign: 'center' as const,
      fontSize: '14px',
      color: '#6b7280'
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerContent}>
            <div>
              <h1 style={styles.headerTitle}>ZeroGate KYC</h1>
              <p style={styles.headerSubtitle}>Privacy-Preserving Eligibility System</p>
            </div>
            
            <div style={styles.tabContainer}>
              <button
                onClick={() => setActiveTab('kyc')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'kyc' ? styles.tabActive : styles.tabInactive)
                }}
              >
                Submit KYC
              </button>
              <button
                onClick={() => setActiveTab('apply')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'apply' ? styles.tabActive : styles.tabInactive)
                }}
              >
                Apply for Schemes
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'dashboard' ? styles.tabActive : styles.tabInactive)
                }}
              >
                Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {activeTab === 'kyc' && <KYCForm />}
        {activeTab === 'apply' && <SchemeApply />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <p>Built with Zero-Knowledge Proofs for CyreneAI Hackathon</p>
          <p style={{ marginTop: '4px' }}>🔒 Your identity never leaves your device</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import apiService from '../services/api.service';
import type { Scheme } from '../services/api.service';
import ProofGenerator from './ProofGenerator';

const SchemeApply: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkKYCStatus = async () => {
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const status = await apiService.getKYCStatus(userId);
      setKycStatus(status);

      if (status.isVerified) {
        const allSchemes = await apiService.getAllSchemes();
        setSchemes(allSchemes.schemes);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch KYC status');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '24px',
      color: '#1f2937'
    },
    card: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box' as const,
      marginBottom: '16px'
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
    schemeCard: {
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start'
    },
    modal: {
      position: 'fixed' as const,
      inset: '0',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 50
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      maxWidth: '800px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto' as const
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Apply for Schemes</h2>

      {!kycStatus && (
        <div style={styles.card}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
              Enter Your User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={styles.input}
              placeholder="user123"
            />

            <button
              onClick={checkKYCStatus}
              disabled={loading || !userId}
              style={{
                ...styles.button,
                backgroundColor: loading || !userId ? '#9ca3af' : '#2563eb',
                color: 'white'
              }}
            >
              {loading ? 'Checking...' : 'Check Eligibility'}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px' }}>
              <p style={{ color: '#991b1b', fontSize: '14px' }}>{error}</p>
            </div>
          )}
        </div>
      )}

      {kycStatus && !kycStatus.isVerified && (
        <div style={{ backgroundColor: '#fef3c7', padding: '24px', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <h3 style={{ fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>⏳ KYC Pending Verification</h3>
          <p style={{ fontSize: '14px', color: '#374151' }}>
            Your KYC is submitted but not yet verified by admin. Please wait for verification.
          </p>
        </div>
      )}

      {kycStatus && kycStatus.isVerified && (
        <div>
          <div style={{ backgroundColor: '#d1fae5', padding: '16px', borderRadius: '8px', border: '1px solid #6ee7b7', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: '600', color: '#065f46' }}>✅ KYC Verified</h3>
            <p style={{ fontSize: '14px', color: '#374151', marginTop: '4px' }}>
              Verified on: {new Date(kycStatus.verifiedAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Your Eligible Schemes</h3>

            {kycStatus.eligibleSchemes.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No schemes available for your profile.</p>
            ) : (
              <div>
                {kycStatus.eligibleSchemes.map((scheme: any) => (
                  <div key={scheme._id} style={styles.schemeCard}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: '600', fontSize: '18px' }}>{scheme.name}</h4>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{scheme.description}</p>
                    </div>

                    <button
                      onClick={() => setSelectedScheme(scheme._id)}
                      style={{
                        marginLeft: '16px',
                        backgroundColor: '#9333ea',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Apply Anonymously
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedScheme && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Apply for Scheme</h3>
                <button
                  onClick={() => setSelectedScheme(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ✕
                </button>
              </div>

              <ProofGenerator
                userId={userId}
                schemeId={selectedScheme}
                schemeName={
                  kycStatus.eligibleSchemes.find((s: any) => s._id === selectedScheme)?.name || ''
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemeApply;
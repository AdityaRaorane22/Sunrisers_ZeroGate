import React, { useState, useEffect } from 'react';
import apiService from '../services/api.service';
import type { Scheme } from '../services/api.service';

const Dashboard: React.FC = () => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTree, setUpdatingTree] = useState<string | null>(null);

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    try {
      const response = await apiService.getAllSchemes();
      setSchemes(response.schemes);
    } catch (error) {
      console.error('Failed to load schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTree = async (schemeId: string) => {
    setUpdatingTree(schemeId);
    try {
      await apiService.updateSchemeTree(schemeId);
      alert('Merkle tree updated successfully!');
      loadSchemes();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update tree');
    } finally {
      setUpdatingTree(null);
    }
  };

  const styles = {
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280'
    },
    grid: {
      display: 'grid',
      gap: '24px'
    },
    card: {
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: '16px'
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1f2937'
    },
    cardDescription: {
      color: '#6b7280',
      marginTop: '4px'
    },
    statsContainer: {
      textAlign: 'right' as const
    },
    statItem: {
      fontSize: '14px',
      color: '#6b7280'
    },
    criteriaSection: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '16px'
    },
    criteriaTitle: {
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    criteriaGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      fontSize: '14px'
    },
    criteriaBox: {
      backgroundColor: '#f9fafb',
      padding: '12px',
      borderRadius: '6px'
    },
    criteriaLabel: {
      color: '#6b7280'
    },
    criteriaValue: {
      fontWeight: '600'
    },
    button: {
      marginTop: '16px',
      width: '100%',
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '10px',
      borderRadius: '6px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px'
    },
    buttonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px',
      color: '#6b7280'
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <p style={styles.subtitle}>Manage schemes and Merkle trees</p>
      </div>

      <div style={styles.grid}>
        {schemes.map((scheme) => (
          <div key={scheme._id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>{scheme.name}</h3>
                <p style={styles.cardDescription}>{scheme.description}</p>
              </div>

              <div style={styles.statsContainer}>
                <div style={styles.statItem}>
                  <p>Eligible Users: <strong style={{ color: '#059669' }}>{scheme.totalEligible}</strong></p>
                </div>
                <div style={styles.statItem}>
                  <p>Applications: <strong style={{ color: '#2563eb' }}>{scheme.totalApplied}</strong></p>
                </div>
              </div>
            </div>

            <div style={styles.criteriaSection}>
              <h4 style={styles.criteriaTitle}>Eligibility Criteria</h4>
              <div style={styles.criteriaGrid}>
                {scheme.criteria.minAge && (
                  <div style={styles.criteriaBox}>
                    <p style={styles.criteriaLabel}>Min Age</p>
                    <p style={styles.criteriaValue}>{scheme.criteria.minAge} years</p>
                  </div>
                )}
                {scheme.criteria.maxAge && (
                  <div style={styles.criteriaBox}>
                    <p style={styles.criteriaLabel}>Max Age</p>
                    <p style={styles.criteriaValue}>{scheme.criteria.maxAge} years</p>
                  </div>
                )}
                {scheme.criteria.nationality && (
                  <div style={styles.criteriaBox}>
                    <p style={styles.criteriaLabel}>Nationality</p>
                    <p style={styles.criteriaValue}>{scheme.criteria.nationality.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleUpdateTree(scheme._id)}
              disabled={updatingTree === scheme._id}
              style={{
                ...styles.button,
                ...(updatingTree === scheme._id ? styles.buttonDisabled : {})
              }}
            >
              {updatingTree === scheme._id ? 'Updating Merkle Tree...' : 'Update Merkle Tree on Blockchain'}
            </button>
          </div>
        ))}
      </div>

      {schemes.length === 0 && (
        <div style={styles.emptyState}>
          No schemes found. Create your first scheme!
        </div>
      )}
    </div>
  );
};

export default Dashboard;
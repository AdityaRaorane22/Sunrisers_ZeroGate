import React, { useState } from 'react';
import apiService from '../services/api.service';

const KYCForm: React.FC = () => {
  const [formData, setFormData] = useState({
    userId: '',
    fullName: '',
    dateOfBirth: '',
    nationality: 'INDIA',
    documentType: 'AADHAAR' as const,
    documentNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    secret: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiService.submitKYC(formData);
      setResult(response);
      localStorage.setItem(`secret_${formData.userId}`, formData.secret);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '24px',
      color: '#1f2937'
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px'
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
    select: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      boxSizing: 'border-box' as const
    },
    addressSection: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '16px'
    },
    addressGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    secretBox: {
      backgroundColor: '#fef3c7',
      padding: '16px',
      borderRadius: '6px'
    },
    secretInfo: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px'
    },
    button: {
      width: '100%',
      backgroundColor: '#2563eb',
      color: 'white',
      padding: '12px',
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
    successBox: {
      marginTop: '24px',
      padding: '16px',
      backgroundColor: '#d1fae5',
      border: '1px solid #6ee7b7',
      borderRadius: '6px'
    },
    errorBox: {
      marginTop: '24px',
      padding: '16px',
      backgroundColor: '#fee2e2',
      border: '1px solid #fca5a5',
      borderRadius: '6px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Submit KYC Details</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div>
          <label style={styles.label}>User ID *</label>
          <input
            type="text"
            name="userId"
            value={formData.userId}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="user123"
          />
        </div>

        <div>
          <label style={styles.label}>Full Name *</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Date of Birth *</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Nationality *</label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="INDIA">India</option>
            <option value="USA">USA</option>
            <option value="UK">UK</option>
            <option value="CANADA">Canada</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Document Type *</label>
          <select
            name="documentType"
            value={formData.documentType}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="AADHAAR">Aadhaar</option>
            <option value="PAN">PAN Card</option>
            <option value="PASSPORT">Passport</option>
            <option value="DRIVING_LICENSE">Driving License</option>
          </select>
        </div>

        <div>
          <label style={styles.label}>Document Number *</label>
          <input
            type="text"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.addressSection}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>Address</h3>
          <div style={styles.addressGrid}>
            <input
              type="text"
              name="address.street"
              placeholder="Street"
              value={formData.address.street}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              type="text"
              name="address.city"
              placeholder="City"
              value={formData.address.city}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              type="text"
              name="address.state"
              placeholder="State"
              value={formData.address.state}
              onChange={handleChange}
              style={styles.input}
            />
            <input
              type="text"
              name="address.pincode"
              placeholder="Pincode"
              value={formData.address.pincode}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.secretBox}>
          <label style={styles.label}>Secret Passphrase * (Keep this safe!)</label>
          <input
            type="password"
            name="secret"
            value={formData.secret}
            onChange={handleChange}
            required
            style={styles.input}
            placeholder="Enter a secret only you know"
          />
          <p style={styles.secretInfo}>
            This will be used to generate your anonymous commitment. Never share this!
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {})
          }}
        >
          {loading ? 'Submitting...' : 'Submit KYC'}
        </button>
      </form>

      {result && (
        <div style={styles.successBox}>
          <h3 style={{ fontWeight: '600', color: '#065f46', marginBottom: '8px' }}>
            ✅ KYC Submitted Successfully!
          </h3>
          <div style={{ fontSize: '14px', color: '#374151' }}>
            <p><strong>KYC ID:</strong> {result.kycId}</p>
            <p style={{ marginTop: '8px' }}>
              <strong>Commitment:</strong><br/>
              <code style={{ fontSize: '12px', backgroundColor: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '4px' }}>
                {result.commitment}
              </code>
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
              Your identity is now anonymized. Wait for admin verification to access schemes.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <p style={{ color: '#991b1b' }}>{error}</p>
        </div>
      )}
    </div>
  );
};

export default KYCForm;
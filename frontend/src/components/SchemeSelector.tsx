import React, { useState, useEffect } from 'react';
import './SchemeSelector.css';

const API_URL = 'http://localhost:3001';

interface Scheme {
    _id: string;
    schemeId: string;
    schemeName: string;
    description: string;
    requiredTier: number;
    isActive: boolean;
}

interface Props {
    userId: string;
    userSecret: string;
    userTier: number;
}

export const SchemeSelector: React.FC<Props> = ({ userId, userSecret, userTier }) => {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
    const [loading, setLoading] = useState(false);
    const [proofGenerated, setProofGenerated] = useState(false);
    const [proofData, setProofData] = useState<any>(null);

    useEffect(() => {
        fetchSchemes();
    }, [userId]);

    const fetchSchemes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/kyc/schemes?userId=${userId}`);
            const data = await response.json();
            if (data.success) {
                setSchemes(data.schemes);
            }
        } catch (error) {
            console.error('Error fetching schemes:', error);
        }
    };

    const generateProof = async () => {
        if (!selectedScheme) return;

        setLoading(true);
        try {
            // Get Merkle proof from backend
            const merkleResponse = await fetch(`${API_URL}/api/get-merkle-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    commitment: await getCommitment()
                }),
            });

            const merkleData = await merkleResponse.json();

            // In a real implementation, this would generate a ZK proof using snarkjs
            // For now, we'll create a mock proof structure
            const mockProof = {
                pi_a: ['0x' + Math.random().toString(16).slice(2), '0x' + Math.random().toString(16).slice(2)],
                pi_b: [['0x1', '0x2'], ['0x3', '0x4']],
                pi_c: ['0x' + Math.random().toString(16).slice(2), '0x' + Math.random().toString(16).slice(2)],
            };

            const publicSignals = {
                root: merkleData.root,
                nullifier: '0x' + Math.random().toString(16).slice(2),
                requiredTier: selectedScheme.requiredTier,
                schemeId: selectedScheme.schemeId
            };

            // Save proof to backend
            const saveResponse = await fetch(`${API_URL}/api/kyc/save-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    schemeId: selectedScheme.schemeId,
                    proof: mockProof,
                    publicSignals,
                    nullifier: publicSignals.nullifier
                }),
            });

            const saveData = await saveResponse.json();

            if (saveData.success) {
                setProofData({ proof: mockProof, publicSignals, proofId: saveData.proofId });
                setProofGenerated(true);
            } else {
                alert('Error saving proof: ' + saveData.error);
            }

        } catch (error) {
            console.error('Error generating proof:', error);
            alert('Error generating proof');
        } finally {
            setLoading(false);
        }
    };

    const getCommitment = async () => {
        // This should match the commitment generation in the backend
        // For now, we'll fetch it from the user status
        const response = await fetch(`${API_URL}/api/kyc/user/${userId}`);
        const data = await response.json();
        return data.user.commitment;
    };

    const validateProof = async () => {
        if (!proofData) return;

        try {
            const response = await fetch(`${API_URL}/api/kyc/validate-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nullifier: proofData.publicSignals.nullifier,
                    schemeId: selectedScheme?.schemeId
                }),
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Access Granted! Proof validated successfully.');
            } else {
                alert('❌ Access Denied: ' + data.error);
            }
        } catch (error) {
            console.error('Error validating proof:', error);
            alert('Error validating proof');
        }
    };

    if (proofGenerated && proofData) {
        return (
            <div className="scheme-selector">
                <div className="proof-success">
                    <h2>✅ Proof Generated Successfully!</h2>
                    <p className="success-message">
                        You have generated a zero-knowledge proof for <strong>{selectedScheme?.schemeName}</strong>
                    </p>

                    <div className="proof-details">
                        <h3>Proof Details</h3>
                        <div className="proof-item">
                            <label>Proof ID:</label>
                            <code>{proofData.proofId}</code>
                        </div>
                        <div className="proof-item">
                            <label>Nullifier:</label>
                            <code>{proofData.publicSignals.nullifier}</code>
                        </div>
                        <div className="proof-item">
                            <label>Scheme:</label>
                            <code>{selectedScheme?.schemeName}</code>
                        </div>
                    </div>

                    <div className="proof-info">
                        <h4>🔐 Privacy Preserved</h4>
                        <p>Your personal details remain private. The proof only reveals:</p>
                        <ul>
                            <li>✅ You are a verified user</li>
                            <li>✅ You have the required tier ({selectedScheme?.requiredTier})</li>
                            <li>❌ No personal information disclosed</li>
                        </ul>
                    </div>

                    <div className="action-buttons">
                        <button className="btn-validate" onClick={validateProof}>
                            Validate Proof & Access Scheme
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setProofGenerated(false);
                                setProofData(null);
                                setSelectedScheme(null);
                            }}
                        >
                            Generate Another Proof
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="scheme-selector">
            <h2>🎯 Select a Scheme</h2>
            <p className="subtitle">Generate a zero-knowledge proof for scheme access</p>

            {userTier === 0 && (
                <div className="warning-box">
                    <p>⚠️ You are not verified yet. Please wait for admin approval.</p>
                </div>
            )}

            <div className="schemes-grid">
                {schemes.map((scheme) => (
                    <div
                        key={scheme._id}
                        className={`scheme-card ${selectedScheme?._id === scheme._id ? 'selected' : ''} ${scheme.requiredTier > userTier ? 'disabled' : ''}`}
                        onClick={() => scheme.requiredTier <= userTier && setSelectedScheme(scheme)}
                    >
                        <div className="scheme-header">
                            <h3>{scheme.schemeName}</h3>
                            <span className={`tier-badge tier-${scheme.requiredTier}`}>
                                Tier {scheme.requiredTier}
                            </span>
                        </div>
                        <p className="scheme-description">{scheme.description}</p>
                        {scheme.requiredTier > userTier && (
                            <div className="locked-overlay">
                                <span>🔒 Requires Tier {scheme.requiredTier}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedScheme && (
                <div className="selected-scheme-actions">
                    <h3>Selected: {selectedScheme.schemeName}</h3>
                    <button
                        className="btn-generate"
                        onClick={generateProof}
                        disabled={loading}
                    >
                        {loading ? 'Generating Proof...' : 'Generate ZK Proof'}
                    </button>
                </div>
            )}
        </div>
    );
};

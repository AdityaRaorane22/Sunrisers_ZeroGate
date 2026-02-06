import React, { useState, useEffect } from 'react';
import { generateZKProof, generateNullifier } from '../utils/zkProof';
import './SchemeSelector.css';

const API_URL = 'http://localhost:3001';

interface Scheme {
    _id: string;
    schemeId: string;
    schemeName: string;
    description: string;
    requiredTier: number;
    eligibilityCriteria: {
        description: string;
    };
}

interface SchemeSelectorProps {
    userId: string;
    userSecret: string;
    userTier: number;
}

export const SchemeSelector: React.FC<SchemeSelectorProps> = ({ userId, userSecret, userTier }) => {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(false);
    const [accessGranted, setAccessGranted] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(60);
    const [proofGenerating, setProofGenerating] = useState(false);

    useEffect(() => {
        fetchSchemes();
    }, [userId]);

    useEffect(() => {
        let timer: number;
        if (accessGranted && countdown > 0) {
            timer = window.setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setAccessGranted(null);
                        return 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => window.clearInterval(timer);
    }, [accessGranted, countdown]);

    const fetchSchemes = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/kyc/schemes?userId=${userId}`);
            const data = await response.json();
            if (data.success) {
                setSchemes(data.schemes);
            }
        } catch (error) {
            console.error('Error fetching schemes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyToScheme = async (scheme: Scheme) => {
        setProofGenerating(true);
        setLoading(true);

        try {
            console.log('🚀 Starting ZK proof generation...');

            // Step 1: Get Merkle proof from backend
            console.log('📡 Fetching Merkle proof from backend...');
            const merkleResponse = await fetch(`${API_URL}/api/get-merkle-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identity: userSecret,
                    tier: userTier
                }),
            });

            const merkleData = await merkleResponse.json();
            if (!merkleData.success) {
                throw new Error('Failed to get Merkle proof: ' + merkleData.error);
            }

            console.log('✅ Merkle proof received:', merkleData);

            // Step 2: Generate ZK proof using snarkjs
            console.log('🔐 Generating ZK proof with snarkjs...');
            const zkProof = await generateZKProof({
                identity: userSecret,
                tier: userTier,
                schemeId: scheme.schemeId,
                pathElements: merkleData.pathElements,
                pathIndices: merkleData.pathIndices,
                root: merkleData.root
            });

            console.log('✅ ZK Proof generated!', zkProof);

            // Step 3: Generate nullifier
            const nullifier = await generateNullifier(userSecret, scheme.schemeId);
            console.log('🔑 Nullifier generated:', nullifier);

            // Step 4: Save proof to backend
            console.log('💾 Saving proof to backend...');
            const saveResponse = await fetch(`${API_URL}/api/kyc/save-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    schemeId: scheme.schemeId,
                    proof: zkProof.proof,
                    publicSignals: zkProof.publicSignals,
                    nullifier
                }),
            });

            const saveData = await saveResponse.json();
            if (!saveData.success) {
                throw new Error('Failed to save proof: ' + saveData.error);
            }

            console.log('✅ Proof saved successfully');

            // Step 5: Validate proof for access
            console.log('🔓 Validating proof for access...');
            const validateResponse = await fetch(`${API_URL}/api/kyc/validate-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nullifier,
                    schemeId: scheme.schemeId
                }),
            });

            const validateData = await validateResponse.json();
            if (validateData.success) {
                console.log('🎉 Access granted!');
                setAccessGranted(scheme.schemeName);
                setCountdown(60);
            } else {
                alert('Proof validation failed: ' + validateData.error);
            }
        } catch (error) {
            console.error('❌ Error in proof generation flow:', error);
            alert('Error: ' + (error as Error).message);
        } finally {
            setProofGenerating(false);
            setLoading(false);
        }
    };

    if (accessGranted) {
        return (
            <div className="access-granted-view">
                <div className="access-card">
                    <div className="access-icon">🎉</div>
                    <h2>Access Granted!</h2>
                    <p className="scheme-name">{accessGranted}</p>
                    <div className="countdown-display">
                        <div className="countdown-circle">
                            <span className="countdown-number">{countdown}</span>
                            <span className="countdown-label">seconds</span>
                        </div>
                    </div>
                    <p className="access-message">
                        You have temporary access to this scheme.
                        <br />
                        Access will expire in {countdown} seconds.
                    </p>
                    <div className="access-animation">
                        <div className="pulse-ring"></div>
                        <div className="pulse-ring delay-1"></div>
                        <div className="pulse-ring delay-2"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="scheme-selector">
            <div className="selector-header">
                <h2>📋 Available Schemes</h2>
                <p>Select a scheme to generate ZK proof and gain access</p>
                {proofGenerating && (
                    <div className="proof-status">
                        <div className="spinner"></div>
                        <p>Generating zero-knowledge proof with snarkjs...</p>
                    </div>
                )}
            </div>

            {loading && !proofGenerating ? (
                <div className="loading">Loading schemes...</div>
            ) : schemes.length === 0 ? (
                <div className="no-schemes">
                    <p>❌ No schemes available for your account</p>
                    <p className="hint">Contact admin for scheme approval</p>
                </div>
            ) : (
                <div className="schemes-grid">
                    {schemes.map((scheme) => (
                        <div key={scheme._id} className="scheme-card">
                            <div className="scheme-header">
                                <h3>{scheme.schemeName}</h3>
                                <span className={`tier-badge tier-${scheme.requiredTier}`}>
                                    Tier {scheme.requiredTier}
                                </span>
                            </div>
                            <p className="scheme-description">{scheme.description}</p>
                            <p className="eligibility-info">
                                ✅ {scheme.eligibilityCriteria.description}
                            </p>
                            <button
                                className="btn-apply"
                                onClick={() => handleApplyToScheme(scheme)}
                                disabled={loading || proofGenerating}
                            >
                                {proofGenerating ? '⏳ Generating Proof...' : 'Apply to Scheme'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

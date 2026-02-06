import React, { useState, useEffect } from 'react';
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
        setLoading(true);
        try {
            // Generate mock proof (in production, use real ZK proof generation)
            const mockProof = {
                pi_a: ["123", "456", "1"],
                pi_b: [["789", "012"], ["345", "678"], ["1", "0"]],
                pi_c: ["901", "234", "1"],
                protocol: "groth16",
                curve: "bn128"
            };

            const mockPublicSignals = {
                commitment: "mock_commitment",
                schemeId: scheme.schemeId
            };

            const nullifier = `NULLIFIER_${userId}_${scheme.schemeId}_${Date.now()}`;

            // Save proof to backend
            const saveResponse = await fetch(`${API_URL}/api/kyc/save-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    schemeId: scheme.schemeId,
                    proof: mockProof,
                    publicSignals: mockPublicSignals,
                    nullifier
                }),
            });

            const saveData = await saveResponse.json();
            if (saveData.success) {
                // Validate proof for access
                const validateResponse = await fetch(`${API_URL}/api/kyc/validate-proof`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nullifier,
                        schemeId: scheme.schemeId
                    }),
                });

                const validateData = await validateResponse.json();
                if (validateData.success) {
                    setAccessGranted(scheme.schemeName);
                    setCountdown(60);
                } else {
                    alert('Proof validation failed: ' + validateData.error);
                }
            } else {
                alert('Error saving proof: ' + saveData.error);
            }
        } catch (error) {
            console.error('Error applying to scheme:', error);
            alert('Error applying to scheme');
        } finally {
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
                <p>Select a scheme to generate proof and gain access</p>
            </div>

            {loading ? (
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
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Apply to Scheme'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

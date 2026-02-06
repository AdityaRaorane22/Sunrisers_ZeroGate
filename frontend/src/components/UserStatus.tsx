import React, { useState, useEffect } from 'react';
import './UserStatus.css';

const API_URL = 'http://localhost:3001';

interface Props {
    userId: string;
    onProofGeneration: (userId: string, secret: string, tier: number) => void;
}

interface UserData {
    userId: string;
    fullName: string;
    email: string;
    commitment: string;
    verificationStatus: string;
    approvedSchemes?: string[];
    tier: number;
    verifiedAt?: string;
    rejectionReason?: string;
    createdAt: string;
}

export const UserStatus: React.FC<Props> = ({ userId, onProofGeneration }) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [secret, setSecret] = useState('');

    useEffect(() => {
        fetchUserStatus();
    }, [userId]);

    const fetchUserStatus = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/kyc/user/${userId}`);
            const data = await response.json();
            if (data.success) {
                setUserData(data.user);
            }
        } catch (error) {
            console.error('Error fetching user status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProceedToSchemes = () => {
        if (userData && secret) {
            onProofGeneration(userData.userId, secret, userData.tier);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#48bb78';
            case 'pending': return '#f39c12';
            case 'rejected': return '#e53e3e';
            default: return '#718096';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return '✅';
            case 'pending': return '⏳';
            case 'rejected': return '❌';
            default: return '❓';
        }
    };

    if (loading) {
        return <div className="user-status loading">Loading user status...</div>;
    }

    if (!userData) {
        return <div className="user-status error">User not found</div>;
    }

    return (
        <div className="user-status">
            <div className="status-card">
                <h2>👤 User Status Dashboard</h2>

                <div className="status-header" style={{ borderColor: getStatusColor(userData.verificationStatus) }}>
                    <div className="status-badge" style={{ background: getStatusColor(userData.verificationStatus) }}>
                        {getStatusIcon(userData.verificationStatus)} {userData.verificationStatus.toUpperCase()}
                    </div>
                    {userData.tier > 0 && (
                        <div className="tier-display">
                            Tier {userData.tier}
                        </div>
                    )}
                </div>

                <div className="user-info">
                    <div className="info-item">
                        <label>Full Name:</label>
                        <span>{userData.fullName}</span>
                    </div>
                    <div className="info-item">
                        <label>Email:</label>
                        <span>{userData.email}</span>
                    </div>
                    <div className="info-item">
                        <label>User ID:</label>
                        <code>{userData.userId}</code>
                    </div>
                    <div className="info-item full-width">
                        <label>Commitment Key:</label>
                        <code className="commitment">{userData.commitment}</code>
                    </div>
                    <div className="info-item">
                        <label>Registered:</label>
                        <span>{new Date(userData.createdAt).toLocaleDateString()}</span>
                    </div>
                    {userData.verifiedAt && (
                        <div className="info-item">
                            <label>Verified:</label>
                            <span>{new Date(userData.verifiedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {userData.verificationStatus === 'pending' && (
                    <div className="status-message pending">
                        <h3>⏳ Verification Pending</h3>
                        <p>Your application is being reviewed by an admin. You will be notified once verified.</p>
                    </div>
                )}

                {userData.verificationStatus === 'rejected' && (
                    <div className="status-message rejected">
                        <h3>❌ Application Rejected</h3>
                        <p><strong>Reason:</strong> {userData.rejectionReason || 'Not specified'}</p>
                        <p>Please contact support or resubmit your application.</p>
                    </div>
                )}

                {userData.verificationStatus === 'approved' && (
                    <div className="status-card approved">
                        <div className="status-icon">✅</div>
                        <h3>Verification Approved!</h3>
                        <div className="user-info">
                            <p><strong>Name:</strong> {userData.fullName}</p>
                            <p><strong>Email:</strong> {userData.email}</p>
                            <p><strong>Verified:</strong> {new Date(userData.verifiedAt!).toLocaleDateString()}</p>
                            <p><strong>Tier:</strong> <span className={`tier-badge tier-${userData.tier}`}>Tier {userData.tier}</span></p>
                        </div>

                        <div className="approved-schemes-section">
                            <h4>📋 Approved Schemes ({userData.approvedSchemes?.length || 0})</h4>
                            {userData.approvedSchemes && userData.approvedSchemes.length > 0 ? (
                                <div className="schemes-list">
                                    {userData.approvedSchemes.map((schemeId: string) => (
                                        <div key={schemeId} className="scheme-badge">
                                            {schemeId}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-schemes">No schemes approved yet</p>
                            )}
                        </div>

                        <div className="secret-input-section">
                            <h4>🔑 Enter Your Secret to Access Schemes</h4>
                            <p className="hint">Enter the secret you saved during registration</p>
                            <input
                                type="password"
                                placeholder="Enter your secret key..."
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className="secret-input"
                            />
                            <button
                                onClick={handleProceedToSchemes}
                                disabled={!secret}
                                className="btn-proceed"
                            >
                                Go to Scheme Selection
                            </button>
                        </div>
                    </div>
                )}

                <button className="btn-refresh" onClick={fetchUserStatus}>
                    🔄 Refresh Status
                </button>
            </div>
        </div>
    );
};

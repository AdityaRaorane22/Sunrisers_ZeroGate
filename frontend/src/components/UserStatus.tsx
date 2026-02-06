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
    tier: number;
    verifiedAt: string | null;
    rejectionReason: string | null;
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
                    <div className="status-message approved">
                        <h3>✅ Verified Successfully!</h3>
                        <p>You have been approved with <strong>Tier {userData.tier}</strong> access.</p>
                        <p>You can now generate zero-knowledge proofs for eligible schemes.</p>

                        <div className="proof-generation-section">
                            <h4>Generate Proof</h4>
                            <p>Enter your secret to generate proofs:</p>
                            <input
                                type="password"
                                placeholder="Enter your secret..."
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                className="secret-input"
                            />
                            <button
                                className="btn-generate-proof"
                                onClick={() => onProofGeneration(userData.userId, secret, userData.tier)}
                                disabled={!secret}
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

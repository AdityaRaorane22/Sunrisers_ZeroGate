import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const API_URL = 'http://localhost:3001';

interface User {
    _id: string;
    userId: string;
    personalDetails: {
        fullName: string;
        email: string;
        phone: string;
        dateOfBirth: string;
        address: string;
        nationality: string;
        idType: string;
        idNumber: string;
    };
    commitment: string;
    verificationStatus: string;
    tier: number;
    createdAt: string;
}

interface Scheme {
    _id: string;
    schemeId: string;
    schemeName: string;
    description: string;
    eligibilityCriteria: {
        minAge?: number;
        maxAge?: number;
        nationality?: string;
        idType?: string;
        description: string;
    };
}

export const AdminDashboard: React.FC = () => {
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedSchemes, setSelectedSchemes] = useState<string[]>([]);
    const [rejectionReason, setRejectionReason] = useState('');

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/kyc/pending`);
            const data = await response.json();
            if (data.success) {
                setPendingUsers(data.users);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchemes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/kyc/schemes`);
            const data = await response.json();
            if (data.success) {
                setSchemes(data.schemes);
            }
        } catch (error) {
            console.error('Error fetching schemes:', error);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
        fetchSchemes();
    }, []);

    const handleSchemeToggle = (schemeId: string) => {
        setSelectedSchemes(prev =>
            prev.includes(schemeId)
                ? prev.filter(id => id !== schemeId)
                : [...prev, schemeId]
        );
    };

    const checkUserEligibility = (user: User, scheme: Scheme): boolean => {
        const criteria = scheme.eligibilityCriteria;
        const age = Math.floor((new Date().getTime() - new Date(user.personalDetails.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

        if (criteria.minAge && age < criteria.minAge) return false;
        if (criteria.maxAge && age > criteria.maxAge) return false;
        if (criteria.nationality && user.personalDetails.nationality !== criteria.nationality) return false;
        if (criteria.idType && user.personalDetails.idType !== criteria.idType) return false;

        return true;
    };

    const handleVerify = async (action: 'approve' | 'reject') => {
        if (!selectedUser) return;

        if (action === 'approve' && selectedSchemes.length === 0) {
            alert('Please select at least one scheme to approve');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/kyc/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUser.userId,
                    action,
                    selectedSchemes: action === 'approve' ? selectedSchemes : undefined,
                    rejectionReason: action === 'reject' ? rejectionReason : undefined,
                    adminId: 'ADMIN_001'
                }),
            });

            const data = await response.json();
            if (data.success) {
                if (data.ineligibleSchemes && data.ineligibleSchemes.length > 0) {
                    alert(`User approved for ${data.approvedSchemes.length} scheme(s).\n\nIneligible for:\n${data.ineligibleSchemes.map((s: any) => `- ${s.schemeName}: ${s.reason}`).join('\n')}`);
                } else {
                    alert(`User ${action}ed successfully!`);
                }
                setSelectedUser(null);
                setSelectedSchemes([]);
                setRejectionReason('');
                fetchPendingUsers();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error verifying user:', error);
            alert('Error verifying user');
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h2>👨‍💼 Admin Verification Dashboard</h2>
                <button onClick={fetchPendingUsers} className="btn-refresh">
                    🔄 Refresh
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading pending verifications...</div>
            ) : pendingUsers.length === 0 ? (
                <div className="no-pending">
                    <p>✅ No pending verifications</p>
                </div>
            ) : (
                <div className="pending-list">
                    <h3>Pending Verifications ({pendingUsers.length})</h3>
                    <div className="users-grid">
                        {pendingUsers.map((user) => (
                            <div key={user._id} className="user-card">
                                <div className="user-header">
                                    <h4>{user.personalDetails.fullName}</h4>
                                    <span className="status-badge pending">Pending</span>
                                </div>
                                <div className="user-details">
                                    <p><strong>Email:</strong> {user.personalDetails.email}</p>
                                    <p><strong>Phone:</strong> {user.personalDetails.phone}</p>
                                    <p><strong>Age:</strong> {Math.floor((new Date().getTime() - new Date(user.personalDetails.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years</p>
                                    <p><strong>Nationality:</strong> {user.personalDetails.nationality}</p>
                                    <p><strong>ID Type:</strong> {user.personalDetails.idType}</p>
                                    <p><strong>Registered:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button
                                    className="btn-review"
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setSelectedSchemes([]);
                                    }}
                                >
                                    Review & Assign Schemes
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content scheme-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Assign Schemes to {selectedUser.personalDetails.fullName}</h3>
                            <button className="btn-close" onClick={() => setSelectedUser(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="user-summary">
                                <p><strong>Age:</strong> {Math.floor((new Date().getTime() - new Date(selectedUser.personalDetails.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years</p>
                                <p><strong>Nationality:</strong> {selectedUser.personalDetails.nationality}</p>
                                <p><strong>ID Type:</strong> {selectedUser.personalDetails.idType}</p>
                            </div>

                            <div className="schemes-section">
                                <h4>Select Schemes (Check eligibility criteria)</h4>
                                <div className="schemes-list">
                                    {schemes.map((scheme) => {
                                        const isEligible = checkUserEligibility(selectedUser, scheme);
                                        return (
                                            <div key={scheme._id} className={`scheme-checkbox-item ${!isEligible ? 'ineligible' : ''}`}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSchemes.includes(scheme.schemeId)}
                                                        onChange={() => handleSchemeToggle(scheme.schemeId)}
                                                    />
                                                    <div className="scheme-info">
                                                        <strong>{scheme.schemeName}</strong>
                                                        <p className="scheme-desc">{scheme.description}</p>
                                                        <p className="eligibility-criteria">
                                                            {isEligible ? '✅' : '❌'} {scheme.eligibilityCriteria.description}
                                                        </p>
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="action-section">
                                <div className="approve-section">
                                    <h4>✅ Approve with Selected Schemes</h4>
                                    <p className="selected-count">
                                        {selectedSchemes.length} scheme(s) selected
                                    </p>
                                    <button
                                        className="btn-approve"
                                        onClick={() => handleVerify('approve')}
                                        disabled={selectedSchemes.length === 0}
                                    >
                                        Approve User
                                    </button>
                                </div>

                                <div className="reject-section">
                                    <h4>❌ Reject Application</h4>
                                    <textarea
                                        placeholder="Reason for rejection..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                    />
                                    <button
                                        className="btn-reject"
                                        onClick={() => handleVerify('reject')}
                                        disabled={!rejectionReason}
                                    >
                                        Reject Application
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

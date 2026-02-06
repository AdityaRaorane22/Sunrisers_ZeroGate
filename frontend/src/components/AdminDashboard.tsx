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

export const AdminDashboard: React.FC = () => {
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [tier, setTier] = useState(1);
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

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleVerify = async (action: 'approve' | 'reject') => {
        if (!selectedUser) return;

        try {
            const response = await fetch(`${API_URL}/api/kyc/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUser.userId,
                    action,
                    tier: action === 'approve' ? tier : undefined,
                    rejectionReason: action === 'reject' ? rejectionReason : undefined,
                    adminId: 'ADMIN_001'
                }),
            });

            const data = await response.json();
            if (data.success) {
                alert(`User ${action}ed successfully!`);
                setSelectedUser(null);
                setRejectionReason('');
                fetchPendingUsers();
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
                                    <p><strong>Nationality:</strong> {user.personalDetails.nationality}</p>
                                    <p><strong>ID Type:</strong> {user.personalDetails.idType}</p>
                                    <p><strong>Registered:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button
                                    className="btn-review"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    Review Details
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Review Application</h3>
                            <button className="btn-close" onClick={() => setSelectedUser(null)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>Personal Information</h4>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Full Name:</label>
                                        <span>{selectedUser.personalDetails.fullName}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Email:</label>
                                        <span>{selectedUser.personalDetails.email}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Phone:</label>
                                        <span>{selectedUser.personalDetails.phone}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Date of Birth:</label>
                                        <span>{new Date(selectedUser.personalDetails.dateOfBirth).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-item full-width">
                                        <label>Address:</label>
                                        <span>{selectedUser.personalDetails.address}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Nationality:</label>
                                        <span>{selectedUser.personalDetails.nationality}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>ID Type:</label>
                                        <span>{selectedUser.personalDetails.idType}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>ID Number:</label>
                                        <span>{selectedUser.personalDetails.idNumber}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>User ID:</label>
                                        <span className="mono">{selectedUser.userId}</span>
                                    </div>
                                    <div className="detail-item full-width">
                                        <label>Commitment:</label>
                                        <span className="mono small">{selectedUser.commitment}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="action-section">
                                <div className="approve-section">
                                    <h4>✅ Approve</h4>
                                    <div className="tier-selector">
                                        <label>Assign Tier:</label>
                                        <select value={tier} onChange={(e) => setTier(Number(e.target.value))}>
                                            <option value={1}>Tier 1 - Basic</option>
                                            <option value={2}>Tier 2 - Standard</option>
                                            <option value={3}>Tier 3 - Premium</option>
                                        </select>
                                    </div>
                                    <button
                                        className="btn-approve"
                                        onClick={() => handleVerify('approve')}
                                    >
                                        Approve with Tier {tier}
                                    </button>
                                </div>

                                <div className="reject-section">
                                    <h4>❌ Reject</h4>
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

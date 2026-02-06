import React, { useState } from 'react';
import './KYCRegistration.css';

const API_URL = 'http://localhost:3001';

interface PersonalDetails {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    nationality: string;
    idType: string;
    idNumber: string;
}

interface RegistrationResponse {
    success: boolean;
    userId: string;
    commitment: string;
    secret: string;
    verificationStatus: string;
    message: string;
}

export const KYCRegistration: React.FC = () => {
    const [formData, setFormData] = useState<PersonalDetails>({
        fullName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        nationality: '',
        idType: 'passport',
        idNumber: ''
    });

    const [registrationResult, setRegistrationResult] = useState<RegistrationResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/kyc/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ personalDetails: formData }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setRegistrationResult(data);
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (registrationResult) {
        return (
            <div className="kyc-registration">
                <div className="success-card">
                    <h2>✅ Registration Successful!</h2>
                    <p className="success-message">{registrationResult.message}</p>

                    <div className="result-section">
                        <h3>Your Credentials</h3>
                        <div className="credential-item">
                            <label>User ID:</label>
                            <code>{registrationResult.userId}</code>
                        </div>
                        <div className="credential-item">
                            <label>Commitment Key:</label>
                            <code className="commitment">{registrationResult.commitment}</code>
                        </div>
                        <div className="credential-item important">
                            <label>🔐 Secret (SAVE THIS!):</label>
                            <code className="secret">{registrationResult.secret}</code>
                        </div>
                    </div>

                    <div className="warning-box">
                        <h4>⚠️ Important</h4>
                        <ul>
                            <li>Save your <strong>User ID</strong> and <strong>Secret</strong> securely</li>
                            <li>You will need these to generate proofs later</li>
                            <li>Your application is now <strong>pending verification</strong></li>
                            <li>An admin will review your details and approve/reject</li>
                        </ul>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() => {
                            setRegistrationResult(null);
                            setFormData({
                                fullName: '',
                                email: '',
                                phone: '',
                                dateOfBirth: '',
                                address: '',
                                nationality: '',
                                idType: 'passport',
                                idNumber: ''
                            });
                        }}
                    >
                        Register Another User
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="kyc-registration">
            <div className="registration-card">
                <h2>🔐 KYC Registration</h2>
                <p className="subtitle">Register with your personal details to get verified</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name *</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone *</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth *</label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="nationality">Nationality *</label>
                            <input
                                type="text"
                                id="nationality"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address *</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="idType">ID Type *</label>
                            <select
                                id="idType"
                                name="idType"
                                value={formData.idType}
                                onChange={handleChange}
                                required
                            >
                                <option value="passport">Passport</option>
                                <option value="driverLicense">Driver's License</option>
                                <option value="nationalId">National ID</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="idNumber">ID Number *</label>
                            <input
                                type="text"
                                id="idNumber"
                                name="idNumber"
                                value={formData.idNumber}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            </div>
        </div>
    );
};

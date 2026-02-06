import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface KYCSubmission {
    userId: string;
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    documentType: 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE';
    documentNumber: string;
    address: {
        street: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    };
    secret: string;
}

export interface Scheme {
    _id: string;
    name: string;
    description: string;
    criteria: {
        minAge?: number;
        maxAge?: number;
        nationality?: string[];
    };
    totalEligible: number;
    totalApplied: number;
}

export interface ProofData {
    proof: {
        a: string[];
        b: string[][];
        c: string[];
    };
    nullifier: string;
    actionId: string;
    epochTimestamp: number;
    root: string;
}

class ApiService {
    // KYC APIs
    async submitKYC(data: KYCSubmission) {
        const response = await api.post('/kyc/submit', data);
        return response.data;
    }

    async getKYCStatus(userId: string) {
        const response = await api.get(`/kyc/status/${userId}`);
        return response.data;
    }

    // Scheme APIs
    async getAllSchemes() {
        const response = await api.get('/scheme/all');
        return response.data;
    }

    async getScheme(schemeId: string) {
        const response = await api.get(`/scheme/${schemeId}`);
        return response.data;
    }

    async createScheme(data: any) {
        const response = await api.post('/scheme/create', data);
        return response.data;
    }

    async updateSchemeTree(schemeId: string) {
        const response = await api.post(`/scheme/${schemeId}/update-tree`);
        return response.data;
    }

    // Proof APIs
    async generateProof(userId: string, schemeId: string, secret: string) {
        const response = await api.post('/proof/generate', {
            userId,
            schemeId,
            secret,
        });
        return response.data;
    }

    async submitProof(proofData: ProofData & { schemeId: string }) {
        const response = await api.post('/proof/submit', proofData);
        return response.data;
    }

    async verifyProof(nullifier: string) {
        const response = await api.get(`/proof/verify/${nullifier}`);
        return response.data;
    }
}

const apiService = new ApiService();
export default apiService;

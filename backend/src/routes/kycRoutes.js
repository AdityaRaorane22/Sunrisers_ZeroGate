import express from 'express';
import {
    registerUser,
    getPendingVerifications,
    verifyUser,
    getSchemes,
    getUserStatus,
    saveProof,
    validateProofAccess
} from '../controllers/kycController.js';

const router = express.Router();

// User routes
router.post('/register', registerUser);
router.get('/user/:userId', getUserStatus);

// Admin routes
router.get('/pending', getPendingVerifications);
router.post('/verify', verifyUser);

// Scheme routes
router.get('/schemes', getSchemes);

// Proof routes
router.post('/save-proof', saveProof);
router.post('/validate-proof', validateProofAccess);

export default router;

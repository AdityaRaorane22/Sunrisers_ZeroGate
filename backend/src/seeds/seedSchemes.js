import Scheme from '../models/Scheme.js';
import { connectDB } from '../config/database.js';

const schemes = [
    {
        schemeId: 'SCHEME_GOV_BENEFITS',
        schemeName: 'Government Benefits Verification',
        description: 'Verify eligibility for government benefits without revealing personal details. Proves age > 18 and citizenship.',
        requiredTier: 1,
        eligibilityCriteria: {
            minAge: 18,
            requiresCitizenship: true
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_FINANCIAL_SERVICES',
        schemeName: 'Financial Services KYC',
        description: 'Access financial services with privacy. Proves age > 21, income range, and credit worthiness without exact values.',
        requiredTier: 2,
        eligibilityCriteria: {
            minAge: 21,
            requiresIncomeProof: true,
            requiresCreditCheck: true
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_PREMIUM_SERVICES',
        schemeName: 'Premium Services Access',
        description: 'Access premium services with complete anonymity. Proves membership duration, transaction history, and reputation.',
        requiredTier: 3,
        eligibilityCriteria: {
            minMembershipDays: 90,
            minTransactions: 10,
            minReputationScore: 80
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_AGE_VERIFICATION',
        schemeName: 'Age Verification',
        description: 'Simple age verification for age-restricted content. Proves age > 18 without revealing exact date of birth.',
        requiredTier: 1,
        eligibilityCriteria: {
            minAge: 18
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_INCOME_VERIFICATION',
        schemeName: 'Income Range Verification',
        description: 'Verify income falls within a range without revealing exact amount. Useful for loan applications.',
        requiredTier: 2,
        eligibilityCriteria: {
            requiresIncomeProof: true
        },
        isActive: true
    }
];

const seedSchemes = async () => {
    try {
        await connectDB();

        console.log('🌱 Seeding schemes...');

        // Clear existing schemes
        await Scheme.deleteMany({});

        // Insert new schemes
        await Scheme.insertMany(schemes);

        console.log(`✅ Successfully seeded ${schemes.length} schemes`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding schemes:', error);
        process.exit(1);
    }
};

seedSchemes();

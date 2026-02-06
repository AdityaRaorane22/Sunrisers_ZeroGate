import Scheme from '../models/Scheme.js';
import { connectDB } from '../config/database.js';

const schemes = [
    {
        schemeId: 'SCHEME_001',
        schemeName: 'Government Benefits (Age 18+)',
        description: 'Access government benefits. Requires age 18 or above.',
        requiredTier: 1,
        eligibilityCriteria: {
            minAge: 18,
            description: 'Must be 18 years or older'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_002',
        schemeName: 'Indian Citizen Services',
        description: 'Services exclusively for Indian citizens.',
        requiredTier: 1,
        eligibilityCriteria: {
            nationality: 'India',
            description: 'Must be an Indian citizen'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_003',
        schemeName: 'Senior Citizen Benefits (Age 60+)',
        description: 'Special benefits for senior citizens.',
        requiredTier: 1,
        eligibilityCriteria: {
            minAge: 60,
            description: 'Must be 60 years or older'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_004',
        schemeName: 'Financial Services (Age 21+)',
        description: 'Access to banking and financial services.',
        requiredTier: 2,
        eligibilityCriteria: {
            minAge: 21,
            description: 'Must be 21 years or older'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_005',
        schemeName: 'International Travel Verification',
        description: 'Verification for international travel services.',
        requiredTier: 2,
        eligibilityCriteria: {
            idType: 'passport',
            description: 'Must have a valid passport'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_006',
        schemeName: 'Driver License Holders',
        description: 'Services for licensed drivers.',
        requiredTier: 1,
        eligibilityCriteria: {
            idType: 'driverLicense',
            description: 'Must have a valid driver\'s license'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_007',
        schemeName: 'Premium Services (Age 25+)',
        description: 'Premium tier services for mature users.',
        requiredTier: 3,
        eligibilityCriteria: {
            minAge: 25,
            description: 'Must be 25 years or older'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_008',
        schemeName: 'Youth Programs (Age 18-30)',
        description: 'Special programs for young adults.',
        requiredTier: 1,
        eligibilityCriteria: {
            minAge: 18,
            maxAge: 30,
            description: 'Must be between 18 and 30 years old'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_009',
        schemeName: 'National ID Holders',
        description: 'Services requiring national ID verification.',
        requiredTier: 1,
        eligibilityCriteria: {
            idType: 'nationalId',
            description: 'Must have a valid national ID'
        },
        isActive: true
    },
    {
        schemeId: 'SCHEME_010',
        schemeName: 'Universal Access',
        description: 'Basic services available to all verified users.',
        requiredTier: 1,
        eligibilityCriteria: {
            description: 'All verified users eligible'
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

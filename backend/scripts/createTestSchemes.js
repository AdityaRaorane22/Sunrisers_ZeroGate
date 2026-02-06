// Script to create test schemes in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

const schemeSchema = new mongoose.Schema({
    name: String,
    description: String,
    criteria: {
        minAge: Number,
        maxAge: Number,
        nationality: [String]
    },
    totalEligible: { type: Number, default: 0 },
    totalApplied: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const Scheme = mongoose.model('Scheme', schemeSchema);

async function createTestSchemes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/zerogate-kyc');
        console.log('✅ Connected to MongoDB');

        // Clear existing schemes
        await Scheme.deleteMany({});
        console.log('🗑️  Cleared existing schemes');

        // Create test schemes
        const schemes = [
            {
                name: 'Student Scholarship Program',
                description: 'Financial assistance for students aged 18-25',
                criteria: {
                    minAge: 18,
                    maxAge: 25,
                    nationality: ['India']
                },
                isActive: true
            },
            {
                name: 'Senior Citizen Welfare',
                description: 'Healthcare and pension benefits for seniors',
                criteria: {
                    minAge: 60,
                    maxAge: 100,
                    nationality: ['India']
                },
                isActive: true
            },
            {
                name: 'Women Empowerment Scheme',
                description: 'Skill development and entrepreneurship for women',
                criteria: {
                    minAge: 18,
                    maxAge: 60,
                    nationality: ['India']
                },
                isActive: true
            }
        ];

        const created = await Scheme.insertMany(schemes);
        console.log(`✅ Created ${created.length} test schemes:`);
        created.forEach(s => console.log(`   - ${s.name} (ID: ${s._id})`));

        await mongoose.connection.close();
        console.log('\n✨ Done! Test schemes created successfully.');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestSchemes();

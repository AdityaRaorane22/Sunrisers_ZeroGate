import Admin from '../models/Admin.js';
import { connectDB } from '../config/database.js';

const admins = [
    {
        adminId: 'ADMIN_001',
        name: 'Super Admin',
        email: 'admin@zerogate.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'superAdmin'
    },
    {
        adminId: 'ADMIN_002',
        name: 'Verifier 1',
        email: 'verifier1@zerogate.com',
        password: 'verifier123',
        role: 'verifier'
    }
];

const seedAdmins = async () => {
    try {
        await connectDB();

        console.log('🌱 Seeding admins...');

        // Clear existing admins
        await Admin.deleteMany({});

        // Insert new admins
        for (const adminData of admins) {
            const admin = new Admin(adminData);
            await admin.save(); // This will trigger password hashing
            console.log(`✅ Created admin: ${adminData.email}`);
        }

        console.log(`✅ Successfully seeded ${admins.length} admins`);
        console.log('\n📝 Admin Credentials:');
        console.log('Super Admin - Email: admin@zerogate.com, Password: admin123');
        console.log('Verifier - Email: verifier1@zerogate.com, Password: verifier123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admins:', error);
        process.exit(1);
    }
};

seedAdmins();

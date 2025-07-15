import dotenv from 'dotenv';
import { storage } from '../storage';

// Load environment variables
dotenv.config();

async function createAdmin() {
  try {
    const adminUser = {
      id: 'admin_001',
      email: 'admin@sekondly.app',
      firstName: 'SeKondly',
      lastName: 'Administrator',
      phone: '1234567890',
      specialty: 'Administration',
      experience: '10+ years',
      institution: 'SeKondly Medical Platform',
      isApproved: true,
      isAdmin: true,
      username: 'admin',
      password: 'Admin123!', // Use a secure password
      level: 'Administrator',
    };
    
    console.log('Creating admin user...');
    await storage.upsertUser(adminUser);
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@sekondly.app');
    console.log('🔐 Password: Admin123!');
    console.log('');
    console.log('You can now login at https://sekondly.app/admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdmin(); 
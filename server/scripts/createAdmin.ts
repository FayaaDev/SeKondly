import { storage } from '../storage';

async function createAdmin() {
  try {
    const adminUser = {
      id: 'admin_1',
      email: 'admin@yourdomain.com',
      firstName: 'Admin',
      lastName: 'User',
      phone: '1234567890',
      specialty: 'Internal Medicine',
      experience: '10',
      institution: null,
      medicalBoard: 'Internal Medicine',
      isApproved: true,
      isAdmin: true,
      username: 'admin',
      password: 'adminpassword', // Change this to a secure password
    };
    await storage.upsertUser(adminUser);
    console.log('Admin user created successfully!');
  } catch (error) {
    console.error('Failed to create admin user:', error);
  }
}

createAdmin(); 
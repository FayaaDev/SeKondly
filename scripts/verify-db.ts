import { db } from '../server/db';
import { users, cases, notifications } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Database verification and seeding script
 * 
 * This script:
 * 1. Verifies database connection
 * 2. Checks if tables exist and are accessible
 * 3. Optionally seeds with initial data
 */

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database connection...');
    
    // Test basic connection
    const result = await db.execute('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully');
    console.log('📅 Current database time:', result.rows[0]);
    
    // Check tables exist by querying them
    console.log('\n🔍 Checking table structure...');
    
    // Check users table
    const userCount = await db.select().from(users).limit(1);
    console.log('✅ Users table accessible');
    
    // Check cases table
    const caseCount = await db.select().from(cases).limit(1);
    console.log('✅ Cases table accessible');
    
    // Check notifications table
    const notificationCount = await db.select().from(notifications).limit(1);
    console.log('✅ Notifications table accessible');
    
    console.log('\n📊 Database verification complete!');
    console.log('🎉 All tables are properly created and accessible');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    throw error;
  }
}

async function seedDatabase() {
  try {
    console.log('\n🌱 Seeding database with initial data...');
    
    // Check if we already have users
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length > 0) {
      console.log('📝 Database already has data, skipping seed');
      return;
    }
    
    // Create sample admin user
    const [adminUser] = await db.insert(users).values({
      id: 'admin-001',
      email: 'admin@medconnect.com',
      firstName: 'Admin',
      lastName: 'User',
      specialty: 'Administration',
      institution: 'MedConnect Platform',
      experience: 'Platform Administrator',
      isApproved: true,
      isAdmin: true,
      approvedAt: new Date(),
      approvedBy: 'system',
    }).returning();
    
    console.log('✅ Created admin user:', adminUser.email);
    
    // Create sample doctor user
    const [doctorUser] = await db.insert(users).values({
      id: 'doctor-001',
      email: 'dr.smith@hospital.com',
      firstName: 'John',
      lastName: 'Smith',
      specialty: 'Cardiology',
      institution: 'General Hospital',
      experience: '10+ years',
      phone: '+1-555-0123',
      medicalBoard: 'American Board of Internal Medicine',
      fellowship: 'Interventional Cardiology',
      isApproved: true,
      isAdmin: false,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
    }).returning();
    
    console.log('✅ Created doctor user:', doctorUser.email);
    
    // Create sample case
    const [sampleCase] = await db.insert(cases).values({
      title: 'Complex Cardiac Arrhythmia Case',
      history: 'A 65-year-old male presents with recurrent episodes of palpitations and dizziness. Patient has a history of hypertension and diabetes. ECG shows irregular rhythm with variable RR intervals. Echo shows mild left ventricular dysfunction.',
      specialty: 'Cardiology',
      authorId: doctorUser.id,
      isApproved: true,
      approvedAt: new Date(),
      approvedBy: adminUser.id,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
    }).returning();
    
    console.log('✅ Created sample case:', sampleCase.title);
    
    // Create welcome notification for doctor
    await db.insert(notifications).values({
      userId: doctorUser.id,
      type: 'welcome',
      title: 'Welcome to MedConnect!',
      message: 'Your account has been approved. You can now share and discuss medical cases with colleagues.',
      isRead: false,
      fromUserId: adminUser.id,
    });
    
    console.log('✅ Created welcome notification');
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('📝 Sample data created:');
    console.log('   - 1 Admin user (admin@medconnect.com)');
    console.log('   - 1 Doctor user (dr.smith@hospital.com)');
    console.log('   - 1 Sample case');
    console.log('   - 1 Welcome notification');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await verifyDatabase();
    
    // Ask user if they want to seed (in a real scenario, you'd use CLI args)
    const shouldSeed = process.argv.includes('--seed');
    
    if (shouldSeed) {
      await seedDatabase();
    } else {
      console.log('\n💡 To seed the database with sample data, run:');
      console.log('   npx tsx scripts/verify-db.ts --seed');
    }
    
    console.log('\n✨ Database setup complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { verifyDatabase, seedDatabase };

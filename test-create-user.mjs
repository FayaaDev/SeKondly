import 'dotenv/config';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5001';

// Function to create a new user with pending verification status
async function createTestUser() {
  console.log('👤 Creating a new test user with pending verification...');
  
  const userData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'amd.fayaa@gmail.com', // Real email for testing
    password: 'testpassword123',
    boardCertification: 'Internal Medicine',
    level: 'Resident',
    yearsOfExperience: '3',
    workplace: 'Test Hospital',
    specialty: 'Internal Medicine'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Test user created successfully');
      console.log('📧 Email:', userData.email);
      console.log('👤 User ID:', data.user?.id);
      console.log('📝 User should receive welcome email');
      console.log('⏳ User status: PENDING VERIFICATION');
      
      console.log('\n📋 User Details:');
      console.log(`   - Name: ${userData.firstName} ${userData.lastName}`);
      console.log(`   - Email: ${userData.email}`);
      console.log(`   - Specialty: ${userData.specialty}`);
      console.log(`   - Level: ${userData.level}`);
      console.log(`   - Experience: ${userData.yearsOfExperience} years`);
      console.log(`   - Workplace: ${userData.workplace}`);
      console.log(`   - Board Certification: ${userData.boardCertification}`);
      
      console.log('\n🔧 Next Steps:');
      console.log('1. Open admin panel at http://localhost:5173/admin');
      console.log('2. Login with admin credentials');
      console.log('3. Navigate to "User Approvals" tab');
      console.log('4. Find the created user in pending list');
      console.log('5. Test approve/reject functionality');
      
      return {
        userId: data.user?.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        specialty: userData.specialty
      };
    }
    
    console.log('❌ User creation failed:', data);
    return null;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return null;
  }
}

// Function to create multiple test users
async function createMultipleTestUsers(count = 3) {
  console.log(`🧪 Creating ${count} test users for testing...\n`);
  
  const users = [];
  
  for (let i = 1; i <= count; i++) {
    const userData = {
      firstName: `Test${i}`,
      lastName: `User${i}`,
      email: `test.user.${i}.${Date.now()}@example.com`,
      password: 'testpassword123',
      boardCertification: ['Internal Medicine', 'Cardiology', 'Pediatrics'][i - 1] || 'Internal Medicine',
      level: ['Resident', 'Fellow', 'Attending'][i - 1] || 'Resident',
      yearsOfExperience: `${i + 1}`,
      workplace: `Test Hospital ${i}`,
      specialty: ['Internal Medicine', 'Cardiology', 'Pediatrics'][i - 1] || 'Internal Medicine'
    };
    
    console.log(`👤 Creating user ${i}/${count}: ${userData.firstName} ${userData.lastName}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ User ${i} created successfully - ID: ${data.user?.id}`);
        users.push({
          userId: data.user?.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          specialty: userData.specialty
        });
      } else {
        console.log(`❌ User ${i} creation failed:`, data);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${i}:`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return users;
}

// Main function to run the script
async function main() {
  console.log('🧪 Test User Creation Script');
  console.log('=' .repeat(50));
  
  // Check if server is running
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server health check failed');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure it\'s running on', BASE_URL);
    return;
  }
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'multiple') {
    const count = parseInt(args[1]) || 3;
    const users = await createMultipleTestUsers(count);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 BATCH USER CREATION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Created ${users.length} test users`);
    console.log('⏳ All users have PENDING VERIFICATION status');
    
    if (users.length > 0) {
      console.log('\n📋 Created Users:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.specialty})`);
        console.log(`      - Email: ${user.email}`);
        console.log(`      - ID: ${user.userId}`);
      });
    }
    
  } else {
    // Create single user
    const user = await createTestUser();
    
    if (user) {
      console.log('\n' + '=' .repeat(50));
      console.log('🎯 SINGLE USER CREATION SUMMARY');
      console.log('=' .repeat(50));
      console.log('✅ Test user created successfully');
      console.log('⏳ User has PENDING VERIFICATION status');
      console.log('📧 Welcome email sent to user');
    }
  }
  
  console.log('\n💡 Usage:');
  console.log('  node test-create-user.mjs           # Create single user');
  console.log('  node test-create-user.mjs multiple  # Create 3 users');
  console.log('  node test-create-user.mjs multiple 5 # Create 5 users');
}

// Run the script
main();

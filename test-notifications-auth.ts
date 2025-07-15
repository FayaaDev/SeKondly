import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { isNotNull } from 'drizzle-orm';
import * as schema from './migrations/schema';

// Setup database connection
const pool = new Pool({
  connectionString: 'postgresql://user:password@localhost:5432/rest-express'
});

const db = drizzle(pool, { schema });

async function testNotificationAuth() {
  try {
    console.log('🔍 Testing notification authentication...\n');

    // Get a user (preferably approved)
    const users = await db.query.users.findMany({
      where: isNotNull(schema.users.approvedAt),
      limit: 1
    });

    if (users.length === 0) {
      console.log('❌ No approved users found');
      return;
    }

    const user = users[0];
    console.log(`✅ Found approved user: ${user.email} (ID: ${user.id})`);

    // Simulate login to get session cookie
    const loginResponse = await fetch('http://192.168.0.205:5001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: 'testpassword123' // You'll need to use actual password
      })
    });

    console.log(`🔑 Login response: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      // Extract session cookie
      const cookies = loginResponse.headers.get('set-cookie');
      console.log(`🍪 Session cookies: ${cookies?.slice(0, 100)}...`);

      // Test notifications endpoint with authentication
      const notificationsResponse = await fetch('http://192.168.0.205:5001/api/notifications', {
        headers: {
          'Cookie': cookies || ''
        }
      });

      console.log(`📱 Notifications endpoint: ${notificationsResponse.status}`);
      
      if (notificationsResponse.ok) {
        const notifications = await notificationsResponse.json();
        console.log(`✅ Successfully fetched ${notifications.length} notifications`);
        console.log('First notification:', notifications[0]);
      } else {
        const error = await notificationsResponse.text();
        console.log(`❌ Notifications error: ${error}`);
      }
    } else {
      const error = await loginResponse.text();
      console.log(`❌ Login failed: ${error}`);
      console.log('💡 You may need to update the password in this test script');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testNotificationAuth();

import { db } from './server/db.ts';
import { users } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

async function checkUser() {
  try {
    const user = await db.select().from(users).where(eq(users.username, 'ama.faa')).limit(1);
    console.log('User found:', JSON.stringify(user[0], null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUser();

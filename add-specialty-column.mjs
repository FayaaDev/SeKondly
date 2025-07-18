import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function addSpecialtyPreferencesColumn() {
  try {
    // Add the column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS user_specialty_preferences text[] DEFAULT '{}'::text[]
    `);
    
    console.log('✅ user_specialty_preferences column added successfully');
    
    // Verify the column exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'user_specialty_preferences'
    `);
    
    console.log('Column verification result:', result);
    
  } catch (error) {
    console.error('❌ Error adding column:', error);
  }
  
  process.exit(0);
}

addSpecialtyPreferencesColumn();

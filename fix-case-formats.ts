import { db } from './server/db';
import { cases } from './shared/schema';
import { isNull } from 'drizzle-orm';

async function fixCaseFormats() {
  try {
    console.log('Checking cases without format...');
    
    // First, let's see how many cases don't have a format
    const casesWithoutFormat = await db
      .select({ id: cases.id, title: cases.title, format: cases.format })
      .from(cases)
      .where(isNull(cases.format));
    
    console.log(`Found ${casesWithoutFormat.length} cases without format:`);
    casesWithoutFormat.forEach(c => {
      console.log(`  ID: ${c.id}, Title: "${c.title}", Format: ${c.format}`);
    });
    
    if (casesWithoutFormat.length > 0) {
      console.log('\nUpdating cases to have "short" format...');
      
      // Update all cases without format to be "short"
      const result = await db
        .update(cases)
        .set({ format: 'short' })
        .where(isNull(cases.format));
      
      console.log('Update completed!');
      
      // Verify the update
      const updatedCases = await db
        .select({ id: cases.id, title: cases.title, format: cases.format })
        .from(cases)
        .where(isNull(cases.format));
        
      console.log(`Cases still without format: ${updatedCases.length}`);
    } else {
      console.log('All cases already have format set.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixCaseFormats();

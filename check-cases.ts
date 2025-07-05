import { db } from './server/db';
import { cases } from './shared/schema';

async function checkCases() {
  try {
    console.log('Fetching all cases...');
    const allCases = await db.select().from(cases);
    
    console.log(`Total cases: ${allCases.length}`);
    
    const longCases = allCases.filter(c => c.format === 'long');
    const shortCases = allCases.filter(c => c.format === 'short');
    
    console.log(`Long cases: ${longCases.length}`);
    console.log(`Short cases: ${shortCases.length}`);
    
    if (longCases.length > 0) {
      console.log('\nLong cases:');
      longCases.forEach(c => {
        console.log(`  ID: ${c.id}, Title: ${c.title}, Format: ${c.format}`);
        console.log(`  Chief Complaint: ${c.chiefComplaint || 'null'}`);
        console.log(`  History of Present Illness: ${c.historyOfPresentIllness || 'null'}`);
        console.log('  ---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCases();

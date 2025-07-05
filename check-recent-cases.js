// Simple script to check recent cases and their format field
import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkRecentCases() {
  try {
    await client.connect();
    console.log('Connected to database successfully');

    // Check the most recent 5 cases
    const result = await client.query(`
      SELECT id, title, format, created_at, 
             CASE WHEN format IS NULL THEN 'NULL' ELSE format END as format_status
      FROM cases 
      ORDER BY created_at DESC 
      LIMIT 10
    `);

    console.log('\nRecent cases from database:');
    console.log('ID | Title | Format | Created | Status');
    console.log('---|-------|--------|---------|--------');
    
    result.rows.forEach(row => {
      console.log(`${row.id} | ${row.title.substring(0, 20)}... | ${row.format || 'NULL'} | ${row.created_at.toISOString().substring(0, 10)} | ${row.format_status}`);
    });

    // Check format distribution
    const formatCount = await client.query(`
      SELECT 
        COALESCE(format, 'NULL') as format_value,
        COUNT(*) as count
      FROM cases 
      GROUP BY format
      ORDER BY count DESC
    `);

    console.log('\nFormat distribution:');
    formatCount.rows.forEach(row => {
      console.log(`${row.format_value}: ${row.count} cases`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkRecentCases();

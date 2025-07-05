import { db } from "./server/db.ts";
import { cases } from "./shared/schema.ts";
import { sql } from "drizzle-orm";

async function checkDatabaseFormat() {
  try {
    console.log('Checking database format field...');
    
    // Check if format field exists and what values it has
    const sampleCases = await db
      .select({
        id: cases.id,
        title: cases.title,
        format: cases.format,
        hasFormatField: sql`CASE WHEN ${cases.format} IS NULL THEN 'NULL' ELSE 'NOT NULL' END`.as('hasFormatField')
      })
      .from(cases)
      .limit(5);
    
    console.log('Sample cases from database:');
    sampleCases.forEach(caseItem => {
      console.log(`ID: ${caseItem.id}, Title: ${caseItem.title}, Format: ${caseItem.format}, Has Format: ${caseItem.hasFormatField}`);
    });
    
    // Check total count of cases with each format
    const formatCounts = await db
      .select({
        format: cases.format,
        count: sql`COUNT(*)`.as('count')
      })
      .from(cases)
      .groupBy(cases.format);
    
    console.log('\nFormat distribution:');
    formatCounts.forEach(row => {
      console.log(`Format: ${row.format || 'NULL'}, Count: ${row.count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseFormat();

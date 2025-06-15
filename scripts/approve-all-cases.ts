#!/usr/bin/env tsx

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cases } from "../shared/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function approveAllCases() {
  try {
    console.log("Updating all cases to be approved...");
    
    const result = await db
      .update(cases)
      .set({ isApproved: true })
      .where(eq(cases.isApproved, false))
      .returning({ id: cases.id, title: cases.title });
    
    console.log(`Updated ${result.length} cases to approved status:`);
    result.forEach(case_data => {
      console.log(`- Case ${case_data.id}: ${case_data.title}`);
    });
    
  } catch (error) {
    console.error("Error updating cases:", error);
  } finally {
    await pool.end();
  }
}

approveAllCases();

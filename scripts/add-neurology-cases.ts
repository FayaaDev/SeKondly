import 'dotenv/config';
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, cases } from "../shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function addNeurologyCases() {
  try {
    console.log("🔍 Adding Neurology test cases...");
    
    // First, create a neurologist user
    const [neurologistUser] = await db.insert(users).values({
      id: 'neuro-001',
      email: 'dr.neuro@hospital.com', 
      firstName: 'Sarah',
      lastName: 'Johnson',
      specialty: 'Neurology',
      institution: 'Neuro Center',
      experience: '8+ years',
      phone: '+1-555-0124',
      medicalBoard: 'American Board of Neurology',
      fellowship: 'Epilepsy',
      isApproved: true,
      isAdmin: false,
      approvedAt: new Date(),
      approvedBy: 'admin-001',
    }).returning();
    
    console.log('✅ Created neurologist user:', neurologistUser.email);
    
    // Create Neurology cases
    const neurologyCases = [
      {
        title: 'Sudden Onset Focal Seizures in Young Adult',
        history: 'A 24-year-old previously healthy female presents with new-onset focal seizures. Episodes began 2 weeks ago with right arm twitching, progressing to secondary generalization. No family history of epilepsy. MRI shows subtle cortical dysplasia in left frontal region.',
        specialty: 'Neurology',
        authorId: neurologistUser.id,
        // isApproved: true, // Removed - now requires approval
        // approvedAt: new Date(), // Removed
        // approvedBy: 'admin-001', // Removed
        likesCount: 3,
        commentsCount: 2,
        viewsCount: 45,
      },
      {
        title: 'Progressive Memory Loss with Behavioral Changes',
        history: 'A 68-year-old male with 18-month history of progressive memory decline and personality changes. Family reports increasing agitation and poor judgment. MMSE score 18/30. Brain MRI shows bilateral temporal lobe atrophy.',
        specialty: 'Neurology',
        authorId: neurologistUser.id,
        // isApproved: true, // Removed - now requires approval
        // approvedAt: new Date(), // Removed
        // approvedBy: 'admin-001', // Removed
        likesCount: 7,
        commentsCount: 5,
        viewsCount: 82,
      },
      {
        title: 'Acute Stroke with Large Vessel Occlusion',
        history: 'A 72-year-old male with sudden onset left hemiplegia and aphasia. NIHSS score 18. CT angiogram reveals right M1 occlusion. Patient arrived within 4-hour window. Considering mechanical thrombectomy.',
        specialty: 'Neurology',
        authorId: neurologistUser.id,
        // isApproved: true, // Removed - now requires approval
        // approvedAt: new Date(), // Removed
        // approvedBy: 'admin-001', // Removed
        likesCount: 12,
        commentsCount: 8,
        viewsCount: 156,
      }
    ];
    
    const insertedCases = await db.insert(cases).values(neurologyCases).returning();
    
    console.log('✅ Created Neurology cases:');
    insertedCases.forEach(case_data => {
      console.log(`   - ${case_data.title}`);
    });
    
    console.log('\n🎉 Neurology test data added successfully!');
    
  } catch (error) {
    console.error('❌ Failed to add Neurology cases:', error);
    throw error;
  }
}

addNeurologyCases();

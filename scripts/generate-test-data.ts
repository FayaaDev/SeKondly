import 'dotenv/config';
import { db } from "../server/db";
import { users, cases } from "../shared/schema";

// Medical specialties directly defined
const MEDICAL_SPECIALTIES = [
  "Cardiology",
  "Dermatology", 
  "Emergency Medicine",
  "Endocrinology",
  "Gastroenterology",
  "General Practice",
  "Hematology",
  "Infectious Disease",
  "Internal Medicine",
  "Nephrology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Surgery",
  "Urology"
] as const;

// Sample data for generating realistic test content
const FIRST_NAMES = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Helen", "Mark", "Sandra", "Donald", "Donna",
  "Steven", "Carol", "Paul", "Ruth", "Andrew", "Sharon", "Joshua", "Michelle",
  "Kenneth", "Laura", "Kevin", "Sarah", "Brian", "Kimberly", "George", "Deborah",
  "Timothy", "Dorothy", "Ronald", "Lisa", "Jason", "Nancy", "Edward", "Karen",
  "Jeffrey", "Betty", "Ryan", "Helen", "Jacob", "Sandra", "Gary", "Donna",
  "Nicholas", "Carol", "Eric", "Ruth", "Jonathan", "Sharon", "Stephen", "Michelle"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "AdAMS", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Gomez", "Phillips", "EvANS", "Turner", "Diaz", "Parker",
  "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
  "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey"
];

const INSTITUTIONS = [
  "Johns Hopkins Hospital",
  "Mayo Clinic",
  "Cleveland Clinic",
  "Massachusetts General Hospital",
  "UCLA Medical Center",
  "Stanford Health Care",
  "Mount Sinai Hospital",
  "Cedars-Sinai Medical Center",
  "NYU Langone Health",
  "University of Chicago Medicine",
  "Houston Methodist Hospital",
  "Duke University Hospital",
  "UCSF Medical Center",
  "Northwestern Memorial Hospital",
  "Brigham and Women's Hospital",
  "Yale-New Haven Hospital",
  "Barnes-Jewish Hospital",
  "University of Pennsylvania Health System",
  "Vanderbilt University Medical Center",
  "Seattle Children's Hospital"
];

const MEDICAL_BOARDS = [
  "American Board of Internal Medicine",
  "American Board of Surgery", 
  "American Board of Pediatrics",
  "American Board of Emergency Medicine",
  "American Board of Radiology",
  "American Board of Anesthesiology",
  "American Board of Pathology",
  "American Board of Psychiatry and Neurology",
  "American Board of Orthopedic Surgery",
  "American Board of Obstetrics and Gynecology"
];

// Sample medical imaging URLs for test data
const MEDICAL_IMAGES = {
  "Cardiology": [
    "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_13ox1i13ox1i13ox.png",
    "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_8p7z2e8p7z2e8p7z.png",
    "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_k77vjpk77vjpk77v.png",
    "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_l4wp2ql4wp2ql4wp.png"
  ],
  "Neurology": [
    "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_2d32c763-0091-4293-a44f-91161a64f94e.png",
    "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_4dcc12d0-4baf-46ec-8d2b-651466cf9641.png",
    "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_626933dc-ace5-42ad-833a-28d9178d9648.png",
    "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_a1316a25-8f6e-49c4-8ed1-23df555fe329.png"
  ],
  "Default": [
    "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_ut62r5ut62r5ut62.png",
    "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_uwpz5zuwpz5zuwpz.png",
    "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_zi0lt8zi0lt8zi0l.png",
    "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_cb9366f1-bea2-47e0-bbd9-01b3ef03ee6b.png"
  ]
};

// Case title templates for different specialties
const CASE_TEMPLATES = {
  "Cardiology": [
    "Complex coronary artery disease in young patient",
    "Acute myocardial infarction with complications",
    "Heart failure with preserved ejection fraction",
    "Atrial fibrillation management challenges",
    "Hypertrophic cardiomyopathy case study",
    "Acute pericarditis presentation",
    "Valvular heart disease complications",
    "Sudden cardiac arrest survivor"
  ],
  "Dermatology": [
    "Unusual skin lesion presentation",
    "Melanoma early detection case",
    "Psoriasis treatment resistance",
    "Drug-induced skin reaction",
    "Autoimmune bullous disease",
    "Pediatric atopic dermatitis",
    "Rare genetic skin disorder",
    "Post-surgical wound complications"
  ],
  "Emergency Medicine": [
    "Multi-trauma patient management",
    "Acute poisoning case",
    "Sepsis recognition and treatment",
    "Stroke protocol activation",
    "Pediatric emergency presentation",
    "Cardiac arrest resuscitation",
    "Anaphylaxis management",
    "Psychiatric emergency intervention"
  ],
  "Neurology": [
    "Acute stroke presentation",
    "Multiple sclerosis progression",
    "Epilepsy refractory case",
    "Parkinson's disease complications",
    "Migraine variant presentation",
    "Peripheral neuropathy workup",
    "Brain tumor diagnosis",
    "Dementia differential diagnosis"
  ],
  "Pediatrics": [
    "Failure to thrive investigation",
    "Pediatric fever workup",
    "Developmental delay assessment",
    "Congenital heart disease",
    "Childhood asthma management",
    "Vaccine hesitancy counseling",
    "Adolescent mental health",
    "Neonatal complications"
  ],
  "Surgery": [
    "Complex abdominal surgery",
    "Emergency appendectomy complications",
    "Laparoscopic procedure challenges",
    "Post-operative infection management",
    "Trauma surgery case",
    "Hernia repair technique",
    "Gallbladder surgery complications",
    "Bowel obstruction management"
  ],
  "Internal Medicine": [
    "Diagnostic dilemma case",
    "Polypharmacy management",
    "Diabetes complications",
    "Hypertension resistant case",
    "Chronic kidney disease progression",
    "Autoimmune disease presentation",
    "Geriatric syndrome management",
    "Preventive care strategies"
  ]
};

// Generate detailed case histories
const generateCaseHistory = (specialty: string, title: string): string => {
  const templates = {
    "Cardiology": `A 55-year-old patient presented to the emergency department with chest pain radiating to the left arm. The pain started 2 hours ago and is described as crushing and severe (8/10). Patient has a history of hypertension and smoking. ECG shows ST-elevation in leads II, III, and aVF. Troponin levels are elevated at 15.2 ng/mL. 

Physical examination reveals diaphoresis, blood pressure 90/60 mmHg, heart rate 110 bpm. Lung examination shows bilateral crackles in lower lobes. Heart sounds reveal S3 gallop. 

Initial management included dual antiplatelet therapy, heparin, and immediate cardiac catheterization was arranged. The case presented several challenges in the management approach due to hemodynamic instability.

Follow-up echocardiogram showed reduced ejection fraction of 35%. Patient was started on ACE inhibitor and beta-blocker therapy. Cardiac rehabilitation was initiated before discharge.`,

    "Emergency Medicine": `Patient arrived via ambulance after motor vehicle collision. Primary survey revealed patent airway, bilateral breath sounds present, blood pressure 80/50 mmHg, heart rate 120 bpm. Glasgow Coma Scale 14.

Secondary survey identified abdominal tenderness with guarding. FAST exam positive for intraperitoneal fluid. X-rays showed no obvious fractures, but CT scan revealed splenic laceration with active bleeding.

Trauma team activation was immediate. Two large-bore IVs established, blood type and cross-match sent. Patient received 2 units of packed red blood cells. Surgery was consulted for potential splenectomy.

The case highlighted the importance of systematic trauma evaluation and multidisciplinary team coordination in emergency settings.`,

    "Neurology": `45-year-old patient presented with acute onset of left-sided weakness and speech difficulties. Symptoms began 1 hour ago while at work. No loss of consciousness reported. Patient has history of atrial fibrillation but stopped taking anticoagulation 3 months ago.

Neurological examination revealed left hemiparesis, facial droop, and expressive aphasia. NIHSS score calculated at 18. Blood pressure 180/100 mmHg, heart rate irregular at 95 bpm.

CT head showed no acute hemorrhage. CTA revealed right MCA occlusion. Patient met criteria for thrombolytic therapy. tPA was administered within the therapeutic window.

Post-thrombolysis monitoring showed gradual improvement in symptoms. Follow-up imaging demonstrated successful recanalization with minimal infarct volume.`,

    "Default": `Patient presented with concerning symptoms requiring immediate medical attention. Initial assessment revealed multiple clinical findings that required systematic evaluation and management.

Comprehensive history and physical examination were performed. Relevant laboratory studies and imaging were obtained to establish the diagnosis.

Treatment plan was developed based on evidence-based guidelines and patient-specific factors. Multidisciplinary team consultation was obtained when appropriate.

Patient showed good response to treatment with improvement in clinical status. Appropriate follow-up care was arranged with specialist consultation as needed.`
  };

  return templates[specialty as keyof typeof templates] || templates["Default"];
};

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

const PROFILE_IMAGES = [
  "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_13ox1i13ox1i13ox.png",
  "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_8p7z2e8p7z2e8p7z.png",
  "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_k77vjpk77vjpk77v.png",
  "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_l4wp2ql4wp2ql4wp.png",
  "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_ut62r5ut62r5ut62.png",
  "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_uwpz5zuwpz5zuwpz.png",
  "/Users/fayaa/SeKondly/uploads/Gemini_Generated_Image_zi0lt8zi0lt8zi0l.png",
  "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_2d32c763-0091-4293-a44f-91161a64f94e.png",
  "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_4dcc12d0-4baf-46ec-8d2b-651466cf9641.png",
  "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_626933dc-ace5-42ad-833a-28d9178d9648.png",
  "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_a1316a25-8f6e-49c4-8ed1-23df555fe329.png",
  "/Users/fayaa/SeKondly/uploads/i_Google_Create_20_random_images_of_patients_being_examined_by_a_doctor_cb9366f1-bea2-47e0-bbd9-01b3ef03ee6b.png",
  "/Users/fayaa/SeKondly/uploads/1.png",
  "/Users/fayaa/SeKondly/uploads/2.png"
];

function generateRandomUser() {
  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  const specialty = getRandomElement(MEDICAL_SPECIALTIES);
  const institution = getRandomElement(INSTITUTIONS);
  const medicalBoard = getRandomElement(MEDICAL_BOARDS);
  const profileImage = getRandomElement(PROFILE_IMAGES);
  
  return {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@medconsult.com`,
    username: `dr${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    password: "hashedpassword123", // In real app, this would be properly hashed
    firstName,
    lastName,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    medicalBoard,
    fellowship: `${specialty} Fellowship`,
    experience: `${Math.floor(Math.random() * 20) + 5} years`,
    institution,
    specialty: specialty as string,
    isApproved: true,
    isAdmin: false,
    approvedAt: new Date(),
    approvedBy: "admin_system",
    profileImage
  };
}

function generateRandomCase(authorId: string, specialty: string) {
  const templates = CASE_TEMPLATES[specialty as keyof typeof CASE_TEMPLATES] || CASE_TEMPLATES["Internal Medicine"];
  const title = getRandomElement(templates);
  const history = generateCaseHistory(specialty, title);
  
  // Get specialty-specific images or default ones
  const availableImages = MEDICAL_IMAGES[specialty as keyof typeof MEDICAL_IMAGES] || MEDICAL_IMAGES["Default"];
  const numImages = Math.floor(Math.random() * 2) + 2; // 2-3 images per case
  const imageUrls = Array.from({ length: numImages }, () => getRandomElement(availableImages));
  
  return {
    title,
    history,
    specialty,
    authorId,
    isApproved: true,
    approvedAt: new Date(),
    approvedBy: "admin_system",
    imageUrls,
    likesCount: Math.floor(Math.random() * 50),
    commentsCount: Math.floor(Math.random() * 20),
    viewsCount: Math.floor(Math.random() * 200) + 50
  };
}

async function generateTestData() {
  try {
    console.log("🚀 Starting test data generation...");
    
    // Generate 14 random users
    const userCount = 14;
    const casesPerUser = 3; // Each user will have 2-4 cases
    
    console.log(`📝 Generating ${userCount} users with profile images...`);
    const generatedUsers: (typeof users.$inferSelect)[] = [];
    
    for (let i = 0; i < userCount; i++) {
      const userData = generateRandomUser();
      try {
        const [insertedUser] = await db.insert(users).values(userData).returning();
        generatedUsers.push(insertedUser);
        console.log(`✅ Created user: Dr. ${userData.firstName} ${userData.lastName} (${userData.specialty})`);
      } catch (error) {
        console.error(`❌ Failed to create user: Dr. ${userData.firstName} ${userData.lastName}`, error);
      }
    }
    
    console.log(`📋 Generating cases for each user...`);
    let totalCases = 0;
    
    for (const user of generatedUsers) {
      const numCases = Math.floor(Math.random() * casesPerUser) + 2; // 2-4 cases per user
      
      for (let j = 0; j < numCases; j++) {
        const caseData = generateRandomCase(user.id, user.specialty!);
        try {
          await db.insert(cases).values(caseData);
          totalCases++;
          console.log(`  📄 Created case: "${caseData.title}" by Dr. ${user.firstName} ${user.lastName}`);
        } catch (error) {
          console.error(`  ❌ Failed to create case for Dr. ${user.firstName} ${user.lastName}`, error);
        }
      }
    }
    
    console.log(`\n🎉 Test data generation complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users created: ${userCount}`);
    console.log(`   - Cases created: ${totalCases}`);
    console.log(`   - Specialties covered: ${[...new Set(generatedUsers.map(u => u.specialty))].length}`);
    
    console.log(`\n🔍 Specialty breakdown:`);
    const specialtyCount = generatedUsers.reduce((acc, user) => {
      acc[user.specialty!] = (acc[user.specialty!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(specialtyCount).forEach(([specialty, count]) => {
      console.log(`   - ${specialty}: ${count} doctors`);
    });
    
  } catch (error) {
    console.error("❌ Error generating test data:", error);
    process.exit(1);
  }
}

// Run the script
generateTestData()
  .then(() => {
    console.log("\n✨ All done! You can now test the vertical pager view with realistic data.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });

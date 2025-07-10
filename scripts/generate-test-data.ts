import 'dotenv/config';
import { db } from "../server/db";
import { users, cases } from "../shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  "Mohammed", "Ahmed", "Ali", "Saud", "Abdullah", "Fahad", "Salman", "Rashed",
  "Hassan", "Yousef", "Khalid", "Ibrahim", "Majed", "Tariq", "Badr", "Sultan",
  "Nawaf", "Murad", "Yasser", "Hussein",
  "Fatima", "Sara", "Reem", "Noura", "Hind", "Mona", "Abeer", "Laila",
  "Rana", "Dalal", "Amal", "Jawaher", "Kholoud", "Shahad", "Najla", "Somaya",
  "Mai", "Bushra", "Huda", "Rasha"
];

const LAST_NAMES = [
  "AlHarbi", "AlMutairi", "AlQahtani", "AlAnzi", "AlOtaibi", "AlSubaie", "AlShammari",
  "AlDosari", "AlGhamdi", "AlZahrani", "AlJohani", "AlMarri", "AlShehri", "AlSuwaidi",
  "AlMansour", "AlMazrouei", "AlAmri", "AlSharif", "AlOmari", "AlHussain", "AlNaimi",
  "AlSalem", "AlRashid", "AlJaber", "AlSaud", "AlFarsi", "AlEssa", "AlObaid",
  "AlMutlaq", "AlJumah", "AlHajri", "AlBalushi", "AlKhaldi", "AlTurki", "AlAjmi",
  "AlDabbagh", "AlSamari", "AlTayeb", "AlBaz", "AlHarthi", "AlRowais", "AlQarni",
  "AlRuwaili", "AlTamimi", "AlQaissi", "AlKuwaiti", "AlMalki", "AlMugren", "AlSultan",
  "AlOwais", "AlBarqi", "AlYami", "AlBishi", "AlFaraj", "AlRafie", "AlMishari",
  "AlQattan", "AlBadr", "AlMahmoud", "AlSaeed", "AlSaeedi", "AlHaddad", "AlSadiq",
  "AlFahad", "AlZaid", "AlMoqbel", "AlShaya", "AlDossary", "AlMansouri"
];

const INSTITUTIONS = [
  "King Medical City",
  "Noor National Hospital",
  "Al X Specialist Hospital",
  "Emirates Medical Center",
  "Dar Al Shifa Hospital",
  "Salam International Hospital",
  "Al Amal General Hospital",
  "King K University Hospital",
  "Nour Al Hayat Medical Center",
  "Madinah Care Hospital",
  "Al Seha Specialist Hospital",
  "Royal Hospital",
  "Al Rawdah Medical Complex",
  "Shifa Al Jazeera Hospital",
  "Al Rahma Hospital",
  "Al Hanan Medical Center",
  "Al Taif Medical City",
  "Major Health Center",
  "Sultan Qaboos Medical Center",
  "J International Hospital"
];

const MEDICAL_LEVELS = [
  "Medical Student",
  "Intern",
  "Resident",
  "Specialist",
  "Consultant"
] as const;

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

function generateRandomUser(specificLevel?: string) {
  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  const specialty = getRandomElement(MEDICAL_SPECIALTIES);
  const institution = getRandomElement(INSTITUTIONS);
  const level = specificLevel || getRandomElement(MEDICAL_LEVELS);
  const profileImageUrl = getRandomElement(PROFILE_IMAGES);
  
  // Make email unique by adding timestamp
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  
  return {
    id: `user_${timestamp}_${randomId}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomId}@medconsult.com`,
    username: `dr${firstName.toLowerCase()}${lastName.toLowerCase()}${randomId}`,
    password: "hashedpassword123", // In real app, this would be properly hashed
    firstName,
    lastName,
    phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    level,
    fellowship: `${specialty} Fellowship`,
    experience: `${Math.floor(Math.random() * 20) + 5} years`,
    institution,
    specialty: specialty as string,
    isApproved: true,
    isAdmin: false,
    approvedAt: new Date(),
    approvedBy: "admin_system",
    profileImageUrl
  };
}

function generateRandomCase(authorId: string, specialty: string, format: 'short' | 'long' = 'short', includeImages: boolean = true) {
  const templates = CASE_TEMPLATES[specialty as keyof typeof CASE_TEMPLATES] || CASE_TEMPLATES["Internal Medicine"];
  const title = getRandomElement(templates);
  const history = generateCaseHistory(specialty, title);
  
  // Get specialty-specific images or default ones (only if includeImages is true)
  let imageUrls: string[] = [];
  if (includeImages) {
    const availableImages = MEDICAL_IMAGES[specialty as keyof typeof MEDICAL_IMAGES] || MEDICAL_IMAGES["Default"];
    const numImages = Math.floor(Math.random() * 2) + 2; // 2-3 images per case
    imageUrls = Array.from({ length: numImages }, () => getRandomElement(availableImages));
  }
  
  const baseCase = {
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
    viewsCount: Math.floor(Math.random() * 200) + 50,
    format
  };

  // Add long case specific fields
  if (format === 'long') {
    return {
      ...baseCase,
      chiefComplaint: generateChiefComplaint(specialty),
      historyOfPresentIllness: generateHistoryOfPresentIllness(specialty),
      pastMedicalHistory: generatePastMedicalHistory(),
      familyHistory: generateFamilyHistory(),
      drugHistory: generateDrugHistory(),
      systemicReview: generateSystemicReview(),
      examination: generateExamination(specialty),
      management: generateManagement(specialty)
    };
  }

  return baseCase;
}

// Generate long case specific content
function generateChiefComplaint(specialty: string): string {
  const complaints = {
    "Cardiology": [
      "Chest pain for 2 hours",
      "Shortness of breath and palpitations",
      "Syncope while exercising",
      "Lower extremity swelling for 1 week"
    ],
    "Neurology": [
      "Sudden onset left-sided weakness",
      "Severe headache with visual changes",
      "Seizure-like episodes",
      "Progressive memory loss"
    ],
    "Emergency Medicine": [
      "Multiple trauma after MVA",
      "Severe abdominal pain",
      "Difficulty breathing after fall",
      "Altered mental status"
    ],
    "Default": [
      "Chief complaint varies by presentation",
      "Patient presents with concerning symptoms",
      "Acute onset of symptoms",
      "Progressive worsening of condition"
    ]
  };
  
  const specialtyComplaints = complaints[specialty as keyof typeof complaints] || complaints["Default"];
  return getRandomElement(specialtyComplaints);
}

function generateHistoryOfPresentIllness(specialty: string): string {
  const histories = {
    "Cardiology": [
      "Patient developed chest pain 2 hours ago while at rest. Pain is crushing in nature, radiating to left arm and jaw. Associated with nausea and diaphoresis. No shortness of breath initially, but now experiencing mild dyspnea.",
      "Started with palpitations and shortness of breath during exercise. Symptoms have progressively worsened over the past week. Patient reports orthopnea and paroxysmal nocturnal dyspnea.",
      "Sudden onset of chest pain followed by loss of consciousness while climbing stairs. Regained consciousness within seconds. No preceding symptoms."
    ],
    "Neurology": [
      "Patient was speaking normally when suddenly developed difficulty finding words. Left-sided weakness began shortly after. No loss of consciousness. Symptoms have remained stable since onset.",
      "Severe headache began abruptly while patient was watching TV. Described as 'worst headache of my life.' Associated with photophobia and mild neck stiffness.",
      "Witnessed tonic-clonic seizure lasting approximately 2 minutes. Patient was confused post-ictally for 30 minutes. No previous history of seizures."
    ],
    "Default": [
      "Patient presents with acute onset of symptoms that have been progressively worsening. Initial presentation was mild but has become more concerning over time.",
      "Symptoms began gradually and have been associated with various other complaints. Patient reports significant impact on daily activities.",
      "Clinical presentation is consistent with acute medical condition requiring immediate attention and further evaluation."
    ]
  };
  
  const specialtyHistories = histories[specialty as keyof typeof histories] || histories["Default"];
  return getRandomElement(specialtyHistories);
}

function generatePastMedicalHistory(): string {
  const histories = [
    "Hypertension for 10 years, well controlled on ACE inhibitor. Type 2 diabetes mellitus diagnosed 5 years ago, managed with metformin. No known allergies.",
    "History of myocardial infarction 3 years ago, status post PCI. Current medications include dual antiplatelet therapy and statin. Former smoker, quit 2 years ago.",
    "Chronic kidney disease stage 3, baseline creatinine 1.8 mg/dL. History of gout, well controlled. Takes allopurinol daily.",
    "No significant past medical history. Appendectomy at age 25. No regular medications. Non-smoker, occasional alcohol use.",
    "Atrial fibrillation on warfarin therapy. History of stroke 2 years ago with minimal residual deficit. Regular cardiology follow-up.",
    "COPD, home oxygen therapy at night. Multiple hospitalizations for exacerbations. Current smoker, 40 pack-year history."
  ];
  return getRandomElement(histories);
}

function generateFamilyHistory(): string {
  const histories = [
    "Father died of myocardial infarction at age 65. Mother alive with diabetes and hypertension. One sibling with history of stroke.",
    "Strong family history of cardiovascular disease. Both parents deceased from cardiac causes. Multiple siblings with hypertension.",
    "Mother with breast cancer, currently in remission. Father with Alzheimer's disease. No known cardiac history in family.",
    "No significant family history. Parents alive and well in their 80s. Two healthy siblings.",
    "Maternal grandfather with diabetes. Paternal side has history of kidney disease. No known cancer history.",
    "Family history significant for autoimmune diseases. Mother with rheumatoid arthritis, sister with lupus."
  ];
  return getRandomElement(histories);
}

function generateDrugHistory(): string {
  const histories = [
    "Lisinopril 10mg daily, Metformin 1000mg twice daily, Atorvastatin 40mg nightly. No known drug allergies.",
    "Warfarin 5mg daily with regular INR monitoring. Metoprolol 50mg twice daily. Allergic to penicillin - causes rash.",
    "Aspirin 81mg daily, Amlodipine 5mg daily. Takes multivitamin and fish oil supplements. No known allergies.",
    "No regular medications. Takes ibuprofen occasionally for headaches. No known drug allergies.",
    "Insulin glargine 30 units nightly, Insulin lispro with meals. Metformin 1000mg twice daily. NKDA.",
    "Multiple medications for chronic conditions. Recently started on new antihypertensive. History of adverse reaction to sulfa drugs."
  ];
  return getRandomElement(histories);
}

function generateSystemicReview(): string {
  const reviews = [
    "Cardiovascular: Denies chest pain, palpitations, or edema. Respiratory: No shortness of breath, cough, or wheezing. Gastrointestinal: Normal appetite, no nausea or vomiting. Genitourinary: No urinary frequency or urgency. Neurological: No headaches, dizziness, or weakness. Musculoskeletal: No joint pain or stiffness.",
    "Constitutional: Reports fatigue and weight loss. Cardiovascular: Occasional palpitations. Respiratory: Mild shortness of breath on exertion. Gastrointestinal: Decreased appetite, no abdominal pain. Genitourinary: Normal urination. Neurological: Occasional headaches. Musculoskeletal: Generalized muscle weakness.",
    "All systems reviewed and negative except for presenting complaint. Patient denies fever, chills, night sweats, or unintentional weight changes. No skin rashes or lesions noted.",
    "Positive for fatigue and decreased exercise tolerance. Negative for fever, night sweats, or weight changes. All other systems negative."
  ];
  return getRandomElement(reviews);
}

function generateExamination(specialty: string): string {
  const exams = {
    "Cardiology": `Vital signs: BP 140/90, HR 88, RR 18, O2 sat 96% on room air. General appearance: Alert, well-developed, in mild distress.
HEENT: Normocephalic, atraumatic. PERRLA. No JVD appreciated.
Cardiovascular: Regular rate and rhythm, 2/6 systolic murmur at apex. No rubs or gallops. Peripheral pulses 2+ bilaterally.
Pulmonary: Clear to auscultation bilaterally. No wheezes, rales, or rhonchi.
Abdomen: Soft, non-tender, non-distended. Normal bowel sounds.
Extremities: No cyanosis, clubbing, or edema. Good capillary refill.
Neurological: Alert and oriented x3. Cranial nerves II-XII intact. Motor and sensory exam normal.`,

    "Neurology": `Vital signs: BP 160/95, HR 75, RR 16, O2 sat 98% on room air. General: Alert but with obvious speech difficulty.
HEENT: Normocephalic, no trauma. Pupils equal and reactive to light.
Neurological: Alert, follows commands. Expressive aphasia present. Left facial droop noted. Left upper and lower extremity weakness 3/5. Reflexes hyperactive on left side. Positive Babinski on left.
Cardiovascular: Irregular rhythm, no murmurs. 
Pulmonary: Clear bilaterally.
Abdomen: Benign.
Extremities: No edema or cyanosis.`,

    "Default": `Vital signs stable. General appearance: Well-appearing, alert and oriented.
HEENT: Within normal limits.
Cardiovascular: Regular rate and rhythm, no murmurs.
Pulmonary: Clear to auscultation bilaterally.
Abdomen: Soft, non-tender, normal bowel sounds.
Extremities: No significant abnormalities.
Neurological: Non-focal examination.`
  };

  const specialtyExam = exams[specialty as keyof typeof exams] || exams["Default"];
  return specialtyExam;
}



function generateManagement(specialty: string): string {
  const plans = {
    "Cardiology": [
      "1. Emergent cardiac catheterization for primary PCI\n2. Dual antiplatelet therapy (aspirin + clopidogrel)\n3. High-intensity statin therapy\n4. ACE inhibitor once hemodynamically stable\n5. Beta-blocker when appropriate\n6. Cardiac rehabilitation referral\n7. Lifestyle counseling and smoking cessation",
      "1. Optimize heart failure medications (ACE inhibitor, beta-blocker, diuretics)\n2. Daily weights and fluid restriction\n3. Echocardiogram to assess ejection fraction\n4. BNP trending\n5. Cardiology follow-up in 1-2 weeks\n6. Patient education on heart failure management",
      "1. Rate control with beta-blocker or calcium channel blocker\n2. Anticoagulation with warfarin or DOAC based on CHA2DS2-VASc score\n3. TEE if duration of AF unclear\n4. Electrophysiology consultation for rhythm control options\n5. Monitor for hemodynamic stability"
    ],
    "Neurology": [
      "1. Immediate IV tPA if within therapeutic window\n2. Neurology consultation stat\n3. CT perfusion study to assess salvageable tissue\n4. Blood pressure management per stroke protocol\n5. Aspirin after 24 hours if no hemorrhage on repeat CT\n6. Swallow evaluation before oral intake\n7. Physical and occupational therapy evaluation",
      "1. Levetiracetam 500mg BID for seizure prophylaxis\n2. EEG monitoring for 24-48 hours\n3. MRI brain with and without contrast\n4. Basic metabolic panel, magnesium, phosphorus\n5. Neurology consultation\n6. Avoid potential seizure triggers\n7. Safety precautions and seizure education",
      "1. High-dose methylprednisolone 1g IV daily x 3-5 days\n2. MRI brain and spine with gadolinium\n3. Neurology follow-up in 2-4 weeks\n4. Monitor for steroid side effects\n5. Patient education on MS management\n6. Consider disease-modifying therapy adjustment"
    ],
    "Default": [
      "1. Continue current management\n2. Monitor clinical response\n3. Appropriate specialist consultation\n4. Follow-up as clinically indicated\n5. Patient education and counseling\n6. Adjust treatment plan based on response",
      "1. Diagnostic workup as outlined\n2. Symptomatic management\n3. Close monitoring and reassessment\n4. Multidisciplinary team approach\n5. Patient and family education\n6. Coordinate care with primary care physician"
    ]
  };

  const specialtyPlans = plans[specialty as keyof typeof plans] || plans["Default"];
  return getRandomElement(specialtyPlans);
}

async function generateTestData() {
  try {
    console.log("🚀 Starting test data generation...");
    
    // Load real cases if available
    const realCases = loadRealCases();
    console.log(`📋 Found ${realCases.length} real cases to import`);
    
    // Generate exactly 10 users and 20 cases (10 short, 10 long)
    const userCount = 10;
    const totalCasesToGenerate = 20;
    const shortCasesToGenerate = 10;
    const longCasesToGenerate = 10;
    
    // Define specific medical levels distribution
    const levelDistribution = [
      ...Array(4).fill("Consultant"),
      ...Array(3).fill("Specialist"),
      ...Array(2).fill("Resident"),
      ...Array(1).fill("Intern")
    ];
    
    console.log(`📝 Generating ${userCount} users and ${totalCasesToGenerate} cases...`);
    const generatedUsers: (typeof users.$inferSelect)[] = [];
    
    for (let i = 0; i < userCount; i++) {
      const userData = generateRandomUser(levelDistribution[i]);
      try {
        const [insertedUser] = await db.insert(users).values(userData).returning();
        generatedUsers.push(insertedUser);
        console.log(`✅ Created user: Dr. ${userData.firstName} ${userData.lastName} (${userData.specialty}) - ${userData.level}`);
      } catch (error) {
        console.error(`❌ Failed to create user: Dr. ${userData.firstName} ${userData.lastName}`, error);
      }
    }
    
    console.log(`📋 Generating ${totalCasesToGenerate} cases (${shortCasesToGenerate} short, ${longCasesToGenerate} long)...`);
    let totalCases = 0;
    
    // Generate 10 short cases
    for (let i = 0; i < shortCasesToGenerate && totalCases < totalCasesToGenerate; i++) {
      const randomUser = getRandomElement(generatedUsers);
      const caseData = generateRandomCase(randomUser.id, randomUser.specialty!, 'short', false);
      
      try {
        await db.insert(cases).values(caseData);
        totalCases++;
        console.log(`  📄 Created SHORT case ${totalCases}: "${caseData.title}" by Dr. ${randomUser.firstName} ${randomUser.lastName} (${randomUser.specialty})`);
      } catch (error) {
        console.error(`  ❌ Failed to create short case for Dr. ${randomUser.firstName} ${randomUser.lastName}`, error);
      }
    }
    
    // Generate 10 long cases
    for (let i = 0; i < longCasesToGenerate && totalCases < totalCasesToGenerate; i++) {
      const randomUser = getRandomElement(generatedUsers);
      const caseData = generateRandomCase(randomUser.id, randomUser.specialty!, 'long', false);
      
      try {
        await db.insert(cases).values(caseData);
        totalCases++;
        console.log(`  � Created LONG case ${totalCases}: "${caseData.title}" by Dr. ${randomUser.firstName} ${randomUser.lastName} (${randomUser.specialty})`);
      } catch (error) {
        console.error(`  ❌ Failed to create long case for Dr. ${randomUser.firstName} ${randomUser.lastName}`, error);
      }
    }
    
    console.log(`\n🎉 Test data generation complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users created: ${userCount}`);
    console.log(`   - Cases created: ${totalCases} (${shortCasesToGenerate} short, ${longCasesToGenerate} long)`);
    console.log(`   - Specialties covered: ${[...new Set(generatedUsers.map(u => u.specialty))].length}`);
    
    console.log(`\n� Specialty breakdown:`);
    const specialtyCount = generatedUsers.reduce((acc, user) => {
      acc[user.specialty!] = (acc[user.specialty!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(specialtyCount).forEach(([specialty, count]) => {
      console.log(`   - ${specialty}: ${count} doctors`);
    });
    
    console.log(`\n� Level breakdown:`);
    const levelCount = generatedUsers.reduce((acc, user) => {
      acc[user.level!] = (acc[user.level!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(levelCount).forEach(([level, count]) => {
      console.log(`   - ${level}: ${count} doctors`);
    });
  } catch (error) {
    console.error("❌ Error generating test data:", error);
    process.exit(1);
  }
}

// Add interface for real case data structure
interface RealCaseData {
  title: string;
  history: string;
  specialty: string;
  format?: 'short' | 'long';
  imageUrls?: string[];
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  drugHistory?: string;
  systemicReview?: string;
  physicalExam?: string; // Will be mapped to examination
  examination?: string;
  assessment?: string; // Will be mapped to management
  plan?: string; // Will be mapped to management
  management?: string;
}

// Function to load real cases from JSON file
function loadRealCases(): RealCaseData[] {
  try {
    const casesPath = path.join(__dirname, '../real-cases.json');
    if (fs.existsSync(casesPath)) {
      const casesData = fs.readFileSync(casesPath, 'utf8');
      return JSON.parse(casesData);
    }
    console.log('❌ real-cases.json not found. Using synthetic data instead.');
    return [];
  } catch (error) {
    console.error('❌ Error loading real cases:', error);
    return [];
  }
}

// Function to create case from real data
function createCaseFromRealData(realCase: RealCaseData, authorId: string) {
  return {
    title: realCase.title,
    history: realCase.history,
    specialty: realCase.specialty,
    authorId,
    isApproved: true,
    approvedAt: new Date(),
    approvedBy: "admin_system",
    imageUrls: realCase.imageUrls || [],
    likesCount: Math.floor(Math.random() * 50),
    commentsCount: Math.floor(Math.random() * 20),
    viewsCount: Math.floor(Math.random() * 200) + 50,
    format: realCase.format || 'short',
    // Long case fields (if provided)
    ...(realCase.chiefComplaint && { chiefComplaint: realCase.chiefComplaint }),
    ...(realCase.pastMedicalHistory && { pastMedicalHistory: realCase.pastMedicalHistory }),
    ...(realCase.familyHistory && { familyHistory: realCase.familyHistory }),
    ...(realCase.drugHistory && { drugHistory: realCase.drugHistory }),
    ...(realCase.physicalExam && { examination: realCase.physicalExam }), // Map physicalExam to examination
    ...(realCase.assessment && { management: realCase.assessment }), // Map assessment to management
    ...(realCase.plan && { management: realCase.plan }) // Map plan to management
  };
}

// Run the script
generateTestData()
  .then(() => {
    console.log("\n✨ All done! Generated 10 users with 20 cases (10 short, 10 long) for testing.");
    console.log("   👨‍⚕️ User distribution: 4 Consultants, 3 Specialists, 2 Residents, 1 Intern");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });

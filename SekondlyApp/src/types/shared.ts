// Integration with shared schema from /Users/fayaa/SeKondly/shared/schema.ts
// This file ensures the native app uses the exact same types as the backend

// Import the shared schema types
import type { 
  users, 
  cases, 
  caseComments, 
  caseLikes, 
  caseFavorites, 
  notifications, 
  documents, 
  userFollows, 
  hiddenSpecialties 
} from '../../../shared/schema';

// Re-export the inferred types from the shared schema
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

export type CaseComment = typeof caseComments.$inferSelect;
export type InsertCaseComment = typeof caseComments.$inferInsert;

export type CaseLike = typeof caseLikes.$inferSelect;
export type InsertCaseLike = typeof caseLikes.$inferInsert;

export type CaseFavorite = typeof caseFavorites.$inferSelect;
export type InsertCaseFavorite = typeof caseFavorites.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = typeof userFollows.$inferInsert;

export type HiddenSpecialty = typeof hiddenSpecialties.$inferSelect;
export type InsertHiddenSpecialty = typeof hiddenSpecialties.$inferInsert;

// Enhanced types with relations for the native app
export type CaseWithAuthor = Case & {
  author: User;
  isLikedByUser?: boolean;
  userLikeId?: number;
  isFavoritedByUser?: boolean;
  isAuthorFollowedByUser?: boolean;
  // Long case format fields - matching database schema
  format: 'short' | 'long';
  history: string; // Required for all cases
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  drugHistory?: string;
  systemicReview?: string;
  examination?: string;
  management?: string;
  imageUrls?: string[];
  viewsCount?: number;
  createdAt?: string | Date;
};

export type CommentWithAuthor = CaseComment & {
  author: User;
  isAgreedByUser?: boolean;
  agreesCount?: number;
  authorId: string;
};

export type NotificationWithRelated = Notification & {
  fromUser?: User;
  relatedCase?: Case;
};

export type UserWithFollowStats = User & {
  followersCount?: number;
  followingCount?: number;
  isFollowedByUser?: boolean;
};

// Medical specialties from the backend (merged with fellowship specialties)
export const MEDICAL_SPECIALTIES = [
  "Addiction Psychiatry",
  "Adult & Pediatric Orthopedic Spinal Surgery",
  "Adult Allergy & Immunology",
  "Adult Critical Care",
  "Adult Echocardiography",
  "Adult Endocrinology & Metabolism",
  "Adult Gastroenterology",
  "Adult Hematology",
  "Adult Interventional Cardiology",
  "Adult Orthopedic Reconstructive surgery",
  "Adult Psychosomatic Medicine",
  "Adult Stem Cell Transplantation",
  "Adults Cardiology",
  "Adults Infectious Diseases",
  "Adults Respiratory Medicine",
  "Advanced Cardiac lmaging",
  "Advanced General Pediatrics",
  "Anatomic Pathology",
  "Anesthesia",
  "Arthroscopy and Orthopedic Sport Injuries",
  "Body Imaging & non-vascular intervention",
  "Bone and Soft Tissue Pathology",
  "Breast and Gynecologic Pathology",
  "Breast Imaging",
  "Burn Critical Care",
  "Cardiac Anesthesia",
  "Cardiac Critical Care",
  "Cardiac Electrophysiology & Pacing",
  "Cardiac Surgery",
  "Cardiothoracic Radiology",
  "Child And Adolescent Psychiatry",
  "Clinical Genetics & Metabolic Disorders",
  "Clinical Neurophysiology",
  "Clinician Investigator",
  "Colon and Rectal Surgery",
  "Comprehensive Ophthalmology",
  "Cornea/ External Disease",
  "Dermatology",
  "Developmental and Behavioral Pediatric",
  "Diabetes",
  "Diagnostic Neuroradiology",
  "Diagnostic Radiology",
  "Emergency Medical Services and Disaster Medicine",
  "Emergency Medicine",
  "Emergency Medicine Diploma",
  "Endocrine & Breast Surgery",
  "Epilepsy & Electroencephalography",
  "Family Medicine",
  "Forensic Medicine",
  "General Surgery",
  "Geriatric Medicine",
  "Glaucoma",
  "Gynecological Oncology",
  "Head & Neck Oncology Surgery",
  "Hematopathology",
  "Hepatobiliary pancreatic surgery",
  "Home Health Care Physicians Diploma",
  "Hospitalist Medicine",
  "Infertility Andrology",
  "Internal Medicine",
  "Interventional Nephrology",
  "Interventional Neuro-Radiology",
  "Life Style Medicine",
  "Lymphoma and Plasma Cell Disorders",
  "Maternal Fetal Medicine",
  "Medical Oncology",
  "Medical Retina & Uveitis",
  "Medical Specialty",
  "Minimat lnvasive Upper Gl and Bariatri Surgery",
  "Movement Disorder",
  "Musculoskeletal Oncology",
  "Musculoskeletal Radiology",
  "Nephropathologist Renal transplant Pathology",
  "Nero-Ophthalmology",
  "Neurological Physiotherapy",
  "Neurology",
  "Neurosurgery",
  "Neurosurgery Skull Base",
  "Neurourology",
  "Nuclear Medicine",
  "Obesity Medicine",
  "Obstetric Anesthesiology",
  "Obstetrics & Gynecology",
  "Oculoplastic and Orbit Surgery",
  "Ophthalmology",
  "Orthopedic Surgery",
  "Orthopedic Trauma Surgery",
  "Otology, Neurotology and Lateral Skull-Base Surgery",
  "Otorhinolaryngology Head and Neck Surgery",
  "Pain Medicine",
  "Palliative Care Medicine",
  "Pediatric Allergy And Immunology",
  "Pediatric Anesthesia",
  "Pediatric Cardiac Critical Care",
  "Pediatric Cardiology",
  "Pediatric Diagnostic Radiology",
  "Pediatric Echocardiography",
  "Pediatric Endocrinology and Metabolism",
  "Pediatric Gastroenterology and Nutrition",
  "Pediatric Hematology & Oncology",
  "Pediatric Intensive Care",
  "Pediatric Nephrology",
  "Pediatric Neurology",
  "Pediatric Neurosurgery",
  "Pediatric Ophthalmology and Strabismus",
  "Pediatric Orthopedic Surgery",
  "Pediatric Otolaryngology",
  "Pediatric Respiratory Medicine",
  "Pediatric Rheumatology",
  "Pediatric Stem Cell Transplantation",
  "Pediatric Surgery",
  "Pediatric Surgery",
  "Pediatric Urology",
  "Pediatrics",
  "Pediatrics Diploma",
  "Pediatrics Emergency Medicine",
  "Pediatrics Infectious Diseases",
  "Perinatal Neonatal Medicine",
  "Physical Medicine and Rehabilitation",
  "Plastic and Reconstructive Surgery",
  "Preventive Medicine",
  "Primary Mental Health Care",
  "Psychiatry",
  "Radiation Oncology",
  "Reconstructive Microvascular Surgery",
  "Regional Anesthesia",
  "Renal Transplant",
  "Renal Transplant Surgery",
  "Reproductive Medicine & Surgery",
  "Rheumatology",
  "Rhinology, Sinus and Skull-Base Surgery",
  "Saudi Program in Nephrology",
  "Sleep Medicine",
  "Therapeutic Endoscopy",
  "Thoracic Surgery",
  "Transplant Hepatology",
  "Trauma and Acute Surgery",
  "Urethral Reconstruction",
  "Urogynecologist and Pelvic Reconstructive Surgery",
  "Urology",
  "vascular and Interventional radiology",
  "Vascular Neurology (Stroke)",
  "Vascular Surgery",
  "Vitreoretinal Surgery",
  "Women's Health",
] as const;

export type Specialty = typeof MEDICAL_SPECIALTIES[number];

// Medical levels for user classification
export const MEDICAL_LEVELS = [
  "Medical Student",
  "Intern",
  "Resident",
  "Specialist",
  "Consultant"
] as const;

export type MedicalLevel = typeof MEDICAL_LEVELS[number];

// Additional native-specific types
export type SearchFilters = {
  query: string;
  specialty: string;
  dateRange: string;
};

export type Tab = "feed" | "mycases" | "favorites" | "notifications" | "profile";

export type ApiResponse<T = any> = {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

// Add before the User type export
export type CaseFormat = 'short' | 'long';

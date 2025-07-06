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
  liked?: boolean;
  likesCount?: number;
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

// Medical specialties from the backend
export const MEDICAL_SPECIALTIES = [
  "Adult Critical Care Board",
  "Adult Echocardiography",
  "Adults Infectious Diseases",
  "Anatomic Pathology",
  "Anesthesia Board",
  "Body Imaging & non-vascular intervention",
  "Cardiac Anesthesia",
  "Cardiac Surgery Board",
  "Clinician Investigator",
  "Dermatology Board",
  "Diagnostic Radiology Board",
  "Emergency Medicine Board",
  "Emergency Medicine Diploma",
  "Epilepsy & Electroencephalography",
  "Family Medicine Board",
  "Forensic Medicine",
  "General Surgery Board",
  "Glaucoma",
  "Hematopathology Board",
  "Home Health Care Physicians Diploma",
  "Internal Medicine Board",
  "Interventional Nephrology",
  "Interventional Neuro-Radiology",
  "Life Style Medicine",
  "Medical Specialty",
  "Nero-Ophthalmology",
  "Neurological Physiotherapy Board",
  "Neurology Board",
  "Neurosurgery Board",
  "Obstetrics & Gynecology Board",
  "Ophthalmology Board",
  "Orthopedic Surgery Board",
  "Otology, Neurotology and Lateral Skull-Base Surgery",
  "Otorhinolaryngology Head and Neck Surgery Board",
  "Palliative Care Medicine",
  "Pediatric Allergy And Immunology",
  "Pediatric Anesthesia",
  "Pediatric Diagnostic Radiology",
  "Pediatric Neurology Board",
  "Pediatric Otolaryngology",
  "Pediatric Surgery Board",
  "Pediatrics Board",
  "Pediatrics Diploma",
  "Physical Medicine and Rehabilitation",
  "Plastic and Reconstructive Surgery",
  "Preventive Medicine Board",
  "Psychiatry Board",
  "Radiation Oncology Board",
  "Regional Anesthesia",
  "Urogynecologist and Pelvic Reconstructive Surgery",
  "Urology Board",
] as const;

export type Specialty = typeof MEDICAL_SPECIALTIES[number];

// Fellowship specialties
export const FELLOWSHIPS = [
  "Vascular Neurology (Stroke)",
  "Addiction Psychiatry Fellowship",
  "Adult & Pediatric Orthopedic Spinal Surgery Fellowship",
  "Adult Allergy & Immunology Fellowship",
  "Adult Critical Care Fellowship",
  "Adult Endocrinology & Metabolism Fellowship",
  "Adult Gastroenterology Fellowship",
  "Adult Hematology Fellowship",
  "Adult Interventional Cardiology Fellowship",
  "Adult Orthopedic Reconstructive surgery Fellowship",
  "Adult Psychosomatic Medicine Fellowship",
  "Adult Stem Cell Transplantation Fellowship",
  "Adults Cardiology Fellowship",
  "Adults Respiratory Medicine Fellowship",
  "Advanced Cardiac lmaging Fellowship",
  "Advanced General Pediatrics Fellowship",
  "Arthroscopy and Orthopedic Sport Injuries Fellowship",
  "Bone and Soft Tissue Pathology Fellowship",
  "Breast and Gynecologic Pathology Fellowship",
  "Breast Imaging Fellowship",
  "Burn Critical Care Fellowship",
  "Cardiac Critical Care Fellowship",
  "Cardiac Electrophysiology & Pacing Fellowship",
  "Cardiothoracic Radiology Fellowship",
  "Child And Adolescent Psychiatry Fellowship",
  "Clinical Genetics & Metabolic Disorders Fellowship",
  "Clinical Neurophysiology Fellowship",
  "Colon and Rectal Surgery Fellowship",
  "Comprehensive Ophthalmology Fellowship",
  "Cornea/ External Disease Fellowship",
  "Developmental and Behavioral Pediatric Fellowship",
  "Diabetes Fellowship",
  "Diagnostic Neuroradiology Fellowship",
  "Emergency Medical Services and Disaster Medicine Fellowship",
  "Endocrine & Breast Surgery Fellowship",
  "Geriatric Medicine Fellowship",
  "Gynecological Oncology Fellowship",
  "Head & Neck Oncology Surgery Fellowship",
  "Hepatobiliary pancreatic surgery Fellowship",
  "Hospitalist Medicine Fellowship",
  "Infertility Andrology Fellowship",
  "Lymphoma and Plasma Cell Disorders Fellowship",
  "Maternal Fetal Medicine Fellowship",
  "Medical Oncology Fellowship",
  "Medical Retina & Uveitis Fellowship",
  "Minimat lnvasive Upper Gl and Bariatri Surgery Fellowship",
  "Movement Disorder Fellowship",
  "Musculoskeletal Oncology Fellowship",
  "Musculoskeletal Radiology Fellowship",
  "Nephropathologist Renal transplant Pathology Fellowship",
  "Neurosurgery Skull Base Fellowship",
  "Neurourology Fellowship",
  "Nuclear Medicine Fellowship",
  "Obesity Medicine Fellowship",
  "Obstetric Anesthesiology Fellowship",
  "Oculoplastic and Orbit Surgery Fellowship",
  "Orthopedic Trauma Surgery Fellowship",
  "Pain Medicine Fellowship",
  "Pediatric Cardiac Critical Care Fellowship",
  "Pediatric Cardiology Fellowship",
  "Pediatric Echocardiography Fellowship",
  "Pediatric Endocrinology and Metabolism Fellowship",
  "Pediatric Gastroenterology and Nutrition Fellowship",
  "Pediatric Hematology & Oncology Fellowship",
  "Pediatric Intensive Care Fellowship",
  "Pediatric Nephrology Fellowship",
  "Pediatric Neurosurgery Fellowship",
  "Pediatric Ophthalmology and Strabismus Fellowship",
  "Pediatric Orthopedic Surgery Fellowship",
  "Pediatric Respiratory Medicine Fellowship",
  "Pediatric Rheumatology Fellowship",
  "Pediatric Stem Cell Transplantation Fellowship",
  "Pediatric Surgery Fellowship",
  "Pediatric Urology Fellowship",
  "Pediatrics Emergency Medicine Fellowship",
  "Pediatrics Infectious Diseases Fellowship",
  "Perinatal Neonatal Medicine Fellowship",
  "Primary Mental Health Care Fellowship",
  "Reconstructive Microvascular Surgery Fellowship",
  "Renal Transplant Fellowship",
  "Renal Transplant Surgery Fellowship",
  "Reproductive Medicine & Surgery Fellowship",
  "Rheumatology Fellowship",
  "Rhinology, Sinus and Skull-Base Surgery Fellowship",
  "Saudi Fellowship Program in Nephrology",
  "Sleep Medicine Fellowship",
  "Therapeutic Endoscopy Fellowship",
  "Thoracic Surgery Fellowship",
  "Transplant Hepatology Fellowship",
  "Trauma and Acute Surgery Fellowship",
  "Urethral Reconstruction Fellowship",
  "vascular and Interventional radiology Fellowship",
  "Vascular Surgery Fellowship",
  "Vitreoretinal Surgery Fellowship",
  "Women's Health Fellowship",
] as const;

export type Fellowship = typeof FELLOWSHIPS[number];

// Medical levels for user classification
export const MEDICAL_LEVELS = [
  "Registrar",
  "Senior Registrar", 
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

/**
 * Medical specialties constants for the client application
 * Keep in sync with Native/src/types/shared.ts
 */

export const MEDICAL_SPECIALTIES = [
  "Anesthesiology",
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
  "Orthopedic Surgery",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Surgery",
  "Urology",
  "Preventive Medicine",
  "Other"
] as const;

export type Specialty = typeof MEDICAL_SPECIALTIES[number];

/**
 * Board certifications for medical professionals
 * Maps to MEDICAL_SPECIALTIES for consistency
 */
export const BOARD_CERTIFICATIONS = MEDICAL_SPECIALTIES;

export type BoardCertification = typeof BOARD_CERTIFICATIONS[number];

/**
 * Medical specialties constants for the client application
 * Keep in sync with SekondlyApp/src/types/shared.ts
 */

export const MEDICAL_SPECIALTIES = [
  "Adult Critical Care",
  "Adult Echocardiography",
  "Adults Infectious Diseases",
  "Anatomic Pathology",
  "Anesthesia",
  "Body Imaging & non-vascular intervention",
  "Cardiac Anesthesia",
  "Cardiac Surgery",
  "Clinician Investigator",
  "Dermatology",
  "Diagnostic Radiology",
  "Emergency Medicine",
  "Emergency Medicine Diploma",
  "Epilepsy & Electroencephalography",
  "Family Medicine",
  "Forensic Medicine",
  "General Surgery",
  "Glaucoma",
  "Hematopathology",
  "Home Health Care Physicians Diploma",
  "Internal Medicine",
  "Interventional Nephrology",
  "Interventional Neuro-Radiology",
  "Life Style Medicine",
  "Medical Specialty",
  "Nero-Ophthalmology",
  "Neurological Physiotherapy",
  "Neurology",
  "Neurosurgery",
  "Obstetrics & Gynecology",
  "Ophthalmology",
  "Orthopedic Surgery",
  "Otology, Neurotology and Lateral Skull-Base Surgery",
  "Otorhinolaryngology Head and Neck Surgery",
  "Palliative Care Medicine",
  "Pediatric Allergy And Immunology",
  "Pediatric Anesthesia",
  "Pediatric Diagnostic Radiology",
  "Pediatric Neurology",
  "Pediatric Otolaryngology",
  "Pediatric Surgery",
  "Pediatrics",
  "Pediatrics Diploma",
  "Physical Medicine and Rehabilitation",
  "Plastic and Reconstructive Surgery",
  "Preventive Medicine",
  "Psychiatry",
  "Radiation Oncology",
  "Regional Anesthesia",
  "Urogynecologist and Pelvic Reconstructive Surgery",
  "Urology",
] as const;

export type Specialty = typeof MEDICAL_SPECIALTIES[number];

/**
 * Board certifications for medical professionals
 * Maps to MEDICAL_SPECIALTIES for consistency
 */
export const BOARD_CERTIFICATIONS = MEDICAL_SPECIALTIES;

export type BoardCertification = typeof BOARD_CERTIFICATIONS[number];

/**
 * Medical levels for user classification
 * Keep in sync with SekondlyApp/src/types/shared.ts
 */
export const MEDICAL_LEVELS = [
  "Resident",
  "Registrar",
  "Senior Registrar", 
  "Consultant"
] as const;

export type MedicalLevel = typeof MEDICAL_LEVELS[number];

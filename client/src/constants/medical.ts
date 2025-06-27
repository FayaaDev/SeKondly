/**
 * Medical specialties constants for the client application
 * Keep in sync with SekondlyApp/src/types/shared.ts
 */

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

/**
 * Board certifications for medical professionals
 * Maps to MEDICAL_SPECIALTIES for consistency
 */
export const BOARD_CERTIFICATIONS = MEDICAL_SPECIALTIES;

export type BoardCertification = typeof BOARD_CERTIFICATIONS[number];

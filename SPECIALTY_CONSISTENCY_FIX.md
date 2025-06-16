# Medical Specialties Consistency Fix

## Problem
Medical specialty tags were inconsistent across the application with different arrays defined in multiple components:

### Before (Inconsistent Arrays):
1. **NewCaseModal.tsx**: 18 specialties, missing "Anesthesiology", "Orthopedic Surgery"
2. **OnboardingFlow.tsx**: 12 specialties, had "Orthopedic Surgery" but missing many others
3. **EditProfileScreen.tsx**: 12 specialties, same as OnboardingFlow
4. **HomeScreen.tsx**: 12 specialties, different short names like "Emergency"
5. **Client SearchModal.tsx**: 17 specialties, missing "Anesthesiology"
6. **Client EditProfile.tsx**: 23 specialties, had unique names like "Family Medicine"
7. **Client Home.tsx**: 12 specialties, short names like "Emergency"

## Solution
Created a centralized medical specialties system with proper module resolution:

### 1. Native App Constants (`/Native/src/types/shared.ts`)
- Created centralized list of 26 medical specialties within the Native app
- Provides TypeScript types for consistency
- Uses proper relative imports that work with Metro bundler

### 2. Client App Constants (`/client/src/constants/medical.ts`) 
- Mirror of the Native constants for the client application
- Uses proper path aliases that work with Vite bundler
- Keeps both apps in sync while respecting their build systems

### 3. Updated All Components
**Native App:**
- `NewCaseModal.tsx`: Now uses `MEDICAL_SPECIALTIES`
- `OnboardingFlow.tsx`: Now uses `MEDICAL_SPECIALTIES` 
- `EditProfileScreen.tsx`: Now uses `MEDICAL_SPECIALTIES`
- `HomeScreen.tsx`: Now uses `MEDICAL_SPECIALTIES`

**Client App:**
- `SearchModal.tsx`: Now uses `@/constants/medical`
- `EditProfile.tsx`: Now uses `@/constants/medical`
- `Home.tsx`: Now uses `@/constants/medical`

## Benefits
1. **Single Source of Truth**: All specialty lists come from one place
2. **Consistency**: Same specialties available across all forms and filters
3. **Maintainability**: Add/remove specialties in one file updates everywhere
4. **Type Safety**: TypeScript types ensure correct usage
5. **Comprehensive**: Includes all 26 medical specialties that were previously scattered

## Current Specialty List (26 total)
- Anesthesiology
- Cardiology
- Dermatology
- Emergency Medicine
- Endocrinology
- Gastroenterology
- General Practice
- Hematology
- Infectious Disease
- Internal Medicine
- Nephrology
- Neurology
- Obstetrics & Gynecology
- Oncology
- Ophthalmology
- Orthopedic Surgery
- Orthopedics
- Pediatrics
- Psychiatry
- Pulmonology
- Radiology
- Rheumatology
- Surgery
- Urology
- Other

## Future Updates
To add or modify specialties:
1. Update `/Native/src/types/shared.ts` for the Native app
2. Update `/client/src/constants/medical.ts` for the Client app  
3. Keep both files in sync to maintain consistency

## Module Resolution Fix
- **Issue**: React Native/Expo couldn't resolve `../../../shared/constants` path
- **Solution**: Created separate constants files for each app using proper import paths
- **Result**: Expo now loads without module resolution errors

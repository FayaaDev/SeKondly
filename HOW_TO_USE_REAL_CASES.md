# How to Use Your Real Cases with generate-test-data.ts

## Quick Start

1. **Create your real cases file**: Edit the `real-cases.json` file in your project root
2. **Run the script**: `npm run generate-test-data` (or `ts-node scripts/generate-test-data.ts`)
3. **The script will automatically import your real cases** alongside generating some synthetic users

## JSON File Format

Your `real-cases.json` should contain an array of case objects. Each case can be either "short" or "long" format:

### Short Case Format (Minimum Required Fields)
```json
{
  "title": "Case title here",
  "specialty": "Cardiology", 
  "history": "Detailed case history...",
  "imageUrls": ["/path/to/image1.png", "/path/to/image2.png"]
}
```

### Long Case Format (All Fields)
```json
{
  "title": "Complex case title",
  "specialty": "Neurology",
  "format": "long",
  "history": "Detailed case history...",
  "chiefComplaint": "Patient's main complaint",
  "pastMedicalHistory": "Previous medical conditions...", 
  "familyHistory": "Family medical history...",
  "drugHistory": "Current medications and allergies...",
  "physicalExam": "Physical examination findings...",
  "assessment": "Clinical assessment and diagnosis...",
  "plan": "Treatment plan and next steps...",
  "imageUrls": ["/path/to/image1.png"]
}
```

## Supported Medical Specialties

Make sure your cases use one of these specialty names:
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
- Orthopedics
- Pediatrics
- Psychiatry
- Pulmonology
- Radiology
- Rheumatology
- Surgery
- Urology

## Image Handling

- **Image paths**: Use absolute paths to your uploaded images in the `/Users/fayaa/SeKondly/uploads/` directory
- **No images**: Set `"imageUrls": []` for cases without images
- **Multiple images**: Include multiple paths in the array

## Running the Script

### Option 1: With your real cases only
1. Add all your cases to `real-cases.json`
2. Run: `ts-node scripts/generate-test-data.ts`
3. The script will create users and import your real cases

### Option 2: Mix of real and synthetic cases  
1. Add some cases to `real-cases.json`
2. Run the script - it will import your real cases AND generate some synthetic ones

### Option 3: Convert to pure real-case import script
If you want ONLY your real cases (no synthetic data), you can modify the script by setting:
```typescript
const casesPerUser = 0; // No synthetic cases per user
const longCasesToGenerate = 0; // No synthetic long cases  
const shortCasesWithoutImages = 0; // No synthetic short cases
```

## Example Workflow

1. **Prepare your cases**: Write out your real cases in the JSON format
2. **Add images**: Copy any case images to the `uploads/` folder  
3. **Update JSON**: Reference the image paths in your JSON file
4. **Test run**: Run the script with a small batch first
5. **Full import**: Once everything looks good, import all your cases

## Tips

- **Start small**: Begin with 2-3 cases to test the format
- **Match specialties**: The script will try to assign cases to doctors with matching specialties
- **Backup first**: Always backup your database before running import scripts
- **Check logs**: The script provides detailed logging of what was imported

## Alternative Approaches

### Option A: Direct Database Import
If you have many cases, you might want to create a separate import script that directly inserts into your database without generating synthetic users.

### Option B: CSV Import
You could modify the script to read from CSV files instead of JSON if that's easier for your data format.

### Option C: API Integration
If your cases are in another system, you could modify the script to fetch them via API calls.

## Troubleshooting

- **Specialty mismatch**: If a case specialty doesn't match any generated users, it will be assigned to a random user
- **Image not found**: Make sure image paths are correct and files exist
- **Database errors**: Check that your database schema matches the case fields you're trying to insert

Would you like me to help you set up any of these approaches?

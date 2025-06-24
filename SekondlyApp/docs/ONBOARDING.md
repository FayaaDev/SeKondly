# React Native Onboarding Implementation

This document describes the comprehensive onboarding flow implementation for the MedConnect React Native app.

## Overview

The onboarding system provides a complete user registration and authentication flow designed specifically for medical professionals. It includes multi-step signup, credential verification, and a pending approval process.

## Components

### 1. OnboardingFlow (`src/components/OnboardingFlow.tsx`)

The main onboarding component that handles the complete flow:

**Features:**
- Multi-step registration process (Personal Info → Professional Info → Credentials)
- Sign-in flow for existing users  
- Document upload for medical credentials
- Form validation and error handling
- Progress indicator
- iOS-native design patterns
- TanStack Query integration for API calls

**Screens:**
- `welcome` - Landing screen with sign-in/sign-up options
- `signin` - Existing user authentication
- `signup` - Personal information collection
- `professional` - Medical qualifications and specialties
- `credentials` - Document upload for verification
- `approval` - Pending review status

**Props:**
```typescript
interface OnboardingFlowProps {
  onComplete: () => void;
  onSignIn?: () => void;
}
```

### 2. OnboardingScreen (`src/screens/OnboardingScreen.tsx`)

A simple wrapper screen that provides the OnboardingFlow as a full-screen experience.

### 3. DemoScreen (`src/screens/DemoScreen.tsx`)

A demonstration screen that allows switching between onboarding and the main app for testing purposes.

## Account Verification Process

When users complete registration, they must wait for admin approval before accessing the app. The verification process works as follows:

1. **Registration Complete**: User submits credentials and account information
2. **Sign-in Attempt**: When unverified users try to sign in, they receive an alert: "Your account is currently being reviewed by our medical verification team. This process typically takes 1-2 business days. You will receive an email notification once your account is approved."
3. **Admin Review**: Administrators can approve/reject users through the Admin Panel
4. **Notification**: Users receive email notification when approved
5. **Access Granted**: Approved users can sign in and access the full app

## Form Data Structure

```typescript
interface OnboardingData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  boardCertification: string;
  fellowship: string;
  yearsOfExperience: string;
  credentialsFile?: DocumentPicker.DocumentPickerAsset;
}
```

## Board Certifications Supported

- Internal Medicine
- Cardiology
- Neurology
- Orthopedic Surgery
- Emergency Medicine
- Pediatrics
- Psychiatry
- Radiology
- Anesthesiology
- Dermatology
- Oncology
- Other

## API Integration

The onboarding flow integrates with the following endpoints:

### Registration (`/api/onboarding`)
```typescript
POST /api/onboarding
Content-Type: multipart/form-data

FormData fields:
- firstName: string
- lastName: string
- phone: string
- password: string
- email: string (generated)
- boardCertification: string
- fellowship: string (optional)
- yearsOfExperience: string
- credentialsFile: File (optional)
```

### Authentication (`/api/login`)
```typescript
POST /api/login
Content-Type: application/json

{
  username: string;
  password: string;
}
```

## Validation Rules

### Personal Information
- All fields required except fellowship
- Password minimum 6 characters
- Password confirmation must match
- Phone number format validation

### Professional Information
- Board certification required (dropdown selection)
- Years of experience required (numeric)
- Fellowship optional

### Credentials Upload
- File types: PDF, JPG, PNG
- Maximum size: 10MB
- Optional but recommended for faster approval

## Error Handling

The onboarding flow includes comprehensive error handling:

- Form validation with user-friendly alerts
- API error handling with descriptive messages
- Network error recovery
- Loading states during async operations

## Navigation Flow

```
Welcome Screen
├── Sign In → Authentication → Main App
└── Create Account → Personal Info → Professional Info → Credentials → Approval
```

## Usage Examples

### Basic Integration
```tsx
import OnboardingFlow from './src/components/OnboardingFlow';

function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  
  if (!isOnboarded) {
    return (
      <OnboardingFlow onComplete={() => setIsOnboarded(true)} />
    );
  }
  
  return <MainApp />;
}
```

### With Authentication Context
```tsx
function AppContent() {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  if (user || hasCompletedOnboarding) {
    return <HomeScreen />;
  }

  return (
    <OnboardingScreen 
      onComplete={() => setHasCompletedOnboarding(true)} 
    />
  );
}
```

## Dependencies

The onboarding implementation requires:

- `expo-document-picker` - For credential file uploads
- `@tanstack/react-query` - For API state management
- `@expo/vector-icons` - For UI icons
- `react-native` - Core React Native components

## Design Principles

### iOS-Native Design
- Uses iOS system colors (#007AFF, #FF9500, #34C759, etc.)
- Follows iOS typography hierarchy
- Implements iOS-style cards and buttons
- Safe area handling for different screen sizes

### Accessibility
- Semantic component structure
- Clear navigation patterns
- Descriptive button labels
- Proper contrast ratios

### Performance
- Lazy loading of screens
- Optimized form state management
- Efficient re-renders with React.memo patterns
- Background processing for file uploads

## Testing

### Component Testing
```tsx
import { render, fireEvent } from '@testing-library/react-native';
import OnboardingFlow from '../OnboardingFlow';

test('shows welcome screen initially', () => {
  const { getByText } = render(
    <OnboardingFlow onComplete={jest.fn()} />
  );
  expect(getByText('MedConnect')).toBeTruthy();
});
```

### Integration Testing
- Test complete onboarding flow
- Validate form submissions
- Test error scenarios
- Verify navigation between screens

## Future Enhancements

1. **Biometric Authentication** - Touch ID/Face ID integration
2. **Social Login** - Google/Apple sign-in options
3. **Offline Support** - Queue registration when offline
4. **Enhanced Validation** - Real-time field validation
5. **Animations** - Smooth transitions between steps
6. **Analytics** - Track onboarding completion rates
7. **A/B Testing** - Test different onboarding flows

## Troubleshooting

### Common Issues

1. **Document Upload Fails**
   - Check file size (max 10MB)
   - Ensure supported format (PDF, JPG, PNG)
   - Verify device permissions

2. **Form Validation Errors**
   - Check required field completion
   - Verify password requirements
   - Ensure specialty selection

3. **API Connection Issues**
   - Check network connectivity
   - Verify API endpoint configuration
   - Review authentication headers

### Debug Mode

Enable debug logging by setting:
```typescript
const DEBUG_ONBOARDING = __DEV__;
```

This will log form submissions, API calls, and navigation events to the console.

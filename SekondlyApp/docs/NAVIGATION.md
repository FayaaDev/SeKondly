# React Navigation Implementation

This document describes the comprehensive React Navigation setup for the MedConnect React Native app.

## Overview

The navigation system provides a robust, type-safe navigation experience using React Navigation v7 with native stack and bottom tab navigators.

## Architecture

### Navigation Stack Hierarchy

```
RootStack (Native Stack)
├── Auth Screen (Onboarding Flow)
├── Main Screen (Bottom Tabs)
│   ├── Home Tab
│   ├── Search Tab  
│   ├── New Case Tab
│   ├── Notifications Tab
│   └── Profile Tab
└── Pending Verification Screen
```

## Files Structure

```
src/navigation/
├── AppNavigator.tsx          # Main navigation container
├── AuthNavigator.tsx         # Authentication flow navigation
├── MainNavigator.tsx         # Main app tab navigation
├── index.ts                  # Navigation exports
└── README.md                 # This documentation

src/types/
└── navigation.ts             # Navigation type definitions

src/hooks/
└── useNavigation.ts          # Custom navigation hook
```

## Navigation Types (`src/types/navigation.ts`)

### Root Stack Parameters
```typescript
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PendingVerification: { userEmail?: string };
};
```

### Tab Navigation Parameters
```typescript
type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  NewCase: undefined;
  Notifications: undefined;
  Profile: undefined;
};
```

## Components

### 1. AppNavigator (`src/navigation/AppNavigator.tsx`)

The main navigation container that handles the app's top-level navigation flow.

**Features:**
- Authentication-based conditional rendering
- Automatic navigation based on user state
- Type-safe navigation with TypeScript
- iOS-native tab bar styling
- Fade animations between major screen transitions

**Navigation Logic:**
```typescript
{user ? (
  isVerificationPending ? (
    // Show pending verification screen
  ) : (
    // Show main app with tabs
  )
) : (
  // Show onboarding/authentication
)}
```

### 2. Tab Navigation Structure

The main app uses a bottom tab navigator with 5 tabs:

1. **Home** - Main feed and case browsing
2. **Search** - Case search and filtering  
3. **New Case** - Create new medical case
4. **Notifications** - App notifications
5. **Profile** - User profile and settings

**Tab Bar Styling:**
- iOS-native design with proper colors and spacing
- Active/inactive states with proper color contrast
- Icon support with Ionicons
- Safe area handling
- Badge support for notifications

### 3. Authentication Flow

The authentication flow handles:
- Welcome screen
- Sign-in for existing users
- Multi-step onboarding for new users
- Pending verification state

## Usage Examples

### Basic Navigation
```typescript
import { useNavigation } from '../hooks/useNavigation';

function MyComponent() {
  const navigation = useNavigation();
  
  // Navigate to main app
  navigation.navigate('Main');
  
  // Navigate to pending verification
  navigation.navigate('PendingVerification', { 
    userEmail: 'doctor@example.com' 
  });
}
```

### Navigation Utilities
```typescript
import { NavigationUtils } from '../hooks/useNavigation';

// Reset navigation to main app
NavigationUtils.goToMain(navigation);

// Reset navigation to auth flow
NavigationUtils.goToAuth(navigation);
```

### Type-Safe Navigation
```typescript
import type { RootStackNavigationProp } from '../types/navigation';

interface MyScreenProps {
  navigation: RootStackNavigationProp;
}

const MyScreen: React.FC<MyScreenProps> = ({ navigation }) => {
  // TypeScript will provide autocomplete and type checking
  navigation.navigate('Main'); // ✅ Valid
  navigation.navigate('InvalidScreen'); // ❌ TypeScript error
};
```

## Authentication Integration

The navigation system integrates with the `useAuth` hook to automatically handle navigation based on authentication state:

```typescript
const { user, isLoading, isVerificationPending } = useAuth();

// Navigation automatically updates when auth state changes
```

### Authentication States
1. **No User** → Show onboarding flow
2. **User + Pending Verification** → Show pending verification screen
3. **User + Verified** → Show main app

## Deep Linking Support

The navigation structure is ready for deep linking implementation:

```typescript
// Future deep linking configuration
const linking = {
  prefixes: ['medconnect://'],
  config: {
    screens: {
      Auth: 'auth',
      Main: {
        screens: {
          Home: 'home',
          Search: 'search',
          NewCase: 'new-case',
          Profile: 'profile',
        },
      },
      PendingVerification: 'pending-verification',
    },
  },
};
```

## Performance Optimizations

### Lazy Loading
- Screens are loaded only when needed
- Authentication state determines initial screen
- No unnecessary component mounting

### Animation Performance
- Native animations using React Native Screens
- Optimized transitions between major navigation states
- Hardware-accelerated animations on iOS

### Memory Management
- Proper screen cleanup when navigating away
- Efficient state management with React Query
- Minimal re-renders with proper component structure

## Accessibility

### Navigation Accessibility
- Proper screen reader support
- Tab bar accessibility labels
- Keyboard navigation support
- High contrast mode support

### Implementation Example
```typescript
tabBarButton: (props) => (
  <TouchableOpacity
    {...props}
    accessibilityRole="tab"
    accessibilityLabel="Home Tab"
    accessibilityHint="Navigate to home screen"
  />
)
```

## Testing

### Navigation Testing
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

test('navigates to main app when authenticated', () => {
  const { getByText } = render(
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
  
  // Test navigation behavior
});
```

### Mock Navigation
```typescript
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};
```

## Future Enhancements

### 1. Stack Navigation within Tabs
```typescript
// Home stack for deeper navigation
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Feed" component={HomeScreen} />
      <HomeStack.Screen name="CaseDetail" component={CaseDetailScreen} />
      <HomeStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </HomeStack.Navigator>
  );
}
```

### 2. Modal Presentations
```typescript
// Modal stack for overlays
<RootStack.Group screenOptions={{ presentation: 'modal' }}>
  <RootStack.Screen name="NewCaseModal" component={NewCaseModal} />
  <RootStack.Screen name="SearchModal" component={SearchModal} />
</RootStack.Group>
```

### 3. Navigation State Persistence
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const persistNavigationState = async (state) => {
  await AsyncStorage.setItem('navigation_state', JSON.stringify(state));
};
```

### 4. Advanced Deep Linking
- URL parameter parsing
- Authentication-protected routes
- External URL handling
- Universal links support

## Troubleshooting

### Common Issues

1. **Navigation not updating after auth change**
   - Ensure auth hook is properly connected
   - Check for stale closures in navigation callbacks

2. **TypeScript errors with navigation**
   - Verify navigation types are properly imported
   - Check parameter list definitions

3. **Tab bar not showing**
   - Verify safe area setup
   - Check tab bar style configuration

### Debug Navigation State
```typescript
import { useNavigationState } from '@react-navigation/native';

function NavigationDebugger() {
  const state = useNavigationState(state => state);
  console.log('Navigation State:', JSON.stringify(state, null, 2));
  return null;
}
```

## Best Practices

1. **Always use type-safe navigation**
2. **Handle loading states appropriately**
3. **Use proper error boundaries**
4. **Implement proper accessibility**
5. **Test navigation flows thoroughly**
6. **Keep navigation logic simple and predictable**
7. **Use navigation utilities for common patterns**

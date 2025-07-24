# Android Deployment Guide - SeKondly App

## 🤖 Complete Android Deployment Infrastructure

### **Prerequisites Setup**

#### 1. Google Play Console Setup
```bash
# 1. Create Google Play Console Account
# - Go to https://play.google.com/console
# - Pay one-time $25 registration fee
# - Complete account verification

# 2. Create App Listing
# - Click "Create app" in Play Console
# - App name: "SeKondly"
# - Default language: English
# - App type: App
# - Free or paid: Free
```

#### 2. Generate Android Signing Keys
```bash
# Generate upload key for Play Store
keytool -genkeypair -v -storetype PKCS12 -keystore sekondly-upload-key.keystore -alias sekondly-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Store the keystore file securely
# Remember the keystore password and key alias password
```

#### 3. Service Account for Automated Deployment
```bash
# 1. Go to Google Cloud Console
# 2. Create new project or select existing
# 3. Enable Google Play Android Developer API
# 4. Create Service Account:
#    - Name: "SeKondly Play Store Deploy"
#    - Role: "Service Account User"
# 5. Generate JSON key file
# 6. Download as "google-play-service-account.json"
```

### **Build Configuration**

#### Current EAS Configuration (`eas.json`)
```json
{
  "cli": {
    "version": ">= 13.2.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium",
        "distribution": "store"
      },
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "drfayaa@gmail.com",
        "ascAppId": "6747885635",
        "appleTeamId": "4MMGRMAFPR"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### **Deployment Workflow**

#### 1. Development Testing
```bash
# Test on Android device/emulator
npm run android

# Build development APK
eas build --platform android --profile development
```

#### 2. Internal Testing
```bash
# Build preview APK for internal testing
npm run build:android:preview

# Share APK with internal testers
# No Play Store upload needed
```

#### 3. Production Deployment
```bash
# Build production AAB (Android App Bundle)
npm run build:android:production

# Submit to Play Store
npm run submit:android

# Or manual submission:
eas submit --platform android --latest
```

### **Play Store Track Management**

#### Track Progression
```
Internal Testing → Closed Testing → Open Testing → Production
```

#### Commands for Each Track
```bash
# Internal testing (default)
eas submit --platform android --track internal

# Closed testing (alpha)
eas submit --platform android --track alpha

# Open testing (beta)
eas submit --platform android --track beta

# Production release
eas submit --platform android --track production
```

### **Version Management**

#### Automatic Version Bumping
```json
// In app.json
{
  "expo": {
    "version": "1.0.9", // Semantic version
    "android": {
      "versionCode": 1     // Android build number (auto-increment)
    }
  }
}
```

#### Manual Version Updates
```bash
# Update version in app.json before building
# versionCode must be incremented for each Play Store upload
# version should follow semantic versioning
```

### **Required Files Structure**

```
SekondlyApp/
├── google-play-service-account.json  # Service account key
├── sekondly-upload-key.keystore      # Upload signing key
├── app.json                          # App configuration
├── eas.json                          # Build configuration
└── assets/
    ├── adaptive-icon.png             # Android adaptive icon
    ├── sekondly-icon.png            # App icon
    └── splash-icon.png              # Splash screen
```

### **Environment Variables for CI/CD**

```bash
# For automated builds (optional)
export EXPO_ANDROID_KEYSTORE_PATH="./sekondly-upload-key.keystore"
export EXPO_ANDROID_KEYSTORE_PASSWORD="your_keystore_password"
export EXPO_ANDROID_KEY_PASSWORD="your_key_password"
export EXPO_ANDROID_KEY_ALIAS="sekondly-key-alias"
```

### **Permissions Configured**

```json
// In app.json android section
"permissions": [
  "CAMERA",                    // Camera access for medical images
  "RECORD_AUDIO",             // Voice-to-text functionality
  "READ_EXTERNAL_STORAGE",    // File uploads
  "WRITE_EXTERNAL_STORAGE",   // File downloads
  "VIBRATE",                  // Haptic feedback
  "INTERNET",                 // API access
  "ACCESS_NETWORK_STATE"      // Network status
]
```

### **Testing Checklist**

#### Before Production Release
- [ ] Test all core features on Android device
- [ ] Verify voice recording works
- [ ] Test push notifications
- [ ] Check camera/gallery access
- [ ] Verify file uploads
- [ ] Test authentication flow
- [ ] Check offline behavior
- [ ] Verify all permissions work

#### Play Store Requirements
- [ ] App content rating completed
- [ ] Privacy policy uploaded
- [ ] App description and screenshots
- [ ] Target API level compliance
- [ ] 64-bit requirement met (automatic with Expo)

### **Monitoring & Analytics**

#### Play Console Insights
- Crashes and ANRs monitoring
- User acquisition reports
- Revenue tracking
- User reviews and ratings

#### Firebase Analytics (Optional)
```bash
# Add Firebase to get detailed analytics
expo install @react-native-firebase/app @react-native-firebase/analytics
```

### **Security Considerations**

#### Upload Key Security
- Store keystore file securely (not in git)
- Use environment variables for passwords
- Enable Play App Signing for additional security

#### API Security
- All API calls use HTTPS
- Authentication tokens properly managed
- No sensitive data in client-side code

### **Troubleshooting**

#### Common Issues
1. **Build Failures**: Check Android permissions and package name
2. **Upload Rejected**: Ensure versionCode is incremented
3. **Signing Issues**: Verify keystore path and passwords
4. **API Level**: Ensure target SDK is current

#### Support Resources
- Expo EAS Build documentation
- Google Play Console help
- React Native Android guides

---

## 🚀 **Quick Start Commands**

```bash
# 1. Build for testing
npm run build:android:preview

# 2. Build for production
npm run build:android:production

# 3. Submit to Play Store
npm run submit:android
```

Your Android deployment infrastructure is now ready to match your iOS setup!

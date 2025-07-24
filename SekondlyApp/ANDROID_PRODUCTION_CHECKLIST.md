# Android Production Deployment Checklist

## 📋 Pre-Deployment Checklist

### **1. Google Play Console Setup**
- [ ] Google Play Console account created ($25 fee paid)
- [ ] App listing created in Play Console
- [ ] App name: "SeKondly" 
- [ ] Package name: `com.sekondly.app`
- [ ] Content rating completed
- [ ] Privacy policy uploaded

### **2. Signing & Security**
- [ ] Upload keystore generated and stored securely
- [ ] Service account created for automated deployment
- [ ] `google-play-service-account.json` downloaded
- [ ] Play App Signing enabled in Play Console

### **3. App Configuration**
- [ ] `app.json` Android section complete
- [ ] All required permissions added
- [ ] Version code incremented
- [ ] Adaptive icon configured
- [ ] App description and screenshots ready

### **4. Build Configuration**
- [ ] `eas.json` Android profiles configured
- [ ] Build scripts added to `package.json`
- [ ] EAS CLI installed and authenticated

### **5. Feature Testing**
- [ ] Voice recording works on Android
- [ ] Push notifications functional
- [ ] Camera access working
- [ ] File uploads operational
- [ ] Authentication flow tested
- [ ] All core features verified

## 🚀 Deployment Steps

### **Step 1: Final Testing**
```bash
# Test on Android device
cd SekondlyApp
npm run android

# Run Android build test
./test-android-build.sh
```

### **Step 2: Production Build**
```bash
# Build production AAB
npm run build:android:production
```

### **Step 3: Play Store Submission**
```bash
# Submit to internal testing first
npm run submit:android

# Or submit to specific track
eas submit --platform android --track internal
```

### **Step 4: Store Listing**
```bash
# Complete in Play Console:
# 1. App description
# 2. Screenshots (phone, tablet)
# 3. Feature graphic
# 4. Privacy policy link
# 5. Content rating
```

### **Step 5: Release Management**
```bash
# Progression through tracks:
# Internal → Closed Testing → Open Testing → Production

# For closed testing
eas submit --platform android --track alpha

# For open testing  
eas submit --platform android --track beta

# For production
eas submit --platform android --track production
```

## 📱 Testing Tracks

### **Internal Testing**
- **Purpose**: Team testing
- **Users**: Up to 100 internal testers
- **Review**: No Google review required
- **Timeline**: Immediate availability

### **Closed Testing (Alpha)**
- **Purpose**: Limited user testing
- **Users**: Up to 2,000 testers via email list
- **Review**: No Google review required
- **Timeline**: Immediate availability

### **Open Testing (Beta)**
- **Purpose**: Public beta testing
- **Users**: Anyone can join via Play Store link
- **Review**: Limited Google review
- **Timeline**: 1-2 hours

### **Production**
- **Purpose**: Public release
- **Users**: All Play Store users
- **Review**: Full Google review
- **Timeline**: 1-3 days

## 🔧 Version Management

### **Version Bumping**
```json
// app.json - Update before each build
{
  "expo": {
    "version": "1.0.9",      // Semantic version (matches iOS)
    "android": {
      "versionCode": 1       // Increment for each Play Store upload
    }
  }
}
```

### **Automated Version Bumping**
```bash
# EAS can auto-increment versionCode
# Add to eas.json production profile:
{
  "android": {
    "buildType": "aab",
    "autoIncrement": "versionCode"
  }
}
```

## 🛠️ Troubleshooting

### **Common Issues**

#### Build Failures
```bash
# Check EAS authentication
eas login

# Clear cache
eas build:clear-cache

# Check app.json syntax
npx expo doctor
```

#### Upload Failures
```bash
# Ensure versionCode is incremented
# Check service account permissions
# Verify AAB file isn't corrupted
```

#### Permission Issues
```bash
# Android requires explicit permission declarations
# Check app.json permissions array
# Test on actual device, not emulator
```

## 📊 Monitoring

### **Play Console Metrics**
- Crashes and ANRs
- User acquisition
- Revenue (if applicable)
- User reviews and ratings

### **Key Performance Indicators**
- Install rate
- Crash-free sessions
- User retention
- App size optimization

## 🔐 Security Checklist

- [ ] Keystore file not in version control
- [ ] Service account JSON not in version control
- [ ] API keys properly configured
- [ ] App permissions minimal and justified
- [ ] Network traffic uses HTTPS
- [ ] User data properly protected

## 📞 Support Resources

### **Documentation**
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)

### **Community**
- Expo Discord
- React Native Community
- Stack Overflow

---

## ✅ Ready for Production

Once all items are checked, your Android app is ready for Play Store deployment!

**Estimated Timeline:**
- Setup: 1-2 hours
- First build: 30 minutes
- Store review: 1-3 days
- Total: 1-4 days to live app

#!/bin/bash

# Android Testing Script for SeKondly App
# Usage: ./test-android-build.sh

echo "🤖 SeKondly Android Build Testing"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the SekondlyApp directory${NC}"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}⚠️  EAS CLI not found. Installing...${NC}"
    npm install -g @expo/eas-cli
fi

echo ""
echo "🔍 Pre-build Checks"
echo "==================="

# Check app.json configuration
echo -n "📱 Checking app.json Android config... "
if grep -q '"package".*"com.sekondly.app"' app.json; then
    echo -e "${GREEN}✅ Android package name configured${NC}"
else
    echo -e "${RED}❌ Android package name missing${NC}"
    exit 1
fi

# Check eas.json configuration
echo -n "🔧 Checking eas.json Android config... "
if grep -q '"android"' eas.json; then
    echo -e "${GREEN}✅ Android build configuration found${NC}"
else
    echo -e "${RED}❌ Android build configuration missing${NC}"
    exit 1
fi

# Check permissions
echo -n "🔐 Checking Android permissions... "
if grep -q "CAMERA\|RECORD_AUDIO" app.json; then
    echo -e "${GREEN}✅ Required permissions configured${NC}"
else
    echo -e "${RED}❌ Required permissions missing${NC}"
    exit 1
fi

echo ""
echo "🏗️  Building Android Preview"
echo "============================"

# Build preview APK
echo "📦 Starting Android preview build..."
eas build --platform android --profile preview --non-interactive

# Check build status
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Android build completed successfully!${NC}"
    echo ""
    echo "📱 Next Steps:"
    echo "1. Download the APK from the EAS build page"
    echo "2. Install on Android device for testing"
    echo "3. Test all core features:"
    echo "   - User authentication"
    echo "   - Voice recording"
    echo "   - Camera/gallery access"
    echo "   - Push notifications"
    echo "   - Case creation and viewing"
    echo ""
    echo "🚀 To build for production:"
    echo "   npm run build:android:production"
    echo ""
    echo "📤 To submit to Play Store:"
    echo "   npm run submit:android"
else
    echo -e "${RED}❌ Android build failed!${NC}"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check your internet connection"
    echo "2. Verify EAS account authentication: eas login"
    echo "3. Check build logs for specific errors"
    echo "4. Ensure all dependencies are installed: npm install"
    exit 1
fi

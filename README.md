# DENSE - AI-Powered Workout App

## 🚀 Deployment Guide: From Code to TestFlight

This guide covers the steps to deploy the DENSE app to Apple TestFlight using Expo EAS.

### Prerequisites

1. **Apple Developer Account** ($99/year) - enrolled and active
2. **Expo Account** - logged in via CLI
3. **EAS CLI** installed globally

---

### Phase 1: Environment Setup

#### 1. Install EAS CLI
If you haven't already:
```bash
npm install -g eas-cli
```

#### 2. Login to Expo
```bash
eas login
```

#### 3. Configure Project
Link your project to EAS:
```bash
eas build:configure
```
*Select `iOS` when prompted.*

---

### Phase 2: Configuration & Secrets

#### 1. Add Secrets to EAS
Your local `.env` file is not uploaded to EAS. You must set these secrets in the cloud:

```bash
# Gemini API Key
eas secret:create --scope project --name GEMINI_API_KEY --value "YOUR_GEMINI_API_KEY" --type string

# Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_SUPABASE_URL" --type string

# Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_SUPABASE_ANON_KEY" --type string
```

> **Note**: Get these values from your local `.env` file.

#### 2. Verify App Configuration
Check `app.config.js` for:
- **Bundle Identifier**: Ensure `ios.bundleIdentifier` (e.g., `app.dense`) is unique.
- **Privacy Policy**: Ensure `privacyPolicyUrl` is accessible.
- **Assets**: Check if icon (`assets/images/icon.png`) and splash screen exist.

---

### Phase 3: Build & Submit

#### 1. Create the Build
This compiles your app in the cloud and creates an `.ipa` file:

```bash
eas build --platform ios --profile production
```

- You will be prompted to log in to your Apple Developer account.
- EAS will handle certificate and provisioning profile generation automatically.
- **Wait time**: ~15-30 minutes.

#### 2. Submit to App Store Connect
Once the build is successful:

```bash
eas submit --platform ios --latest
```

- This uploads the binary to App Store Connect.
- You'll need an **App-Specific Password** (create at [appleid.apple.com](https://appleid.apple.com)).

---

### Phase 4: App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com).
2. Click **My Apps** → **(+) New App**.
3. **Fill Details**:
   - **Name**: DENSE
   - **Bundle ID**: Select the one created by EAS (e.g., `app.dense`)
   - **SKU**: `dense-app-v1` (or similar unique string)
   - **Primary Language**: English (US)

4. **TestFlight Tab**:
   - Go to **TestFlight** tab.
   - You should see your uploaded build (Processing → Ready to Submit).
   - **Missing Compliance**: If asked about encryption, select "No" (unless you added custom encryption).

5. **Add Testers**:
   - **Internal Testing**: Add your own email. You'll get an invite immediately.
   - **External Testing**: Create a group, add emails. Requires Beta App Review (approx. 24h).

---

### ⚠️ Common Issues & Fixes

**"Bundle ID not available"**
- Change `ios.bundleIdentifier` in `app.config.js` to something unique (e.g., `com.lazarovtwins.dense`).
- Run `eas build` again.

**"Missing Info.plist keys"**
- Ensure camera permissions are in `app.config.js`:
  ```js
  NSCameraUsageDescription: "This app uses the camera to scan food barcodes."
  ```

**"Build Failed"**
- Check the error logs link provided by EAS.
- Common causes: Type errors, missing assets, or dependency conflicts.

---

### 📦 Project Info

**Tech Stack**:
- React Native (Expo SDK 52)
- TypeScript
- Supabase (Backend & Auth)
- Google Gemini AI (Workout Generation)
- NativeWind (Styling)

**Key Commands**:
- `npm start` - Run local development server
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Apply migrations to Supabase


# 🚀 RevenueCat Setup Guide

## ✅ CURRENT STATUS: RevenueCat Integration Complete ✅

Your app is now **fully integrated** with RevenueCat hybrid system! 

**🎯 Current Setup:**
- ✅ **Hybrid subscription service** installed and active
- ✅ **Legacy system** works perfectly (current mode)
- ✅ **RevenueCat integration** ready to activate
- ✅ **Auto-switching** when API keys are configured
- ✅ **Migration modal** for existing users
- ✅ **Settings panel** shows current system status

**👨‍💻 For Developers:** App works perfectly as-is for development and testing

**📱 For Production:** When you get your Apple Developer account, follow these steps:

---

## 📋 STEP 1: Apple Developer Account Setup

### **1.1 Create App in App Store Connect**
```
1. Go to App Store Connect
2. Create New App
3. Set Bundle ID: com.yourcompany.dense (or your choice)
4. Fill basic app information
```

### **1.2 Create Subscription Products**
```
In App Store Connect → Your App → Features → In-App Purchases:

Product 1:
- Product ID: app.dense.monthly.pro
- Type: Auto-Renewable Subscription
- Price: $7.99 USD
- Duration: 1 Month

Product 2:
- Product ID: app.dense.sixmonths.pro
- Type: Auto-Renewable Subscription
- Price: $35.99 USD
- Duration: 6 Months

Product 3:
- Product ID: app.dense.yearly.pro
- Type: Auto-Renewable Subscription
- Price: $47.99 USD
- Duration: 1 Year
```

---

## 📋 STEP 2: RevenueCat Dashboard Setup

### **2.1 Create RevenueCat Account**
```
1. Go to app.revenuecat.com
2. Create free account
3. Create new project: "DENSE Fitness"
```

### **2.2 Add iOS App**
```
1. Add App → iOS
2. Bundle ID: [Same as App Store Connect]
3. App Store Connect Integration:
   - Link your Apple Developer account
   - Select your app
```

### **2.3 Create Entitlement**
```
1. Go to Entitlements
2. Create new: "pro_features"
3. Attach all 3 subscription products
```

### **2.4 Copy API Keys**
```
1. Go to Project Settings
2. Copy iOS API Key (starts with "appl_")
3. Save for next step
```

---

## 📋 STEP 3: App Configuration

### **3.1 Create Environment File**
```bash
# Copy the example file
cp env.example .env

# Edit .env and add your RevenueCat API key:
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_actual_api_key_here
```

### **3.2 Replace Subscription Service**
```bash
# Switch to hybrid system (if not done already)
# Note: subscription-service.js already contains the hybrid functionality
```

### **3.3 Test the Integration**
```bash
# Build and test
npm start
npx expo run:ios --device

# Check Settings → Subscription System
# Should show "RevenueCat (Secure Server Validation)"
```

---

## 📋 STEP 4: Testing

### **4.1 Sandbox Testing**
```
1. Create Sandbox test account in App Store Connect
2. Sign out of App Store on device
3. Sign in with sandbox account
4. Test subscription purchases
5. Verify in RevenueCat dashboard
```

### **4.2 Verify Features**
```
✅ Purchase subscriptions
✅ Restore purchases
✅ Cross-device sync
✅ Trial handling
✅ RevenueCat dashboard shows data
```

---

## 🎯 WHAT'S ALREADY DONE IN YOUR APP

✅ **RevenueCat SDK** installed (`react-native-purchases`)
✅ **Hybrid subscription service** that automatically detects RevenueCat
✅ **Legacy system fallback** (current working system)
✅ **Migration modal** for existing users
✅ **Environment configuration** ready
✅ **Settings panel** shows current status
✅ **Error handling** and graceful fallbacks

---

## 🚨 WHEN YOU'RE READY

1. **Get Apple Developer Account** ($99/year)
2. **Follow Steps 1-3** above (should take 2-3 hours)
3. **Test everything** in sandbox
4. **Deploy to TestFlight**

Your app will **automatically upgrade** from legacy to RevenueCat when properly configured!

---

## 💡 CURRENT APP STATUS

- ✅ **Works perfectly** with current legacy system
- ✅ **Ready to upgrade** when you add RevenueCat API keys
- ✅ **Zero downtime** migration
- ✅ **Existing users protected** with migration modal

**You can continue developing other features while waiting for Apple Developer account!**


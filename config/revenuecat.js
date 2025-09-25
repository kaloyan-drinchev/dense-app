// RevenueCat Configuration
// API Keys from RevenueCat Dashboard

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || 'your_ios_api_key_here';
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || 'your_android_api_key_here';

// Development mode flag
const IS_DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// Force legacy subscriptions (for development without RevenueCat)
const FORCE_LEGACY = process.env.EXPO_PUBLIC_FORCE_LEGACY_SUBSCRIPTIONS === 'true';

// Check if RevenueCat is properly configured
const isRevenueCatConfigured = () => {
  const hasKeys = IOS_API_KEY && IOS_API_KEY !== 'your_ios_api_key_here';
  return hasKeys && !FORCE_LEGACY;
};

export {
  IOS_API_KEY,
  ANDROID_API_KEY,
  IS_DEV_MODE,
  FORCE_LEGACY,
  isRevenueCatConfigured,
};


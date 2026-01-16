import { Platform } from 'react-native';

// 🎭 MOCK MODE - Set to true for development without RevenueCat
export const USE_MOCK_PAYMENTS = true; // ⚠️ Set to false when ready to use real payments

// 1. REVENUECAT API KEYS
// TODO: Replace these with your actual keys from the RevenueCat Dashboard
export const REVENUECAT_KEYS = {
  apple: 'appl_YOUR_IOS_KEY_HERE', 
  google: 'goog_YOUR_ANDROID_KEY_HERE', 
};

// 2. PLAN IDS (Must match RevenueCat Identifiers exactly)
export const ENTITLE_ID = 'pro'; // The name of your Entitlement in RC

// 3. UI CONFIGURATION
// RevenueCat gives us Price/Duration. We provide Features/Labels locally.
export const PLAN_METADATA: Record<string, { features: string[]; bestValue: boolean; label: string }> = {
  'dense_monthly_pro': {
    features: ['Unlimited AI Workouts', 'Nutrition Guidance', 'Progress Tracking'],
    bestValue: false,
    label: 'Monthly',
  },
  'dense_sixmonths_pro': {
    features: ['All Monthly Features', 'Save 25%', 'Priority Support'],
    bestValue: false,
    label: '6 Months',
  },
  'dense_yearly_pro': {
    features: ['All Pro Features', 'Save 50%', 'Advanced Analytics', 'VIP Support'],
    bestValue: true,
    label: 'Annual',
  }
};

// 4. MOCK DATA (Used when USE_MOCK_PAYMENTS = true)
export const MOCK_PLANS = [
  {
    id: '$rc_monthly',
    identifier: 'dense_monthly_pro',
    priceString: '$9.99',
    title: 'Monthly Pro',
    description: 'Billed monthly',
    features: PLAN_METADATA['dense_monthly_pro'].features,
    bestValue: PLAN_METADATA['dense_monthly_pro'].bestValue,
    label: PLAN_METADATA['dense_monthly_pro'].label,
  },
  {
    id: '$rc_six_month',
    identifier: 'dense_sixmonths_pro',
    priceString: '$49.99',
    title: 'Six Month Pro',
    description: 'Billed every 6 months',
    features: PLAN_METADATA['dense_sixmonths_pro'].features,
    bestValue: PLAN_METADATA['dense_sixmonths_pro'].bestValue,
    label: PLAN_METADATA['dense_sixmonths_pro'].label,
  },
  {
    id: '$rc_annual',
    identifier: 'dense_yearly_pro',
    priceString: '$79.99',
    title: 'Annual Pro',
    description: 'Billed yearly - Best Value',
    features: PLAN_METADATA['dense_yearly_pro'].features,
    bestValue: PLAN_METADATA['dense_yearly_pro'].bestValue,
    label: PLAN_METADATA['dense_yearly_pro'].label,
  },
];

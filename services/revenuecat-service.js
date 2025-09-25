import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { IOS_API_KEY, ANDROID_API_KEY, IS_DEV_MODE } from '../config/revenuecat';

// Subscription Plans Configuration
const SUBSCRIPTION_PLANS = {
  monthly: {
    id: 'app.dense.monthly.pro',
    identifier: 'dense_monthly_pro',
    price: '$7.99',
    title: 'Monthly Pro',
    description: 'Full access to all features'
  },
  sixMonths: {
    id: 'app.dense.sixmonths.pro',
    identifier: 'dense_sixmonths_pro',
    price: '$35.99',
    title: '6 Months Pro',
    description: 'Save 25% with 6-month plan'
  },
  yearly: {
    id: 'app.dense.yearly.pro',
    identifier: 'dense_yearly_pro',
    price: '$47.99',
    title: 'Yearly Pro',
    description: 'Save 50% with annual plan'
  }
};

// Initialize RevenueCat
const initializeRevenueCat = async (userID = null) => {
  try {
    console.log('[RevenueCat] Initializing...');
    
    // Configure RevenueCat
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: IOS_API_KEY });
    } else {
      Purchases.configure({ apiKey: ANDROID_API_KEY });
    }

    // Set debug logs in development
    if (IS_DEV_MODE) {
      Purchases.setLogLevel('debug');
    }

    // Set user ID if provided
    if (userID) {
      await Purchases.logIn(userID);
    }

    console.log('[RevenueCat] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[RevenueCat] Initialization failed:', error);
    return false;
  }
};

// Get available packages (subscription products)
const getPackages = async () => {
  try {
    console.log('[RevenueCat] Fetching packages...');
    const offerings = await Purchases.getOfferings();
    
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      console.log('[RevenueCat] Packages loaded:', offerings.current.availablePackages.length);
      return offerings.current.availablePackages;
    }
    
    console.warn('[RevenueCat] No packages available');
    return [];
  } catch (error) {
    console.error('[RevenueCat] Failed to get packages:', error);
    return [];
  }
};

// Purchase a package
const purchasePackage = async (packageToPurchase) => {
  try {
    console.log('[RevenueCat] Starting purchase:', packageToPurchase.identifier);
    
    const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
    
    console.log('[RevenueCat] Purchase successful:', productIdentifier);
    return {
      success: true,
      customerInfo,
      productIdentifier
    };
  } catch (error) {
    console.error('[RevenueCat] Purchase failed:', error);
    return {
      success: false,
      error: error.message,
      userCancelled: error.userCancelled
    };
  }
};

// Restore purchases
const restorePurchases = async () => {
  try {
    console.log('[RevenueCat] Restoring purchases...');
    
    const customerInfo = await Purchases.restorePurchases();
    
    console.log('[RevenueCat] Restore successful');
    return {
      success: true,
      customerInfo
    };
  } catch (error) {
    console.error('[RevenueCat] Restore failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get customer info
const getCustomerInfo = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Failed to get customer info:', error);
    return null;
  }
};

// Check if user has active subscription
const hasActiveSubscription = async () => {
  try {
    const customerInfo = await getCustomerInfo();
    return customerInfo && Object.keys(customerInfo.entitlements.active).length > 0;
  } catch (error) {
    console.error('[RevenueCat] Failed to check subscription status:', error);
    return false;
  }
};

// Set user ID
const setUserID = async (userID) => {
  try {
    await Purchases.logIn(userID);
    console.log('[RevenueCat] User ID set:', userID);
    return true;
  } catch (error) {
    console.error('[RevenueCat] Failed to set user ID:', error);
    return false;
  }
};

// Log out user
const logOut = async () => {
  try {
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out');
    return true;
  } catch (error) {
    console.error('[RevenueCat] Failed to log out:', error);
    return false;
  }
};

export {
  SUBSCRIPTION_PLANS,
  initializeRevenueCat,
  getPackages,
  purchasePackage,
  restorePurchases,
  getCustomerInfo,
  hasActiveSubscription,
  setUserID,
  logOut,
};


// RevenueCat-based Subscription Service
// This replaces the legacy subscription service with RevenueCat integration

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { 
  initializeRevenueCat, 
  getPackages, 
  purchasePackage, 
  restorePurchases as rcRestorePurchases,
  hasActiveSubscription,
  getCustomerInfo,
  setUserID,
  logOut as rcLogOut,
  SUBSCRIPTION_PLANS 
} from './revenuecat-service';

// Storage keys
const SUBSCRIPTION_STATUS_KEY = '@subscription_status';
const TRIAL_START_KEY = '@trial_start_date';
const LAST_PURCHASE_KEY = '@last_purchase_date';

// Initialize the service
const initialize = async (userID = null) => {
  try {
    console.log('[SubscriptionService] Initializing RevenueCat service...');
    
    const success = await initializeRevenueCat(userID);
    if (!success) {
      throw new Error('Failed to initialize RevenueCat');
    }

    // Sync with RevenueCat status
    await syncSubscriptionStatus();
    
    console.log('[SubscriptionService] RevenueCat service initialized');
    return true;
  } catch (error) {
    console.error('[SubscriptionService] Failed to initialize:', error);
    return false;
  }
};

// Sync local status with RevenueCat
const syncSubscriptionStatus = async () => {
  try {
    const isActive = await hasActiveSubscription();
    const customerInfo = await getCustomerInfo();
    
    // Update local storage
    await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, JSON.stringify({
      isActive,
      lastSync: new Date().toISOString(),
      source: 'revenuecat'
    }));

    console.log('[SubscriptionService] Status synced:', isActive);
    return isActive;
  } catch (error) {
    console.error('[SubscriptionService] Failed to sync status:', error);
    return false;
  }
};

// Check subscription status
const checkSubscriptionStatus = async () => {
  try {
    // Always check with RevenueCat for real-time status
    const isActive = await hasActiveSubscription();
    
    // Update local cache
    await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, JSON.stringify({
      isActive,
      lastSync: new Date().toISOString(),
      source: 'revenuecat'
    }));

    return {
      isSubscribed: isActive,
      source: 'revenuecat',
      trial: null // RevenueCat handles trials automatically
    };
  } catch (error) {
    console.error('[SubscriptionService] Failed to check status:', error);
    
    // Fallback to cached status
    try {
      const cached = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
      if (cached) {
        const status = JSON.parse(cached);
        return {
          isSubscribed: status.isActive || false,
          source: 'cached',
          trial: null
        };
      }
    } catch (cacheError) {
      console.error('[SubscriptionService] Cache read failed:', cacheError);
    }

    return {
      isSubscribed: false,
      source: 'error',
      trial: null
    };
  }
};

// Get available subscription plans
const getSubscriptionPlans = async () => {
  try {
    const packages = await getPackages();
    
    if (packages && packages.length > 0) {
      // Map RevenueCat packages to our plan format
      return packages.map(pkg => ({
        id: pkg.identifier,
        name: pkg.product.title || 'Pro Plan',
        price: pkg.product.priceString,
        originalPrice: pkg.product.priceString,
        savings: null,
        duration: pkg.product.subscriptionPeriod || '1 month',
        isPopular: pkg.identifier.includes('yearly'),
        packageData: pkg // Store RevenueCat package for purchase
      }));
    }

    // Fallback to static plans if RevenueCat packages not available
    return [
      {
        id: 'monthly',
        name: 'Monthly Pro',
        price: '$7.99',
        originalPrice: '$7.99',
        savings: null,
        duration: '1 month',
        isPopular: false
      },
      {
        id: 'sixmonths',
        name: '6 Months Pro',
        price: '$35.99',
        originalPrice: '$47.94',
        savings: '25%',
        duration: '6 months',
        isPopular: true
      },
      {
        id: 'yearly',
        name: 'Yearly Pro',
        price: '$47.99',
        originalPrice: '$95.88',
        savings: '50%',
        duration: '1 year',
        isPopular: false
      }
    ];
  } catch (error) {
    console.error('[SubscriptionService] Failed to get plans:', error);
    return [];
  }
};

// Subscribe to a plan
const subscribe = async (planId) => {
  try {
    console.log('[SubscriptionService] Starting subscription:', planId);
    
    // Get packages
    const packages = await getPackages();
    if (!packages || packages.length === 0) {
      throw new Error('No subscription packages available');
    }

    // Find the matching package
    let targetPackage = packages.find(pkg => 
      pkg.identifier.includes(planId) || 
      pkg.product.identifier.includes(planId)
    );

    // If no exact match, try the first package
    if (!targetPackage) {
      targetPackage = packages[0];
    }

    console.log('[SubscriptionService] Purchasing package:', targetPackage.identifier);
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Make the purchase
    const result = await purchasePackage(targetPackage);
    
    if (result.success) {
      console.log('[SubscriptionService] Purchase successful');
      
      // Success haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Update local status
      await syncSubscriptionStatus();
      
      // Store purchase info
      await AsyncStorage.setItem(LAST_PURCHASE_KEY, JSON.stringify({
        planId,
        purchaseDate: new Date().toISOString(),
        productIdentifier: result.productIdentifier
      }));

      return {
        success: true,
        message: 'Subscription activated successfully!'
      };
    } else {
      console.log('[SubscriptionService] Purchase failed:', result.error);
      
      // Error haptic (only if not user cancelled)
      if (!result.userCancelled) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      return {
        success: false,
        message: result.userCancelled ? 'Purchase cancelled' : (result.error || 'Purchase failed'),
        userCancelled: result.userCancelled
      };
    }
  } catch (error) {
    console.error('[SubscriptionService] Subscribe failed:', error);
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    return {
      success: false,
      message: error.message || 'Subscription failed'
    };
  }
};

// Restore purchases
const restorePurchases = async () => {
  try {
    console.log('[SubscriptionService] Restoring purchases...');
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await rcRestorePurchases();
    
    if (result.success) {
      console.log('[SubscriptionService] Restore successful');
      
      // Sync status
      const isActive = await syncSubscriptionStatus();
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      return {
        success: true,
        hasActiveSubscription: isActive,
        message: isActive ? 'Subscription restored successfully!' : 'No active subscriptions found'
      };
    } else {
      console.log('[SubscriptionService] Restore failed:', result.error);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      return {
        success: false,
        message: result.error || 'Failed to restore purchases'
      };
    }
  } catch (error) {
    console.error('[SubscriptionService] Restore failed:', error);
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    return {
      success: false,
      message: error.message || 'Failed to restore purchases'
    };
  }
};

// Set user identifier
const setUserIdentifier = async (userID) => {
  try {
    const success = await setUserID(userID);
    if (success) {
      await syncSubscriptionStatus();
    }
    return success;
  } catch (error) {
    console.error('[SubscriptionService] Failed to set user ID:', error);
    return false;
  }
};

// Clear user data
const clearUserData = async () => {
  try {
    // Log out from RevenueCat
    await rcLogOut();
    
    // Clear local storage
    await AsyncStorage.multiRemove([
      SUBSCRIPTION_STATUS_KEY,
      TRIAL_START_KEY,
      LAST_PURCHASE_KEY
    ]);
    
    console.log('[SubscriptionService] User data cleared');
    return true;
  } catch (error) {
    console.error('[SubscriptionService] Failed to clear user data:', error);
    return false;
  }
};

// Get purchase history (basic info)
const getPurchaseHistory = async () => {
  try {
    const customerInfo = await getCustomerInfo();
    
    if (customerInfo && customerInfo.allPurchaseDates) {
      return Object.entries(customerInfo.allPurchaseDates).map(([productId, date]) => ({
        productId,
        purchaseDate: date.toISOString(),
        source: 'revenuecat'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('[SubscriptionService] Failed to get purchase history:', error);
    return [];
  }
};

// Export all functions
export {
  initialize,
  checkSubscriptionStatus,
  getSubscriptionPlans,
  subscribe,
  restorePurchases,
  setUserIdentifier,
  clearUserData,
  getPurchaseHistory,
  syncSubscriptionStatus,
};


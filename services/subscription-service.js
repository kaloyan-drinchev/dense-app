// Hybrid Subscription Service
// Automatically switches between Legacy and RevenueCat based on configuration

import { Platform } from 'react-native';
import { isRevenueCatConfigured } from '../config/revenuecat';

// Import Legacy service (always available)
import { subscriptionService as LegacyService } from './subscription-service-legacy';

// Import RevenueCat service only on native platforms
let RevenueCatService = null;
if (Platform.OS !== 'web') {
  try {
    RevenueCatService = require('./subscription-service-revenuecat');
  } catch (error) {
    console.warn('[HybridService] RevenueCat service not available:', error.message);
  }
}

// Detect which service to use
const getActiveService = () => {
  // On web or if RevenueCat is not available, always use Legacy
  if (Platform.OS === 'web' || !RevenueCatService) {
    console.log('[HybridService] Using Legacy subscription service (web or RevenueCat unavailable)');
    return LegacyService;
  }
  
  const useRevenueCat = isRevenueCatConfigured();
  
  console.log(`[HybridService] Using ${useRevenueCat ? 'RevenueCat' : 'Legacy'} subscription service`);
  
  return useRevenueCat ? RevenueCatService : LegacyService;
};

// Get current service info
const getServiceInfo = () => {
  // On web or if RevenueCat is not available, always return legacy
  if (Platform.OS === 'web' || !RevenueCatService) {
    return {
      service: 'legacy',
      configured: false,
      description: Platform.OS === 'web' ? 
        'Legacy System (Web Platform)' : 
        'Legacy System (RevenueCat Unavailable)'
    };
  }
  
  const useRevenueCat = isRevenueCatConfigured();
  
  return {
    service: useRevenueCat ? 'revenuecat' : 'legacy',
    configured: useRevenueCat,
    description: useRevenueCat ? 
      'RevenueCat (Secure Server Validation)' : 
      'Legacy System (Development Mode)'
  };
};

// Initialize the active service
const initialize = async (userID = null) => {
  try {
    const service = getActiveService();
    console.log('[HybridService] Initializing subscription service...');
    
    const result = await service.initialize(userID);
    
    const serviceInfo = getServiceInfo();
    console.log(`[HybridService] ${serviceInfo.service} service initialized:`, result);
    
    return result;
  } catch (error) {
    console.error('[HybridService] Failed to initialize:', error);
    return false;
  }
};

// Check subscription status
const checkSubscriptionStatus = async () => {
  try {
    const service = getActiveService();
    
    // Map to correct method based on service type
    let result;
    if (service === LegacyService) {
      // Legacy service uses getSubscriptionStatus()
      result = await service.getSubscriptionStatus();
    } else {
      // RevenueCat service uses checkSubscriptionStatus()
      result = await service.checkSubscriptionStatus();
    }
    
    // Add service info to result
    return {
      ...result,
      serviceInfo: getServiceInfo()
    };
  } catch (error) {
    console.error('[HybridService] Failed to check status:', error);
    return {
      isSubscribed: false,
      source: 'error',
      trial: null,
      serviceInfo: getServiceInfo()
    };
  }
};

// Get subscription plans
const getSubscriptionPlans = async () => {
  try {
    const service = getActiveService();
    
    // Map to correct method based on service type
    if (service === LegacyService) {
      // Legacy service uses getPlans() - non-async
      return service.getPlans();
    } else {
      // RevenueCat service uses getSubscriptionPlans()
      return await service.getSubscriptionPlans();
    }
  } catch (error) {
    console.error('[HybridService] Failed to get plans:', error);
    return [];
  }
};

// Subscribe to a plan
const subscribe = async (planId) => {
  try {
    const service = getActiveService();
    
    // Map to correct method based on service type
    let result;
    if (service === LegacyService) {
      // Legacy service uses purchasePlan()
      result = await service.purchasePlan(planId);
    } else {
      // RevenueCat service uses subscribe()
      result = await service.subscribe(planId);
    }
    
    console.log(`[HybridService] Subscription result (${getServiceInfo().service}):`, result);
    
    return result;
  } catch (error) {
    console.error('[HybridService] Subscribe failed:', error);
    return {
      success: false,
      message: error.message || 'Subscription failed'
    };
  }
};

// Restore purchases
const restorePurchases = async () => {
  try {
    const service = getActiveService();
    const result = await service.restorePurchases();
    
    console.log(`[HybridService] Restore result (${getServiceInfo().service}):`, result);
    
    return result;
  } catch (error) {
    console.error('[HybridService] Restore failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to restore purchases'
    };
  }
};

// Set user identifier
const setUserIdentifier = async (userID) => {
  try {
    const service = getActiveService();
    
    // Legacy service might not have this method
    if (service.setUserIdentifier) {
      return await service.setUserIdentifier(userID);
    }
    
    // For legacy service, just return true
    console.log('[HybridService] User ID setting not supported in legacy mode');
    return true;
  } catch (error) {
    console.error('[HybridService] Failed to set user ID:', error);
    return false;
  }
};

// Clear user data
const clearUserData = async () => {
  try {
    const service = getActiveService();
    
    // Legacy service might not have this method
    if (service.clearUserData) {
      return await service.clearUserData();
    }
    
    // For legacy service, just return true
    console.log('[HybridService] User data clearing not needed in legacy mode');
    return true;
  } catch (error) {
    console.error('[HybridService] Failed to clear user data:', error);
    return false;
  }
};

// Get purchase history
const getPurchaseHistory = async () => {
  try {
    const service = getActiveService();
    
    // Legacy service might not have this method
    if (service.getPurchaseHistory) {
      return await service.getPurchaseHistory();
    }
    
    // For legacy service, return empty array
    console.log('[HybridService] Purchase history not available in legacy mode');
    return [];
  } catch (error) {
    console.error('[HybridService] Failed to get purchase history:', error);
    return [];
  }
};

// Sync subscription status (RevenueCat only)
const syncSubscriptionStatus = async () => {
  try {
    const service = getActiveService();
    
    // Only RevenueCat service has sync method
    if (service.syncSubscriptionStatus) {
      return await service.syncSubscriptionStatus();
    }
    
    // For legacy service, check status instead
    const status = await service.checkSubscriptionStatus();
    return status.isSubscribed;
  } catch (error) {
    console.error('[HybridService] Failed to sync status:', error);
    return false;
  }
};

// Service detection utilities
const isUsingRevenueCat = () => {
  return isRevenueCatConfigured();
};

const isUsingLegacy = () => {
  return !isRevenueCatConfigured();
};

// Migration helper (for when switching from legacy to RevenueCat)
const migrateToRevenueCat = async (userID = null) => {
  try {
    console.log('[HybridService] Starting migration to RevenueCat...');
    
    // Check if already using RevenueCat
    if (isUsingRevenueCat()) {
      console.log('[HybridService] Already using RevenueCat');
      return { success: true, message: 'Already using RevenueCat' };
    }
    
    // This would be called after RevenueCat is properly configured
    // For now, just log the intention
    console.log('[HybridService] Migration will happen automatically when RevenueCat is configured');
    
    return {
      success: true,
      message: 'Migration ready - configure RevenueCat API keys to complete'
    };
  } catch (error) {
    console.error('[HybridService] Migration failed:', error);
    return {
      success: false,
      message: error.message || 'Migration failed'
    };
  }
};

// Create subscription service object
const subscriptionService = {
  initialize,
  checkSubscriptionStatus,
  getSubscriptionPlans,
  subscribe,
  restorePurchases,
  setUserIdentifier,
  clearUserData,
  getPurchaseHistory,
  syncSubscriptionStatus,
  
  // Service info
  getServiceInfo,
  isUsingRevenueCat,
  isUsingLegacy,
  
  // Migration
  migrateToRevenueCat,
};

// Export individual functions for compatibility
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
  
  // Service info
  getServiceInfo,
  isUsingRevenueCat,
  isUsingLegacy,
  
  // Migration
  migrateToRevenueCat,
};

// Export as default for easy importing
export default subscriptionService;

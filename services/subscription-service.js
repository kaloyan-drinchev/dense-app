// Hybrid Subscription Service
// Automatically switches between Legacy and RevenueCat based on configuration

import { Platform } from 'react-native';
import { isRevenueCatConfigured } from '../config/revenuecat';

// Import Legacy service (always available)
import { subscriptionService as LegacyService, SUBSCRIPTION_PLANS as LegacyPlans } from './subscription-service-legacy';

// Import RevenueCat service only on native platforms
let RevenueCatService = null;
let RevenueCatPlans = null;
if (Platform.OS !== 'web') {
  try {
    const rcModule = require('./subscription-service-revenuecat');
    RevenueCatService = rcModule;
    // RevenueCat plans are not exported as named export, use legacy for now
    RevenueCatPlans = LegacyPlans;
  } catch (error) {
    console.warn('[HybridService] RevenueCat service not available:', error.message);
  }
}

// Export subscription plans (use Legacy plans as they're compatible with both services)
export const SUBSCRIPTION_PLANS = LegacyPlans;

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
      // Legacy service uses getSubscriptionStatus() and returns { isActive, endDate, ... } or null
      const legacyResult = await service.getSubscriptionStatus();
      // Normalize to hybrid format
      result = legacyResult ? {
        isSubscribed: legacyResult.isActive || false,
        isActive: legacyResult.isActive || false,
        endDate: legacyResult.endDate,
        planId: legacyResult.planId,
        source: 'legacy'
      } : {
        isSubscribed: false,
        isActive: false,
        source: 'legacy'
      };
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
      isActive: false,
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
    
    // For legacy service, check status using our normalized method
    const status = await checkSubscriptionStatus();
    return status?.isSubscribed || false;
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

// Get trial status
const getTrialStatus = async () => {
  try {
    const service = getActiveService();
    
    // Check if service has getTrialStatus method
    if (service.getTrialStatus) {
      return await service.getTrialStatus();
    }
    
    // Fallback for services without trial support
    return {
      isActive: false,
      daysRemaining: 0,
      endDate: null
    };
  } catch (error) {
    console.error('[HybridService] Failed to get trial status:', error);
    return {
      isActive: false,
      daysRemaining: 0,
      endDate: null
    };
  }
};

// Get subscription status (legacy method name - same as checkSubscriptionStatus)
const getSubscriptionStatus = async () => {
  // Just use checkSubscriptionStatus for consistency
  return await checkSubscriptionStatus();
};

// Get subscription status type (for navigation logic)
const getSubscriptionStatusType = async () => {
  try {
    const service = getActiveService();
    
    // Check if service has getSubscriptionStatusType method
    if (service.getSubscriptionStatusType) {
      return await service.getSubscriptionStatusType();
    }
    
    // Fallback logic for services without this method
    const status = await getSubscriptionStatus();
    const trialStatus = await getTrialStatus();
    
    // Priority: trial > active subscription > expired > none
    if (trialStatus?.isActive) {
      return 'trial_active';
    }
    
    if (status?.isSubscribed) {
      return 'subscription_active';
    }
    
    return 'no_subscription';
  } catch (error) {
    console.error('[HybridService] Failed to get subscription status type:', error);
    return 'no_subscription';
  }
};

// Check if subscription is cancelled
const isSubscriptionCancelled = async () => {
  try {
    const service = getActiveService();
    
    // Check if service has isSubscriptionCancelled method
    if (service.isSubscriptionCancelled) {
      return await service.isSubscriptionCancelled();
    }
    
    // Fallback for services without this method
    return false;
  } catch (error) {
    console.error('[HybridService] Failed to check if subscription is cancelled:', error);
    return false;
  }
};

// Check if user can start a trial
const canStartTrial = async () => {
  try {
    const service = getActiveService();
    
    // Check if service has canStartTrial method
    if (service.canStartTrial) {
      return await service.canStartTrial();
    }
    
    // Fallback for services without this method
    return false;
  } catch (error) {
    console.error('[HybridService] Failed to check trial eligibility:', error);
    return false;
  }
};

// Start free trial
const startFreeTrial = async () => {
  try {
    const service = getActiveService();
    
    // Check if service has startFreeTrial method
    if (service.startFreeTrial) {
      return await service.startFreeTrial();
    }
    
    // Fallback for services without this method
    return {
      success: false,
      message: 'Trial not supported by this service'
    };
  } catch (error) {
    console.error('[HybridService] Failed to start trial:', error);
    return {
      success: false,
      message: error.message || 'Failed to start trial'
    };
  }
};

// Set subscription end date
const setSubscriptionEndDate = async (daysFromNow, disableAutoRenew = false) => {
  try {
    const service = getActiveService();
    
    // Check if service has setSubscriptionEndDate method
    if (service.setSubscriptionEndDate) {
      return await service.setSubscriptionEndDate(daysFromNow, disableAutoRenew);
    }
    
    // Fallback for services without this method
    return {
      success: false,
      message: 'Setting subscription end date not supported by this service'
    };
  } catch (error) {
    console.error('[HybridService] Failed to set subscription end date:', error);
    return {
      success: false,
      message: error.message || 'Failed to set subscription end date'
    };
  }
};

// Get plan by ID
const getPlan = (planId) => {
  try {
    const service = getActiveService();
    
    // Check if service has getPlan method (only Legacy service has this)
    if (service === LegacyService && service.getPlan) {
      return service.getPlan(planId);
    }
    
    // Fallback - find in plans array (works for both Legacy and RevenueCat)
    if (SUBSCRIPTION_PLANS && Array.isArray(SUBSCRIPTION_PLANS)) {
      return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
    }
    
    return null;
  } catch (error) {
    console.error('[HybridService] Failed to get plan:', error);
    return null;
  }
};

// Purchase plan (legacy method name for subscribe)
const purchasePlan = async (planId) => {
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
    
    console.log(`[HybridService] Purchase result (${getServiceInfo().service}):`, result);
    
    return result;
  } catch (error) {
    console.error('[HybridService] Purchase failed:', error);
    return {
      success: false,
      message: error.message || 'Purchase failed'
    };
  }
};

// Get payment provider info
const getPaymentProviderInfo = () => {
  try {
    const service = getActiveService();
    
    // Check if service has getPaymentProviderInfo method (only Legacy service has this)
    if (service === LegacyService && service.getPaymentProviderInfo) {
      return service.getPaymentProviderInfo();
    }
    
    // For RevenueCat or fallback
    const serviceInfo = getServiceInfo();
    return {
      provider: serviceInfo.service,
      displayName: serviceInfo.service === 'revenuecat' ? 'RevenueCat' : 'Development Mode',
      description: serviceInfo.description
    };
  } catch (error) {
    console.error('[HybridService] Failed to get payment provider info:', error);
    return {
      provider: 'error',
      displayName: 'Error',
      description: 'Failed to get payment provider info'
    };
  }
};

// Switch payment provider (legacy only)
const switchPaymentProvider = (provider) => {
  try {
    const service = getActiveService();
    
    // Only Legacy service has this method
    if (service === LegacyService && service.switchPaymentProvider) {
      return service.switchPaymentProvider(provider);
    }
    
    console.warn('[HybridService] switchPaymentProvider not supported by RevenueCat service');
    return false;
  } catch (error) {
    console.error('[HybridService] Failed to switch payment provider:', error);
    return false;
  }
};

// Create subscription service object
const subscriptionService = {
  initialize,
  checkSubscriptionStatus,
  getSubscriptionStatus,
  getSubscriptionStatusType,
  getTrialStatus,
  isSubscriptionCancelled,
  canStartTrial,
  startFreeTrial,
  setSubscriptionEndDate,
  getPlan,
  getSubscriptionPlans,
  subscribe,
  purchasePlan,
  restorePurchases,
  setUserIdentifier,
  clearUserData,
  getPurchaseHistory,
  syncSubscriptionStatus,
  getPaymentProviderInfo,
  switchPaymentProvider,
  
  // Service info
  getServiceInfo,
  isUsingRevenueCat,
  isUsingLegacy,
  
  // Migration
  migrateToRevenueCat,
};

// Export individual functions for compatibility
export {
  // Main service object (for named imports)
  subscriptionService,
  
  // Individual functions
  initialize,
  checkSubscriptionStatus,
  getSubscriptionStatus,
  getSubscriptionStatusType,
  getTrialStatus,
  isSubscriptionCancelled,
  canStartTrial,
  startFreeTrial,
  setSubscriptionEndDate,
  getPlan,
  getSubscriptionPlans,
  subscribe,
  purchasePlan,
  restorePurchases,
  setUserIdentifier,
  clearUserData,
  getPurchaseHistory,
  syncSubscriptionStatus,
  getPaymentProviderInfo,
  switchPaymentProvider,
  
  // Service info
  getServiceInfo,
  isUsingRevenueCat,
  isUsingLegacy,
  
  // Migration
  migrateToRevenueCat,
};

// Export as default for easy importing
export default subscriptionService;

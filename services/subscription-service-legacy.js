import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { appleIAPService } from './apple-iap-service.js';

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = [
  {
    id: 'yearly',
    name: 'Annual Pro',
    duration: 12,
    price: 47.99,
    monthlyPrice: 4.00,
    originalPrice: 119.88,
    savings: 71.89,
    savingsPercentage: 60,
    features: [
      'Unlimited AI workouts',
      'Progress tracking',
      'Nutrition guidance',
      'Premium support',
      'Advanced analytics',
      'Priority support'
    ],
    isPopular: true,
    bonusFeatures: ['Save 60%', 'Best Value']
  },
  {
    id: 'sixmonths',
    name: '6-Month Pro',
    duration: 6,
    price: 35.99,
    monthlyPrice: 6.00,
    originalPrice: 59.94,
    savings: 23.95,
    savingsPercentage: 40,
    features: [
      'Unlimited AI workouts',
      'Progress tracking',
      'Nutrition guidance',
      'Premium support',
      'Advanced analytics'
    ],
    isPopular: false,
    bonusFeatures: ['Save 40%']
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    duration: 1,
    price: 7.99,
    monthlyPrice: 7.99,
    originalPrice: 9.99,
    savings: 2.00,
    savingsPercentage: 20,
    features: [
      'Unlimited AI workouts',
      'Progress tracking',
      'Nutrition guidance',
      'Premium support'
    ],
    isPopular: false,
    bonusFeatures: []
  }
];

// Storage keys
const SUBSCRIPTION_STORAGE_KEY = 'user_subscription';
const TRIAL_STORAGE_KEY = 'user_trial_status';
const PURCHASES_STORAGE_KEY = 'user_purchases';
const SUBSCRIPTION_HISTORY_KEY = 'subscription_history';
const DEVICE_ID_KEY = 'device_id';

export const subscriptionService = {
  // Get all plans
  getPlans() {
    return SUBSCRIPTION_PLANS;
  },

  // Get plan by ID
  getPlan(planId) {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
  },

  // Main purchase function - uses Apple IAP on iOS, mock payments elsewhere
  async purchasePlan(planId) {
    try {
      console.log('🛒 Processing purchase for plan:', planId);
      
      // Use Apple IAP on iOS, mock payments on other platforms
      if (Platform.OS === 'ios') {
        return await this.purchaseWithAppleIAP(planId);
      } else {
        return await this.purchaseWithMockPayments(planId);
      }
    } catch (error) {
      console.error('❌ Purchase error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  // Apple IAP purchase processing
  async purchaseWithAppleIAP(planId) {
    try {
      console.log('🍎 Processing Apple IAP purchase for plan:', planId);
      
      // Map internal plan ID to Apple product ID
      const productId = appleIAPService.mapToAppleProductId(planId);
      if (!productId) {
        return { success: false, error: 'Invalid subscription plan for Apple IAP' };
      }

      const plan = this.getPlan(planId);
      if (!plan) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      // Attempt purchase through Apple IAP
      const result = await appleIAPService.purchaseSubscription(planId);
      
      if (!result.success) {
        return { success: false, error: result.error || 'Apple IAP purchase failed' };
      }

      // Create subscription status from successful Apple purchase
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      const subscription = {
        isActive: true,
        planId: planId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        platform: 'ios',
        subscriptionStatus: 'active'
      };

      // Save subscription
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
      
      // Save purchase record (Apple IAP format)
      const purchase = {
        id: result.purchase?.purchaseId || `apple_${Date.now()}`,
        planId,
        price: plan.price,
        purchaseDate: startDate.toISOString(),
        platform: 'ios',
        appleTransactionId: result.purchase?.orderId,
        appleOriginalTransactionId: result.purchase?.originalTransactionId
      };
      
      const existingPurchases = await this.getPurchaseHistory();
      const updatedPurchases = [...existingPurchases, purchase];
      await AsyncStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(updatedPurchases));

      console.log('✅ Apple IAP purchase successful:', subscription);
      return { success: true };

    } catch (error) {
      console.error('❌ Apple IAP purchase error:', error);
      return { success: false, error: 'Apple IAP purchase failed' };
    }
  },

  // Mock purchase processing (for development/non-iOS)
  async purchaseWithMockPayments(planId) {
    try {
      console.log('🧪 Processing mock purchase for plan:', planId);
      
      const plan = this.getPlan(planId);
      if (!plan) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate 90% success rate for mock payments
      const success = Math.random() > 0.1;
      
      if (!success) {
        return { success: false, error: 'Mock payment failed (simulated 10% failure rate)' };
      }

      // Create subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      const subscription = {
        isActive: true,
        planId: planId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        platform: 'mock',
        subscriptionStatus: 'active'
      };

      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
      
      // Save purchase record
      const purchase = {
        id: `mock_${Date.now()}`,
        planId,
        price: plan.price,
        purchaseDate: startDate.toISOString(),
        platform: 'mock'
      };
      
      const existingPurchases = await this.getPurchaseHistory();
      const updatedPurchases = [...existingPurchases, purchase];
      await AsyncStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(updatedPurchases));

      console.log('✅ Mock purchase successful:', subscription);
      return { success: true };

    } catch (error) {
      console.error('❌ Mock purchase error:', error);
      return { success: false, error: 'Mock purchase failed' };
    }
  },

  // Get current subscription status
  async getSubscriptionStatus() {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      return null;
    }
  },

  // Check if user has active subscription
  async hasActiveSubscription() {
    try {
      const subscription = await this.getSubscriptionStatus();
      
      if (!subscription?.isActive) {
        return false;
      }
      
      // Check if subscription has expired
      const now = new Date();
      const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
      
      return !endDate || now < endDate;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  },

  // Get purchase history
  async getPurchaseHistory() {
    try {
      const stored = await AsyncStorage.getItem(PURCHASES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting purchase history:', error);
      return [];
    }
  },

  // Restore purchases
  async restorePurchases() {
    try {
      console.log('🔄 Restoring purchases...');
      
      // Use Apple IAP on iOS, mock payments elsewhere
      if (Platform.OS === 'ios') {
        return await this.restoreApplePurchases();
      } else {
        return await this.restoreMockPurchases();
      }
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      return { success: false, restored: 0, error: 'An unexpected error occurred' };
    }
  },

  // Restore Apple IAP purchases
  async restoreApplePurchases() {
    try {
      console.log('🍎 Restoring Apple IAP purchases...');
      
      const result = await appleIAPService.restorePurchases();
      
      if (!result.success) {
        return { success: false, restored: 0, error: result.error };
      }

      if (result.restored > 0) {
        // Check if we have an active subscription from restored purchases
        const subscriptionStatus = await appleIAPService.hasActiveSubscription();
        
        if (subscriptionStatus.isActive && subscriptionStatus.productId) {
          // Map Apple product ID back to our internal plan ID
          const planId = appleIAPService.mapFromAppleProductId(subscriptionStatus.productId);
          
          if (planId) {
            // Create subscription status from restored purchase
            const subscription = {
              isActive: true,
              planId: planId,
              startDate: new Date().toISOString(), // We don't have exact start date from restore
              endDate: subscriptionStatus.expiryDate?.toISOString() || new Date().toISOString(),
              autoRenew: true,
              platform: 'ios',
              subscriptionStatus: 'active'
            };

            // Save restored subscription
            await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
            
            console.log('✅ Apple IAP subscription restored:', subscription);
          }
        }
      }
      
      return { success: true, restored: result.restored };
    } catch (error) {
      console.error('❌ Error restoring Apple IAP purchases:', error);
      return { success: false, restored: 0, error: 'Failed to restore Apple purchases' };
    }
  },

  // Restore mock purchases
  async restoreMockPurchases() {
    console.log('🧪 Mock restore - no purchases to restore');
    return { success: true, restored: 0 };
  },

  // Initialize the subscription service
  async initialize() {
    try {
      console.log('🔧 Initializing subscription service...');
      
      // Initialize Apple IAP on iOS
      if (Platform.OS === 'ios') {
        const result = await appleIAPService.initialize();
        if (result.success) {
          console.log('✅ Subscription service initialized (using Apple IAP)');
        } else {
          console.warn('⚠️ Apple IAP initialization failed, falling back to mock payments:', result.error);
        }
      } else {
        console.log('✅ Subscription service initialized (using mock payments)');
      }
    } catch (error) {
      console.error('❌ Error initializing subscription service:', error);
      // Don't throw - allow app to continue with limited functionality
    }
  },

  // Get current payment provider information
  getPaymentProviderInfo() {
    if (Platform.OS === 'ios') {
      return appleIAPService.getPaymentProviderInfo();
    } else {
      return {
        provider: 'mock',
        displayName: 'Mock Payments (Development)',
      };
    }
  },

  // Trial related methods
  async getTrialStatus() {
    try {
      const stored = await AsyncStorage.getItem(TRIAL_STORAGE_KEY);
      const trialData = stored ? JSON.parse(stored) : null;
      
      if (!trialData) {
        return {
          isActive: false,
          startDate: null,
          endDate: null,
          daysRemaining: 0
        };
      }
      
      const now = new Date();
      const endDate = new Date(trialData.endDate);
      const isActive = now < endDate;
      const daysRemaining = isActive ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        isActive,
        startDate: trialData.startDate,
        endDate: trialData.endDate,
        daysRemaining
      };
    } catch (error) {
      console.error('❌ Error getting trial status:', error);
      return {
        isActive: false,
        startDate: null,
        endDate: null,
        daysRemaining: 0
      };
    }
  },

  async startFreeTrial() {
    try {
      console.log('🆓 Starting free trial...');
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 7-day trial
      
      const trialStatus = {
        isActive: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysRemaining: 7
      };
      
      await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trialStatus));
      
      console.log('✅ Free trial started successfully');
      return {
        success: true,
        message: 'Free trial started successfully!',
        trialEndDate: endDate.toISOString()
      };
    } catch (error) {
      console.error('❌ Error starting trial:', error);
      return {
        success: false,
        message: 'Failed to start trial'
      };
    }
  },

  // Check if trial is currently active
  async isTrialActive() {
    try {
      const trialStatus = await this.getTrialStatus();
      return trialStatus ? trialStatus.isActive : false;
    } catch (error) {
      console.error('❌ Error checking trial active status:', error);
      return false;
    }
  },

  // Check if user can start a trial
  async canStartTrial() {
    try {
      console.log('🔍 Checking trial eligibility...');
      
      // Check if user already has an active subscription
      const hasActiveSub = await this.hasActiveSubscription();
      if (hasActiveSub) {
        console.log('❌ Cannot start trial: user has active subscription');
        return false;
      }
      
      // Check if user has already used their trial
      const trialStatus = await this.getTrialStatus();
      if (trialStatus && trialStatus.startDate) {
        console.log('❌ Cannot start trial: user already used their trial');
        return false;
      }
      
      // Check purchase history to see if user ever had a subscription
      const purchaseHistory = await this.getPurchaseHistory();
      if (purchaseHistory.length > 0) {
        console.log('❌ Cannot start trial: user has purchase history');
        return false;
      }
      
      console.log('✅ User is eligible for trial');
      return true;
    } catch (error) {
      console.error('❌ Error checking trial eligibility:', error);
      return false;
    }
  },

  async clearTrialData() {
    try {
      await AsyncStorage.removeItem(TRIAL_STORAGE_KEY);
      console.log('✅ Trial data cleared');
    } catch (error) {
      console.error('❌ Error clearing trial data:', error);
    }
  },

  async expireTrial() {
    try {
      console.log('⏰ Expiring trial...');
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const trialStatus = {
        isActive: false,
        startDate: yesterday.toISOString(),
        endDate: yesterday.toISOString(),
        daysRemaining: 0
      };
      
      await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trialStatus));
      
      return {
        success: true,
        message: 'Trial expired successfully'
      };
    } catch (error) {
      console.error('❌ Error expiring trial:', error);
      return {
        success: false,
        message: 'Failed to expire trial'
      };
    }
  },

  async setSubscriptionEndDate(daysFromNow, disableAutoRenew = false) {
    try {
      const subscription = await this.getSubscriptionStatus();
      
      if (!subscription) {
        return false;
      }
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysFromNow);
      
      const updatedSubscription = {
        ...subscription,
        endDate: endDate.toISOString(),
        autoRenew: !disableAutoRenew
      };
      
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(updatedSubscription));
      
      console.log(`✅ Subscription end date set to ${daysFromNow} days from now`);
      return true;
    } catch (error) {
      console.error('❌ Error setting subscription end date:', error);
      return false;
    }
  },

  // Check if subscription is cancelled (has active subscription but is set to not renew)
  async isSubscriptionCancelled() {
    try {
      console.log('🔍 Checking if subscription is cancelled...');
      
      // Use Apple IAP on iOS, mock check elsewhere
      if (Platform.OS === 'ios') {
        return await this.checkAppleSubscriptionCancelled();
      } else {
        return await this.checkMockSubscriptionCancelled();
      }
    } catch (error) {
      console.error('❌ Error checking cancelled subscription:', error);
      return false;
    }
  },

  // Check Apple subscription cancellation status
  async checkAppleSubscriptionCancelled() {
    try {
      const { appleIAPService } = await import('./apple-iap-service.js');
      
      if (!appleIAPService.isInitialized) {
        console.log('⚠️ Apple IAP not initialized, assuming not cancelled');
        return false;
      }

      // Get stored purchases to check cancellation status
      const storedPurchases = await appleIAPService.getStoredPurchases();
      
      if (storedPurchases.length === 0) {
        return false;
      }

      // In a real implementation, you would check with Apple's server-to-server notifications
      // For now, we'll check if subscription is active but marked as cancelled in local storage
      const cancelledFlag = await AsyncStorage.getItem('subscription_cancelled');
      return cancelledFlag === 'true';
    } catch (error) {
      console.error('❌ Error checking Apple subscription cancellation:', error);
      return false;
    }
  },

  // Check mock subscription cancellation status
  async checkMockSubscriptionCancelled() {
    try {
      const cancelledFlag = await AsyncStorage.getItem('subscription_cancelled');
      return cancelledFlag === 'true';
    } catch (error) {
      console.error('❌ Error checking mock subscription cancellation:', error);
      return false;
    }
  },

  // Get subscription status type (for navigation logic)
  async getSubscriptionStatusType() {
    try {
      console.log('🔍 Getting subscription status type...');
      
      const status = await this.getSubscriptionStatus();
      const trialStatus = await this.getTrialStatus();
      
      // Priority: trial > active subscription > expired > none
      if (trialStatus && trialStatus.isActive) {
        return 'trial_active';
      }
      
      if (status && status.isActive) {
        const isCancelled = await this.isSubscriptionCancelled();
        if (isCancelled) {
          return 'subscription_cancelled';
        }
        return 'subscription_active';
      }
      
      if (status && !status.isActive && status.endDate) {
        const endDate = new Date(status.endDate);
        const now = new Date();
        if (now > endDate) {
          return 'subscription_expired';
        }
      }
      
      return 'no_subscription';
    } catch (error) {
      console.error('❌ Error getting subscription status type:', error);
      return 'no_subscription';
    }
  }
};

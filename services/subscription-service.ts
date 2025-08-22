import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SubscriptionPlan {
  id: string;
  name: string;
  duration: number; // months
  price: number;
  monthlyPrice: number;
  originalPrice: number;
  savings: number;
  savingsPercentage: number;
  features: string[];
  isPopular?: boolean;
  bonusFeatures?: string[];
}

export interface SubscriptionStatus {
  isActive: boolean;
  planId: string | null;
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  platform: 'ios' | 'android' | 'mock';
}

export interface SubscriptionHistory {
  subscriptionId: string;
  planId: string;
  startDate: string;
  endDate: string;
  wasActive: boolean;
  purchaseDate: string;
}

export interface TrialStatus {
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  hasUsedTrial: boolean;
  deviceId: string | null;
}

const SUBSCRIPTION_STORAGE_KEY = 'user_subscription';
const PURCHASES_STORAGE_KEY = 'user_purchases';
const SUBSCRIPTION_HISTORY_KEY = 'subscription_history';
const TRIAL_STORAGE_KEY = 'user_trial_status';

// Trial configuration
const TRIAL_DURATION_DAYS = 7;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Pro',
    duration: 1,
    price: 7.99,
    monthlyPrice: 7.99,
    originalPrice: 7.99,
    savings: 0,
    savingsPercentage: 0,
    features: [
      'Unlimited AI-generated programs',
      'Advanced progress tracking',
      'Complete exercise library',
      'Workout analytics & insights',
      'No ads or limitations'
    ]
  },
  {
    id: 'yearly',
    name: 'Annual Pro',
    duration: 12,
    price: 49.99,
    monthlyPrice: 4.17,
    originalPrice: 95.88,
    savings: 45.89,
    savingsPercentage: 48,
    features: [
      'Everything in Monthly Pro',
      'Priority support',
      'Advanced AI customization',
      'Workout history export',
      'Early access to new features'
    ],
    bonusFeatures: [
      '💰 Save $45.89 per year',
      '🎁 4+ months free',
      '⚡ Priority AI responses',
      '🔓 Beta feature access'
    ],
    isPopular: true
  }
];

export const subscriptionService = {
  // Get all available plans
  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  },

  // Get plan by ID
  getPlan(planId: string): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
  },

  // Mock purchase processing
  async purchasePlan(planId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🛒 Processing mock purchase for plan:', planId);
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment success (90% success rate for testing)
      const isSuccess = Math.random() > 0.1;
      
      if (!isSuccess) {
        return { success: false, error: 'Payment processing failed. Please try again.' };
      }

      const plan = this.getPlan(planId);
      if (!plan) {
        return { success: false, error: 'Invalid subscription plan' };
      }

      // Create subscription status
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration);

      const subscription: SubscriptionStatus = {
        isActive: true,
        planId: planId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        autoRenew: true,
        platform: 'mock'
      };

      // Save subscription
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
      
      // Add to subscription history
      await this.addToSubscriptionHistory(subscription);
      
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

      console.log('Mock purchase successful:', subscription);
      return { success: true };

    } catch (error) {
      console.error('❌ Purchase error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  // Get current subscription status
  async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (!stored) return null;

      const subscription: SubscriptionStatus = JSON.parse(stored);
      
      // Check if subscription is still valid
      if (subscription.endDate) {
        const endDate = new Date(subscription.endDate);
        const now = new Date();
        
        if (now > endDate) {
          // Subscription expired - check for auto-renewal
          if (subscription.autoRenew && subscription.planId) {
            // Auto-renew the subscription
            console.log('🔄 Auto-renewing subscription for plan:', subscription.planId);
            
            const plan = this.getPlan(subscription.planId);
            if (plan) {
              // Calculate new dates
              const newStartDate = new Date(subscription.endDate); // Start from old end date
              const newEndDate = new Date(newStartDate);
              newEndDate.setMonth(newEndDate.getMonth() + plan.duration);
              
              // Update subscription with new dates
              subscription.startDate = newStartDate.toISOString();
              subscription.endDate = newEndDate.toISOString();
              subscription.isActive = true; // Keep active after renewal
              
              // Save updated subscription
              await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
              
              // Add to subscription history
              await this.addToSubscriptionHistory(subscription);
              
              console.log(`✅ Auto-renewed subscription until ${newEndDate.toLocaleDateString()}`);
            } else {
              // Plan not found, expire subscription
              console.log('❌ Auto-renewal failed: Plan not found');
              subscription.isActive = false;
              await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
              
              // Stop any running workout timer
              const { useTimerStore } = await import('@/store/timer-store');
              const { stopWorkoutOnExpiration } = useTimerStore.getState();
              stopWorkoutOnExpiration();
            }
          } else {
            // No auto-renewal, expire subscription
            console.log('⏰ Subscription expired (auto-renewal disabled)');
            subscription.isActive = false;
            await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
            
            // Stop any running workout timer
            const { useTimerStore } = await import('@/store/timer-store');
            const { stopWorkoutOnExpiration } = useTimerStore.getState();
            stopWorkoutOnExpiration();
          }
        }
      }

      return subscription;
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      return null;
    }
  },

  // Check if user has active subscription
  async hasActiveSubscription(): Promise<boolean> {
    const status = await this.getSubscriptionStatus();
    return status?.isActive || false;
  },

  // Get purchase history
  async getPurchaseHistory(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(PURCHASES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting purchase history:', error);
      return [];
    }
  },

  // Restore purchases (mock implementation)
  async restorePurchases(): Promise<{ success: boolean; restored: number }> {
    try {
      console.log('🔄 Restoring purchases...');
      
      // Simulate restore delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real implementation, this would check with App Store/Play Store
      const purchases = await this.getPurchaseHistory();
      
      if (purchases.length > 0) {
        // Find most recent valid purchase
        const latestPurchase = purchases[purchases.length - 1];
        const plan = this.getPlan(latestPurchase.planId);
        
        if (plan) {
          // Restore subscription
          const startDate = new Date(latestPurchase.purchaseDate);
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + plan.duration);
          
          const subscription: SubscriptionStatus = {
            isActive: endDate > new Date(),
            planId: latestPurchase.planId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            autoRenew: true,
            platform: 'mock'
          };
          
          await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
          console.log('✅ Purchases restored:', subscription);
          
          return { success: true, restored: 1 };
        }
      }
      
      return { success: true, restored: 0 };
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      return { success: false, restored: 0 };
    }
  },

  // Cancel subscription (end-of-period cancellation)
  async cancelSubscription(reason?: string): Promise<{ success: boolean; message: string; expiryDate?: string }> {
    try {
      const subscription = await this.getSubscriptionStatus();
      if (!subscription || !subscription.isActive) {
        return { 
          success: false, 
          message: 'No active subscription found to cancel' 
        };
      }

      // Industry best practice: End-of-period cancellation
      // Keep access until current period ends, just disable auto-renewal
      subscription.autoRenew = false;
      // subscription.isActive stays true until natural expiration
      
      // Add cancellation metadata
      const cancellationData = {
        ...subscription,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason || 'user_cancelled',
        willExpireAt: subscription.endDate
      };
      
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(cancellationData));
      
      // Add to history with cancellation flag
      await this.addToSubscriptionHistory(subscription);
      
      const expiryDate = subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'Unknown';
      console.log(`✅ Subscription cancelled (end-of-period). Access until: ${expiryDate}`);
      
      return { 
        success: true, 
        message: `Subscription cancelled. You'll keep access until ${expiryDate}.`,
        expiryDate: subscription.endDate || ''
      };
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return { 
        success: false, 
        message: 'Failed to cancel subscription. Please try again.' 
      };
    }
  },

  // Check if subscription is cancelled but still active
  async isCancelled(): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionStatus();
      return subscription?.autoRenew === false && subscription?.isActive === true;
    } catch (error) {
      console.error('❌ Error checking cancellation status:', error);
      return false;
    }
  },

  // Reactivate cancelled subscription (restore auto-renewal)
  async reactivateSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      const subscription = await this.getSubscriptionStatus();
      if (!subscription || !subscription.isActive) {
        return { 
          success: false, 
          message: 'No active subscription found to reactivate' 
        };
      }

      if (subscription.autoRenew) {
        return { 
          success: false, 
          message: 'Subscription is already active and will auto-renew' 
        };
      }

      // Restore auto-renewal
      subscription.autoRenew = true;
      delete (subscription as any).cancelledAt;
      delete (subscription as any).cancellationReason;
      
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
      
      console.log('✅ Subscription reactivated - auto-renewal restored');
      
      return { 
        success: true, 
        message: 'Great! Your subscription will continue to auto-renew.' 
      };
    } catch (error) {
      console.error('❌ Error reactivating subscription:', error);
      return { 
        success: false, 
        message: 'Failed to reactivate subscription. Please try again.' 
      };
    }
  },

  // Clear all subscription data (for testing)
  async clearSubscriptionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SUBSCRIPTION_STORAGE_KEY, PURCHASES_STORAGE_KEY, SUBSCRIPTION_HISTORY_KEY]);
      console.log('✅ Subscription data cleared');
    } catch (error) {
      console.error('❌ Error clearing subscription data:', error);
    }
  },

  // Add subscription to history
  async addToSubscriptionHistory(subscription: SubscriptionStatus): Promise<void> {
    try {
      const existingHistory = await this.getSubscriptionHistory();
      
      const historyEntry: SubscriptionHistory = {
        subscriptionId: `${subscription.planId || 'unknown'}_${Date.now()}`,
        planId: subscription.planId || 'unknown',
        startDate: subscription.startDate || new Date().toISOString(),
        endDate: subscription.endDate || new Date().toISOString(),
        wasActive: subscription.isActive,
        purchaseDate: new Date().toISOString(),
      };
      
      const updatedHistory = [...existingHistory, historyEntry];
      await AsyncStorage.setItem(SUBSCRIPTION_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      console.log('✅ Subscription added to history:', historyEntry);
    } catch (error) {
      console.error('❌ Error adding subscription to history:', error);
    }
  },

  // Get subscription history
  async getSubscriptionHistory(): Promise<SubscriptionHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(SUBSCRIPTION_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting subscription history:', error);
      return [];
    }
  },

  // Check if user has previously subscribed
  async hasSubscriptionHistory(): Promise<boolean> {
    try {
      const history = await this.getSubscriptionHistory();
      return history.length > 0;
    } catch (error) {
      console.error('❌ Error checking subscription history:', error);
      return false;
    }
  },

  // Check if this is a re-subscription (had active subscription before)
  async isResubscription(): Promise<boolean> {
    try {
      const history = await this.getSubscriptionHistory();
      return history.some(entry => entry.wasActive);
    } catch (error) {
      console.error('❌ Error checking if re-subscription:', error);
      return false;
    }
  },

  // Get subscription count (how many times they've subscribed)
  async getSubscriptionCount(): Promise<number> {
    try {
      const history = await this.getSubscriptionHistory();
      return history.filter(entry => entry.wasActive).length;
    } catch (error) {
      console.error('❌ Error getting subscription count:', error);
      return 0;
    }
  },

  // Testing methods for auto-renewal
  async forceAutoRenewal(): Promise<{ success: boolean; message: string }> {
    try {
      const subscription = await this.getSubscriptionStatus();
      if (!subscription) {
        return { success: false, message: 'No active subscription found' };
      }

      if (!subscription.autoRenew) {
        return { success: false, message: 'Auto-renewal is disabled' };
      }

      if (!subscription.planId) {
        return { success: false, message: 'No plan ID found' };
      }

      const plan = this.getPlan(subscription.planId);
      if (!plan) {
        return { success: false, message: 'Plan not found' };
      }

      // Force renewal by setting end date to past
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 1); // 1 minute ago
      subscription.endDate = pastDate.toISOString();
      
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
      
      // Trigger auto-renewal by calling getSubscriptionStatus
      await this.getSubscriptionStatus();
      
      return { success: true, message: 'Auto-renewal triggered successfully!' };
    } catch (error) {
      console.error('❌ Error forcing auto-renewal:', error);
      return { success: false, message: 'Failed to trigger auto-renewal' };
    }
  },

  async setSubscriptionEndDate(daysFromNow: number): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionStatus();
      if (subscription) {
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + daysFromNow);
        subscription.endDate = newEndDate.toISOString();
        
        await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
        console.log(`✅ Subscription end date set to ${newEndDate.toLocaleDateString()}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error setting subscription end date:', error);
      return false;
    }
  },

  // ==================== TRIAL SYSTEM ====================

  // Get device ID for trial tracking
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        // Generate a simple device ID
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('❌ Error getting device ID:', error);
      return 'device_' + Date.now();
    }
  },

  // Get current trial status
  async getTrialStatus(): Promise<TrialStatus> {
    try {
      const trialData = await AsyncStorage.getItem(TRIAL_STORAGE_KEY);
      if (!trialData) {
        // No trial data found, return default
        return {
          isActive: false,
          startDate: null,
          endDate: null,
          hasUsedTrial: false,
          deviceId: null
        };
      }

      const trial: TrialStatus = JSON.parse(trialData);
      const now = new Date();
      
      // Check if trial has expired
      if (trial.isActive && trial.endDate) {
        const endDate = new Date(trial.endDate);
        if (now > endDate) {
          trial.isActive = false;
          await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trial));
        }
      }

      return trial;
    } catch (error) {
      console.error('❌ Error getting trial status:', error);
      return {
        isActive: false,
        startDate: null,
        endDate: null,
        hasUsedTrial: false,
        deviceId: null
      };
    }
  },

  // Start a free trial
  async startFreeTrial(): Promise<{ success: boolean; message: string; trialEndDate?: string }> {
    try {
      const currentTrial = await this.getTrialStatus();
      const deviceId = await this.getDeviceId();

      // Check if trial was already used
      if (currentTrial.hasUsedTrial) {
        return {
          success: false,
          message: 'Free trial has already been used on this device'
        };
      }

      // Check if user has active subscription
      const subscription = await this.getSubscriptionStatus();
      if (subscription && subscription.isActive) {
        return {
          success: false,
          message: 'You already have an active subscription'
        };
      }

      // Create trial
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + TRIAL_DURATION_DAYS);

      const trial: TrialStatus = {
        isActive: true,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        hasUsedTrial: true,
        deviceId
      };

      await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trial));

      console.log('✅ Free trial started successfully');
      return {
        success: true,
        message: `Your ${TRIAL_DURATION_DAYS}-day free trial has started!`,
        trialEndDate: endDate.toISOString()
      };
    } catch (error) {
      console.error('❌ Error starting free trial:', error);
      return {
        success: false,
        message: 'Failed to start free trial'
      };
    }
  },

  // Check if user can start a trial
  async canStartTrial(): Promise<boolean> {
    try {
      const trial = await this.getTrialStatus();
      const subscription = await this.getSubscriptionStatus();
      
      // Can start trial if:
      // 1. Never used trial before
      // 2. No active subscription
      return !trial.hasUsedTrial && !(subscription && subscription.isActive);
    } catch (error) {
      console.error('❌ Error checking trial eligibility:', error);
      return false;
    }
  },

  // Get days remaining in trial
  async getTrialDaysRemaining(): Promise<number> {
    try {
      const trial = await this.getTrialStatus();
      if (!trial.isActive || !trial.endDate) {
        return 0;
      }

      const now = new Date();
      const endDate = new Date(trial.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays);
    } catch (error) {
      console.error('❌ Error calculating trial days remaining:', error);
      return 0;
    }
  },

  // Check if user has premium access (subscription OR trial)
  async hasPremiumAccess(): Promise<boolean> {
    try {
      // Check subscription first
      const subscription = await this.getSubscriptionStatus();
      if (subscription && subscription.isActive) {
        return true;
      }

      // Check trial
      const trial = await this.getTrialStatus();
      return trial.isActive;
    } catch (error) {
      console.error('❌ Error checking premium access:', error);
      return false;
    }
  },

  // Clear trial data (for testing)
  async clearTrialData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TRIAL_STORAGE_KEY);
      console.log('✅ Trial data cleared');
    } catch (error) {
      console.error('❌ Error clearing trial data:', error);
    }
  },

  // Force trial expiration (for testing)
  async expireTrial(): Promise<{ success: boolean; message: string }> {
    try {
      const trial = await this.getTrialStatus();
      if (!trial.isActive) {
        return { success: false, message: 'No active trial to expire' };
      }

      trial.isActive = false;
      trial.endDate = new Date().toISOString(); // Set to now
      
      await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trial));
      
      return { success: true, message: 'Trial expired successfully' };
    } catch (error) {
      console.error('❌ Error expiring trial:', error);
      return { success: false, message: 'Failed to expire trial' };
    }
  }
};

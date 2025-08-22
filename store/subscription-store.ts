import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService, type SubscriptionStatus, type TrialStatus } from '@/services/subscription-service';

interface SubscriptionState {
  // State
  subscriptionStatus: SubscriptionStatus | null;
  trialStatus: TrialStatus | null;
  isLoading: boolean;
  error: string | null;
  hasCheckedStatus: boolean;

  // Actions
  checkSubscriptionStatus: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void;
  clearError: () => void;
  hasActiveSubscription: () => boolean;
  isSubscriptionExpired: () => boolean;
  getDaysUntilExpiry: () => number | null;
  getSubscriptionInfo: () => {
    isActive: boolean;
    planName: string | null;
    expiryDate: string | null;
    daysLeft: number | null;
  };
  shouldShowExpirationWarning: () => boolean;
  getExpirationWarningLevel: () => 'critical' | 'warning' | 'info' | null;
  shouldBlockAccess: () => boolean;
  isResubscription: () => Promise<boolean>;
  getSubscriptionCount: () => Promise<number>;
    addToHistory: (subscription: SubscriptionStatus) => Promise<void>;
  getSubscriptionHistory: () => Promise<any[]>;
  
  // Cancellation methods
  cancelSubscription: (reason?: string) => Promise<{ success: boolean; message: string; expiryDate?: string }>;
  isCancelled: () => Promise<boolean>;
  reactivateSubscription: () => Promise<{ success: boolean; message: string }>;

  // Testing methods
  forceAutoRenewal: () => Promise<{ success: boolean; message: string }>;
  setSubscriptionEndDate: (daysFromNow: number) => Promise<boolean>;

  // Trial methods
  getTrialStatus: () => Promise<TrialStatus>;
  startFreeTrial: () => Promise<{ success: boolean; message: string; trialEndDate?: string }>;
  canStartTrial: () => Promise<boolean>;
  getTrialDaysRemaining: () => Promise<number>;
  hasPremiumAccess: () => Promise<boolean>;
  isTrialActive: () => boolean;
  getTrialInfo: () => {
    isActive: boolean;
    daysRemaining: number;
    hasUsedTrial: boolean;
  };

  // Testing methods for trial
  clearTrialData: () => Promise<void>;
  expireTrial: () => Promise<{ success: boolean; message: string }>;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      subscriptionStatus: null,
      trialStatus: null,
      isLoading: false,
      error: null,
      hasCheckedStatus: false,

      // Check subscription status
      checkSubscriptionStatus: async () => {
        const state = get();
        if (state.hasCheckedStatus && !state.isLoading) {
          // Already checked, just return current status
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const [status, trialStatus] = await Promise.all([
            subscriptionService.getSubscriptionStatus(),
            subscriptionService.getTrialStatus()
          ]);
          set({ 
            subscriptionStatus: status,
            trialStatus: trialStatus,
            isLoading: false, 
            hasCheckedStatus: true 
          });
          console.log('Subscription status checked:', status);
          console.log('Trial status checked:', trialStatus);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to check subscription';
          set({ 
            error: errorMessage, 
            isLoading: false, 
            hasCheckedStatus: true 
          });
          console.error('❌ Error checking subscription:', error);
        }
      },

      // Refresh subscription status (force refresh)
      refreshSubscriptionStatus: async () => {
        set({ isLoading: true, error: null, hasCheckedStatus: false });

        try {
          const [status, trialStatus] = await Promise.all([
            subscriptionService.getSubscriptionStatus(),
            subscriptionService.getTrialStatus()
          ]);
          set({ 
            subscriptionStatus: status,
            trialStatus: trialStatus,
            isLoading: false, 
            hasCheckedStatus: true 
          });
          console.log('Subscription status refreshed:', status);
          console.log('Trial status refreshed:', trialStatus);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh subscription';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          console.error('❌ Error refreshing subscription:', error);
        }
      },

      // Set subscription status manually (after purchase)
      setSubscriptionStatus: (status: SubscriptionStatus | null) => {
        set({ 
          subscriptionStatus: status, 
          hasCheckedStatus: true,
          error: null 
        });
        console.log('📝 Subscription status updated:', status);
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Check if user has active subscription
      hasActiveSubscription: () => {
        const { subscriptionStatus } = get();
        return subscriptionStatus?.isActive || false;
      },

      // Check if subscription is expired
      isSubscriptionExpired: () => {
        const { subscriptionStatus } = get();
        if (!subscriptionStatus || !subscriptionStatus.endDate) {
          return true;
        }

        const endDate = new Date(subscriptionStatus.endDate);
        const now = new Date();
        return now > endDate;
      },

      // Get days until subscription expires
      getDaysUntilExpiry: () => {
        const { subscriptionStatus } = get();
        if (!subscriptionStatus || !subscriptionStatus.endDate || !subscriptionStatus.isActive) {
          return null;
        }

        const endDate = new Date(subscriptionStatus.endDate);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
      },

      // Get comprehensive subscription info
      getSubscriptionInfo: () => {
        const state = get();
        const { subscriptionStatus } = state;
        
        if (!subscriptionStatus) {
          return {
            isActive: false,
            planName: null,
            expiryDate: null,
            daysLeft: null,
          };
        }

        const plan = subscriptionStatus.planId ? 
          subscriptionService.getPlan(subscriptionStatus.planId) : null;

        return {
          isActive: subscriptionStatus.isActive && !state.isSubscriptionExpired(),
          planName: plan?.name || null,
          expiryDate: subscriptionStatus.endDate,
          daysLeft: state.getDaysUntilExpiry(),
        };
      },

      // Check if should show expiration warning
      shouldShowExpirationWarning: () => {
        const daysLeft = get().getDaysUntilExpiry();
        const { subscriptionStatus } = get();
        
        if (!subscriptionStatus?.isActive || daysLeft === null) {
          return false;
        }
        
        return daysLeft <= 7; // Show warning when 7 days or less remaining
      },

      // Get warning level based on days remaining
      getExpirationWarningLevel: () => {
        const daysLeft = get().getDaysUntilExpiry();
        const { subscriptionStatus } = get();
        
        if (!subscriptionStatus?.isActive || daysLeft === null) {
          return null;
        }
        
        if (daysLeft <= 1) {
          return 'critical'; // 1 day or less - red alert
        } else if (daysLeft <= 3) {
          return 'warning'; // 2-3 days - orange warning
        } else if (daysLeft <= 7) {
          return 'info'; // 4-7 days - blue info
        }
        
        return null;
      },

      // Check if access should be blocked (subscription OR trial)
      shouldBlockAccess: () => {
        const { subscriptionStatus, trialStatus } = get();
        
        // First check if user has active trial
        if (trialStatus && trialStatus.isActive) {
          return false; // Active trial = don't block
        }
        
        // Then check subscription
        if (!subscriptionStatus || !subscriptionStatus.endDate) {
          return true; // No subscription and no trial = block
        }
        
        const endDate = new Date(subscriptionStatus.endDate);
        const now = new Date();
        const daysSinceExpiry = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if subscription has expired and stop timer if needed
        const shouldBlock = subscriptionStatus.planId?.startsWith('test_') 
          ? daysSinceExpiry >= 0  // Block immediately for testing
          : daysSinceExpiry > 3;  // Allow 3 days grace period for real subscriptions
        
        // If access should be blocked and subscription is expired, stop any running workout
        if (shouldBlock && daysSinceExpiry >= 0) {
          // Dynamically import to avoid circular dependencies
          import('@/store/timer-store').then(({ useTimerStore }) => {
            const { stopWorkoutOnExpiration } = useTimerStore.getState();
            stopWorkoutOnExpiration();
          }).catch(console.error);
        }
        
        return shouldBlock;
      },

      // Check if this is a re-subscription
      isResubscription: async () => {
        return await subscriptionService.isResubscription();
      },

      // Get subscription count
      getSubscriptionCount: async () => {
        return await subscriptionService.getSubscriptionCount();
      },

      // Add subscription to history
      addToHistory: async (subscription: SubscriptionStatus) => {
        await subscriptionService.addToSubscriptionHistory(subscription);
      },
      
      getSubscriptionHistory: async () => {
        return await subscriptionService.getSubscriptionHistory();
      },
      
      // Cancellation methods
      cancelSubscription: async (reason?: string) => {
        const result = await subscriptionService.cancelSubscription(reason);
        if (result.success) {
          // Refresh status to reflect cancellation
          const { refreshSubscriptionStatus } = get();
          await refreshSubscriptionStatus();
        }
        return result;
      },
      
      isCancelled: async () => {
        return await subscriptionService.isCancelled();
      },
      
      reactivateSubscription: async () => {
        const result = await subscriptionService.reactivateSubscription();
        if (result.success) {
          // Refresh status to reflect reactivation
          const { refreshSubscriptionStatus } = get();
          await refreshSubscriptionStatus();
        }
        return result;
      },

      // Testing methods
      forceAutoRenewal: async () => {
        return await subscriptionService.forceAutoRenewal();
      },

      setSubscriptionEndDate: async (daysFromNow: number) => {
        const success = await subscriptionService.setSubscriptionEndDate(daysFromNow);
        if (success) {
          // Refresh status to reflect new end date
          const { refreshSubscriptionStatus } = get();
          await refreshSubscriptionStatus();
        }
        return success;
      },

      // ==================== TRIAL METHODS ====================

      // Get trial status
      getTrialStatus: async () => {
        return await subscriptionService.getTrialStatus();
      },

      // Start free trial
      startFreeTrial: async () => {
        const result = await subscriptionService.startFreeTrial();
        if (result.success) {
          // Refresh status to include new trial
          const { refreshSubscriptionStatus } = get();
          await refreshSubscriptionStatus();
        }
        return result;
      },

      // Check if user can start trial
      canStartTrial: async () => {
        return await subscriptionService.canStartTrial();
      },

      // Get days remaining in trial
      getTrialDaysRemaining: async () => {
        return await subscriptionService.getTrialDaysRemaining();
      },

      // Check if user has premium access (subscription OR trial)
      hasPremiumAccess: async () => {
        return await subscriptionService.hasPremiumAccess();
      },

      // Check if trial is currently active (from store state)
      isTrialActive: () => {
        const state = get();
        return state.trialStatus?.isActive || false;
      },

      // Get trial info for UI
      getTrialInfo: () => {
        const state = get();
        const trial = state.trialStatus;
        
        if (!trial) {
          return {
            isActive: false,
            daysRemaining: 0,
            hasUsedTrial: false
          };
        }

        // Calculate days remaining
        let daysRemaining = 0;
        if (trial.isActive && trial.endDate) {
          const now = new Date();
          const endDate = new Date(trial.endDate);
          const diffTime = endDate.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        return {
          isActive: trial.isActive,
          daysRemaining,
          hasUsedTrial: trial.hasUsedTrial
        };
      },

      // Testing methods for trial
      clearTrialData: async () => {
        await subscriptionService.clearTrialData();
        // Refresh to clear trial status from store
        const { refreshSubscriptionStatus } = get();
        await refreshSubscriptionStatus();
      },

      expireTrial: async () => {
        const result = await subscriptionService.expireTrial();
        if (result.success) {
          // Refresh status to reflect expired trial
          const { refreshSubscriptionStatus } = get();
          await refreshSubscriptionStatus();
        }
        return result;
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscriptionStatus: state.subscriptionStatus,
        trialStatus: state.trialStatus,
        hasCheckedStatus: state.hasCheckedStatus,
      }),
    }
  )
);

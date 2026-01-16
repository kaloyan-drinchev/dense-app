import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService } from '@/services/subscription';

export const useSubscriptionStore = create()(
  persist(
    (set, get) => ({
      // State
      subscriptionStatus: null,
      trialStatus: null,
      isLoading: false,
      error: null,
      hasCheckedStatus: false,

      // Actions
      checkSubscriptionStatus: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const status = await subscriptionService.getUserStatus();
          // Note: Trial status is now part of the main status from RevenueCat
          // If you need separate trial info, check status.isPro and status.latestExpirationDate
          
          set({ 
            subscriptionStatus: {
              isActive: status.isPro,
              endDate: status.latestExpirationDate,
              activeSubscriptions: status.activeSubscriptions
            }, 
            trialStatus: null, // Trials are handled by RevenueCat entitlements
            hasCheckedStatus: true,
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to check subscription status:', error);
          set({ 
            error: 'Failed to check subscription status',
            isLoading: false 
          });
        }
      },

      refreshSubscriptionStatus: async () => {
        const { checkSubscriptionStatus } = get();
        await checkSubscriptionStatus();
      },

      setSubscriptionStatus: (status) => {
        set({ subscriptionStatus: status });
      },

      clearError: () => {
        set({ error: null });
      },

      hasActiveSubscription: () => {
        const { subscriptionStatus, trialStatus } = get();
        
        // Check trial first
        if (trialStatus?.isActive) {
          return true;
        }
        
        // Check subscription
        if (subscriptionStatus?.isActive) {
          const now = new Date();
          const endDate = subscriptionStatus.endDate ? new Date(subscriptionStatus.endDate) : null;
          return !endDate || now < endDate;
        }
        
        return false;
      },

      isSubscriptionExpired: () => {
        const { subscriptionStatus } = get();
        
        if (!subscriptionStatus?.isActive) {
          return true;
        }
        
        const now = new Date();
        const endDate = subscriptionStatus.endDate ? new Date(subscriptionStatus.endDate) : null;
        return endDate && now >= endDate;
      },

      getDaysUntilExpiry: () => {
        const { subscriptionStatus } = get();
        
        if (!subscriptionStatus?.endDate) {
          return null;
        }
        
        const now = new Date();
        const endDate = new Date(subscriptionStatus.endDate);
        const diffTime = endDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
      },

      getSubscriptionInfo: () => {
        const { subscriptionStatus } = get();
        
        if (!subscriptionStatus) {
          return {
            isActive: false,
            planName: null,
            expiryDate: null
          };
        }
        
        return {
          isActive: subscriptionStatus.isActive || false,
          planName: subscriptionStatus.planId || null,
          expiryDate: subscriptionStatus.endDate || null
        };
      },

      // Debug function to log current subscription status
      logSubscriptionStatus: () => {
        const { subscriptionStatus, trialStatus, hasActiveSubscription } = get();
        console.log('📊 Current Subscription Status:');
        console.log('  - Subscription:', subscriptionStatus ? JSON.stringify(subscriptionStatus, null, 2) : 'null');
        console.log('  - Trial:', trialStatus ? JSON.stringify(trialStatus, null, 2) : 'null');
        console.log('  - Has Active Subscription:', hasActiveSubscription());
        console.log('  - Has Checked Status:', get().hasCheckedStatus);
        return {
          subscriptionStatus,
          trialStatus,
          hasActiveSubscription: hasActiveSubscription(),
          hasCheckedStatus: get().hasCheckedStatus
        };
      },

      // Trial related methods
      isTrialActive: () => {
        const { trialStatus } = get();
        return trialStatus?.isActive || false;
      },

      getTrialDaysRemaining: async () => {
        // Trial information is now handled through RevenueCat entitlements
        // Check the subscription status for expiration dates
        const status = await subscriptionService.getUserStatus();
        if (status.latestExpirationDate) {
          const now = new Date();
          const expiryDate = new Date(status.latestExpirationDate);
          const diffTime = expiryDate - now;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return Math.max(0, diffDays);
        }
        return 0;
      },

      getTrialInfo: () => {
        const { trialStatus } = get();
        
        if (!trialStatus) {
          return {
            isActive: false,
            daysRemaining: 0,
            endDate: null
          };
        }
        
        return {
          isActive: trialStatus.isActive || false,
          daysRemaining: trialStatus.daysRemaining || 0,
          endDate: trialStatus.endDate || null
        };
      },

      // Check if user can start a trial
      // Note: With RevenueCat, trials are part of the package offerings
      // Users purchase a package that includes a trial period
      canStartTrial: async () => {
        try {
          const status = await subscriptionService.getUserStatus();
          // If user has never subscribed, they can potentially start a trial
          return !status.isPro && (!status.activeSubscriptions || status.activeSubscriptions.length === 0);
        } catch (error) {
          console.error('Failed to check trial eligibility:', error);
          return false;
        }
      },

      // Start free trial
      // Note: With RevenueCat, trials are started by purchasing a package that includes a trial
      // This method is kept for compatibility but should redirect to the paywall
      startFreeTrial: async () => {
        console.warn('startFreeTrial: Trials are now handled through RevenueCat package purchases');
        return {
          success: false,
          message: 'Please use the subscription screen to start a trial'
        };
      },

      setSubscriptionEndDate: async (days, disableAutoRenew = false) => {
        console.warn('setSubscriptionEndDate: This is a legacy method not supported by RevenueCat');
        return false;
      },

      // Navigation refresh trigger
      triggerNavigationRefresh: () => {
        // This is used to trigger re-evaluation of subscription-based navigation
        // The actual navigation logic is in _layout.tsx
        console.log('🔄 Navigation refresh triggered from subscription store');
      },

      // Check if access should be blocked based on subscription status
      shouldBlockAccess: () => {
        const { subscriptionStatus, trialStatus } = get();
        
        // Check trial first - if trial is active, allow access
        if (trialStatus?.isActive) {
          return false;
        }
        
        // Check subscription - if no active subscription, block access
        if (!subscriptionStatus?.isActive) {
          return true;
        }
        
        // Check if subscription is expired
        if (subscriptionStatus.isActive && subscriptionStatus.endDate) {
          const now = new Date();
          const endDate = new Date(subscriptionStatus.endDate);
          return now >= endDate;
        }
        
        // If subscription is active and not expired, allow access
        return false;
      }
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscriptionStatus: state.subscriptionStatus,
        trialStatus: state.trialStatus,
        hasCheckedStatus: state.hasCheckedStatus
      })
    }
  )
);
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService } from '@/services/subscription-service.js';

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
          
          const status = await subscriptionService.checkSubscriptionStatus();
          const trialStatus = await subscriptionService.getTrialStatus();
          
          set({ 
            subscriptionStatus: status, 
            trialStatus: trialStatus,
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

      // Trial related methods
      isTrialActive: () => {
        const { trialStatus } = get();
        return trialStatus?.isActive || false;
      },

      getTrialDaysRemaining: async () => {
        const trialStatus = await subscriptionService.getTrialStatus();
        return trialStatus?.daysRemaining || 0;
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
      canStartTrial: async () => {
        try {
          return await subscriptionService.canStartTrial();
        } catch (error) {
          console.error('Failed to check trial eligibility:', error);
          return false;
        }
      },

      // Start free trial
      startFreeTrial: async () => {
        try {
          const result = await subscriptionService.startFreeTrial();
          
          if (result.success) {
            // Refresh subscription status after starting trial
            const { checkSubscriptionStatus } = get();
            await checkSubscriptionStatus();
          }
          
          return result;
        } catch (error) {
          console.error('Failed to start trial:', error);
          return {
            success: false,
            message: 'Failed to start trial'
          };
        }
      },

      setSubscriptionEndDate: async (days, disableAutoRenew = false) => {
        try {
          const result = await subscriptionService.setSubscriptionEndDate(days, disableAutoRenew);
          
          if (result.success) {
            // Refresh subscription status after update
            const { checkSubscriptionStatus } = get();
            await checkSubscriptionStatus();
          }
          
          return result.success;
        } catch (error) {
          console.error('Failed to set subscription end date:', error);
          return false;
        }
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
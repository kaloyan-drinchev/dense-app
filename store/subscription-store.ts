import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscriptionService, type SubscriptionStatus } from '@/services/subscription-service';

interface SubscriptionState {
  // State
  subscriptionStatus: SubscriptionStatus | null;
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
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      // Initial state
      subscriptionStatus: null,
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
          const status = await subscriptionService.getSubscriptionStatus();
          set({ 
            subscriptionStatus: status, 
            isLoading: false, 
            hasCheckedStatus: true 
          });
          console.log('✅ Subscription status checked:', status);
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
          const status = await subscriptionService.getSubscriptionStatus();
          set({ 
            subscriptionStatus: status, 
            isLoading: false, 
            hasCheckedStatus: true 
          });
          console.log('🔄 Subscription status refreshed:', status);
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
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscriptionStatus: state.subscriptionStatus,
        hasCheckedStatus: state.hasCheckedStatus,
      }),
    }
  )
);

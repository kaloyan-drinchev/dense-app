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

const SUBSCRIPTION_STORAGE_KEY = 'user_subscription';
const PURCHASES_STORAGE_KEY = 'user_purchases';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    duration: 1,
    price: 15,
    monthlyPrice: 15,
    originalPrice: 15,
    savings: 0,
    savingsPercentage: 0,
    features: [
      'Unlimited AI-generated programs',
      'Progress tracking',
      'Exercise library access',
      'Workout analytics'
    ]
  },
  {
    id: 'sixmonth',
    name: '6 Months',
    duration: 6,
    price: 75,
    monthlyPrice: 12.50,
    originalPrice: 90,
    savings: 15,
    savingsPercentage: 17,
    features: [
      'Everything in Monthly',
      'Priority AI responses',
      'Advanced analytics',
      'Export workout data'
    ],
    isPopular: true
  },
  {
    id: 'yearly',
    name: '12 Months',
    duration: 12,
    price: 120,
    monthlyPrice: 10,
    originalPrice: 180,
    savings: 60,
    savingsPercentage: 33,
    features: [
      'Everything in 6 Months',
      'Nutrition planning (coming soon)',
      'Personal coach chat',
      'Exclusive workout programs'
    ],
    bonusFeatures: [
      '🎁 Free program updates for life',
      '🎁 Early access to new features',
      '🎁 VIP support'
    ]
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
          // Subscription expired
          subscription.isActive = false;
          await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
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

  // Cancel subscription (for testing)
  async cancelSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionStatus();
      if (subscription) {
        subscription.isActive = false;
        subscription.autoRenew = false;
        await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
        console.log('✅ Subscription cancelled');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return false;
    }
  },

  // Clear all subscription data (for testing)
  async clearSubscriptionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SUBSCRIPTION_STORAGE_KEY, PURCHASES_STORAGE_KEY]);
      console.log('✅ Subscription data cleared');
    } catch (error) {
      console.error('❌ Error clearing subscription data:', error);
    }
  }
};

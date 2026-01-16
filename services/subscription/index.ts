import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REVENUECAT_KEYS, ENTITLE_ID, PLAN_METADATA, USE_MOCK_PAYMENTS, MOCK_PLANS } from './config';

class SubscriptionService {
  private isInitialized = false;
  private mockSubscriptionKey = '@mock_subscription_status';

  /**
   * Initialize Subscription Service (Mock or RevenueCat)
   */
  async initialize(userId?: string) {
    if (this.isInitialized) return;

    if (USE_MOCK_PAYMENTS) {
      console.log('🎭 Subscription Service Initialized (MOCK MODE)');
      this.isInitialized = true;
      return;
    }

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_KEYS.apple : REVENUECAT_KEYS.google;
    
    if (!apiKey || apiKey.includes('YOUR_')) {
      console.warn('⚠️ RevenueCat API Keys are missing in config.ts');
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey });

    if (userId) {
      await Purchases.logIn(userId);
    }

    this.isInitialized = true;
    console.log('✅ Subscription Service Initialized (RevenueCat)');
  }

  /**
   * Get formatted packages for the Paywall UI
   */
  async getPaywallOptions() {
    // MOCK MODE: Return static plans
    if (USE_MOCK_PAYMENTS) {
      console.log('🎭 Returning mock payment plans');
      return MOCK_PLANS;
    }

    // REAL MODE: Fetch from RevenueCat
    try {
      const offerings = await Purchases.getOfferings();
      
      if (!offerings.current || !offerings.current.availablePackages.length) {
        return [];
      }

      return offerings.current.availablePackages.map((pkg) => {
        const metadata = PLAN_METADATA[pkg.product.identifier] || { features: [], bestValue: false, label: 'Pro' };
        
        return {
          id: pkg.identifier, 
          rcPackage: pkg, // Keep raw object for purchase flow
          identifier: pkg.product.identifier,
          priceString: pkg.product.priceString,
          title: pkg.product.title,
          description: pkg.product.description,
          features: metadata.features,
          bestValue: metadata.bestValue,
          label: metadata.label,
        };
      });
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return [];
    }
  }

  /**
   * Purchase a package
   */
  async purchasePackage(rcPackage: any) {
    // MOCK MODE: Simulate successful purchase
    if (USE_MOCK_PAYMENTS) {
      console.log('🎭 Mock purchase successful:', rcPackage?.identifier || 'unknown');
      
      // Store mock subscription status
      const mockStatus = {
        isPro: true,
        activeSubscriptions: [rcPackage?.identifier || 'mock_subscription'],
        latestExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        purchaseDate: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(this.mockSubscriptionKey, JSON.stringify(mockStatus));
      
      return mockStatus;
    }

    // REAL MODE: Use RevenueCat
    try {
      const { customerInfo } = await Purchases.purchasePackage(rcPackage);
      return this.handleCustomerInfo(customerInfo);
    } catch (error: any) {
      if (error.userCancelled) {
        return { isPro: false, cancelled: true };
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases() {
    // MOCK MODE: Return existing mock subscription if any
    if (USE_MOCK_PAYMENTS) {
      console.log('🎭 Attempting to restore mock purchases');
      const stored = await AsyncStorage.getItem(this.mockSubscriptionKey);
      
      if (stored) {
        const mockStatus = JSON.parse(stored);
        console.log('🎭 Mock subscription restored');
        return mockStatus;
      }
      
      console.log('🎭 No mock subscription found');
      return { isPro: false };
    }

    // REAL MODE: Use RevenueCat
    try {
      const customerInfo = await Purchases.restorePurchases();
      return this.handleCustomerInfo(customerInfo);
    } catch (error: any) {
      console.error('Restore failed:', error);
      return { isPro: false, error: error.message };
    }
  }

  /**
   * Get current user status
   */
  async getUserStatus() {
    // MOCK MODE: Check AsyncStorage
    if (USE_MOCK_PAYMENTS) {
      const stored = await AsyncStorage.getItem(this.mockSubscriptionKey);
      
      if (stored) {
        const mockStatus = JSON.parse(stored);
        
        // Check if mock subscription is expired
        const expiryDate = new Date(mockStatus.latestExpirationDate);
        const isExpired = expiryDate < new Date();
        
        if (isExpired) {
          console.log('🎭 Mock subscription expired');
          return { isPro: false };
        }
        
        console.log('🎭 Mock subscription active');
        return mockStatus;
      }
      
      return { isPro: false };
    }

    // REAL MODE: Use RevenueCat
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.handleCustomerInfo(customerInfo);
    } catch (error) {
      return { isPro: false };
    }
  }

  /**
   * Clear mock subscription (for testing)
   */
  async clearMockSubscription() {
    if (USE_MOCK_PAYMENTS) {
      await AsyncStorage.removeItem(this.mockSubscriptionKey);
      console.log('🎭 Mock subscription cleared');
    }
  }

  /**
   * Private helper to parse RevenueCat CustomerInfo
   */
  private handleCustomerInfo(info: CustomerInfo) {
    const isPro = typeof info.entitlements.active[ENTITLE_ID] !== "undefined";
    return {
      isPro,
      activeSubscriptions: info.activeSubscriptions,
      latestExpirationDate: info.latestExpirationDate,
    };
  }
}

export const subscriptionService = new SubscriptionService();

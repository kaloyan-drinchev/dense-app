import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditionally import IAP to avoid native module errors in Expo Go
let RNIap = null;
try {
  // This will fail in Expo Go, which is expected
  RNIap = require('react-native-iap');
} catch (error) {
  console.log('📱 Running in Expo Go - IAP module not available');
}

// JavaScript file - interfaces removed, using plain objects

// Apple App Store Connect product IDs - these need to match your App Store Connect setup
export const APPLE_PRODUCT_IDS = {
  monthly: 'app.dense.monthly.pro',
  sixmonths: 'app.dense.sixmonths.pro', 
  yearly: 'app.dense.yearly.pro'
};

// Valid product IDs: 'monthly', 'sixmonths', 'yearly'

class AppleIAPService {
  constructor() {
    this.isInitialized = false;
    this.products = [];
    this.purchaseListener = null;
  }

  /**
   * Check if we're running in Expo Go (which doesn't support native IAP)
   */
  isExpoGo() {
    // If RNIap module is null, we're in Expo Go
    return RNIap === null;
  }

  /**
   * Initialize the IAP service - call this when app starts
   */
  async initialize() {
    try {
      console.log('🍎 Initializing Apple IAP service...');

      // Only initialize on iOS
      if (Platform.OS !== 'ios') {
        console.log('📱 Skipping IAP initialization - not on iOS');
        return { success: true };
      }

      // Check if we're in Expo Go
      if (this.isExpoGo()) {
        console.log('📱 Running in Expo Go - using mock IAP for development');
        this.isInitialized = true;
        // Load mock products for development
        this.products = [
          {
            productId: APPLE_PRODUCT_IDS.monthly,
            price: '$7.99',
            priceAmountMicros: 7990000,
            priceCurrencyCode: 'USD',
            title: 'Dense Pro Monthly (Mock)',
            description: 'Monthly subscription to Dense Pro features',
            type: 'subscription'
          },
          {
            productId: APPLE_PRODUCT_IDS.sixmonths,
            price: '$35.99',
            priceAmountMicros: 35990000,
            priceCurrencyCode: 'USD',
            title: 'Dense Pro 6-Month (Mock)',
            description: '6-month subscription to Dense Pro features',
            type: 'subscription'
          },
          {
            productId: APPLE_PRODUCT_IDS.yearly,
            price: '$47.99',
            priceAmountMicros: 47990000,
            priceCurrencyCode: 'USD',
            title: 'Dense Pro Yearly (Mock)',
            description: 'Annual subscription to Dense Pro features',
            type: 'subscription'
          }
        ];
        console.log('✅ Mock Apple IAP service initialized');
        return { success: true };
      }

      // Connect to the store (real IAP)
      await RNIap.initConnection();
      console.log('✅ Connected to Apple App Store');

      // Set up purchase listener
      this.purchaseListener = RNIap.purchaseUpdatedListener((purchase) => {
        console.log('🛒 Purchase listener triggered:', purchase);
        console.log('✅ Purchase successful:', purchase);
        this.handlePurchaseSuccess(purchase);
      });

      // Set up purchase error listener
      this.purchaseErrorListener = RNIap.purchaseErrorListener((error) => {
        console.log('❌ Purchase failed:', error);
      });

      // Load available products
      await this.loadProducts();

      this.isInitialized = true;
      console.log('✅ Apple IAP service initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize Apple IAP:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown initialization error'
      };
    }
  }

  /**
   * Load available products from App Store
   */
  async loadProducts() {
    try {
      const productIds = Object.values(APPLE_PRODUCT_IDS);
      console.log('📦 Loading products:', productIds);

      const results = await RNIap.getSubscriptions({ skus: productIds });
      
      if (results && results.length > 0) {
        this.products = results.map(product => ({
          productId: product.productId,
          price: product.localizedPrice,
          priceAmountMicros: parseFloat(product.price) * 1000000,
          priceCurrencyCode: product.currency,
          title: product.title,
          description: product.description,
          type: 'subscription'
        }));
        
        console.log('✅ Loaded products:', this.products);
      } else {
        console.warn('⚠️ Failed to load products, using fallback pricing');
        // Fallback to our hardcoded pricing for development
        this.products = [
          {
            productId: APPLE_PRODUCT_IDS.monthly,
            price: '$7.99',
            priceAmountMicros: 7990000,
            priceCurrencyCode: 'USD',
            title: 'DENSE Monthly Pro',
            description: 'Monthly subscription to DENSE Pro',
            type: 'subscription'
          },
          {
            productId: APPLE_PRODUCT_IDS.sixmonths,
            price: '$35.99',
            priceAmountMicros: 35990000,
            priceCurrencyCode: 'USD',
            title: 'DENSE 6-Month Pro',
            description: '6-month subscription to DENSE Pro',
            type: 'subscription'
          },
          {
            productId: APPLE_PRODUCT_IDS.yearly,
            price: '$47.99',
            priceAmountMicros: 47990000,
            priceCurrencyCode: 'USD',
            title: 'DENSE Annual Pro',
            description: 'Annual subscription to DENSE Pro',
            type: 'subscription'
          }
        ];
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(planId) {
    try {
      console.log('🛒 Starting purchase for plan:', planId);

      if (!this.isInitialized) {
        console.log('⚠️ IAP service not initialized, initializing now...');
        await this.initialize();
      }

      if (Platform.OS !== 'ios') {
        throw new Error('Apple IAP only available on iOS');
      }

      const productId = APPLE_PRODUCT_IDS[planId];
      const product = this.products.find(p => p.productId === productId);
      
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      console.log('🛒 Purchasing product:', product);

      // Check if we're in Expo Go mode (mock payments)
      if (this.isExpoGo()) {
        console.log('📱 Mock purchase in Expo Go mode');
        return await this.mockPurchase(planId);
      }

      // Start the purchase flow
      const purchase = await RNIap.requestSubscription({ sku: productId });
      
      if (purchase) {
        console.log('✅ Purchase completed:', purchase);
        
        const iapPurchase = {
          purchaseId: purchase.transactionId || `iap_${Date.now()}`,
          productId: purchase.productId,
          purchaseTime: purchase.transactionDate || Date.now(),
          purchaseState: 'purchased',
          isAcknowledged: false,
          orderId: purchase.transactionId || '',
          originalTransactionId: purchase.originalTransactionId,
          transactionReceipt: purchase.transactionReceipt || ''
        };

        // Store purchase locally
        await this.storePurchase(iapPurchase);
        
        return { success: true, purchase: iapPurchase };
      } else {
        return { success: false, error: 'Purchase failed' };
      }
    } catch (error) {
      console.error('❌ Purchase error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown purchase error'
      };
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases() {
    try {
      console.log('🔄 Restoring purchases...');

      if (!this.isInitialized) {
        throw new Error('IAP service not initialized');
      }

      if (Platform.OS !== 'ios') {
        return { success: true, restored: 0 };
      }

      const results = await RNIap.getAvailablePurchases();
      
      if (results && results.length > 0) {
        console.log('📦 Found purchase history:', results);
        
        let restoredCount = 0;
        for (const purchase of results) {
          if (Object.values(APPLE_PRODUCT_IDS).includes(purchase.productId)) {
            const iapPurchase = {
              purchaseId: purchase.transactionId || `restored_${Date.now()}`,
              productId: purchase.productId,
              purchaseTime: purchase.transactionDate || Date.now(),
              purchaseState: 'purchased',
              isAcknowledged: false,
              orderId: purchase.transactionId || '',
              originalTransactionId: purchase.originalTransactionId,
              transactionReceipt: purchase.transactionReceipt || ''
            };
            
            await this.storePurchase(iapPurchase);
            restoredCount++;
          }
        }
        
        console.log(`✅ Restored ${restoredCount} purchases`);
        return { success: true, restored: restoredCount };
      } else {
        console.log('📦 No purchases to restore');
        return { success: true, restored: 0 };
      }
    } catch (error) {
      console.error('❌ Restore error:', error);
      return { 
        success: false, 
        restored: 0,
        error: error instanceof Error ? error.message : 'Unknown restore error'
      };
    }
  }

  /**
   * Get available subscription products
   */
  getProducts() {
    return this.products;
  }

  /**
   * Get a specific product by ID
   */
  getProduct(productId) {
    return this.products.find(p => p.productId === productId);
  }

  /**
   * Handle successful purchase
   */
  async handlePurchaseSuccess(purchase) {
    try {
      console.log('🎉 Processing successful purchase:', purchase);
      
      // Acknowledge the purchase 
      await RNIap.finishTransaction({ purchase, isConsumable: false });
      
      // Store purchase record
      const iapPurchase = {
        purchaseId: purchase.orderId || purchase.transactionId || `success_${Date.now()}`,
        productId: purchase.productId,
        purchaseTime: purchase.purchaseTime || Date.now(),
        purchaseState: 'purchased',
        isAcknowledged: true,
        orderId: purchase.orderId || purchase.transactionId || '',
        originalTransactionId: purchase.originalTransactionId,
        transactionReceipt: purchase.transactionReceipt || ''
      };
      
      await this.storePurchase(iapPurchase);
      console.log('✅ Purchase processed and stored');
    } catch (error) {
      console.error('❌ Error processing purchase:', error);
    }
  }

  /**
   * Store purchase record
   */
  async storePurchase(purchase) {
    try {
      const stored = await AsyncStorage.getItem('apple_iap_purchases');
      const purchases = stored ? JSON.parse(stored) : [];
      
      // Avoid duplicates
      const existingIndex = purchases.findIndex(p => p.purchaseId === purchase.purchaseId);
      if (existingIndex >= 0) {
        purchases[existingIndex] = purchase;
      } else {
        purchases.push(purchase);
      }
      
      await AsyncStorage.setItem('apple_iap_purchases', JSON.stringify(purchases));
      console.log('💾 Purchase stored locally');
    } catch (error) {
      console.error('❌ Error storing purchase:', error);
    }
  }

  /**
   * Get stored purchases
   */
  async getStoredPurchases() {
    try {
      const stored = await AsyncStorage.getItem('apple_iap_purchases');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting stored purchases:', error);
      return [];
    }
  }

  /**
   * Check if user has active subscription based on purchases
   */
  async hasActiveSubscription() {
    try {
      const purchases = await this.getStoredPurchases();
      
      // Find the most recent valid purchase
      const validPurchases = purchases
        .filter(p => p.purchaseState === 'purchased')
        .sort((a, b) => b.purchaseTime - a.purchaseTime);
      
      if (validPurchases.length === 0) {
        return { isActive: false };
      }
      
      const latestPurchase = validPurchases[0];
      
      // For subscriptions, we need to calculate expiry based on the product type
      // This is simplified - in production you'd validate with Apple's servers
      const purchaseDate = new Date(latestPurchase.purchaseTime);
      let expiryDate;
      
      if (latestPurchase.productId === APPLE_PRODUCT_IDS.monthly) {
        expiryDate = new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      } else if (latestPurchase.productId === APPLE_PRODUCT_IDS.sixmonths) {
        expiryDate = new Date(purchaseDate.getTime() + (6 * 30 * 24 * 60 * 60 * 1000)); // 6 months
      } else if (latestPurchase.productId === APPLE_PRODUCT_IDS.yearly) {
        expiryDate = new Date(purchaseDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
      } else {
        return { isActive: false };
      }
      
      const isActive = new Date() < expiryDate;
      
      return {
        isActive,
        productId: latestPurchase.productId,
        expiryDate
      };
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return { isActive: false };
    }
  }

  /**
   * Map our internal product IDs to Apple product IDs
   */
  mapToAppleProductId(internalId) {
    switch (internalId) {
      case 'monthly':
        return APPLE_PRODUCT_IDS.monthly;
      case 'sixmonths':
        return APPLE_PRODUCT_IDS.sixmonths;
      case 'yearly':
        return APPLE_PRODUCT_IDS.yearly;
      default:
        return null;
    }
  }

  /**
   * Map Apple product ID back to our internal ID
   */
  mapFromAppleProductId(appleId) {
    switch (appleId) {
      case APPLE_PRODUCT_IDS.monthly:
        return 'monthly';
      case APPLE_PRODUCT_IDS.sixmonths:
        return 'sixmonths';
      case APPLE_PRODUCT_IDS.yearly:
        return 'yearly';
      default:
        return null;
    }
  }

  /**
   * Disconnect from the store
   */
  async disconnect() {
    try {
      if (this.purchaseListener) {
        this.purchaseListener.remove();
        this.purchaseListener = null;
      }

      if (this.purchaseErrorListener) {
        this.purchaseErrorListener.remove();
        this.purchaseErrorListener = null;
      }
      
      if (Platform.OS === 'ios') {
        await RNIap.endConnection();
      }
      
      this.isInitialized = false;
      console.log('✅ Disconnected from Apple IAP');
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }

  /**
   * Get payment provider info
   */
  getPaymentProviderInfo() {
    return {
      provider: 'apple',
      displayName: 'Apple In-App Purchases'
    };
  }

  /**
   * Mock purchase for development/Expo Go
   */
  async mockPurchase(planId) {
    try {
      console.log('🎭 Processing mock purchase for plan:', planId);
      
      const productId = APPLE_PRODUCT_IDS[planId];
      if (!productId) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      // Create mock purchase data
      const mockPurchase = {
        purchaseId: `mock_${Date.now()}`,
        productId: productId,
        purchaseTime: Date.now(),
        purchaseState: 'purchased',
        isAcknowledged: true,
        orderId: `mock_order_${Date.now()}`,
        originalTransactionId: `mock_trans_${Date.now()}`,
        transactionReceipt: 'mock_receipt_data'
      };

      // Store the mock purchase
      await this.storePurchase(mockPurchase);
      
      console.log('✅ Mock purchase completed:', mockPurchase);
      return { success: true, purchase: mockPurchase };
    } catch (error) {
      console.error('❌ Mock purchase error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const appleIAPService = new AppleIAPService();

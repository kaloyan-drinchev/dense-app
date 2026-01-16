# 🎭 Mock Payments Guide

## Current Status: MOCK MODE ENABLED ✅

Your subscription service is now configured to use **mock payments** for development. No RevenueCat setup required!

---

## How Mock Payments Work

### What You Get:
✅ Full subscription UI working  
✅ Can "purchase" any plan  
✅ Plans show up in SubscriptionScreen  
✅ Subscription status is tracked  
✅ Can test navigation logic  
✅ Can restore "purchases"  
✅ NO actual charges  
✅ NO RevenueCat API keys needed  

### Mock Plans Available:
- **Monthly Pro**: $9.99/month
- **Six Month Pro**: $49.99 (6 months)
- **Annual Pro**: $79.99/year (Best Value)

### How It Stores Data:
- Uses **AsyncStorage** to save mock subscription status
- Simulates a 1-year subscription when you "purchase"
- Persists across app restarts
- Can be cleared for testing

---

## Testing Mock Payments

### 1. View Plans
Navigate to the subscription screen - you'll see all 3 mock plans with prices and features.

### 2. "Purchase" a Plan
- Select any plan
- Click Subscribe/Purchase
- It will instantly grant access (no payment dialog)
- Status is saved to AsyncStorage

### 3. Check Subscription Status
The app will now show you as a "Pro" user with access to all features.

### 4. Restore "Purchases"
Click "Restore Purchases" to restore your mock subscription from AsyncStorage.

### 5. Clear Subscription (For Testing)
To test the subscription flow again, you can:
- Clear app data, OR
- Call `subscriptionService.clearMockSubscription()` in your code

---

## Switching to Real Payments

When you're ready to use actual RevenueCat payments:

### Step 1: Get RevenueCat API Keys
1. Set up your app in [RevenueCat Dashboard](https://app.revenuecat.com)
2. Configure both iOS and Android platforms
3. Get your API keys

### Step 2: Update Config
Open `services/subscription/config.ts`:

```typescript
// Change this from true to false
export const USE_MOCK_PAYMENTS = false; // ⚠️ CHANGE THIS

// Add your real keys
export const REVENUECAT_KEYS = {
  apple: 'appl_YOUR_ACTUAL_IOS_KEY',
  google: 'goog_YOUR_ACTUAL_ANDROID_KEY',
};
```

### Step 3: Test
- Rebuild your app
- Use sandbox/test accounts to verify real purchases work
- Test restore purchases with real subscriptions

That's it! The code automatically switches between mock and real mode.

---

## Advantages of Mock Mode for Development

✅ **No Setup Required**: Start developing immediately  
✅ **No Costs**: Test unlimited times without charges  
✅ **Fast Iteration**: No waiting for store approvals  
✅ **Predictable**: Same behavior every time  
✅ **Easy Switching**: One flag to toggle between modes  

---

## Current Configuration

```typescript
// services/subscription/config.ts
USE_MOCK_PAYMENTS = true  // ✅ Currently in MOCK mode
```

**Console Output:**
- `🎭 Subscription Service Initialized (MOCK MODE)`
- `🎭 Returning mock payment plans`
- `🎭 Mock purchase successful`
- `🎭 Mock subscription active`

---

## API Methods (Work in Both Modes)

All these work identically in both mock and real mode:

```typescript
// Initialize
await subscriptionService.initialize(userId);

// Get plans
const plans = await subscriptionService.getPaywallOptions();

// Purchase (pass the plan or rcPackage)
const result = await subscriptionService.purchasePackage(selectedPlan);

// Check status
const status = await subscriptionService.getUserStatus();
// Returns: { isPro: true/false, activeSubscriptions: [], latestExpirationDate: string }

// Restore
const restored = await subscriptionService.restorePurchases();

// Clear mock (only in mock mode)
await subscriptionService.clearMockSubscription();
```

---

## Testing Checklist

Before switching to real payments, test these in mock mode:

- [ ] Plans display correctly in UI
- [ ] Can select and "purchase" each plan
- [ ] Subscription status updates after purchase
- [ ] Navigation logic works (shows/hides subscription screen)
- [ ] Restore purchases works
- [ ] Subscription expiry works (set to 1 year in mock)
- [ ] All UI flows complete without errors

---

## Mock Data Storage

**Key:** `@mock_subscription_status`

**Stored Object:**
```json
{
  "isPro": true,
  "activeSubscriptions": ["dense_monthly_pro"],
  "latestExpirationDate": "2026-01-16T00:00:00.000Z",
  "purchaseDate": "2025-01-16T00:00:00.000Z"
}
```

---

## Need Help?

- **Issue**: Plans not showing → Check `MOCK_PLANS` in config.ts
- **Issue**: Purchase not working → Check console for `🎭` logs
- **Issue**: Status not persisting → Check AsyncStorage permissions

**Happy testing! 🚀**

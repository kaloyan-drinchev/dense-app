# Subscription Service

Clean, single-source subscription service using RevenueCat with mock mode support.

## Quick Start

### Development (Mock Payments)
```typescript
// config.ts
export const USE_MOCK_PAYMENTS = true; // ✅ No setup needed!
```

### Production (Real Payments)
```typescript
// config.ts
export const USE_MOCK_PAYMENTS = false;
export const REVENUECAT_KEYS = {
  apple: 'appl_YOUR_KEY',
  google: 'goog_YOUR_KEY',
};
```

## Usage

```typescript
import { subscriptionService } from '@/services/subscription';

// Initialize
await subscriptionService.initialize(userId);

// Get plans for paywall
const plans = await subscriptionService.getPaywallOptions();

// Purchase
const result = await subscriptionService.purchasePackage(plan.rcPackage);

// Check status
const status = await subscriptionService.getUserStatus();

// Restore
const restored = await subscriptionService.restorePurchases();
```

## Files

- **config.ts** - API keys, plan metadata, mock data
- **index.ts** - Service logic (auto-switches mock/real mode)
- **README.md** - This file

## Documentation

See `MOCK_PAYMENTS_GUIDE.md` for detailed mock mode documentation.

# 🚨 TESTING FEATURES - REMOVE BEFORE PRODUCTION

This document lists all testing-only features that need to be removed before production release.

## Features to Remove

### 1. Reset Progress Functionality
**Purpose**: For development testing only - allows complete data reset
**Files to modify**:

#### Store Files:
- `store/timer-store.ts`
  - Remove `clearAllTimerData()` function (lines ~25, ~139-159)
  - Remove interface declaration

- `store/workout-store.ts`
  - Remove `resetProgress()` function (lines ~42, ~387-439)
  - Remove interface declaration
  - Remove AsyncStorage clearing logic

- `store/auth-store.ts`
  - Remove timer clearing from `logout()` function (lines ~231-241)
  - Remove `resetProgress()` call from logout (line ~232)

#### UI Files:
- `app/(tabs)/settings.tsx`
  - Remove `handleResetProgress()` function (lines ~79-120)
  - Remove entire "Reset Progress" TouchableOpacity (lines ~251-269)
  - Remove `isResetting` state and related imports

## Search Pattern for Removal
Search for: `🚨 TESTING ONLY` - all testing code is marked with this comment

## Expected Behavior After Removal
- No reset button in Settings
- Logout only clears auth data (normal behavior)
- Timer data persists normally between sessions
- Progress data persists normally

## Notes
- The reset functionality was implemented to fix timer persistence during development
- In production, users should never need to completely wipe their data
- Normal logout should only clear authentication, not progress data

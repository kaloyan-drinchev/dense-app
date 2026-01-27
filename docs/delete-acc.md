@Workspace
Role: Mobile Lifecycle Engineer.
Task: Implement "Factory Reset" Account Deletion with RevenueCat support.

**Context:** - App has no Email Login (Anonymous/Device based).
- Uses RevenueCat for subscriptions.
- Uses Supabase for data.

1. **Backend Logic:**
   - Create a PostgreSQL RPC function `delete_user_profile()` that deletes the `public.profiles` row for the calling user.
   - Ensure Foreign Key cascades handle the cleanup of matches/swipes.

2. **Frontend Logic (`app/settings/index.tsx`):**
   - Import `Purchases` from 'react-native-purchases'.
   - Add a "Delete Data & Reset App" button.

3. **The Deletion Workflow (The `handleDelete` function):**
   - **Step 1: Modal Warning**
     - "This will delete your profile and match history permanently. It does NOT cancel your subscription (manage that in Device Settings)." (this needs to delete all data related to this user. exercises, sets,reps,finished workouts, nutrition history, everything, progress, etc!)
   - **Step 2: Execution**
     - Await `supabase.rpc('delete_user_profile')`.
     - **CRITICAL:** Await `Purchases.logOut()`. 
       - *Why:* This resets the RevenueCat identity so the next launch creates a fresh anonymous user.
     - Await `AsyncStorage.clear()`.
   - **Step 3: Redirect**
     - `router.replace('/onboarding')`.

4. **"Restore Purchase" Note:**
   - Ensure the Onboarding/Paywall screen has a functional "Restore Purchases" button, as the "New" user will technically not have the subscription attached until they restore.
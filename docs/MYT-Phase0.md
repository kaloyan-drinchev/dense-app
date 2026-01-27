@Workspace
Role: React Native Architect.
Task: Setup Network & Supabase Client.

**Goal** Since this is your first online feature, we must ensure the app can talk to the internet and handle offline states gracefully.

## Part 1:
1. **Dependencies:**
   - Install `@react-native-community/netinfo` (for offline checking).
   - Ensure `@supabase/supabase-js` is installed.

2. **Supabase Client:**
   - Create `lib/supabase.ts`.
   - Initialize the client using `Expo SecureStore` for auth persistence (so users stay logged in).
   - Export the `supabase` object.

3. **Offline Hook:**
   - Create a custom hook `hooks/useNetworkStatus.ts`.
   - It should return `isConnected` (boolean).
   - It should listen to network state changes using NetInfo.

4. **Types:**
   - Create `types/database.types.ts` (You can generate this from Supabase, or create a placeholder for now matching our Schema plan).

 ##  Part 2:

 Create another Step in the Wizard, where user will add their BSD (Bench press, Squad, Deadlift) max. And store it like we are storing all the other info we are gathering for the user. To be visible in the Wizard Overview step (the last one), also in the settings, where user can see their goals (there user sees what values he inserted in the inputs on the wizard (onboarding))
By these values we will be working on the MYT feature.

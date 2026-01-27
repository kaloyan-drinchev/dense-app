@Workspace
Role: UX & Navigation Engineer.
Task: Implement Network handling, Onboarding Modal, and Navigation Gating.

**Goal** Handle the "Real World" constraints: WiFi connection, the First-Time User Modal, and placing the entry button on the Home Screen.

1. **Network Layer:**
   - Create `hooks/useNetworkStatus.ts` using `@react-native-community/netinfo`.
   - in `app/twin/index.tsx`, use this hook.
   - If `!isConnected`, return a "No Internet Connection" UI view immediately, blocking any data fetching.

2. **The "First Time" Modal (Global):**
   - In `app/_layout.tsx` (or Root Layout), check `AsyncStorage` for key `has_seen_twin_intro`.
   - If `null`: Render a Modal over the app.
     - Content: "Ready to Meet Your Rival?"
     - Button "YES": Sets key to true, triggers navigation.
     - Button "Not Now": Sets key to true, closes modal.

3. **Home Screen Entry & Gating:**
   - Add a "Find Your Twin" Card/Button to `app/index.tsx`.
   - **Gating Logic:** When clicked (or when Modal "YES" is clicked):
     - Check `user.total_lifted_kg` from Supabase.
     - **If 0 or null:** Alert "We need your strength stats first!" and navigate to `app/profile/edit`.
     - **If valid:** Navigate to `app/twin/index.tsx`.
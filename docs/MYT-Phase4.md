@Workspace
Role: React Native UI Specialist.
Task: Create the `TwinCard` component.

**Goal** Build the UI components in isolation. We focus heavily on NativeWind styling here to ensure the "Write Once, Run Everywhere" strategy works for both Android phones and Windows desktops.

Context: We are using NativeWind (Tailwind) and Expo.
Goal: A visual card displaying user stats.

1. Create `components/TwinCard.tsx`.
2. Props: `profile` (matches the DB schema).
3. Design:
   - Container: Rounded-xl, shadow-xl, slate-800 background.
   - Content: Show Username, Total Lifted, and **highlight the DOTS score**.
4. **Platform Specifics**:
   - We need deeper padding on Windows for mouse usage.
   - Use NativeWind platform modifiers: `p-4 windows:p-8`.
   - Ensure text sizes scale legibly on desktop windows.
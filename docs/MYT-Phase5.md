@Workspace
Role: Animation Engineer (Reanimated 3).
Task: Implement the `SwipeDeck` component. 

**Goal** The most complex frontend task. We isolate this to ensure the physics engine (Reanimated 3) doesn't break the business logic. This phase focuses entirely on "User Feel" and 60fps performance.

1. Use `react-native-gesture-handler` (GestureDetector) and `react-native-reanimated`.
2. **Logic**:
   - Receive a stack of profiles.
   - Render the top 2 profiles (for performance).
   - The top card is a PanGesture.
3. **Physics**:
   - Map x-translation to rotation (tilt as you drag).
   - Use `Worklets` for all gesture logic to run on the UI thread (crucial for Android low-end).
   - On Release (`onFinalize`): If velocity > 800 or translation is significant, throw the card off-screen and trigger the `onSwipe` callback. Otherwise, spring back to center.
4. **Windows Compatibility**:
   - Ensure the `GestureDetector` is configured to accept mouse drags (Pointer events) identical to touch events.
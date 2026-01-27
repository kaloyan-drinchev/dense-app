@Workspace
Role: Full Stack Integrator.
Task: Create the Waiting Room and connect the Twin Feed.

**Goal** Create the "Zero User" UI and wire the Backend (RPC) to the Frontend. This phase ensures that if no matches are found, the user sees a "Waiting Room" instead of a broken empty deck.

1. **Create `components/WaitingRoom.tsx`:**
   - This is the "Zero User" state.
   - UI: A clean, centered card.
   - Icon: A radar or trophy icon.
   - Text: "Scouting for your strength rival..." and "You are early to the arena."
   - Button: "Notify me when found" (Visual only for now).

2. **Implement `app/twin/index.tsx` (The Main Screen):**
   - **State:** `profiles` (Array), `loading` (Boolean).
   - **Fetch:** On mount, call the `get_potential_matches` RPC from Supabase.
   - **Conditional Rendering (Crucial):**
     - If `loading`: Show a Loading Spinner.
     - If `profiles.length === 0`: Render `<WaitingRoom />`.
     - If `profiles.length > 0`: Render `<SwipeDeck profiles={profiles} onSwipe={handleSwipe} />`.

3. **Wiring the Swipe Logic:**
   - Implement the `handleSwipe` function passed to the deck.
   - Arguments: `swiped_profile_id`, `direction`.
   - Action: Insert row into Supabase `swipes` table.
   - Error Handling: Wrap in try/catch. If error message contains "locked", show a `Alert.alert("Match Locked", "You are already in a partnership!")`.
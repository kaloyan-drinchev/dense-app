@Workspace
Role: Reliability Engineer.
Task: Implement Safety Nets for Edge Cases (Ghost Users, Pagination, Stale Data).

1. **Fix "Ghost Partner" Trap (Database):**
   - Create a new migration file `supabase/migrations/20240102_safety_hardening.sql`.
   - Update `partnerships` table:
     - The `user_a` and `user_b` columns MUST have `ON DELETE CASCADE`.
     - This ensures if a user deletes their account, the partnership row vanishes, unlocking the survivor immediately.

2. **Fix "Input Math" Errors (Database):**
   - Add a CHECK constraint to `profiles`: `body_weight_kg > 0`.
   - This prevents Division-By-Zero in the DOTS calculation.

3. **Fix "Infinite Waiting Room" (Frontend - `SwipeDeck`):**
   - In `SwipeDeck.tsx`, add a prop `onStackLow` (callback).
   - Logic: When `currentIndex >= profiles.length - 2`, trigger `onStackLow`.
   - In `app/twin/index.tsx`:
     - Connect `onStackLow` to a pagination fetcher.
     - Fetch the next 10 users (OFFSET based on current count) and append them to the state.
     - ONLY show `<WaitingRoom>` if the *server* returns empty array AND local stack is empty.

4. **Fix "Stale Swipe" Error (Frontend - Integration):**
   - In `handleSwipe` (app/twin/index.tsx):
   - Enhance the `catch` block.
   - Check if the error code/message relates to the "Lock Trigger".
   - If yes: Show a specific Toast/Alert: "Too late! This athlete just found a match."
   - Immediately remove the card from the deck so the user can continue swiping.
@Workspace
Role: Backend Logic Engineer.
Task: Create the Feed RPC and Concurrency Triggers.

**Goal** Implement the "Anti-Join" pattern and the concurrency triggers. This handles the logic of who you see (excluding people you've already swiped) and ensuring you cannot have multiple active partnerships simultaneously.

1. **The Feed (RPC):**
   Create a function `get_potential_matches(viewer_id uuid)`.
   - It must return profiles.
   - FILTERING: Use `NOT EXISTS` (Anti-Semi Join) to exclude anyone the viewer has already swiped on.
   - FILTERING: Exclude profiles currently in a 'locked' partnership.
   - SORTING: `ORDER BY ABS(profiles.dots_score - viewer_dots_score) ASC`.

2. **The Lock (Triggers):**
   - Trigger 1 (`before_swipe`): Before inserting into `swipes`, check `partnerships`. If `from_id` is currently locked (locked_until > NOW()), RAISE EXCEPTION.
   - Trigger 2 (`on_match`): After inserting a 'right' swipe, check if the reciprocal 'right' swipe exists. If yes, insert into `partnerships` and set `locked_until` to 28 days from now.
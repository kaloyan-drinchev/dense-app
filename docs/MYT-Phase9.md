@Workspace
Role: Compliance Engineer.
Task: Implement Input Limits and Safety Constraints.

1. **Database Constraints (Update Schema):**
   - Add CHECK constraints to `profiles`:
     - `squat_kg <= 400`
     - `bench_kg <= 300`
     - `deadlift_kg <= 400`
   - This ensures no one breaks the app with fake 1000kg lifts.

2. **Frontend Validation (`app/profile/edit.tsx`):**
   - Update the form validation schema (Zod/Yup).
   - **Rules:**
     - Squat: Max 400.
     - Bench: Max 300.
     - Deadlift: Max 400.
   - **Error Message:** "Limit exceeded. Max allowed: [Value]kg."

3. **Reporting System:**
   - Create `reports` table.
   - Add "Report & Unmatch" button in Chat Settings.
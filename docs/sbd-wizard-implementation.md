@Workspace
Role: React Native Onboarding Specialist.
Task: Add "Powerlifting Stats" Step to Onboarding Wizard.

**Objective:**
We need to collect the user's "Big 3" One-Rep Maxes (Squat, Bench, Deadlift) during the onboarding flow. This data is critical for the upcoming "Meet Your Twin" feature.

**1. Database Schema Update (Supabase)**
Ensure the `profiles` table has the following columns (create a migration if they don't exist):
- `squat_kg` (Numeric, Default 0)
- `bench_kg` (Numeric, Default 0)
- `deadlift_kg` (Numeric, Default 0)
- `total_lifted_kg` (Numeric) -> GENERATED ALWAYS AS (squat_kg + bench_kg + deadlift_kg) STORED.

**2. New Wizard Component: `StatsInputStep.tsx`**
Create a new step in the Onboarding Wizard flow.
- **UI:** Three numeric input fields labeled "Squat (kg)", "Bench Press (kg)", and "Deadlift (kg)".
- **Validation (Strict):** You must strictly enforce the following maximums using Zod or Formik:
  - Squat: Max 400 kg.
  - Bench: Max 300 kg.
  - Deadlift: Max 400 kg.
  - *Error Message:* "Value exceeds the human limit allowed (Max: X kg)."
- **UX:** Use a numeric keyboard. If the user doesn't know their max, allow them to enter '0' or skip (default to 0).

**3. State Management & Overview**
- Update the Onboarding Store/Context to include `stats: { squat: number, bench: number, deadlift: number }`.
- **The Overview Step:** Update the final "Review" screen of the wizard to display these three values so the user can verify them before submitting.

**4. Settings / Profile Screen Update**
- Navigate to the existing Settings or Goals screen where user data is displayed.
- Add a new section: "Strength Profile".
- Display the current maxes fetched from the `profiles` table.
- Allow the user to edit these values (re-using the same validation logic from the Wizard).

**Deliverables:**
- `components/onboarding/StatsInputStep.tsx`
- Updates to `components/onboarding/OverviewStep.tsx`
- Updates to `app/settings/index.tsx` (or relevant profile screen).
- Schema migration SQL (if needed).
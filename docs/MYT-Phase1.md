# "Meet Your Twin" Protocol: Modular Implementation Strategy

## Executive Summary
This document outlines the step-by-step implementation plan for the "Meet Your Twin" feature. It breaks the architectural synthesis into **6 Sequential Phases**.

**Methodology:**
* **Encapsulation:** Each phase isolates a specific domain (Database, Math, UI, Physics) to prevent context drift in the AI.
* **KISS:** Complex problems (like DOTS scoring) are solved in isolation before being integrated.
* **Sequential Execution:** Do not proceed to the next phase until the current phase is verified.

---

## Phase 1: The Foundation (Schema & Storage)
**Goal:** Establish the strict database structure before writing any application code. This ensures the data types are correct for the math that follows and enforces data integrity at the lowest level.


### Prompt for Phase 1
```text
@Workspace
Role: Senior Database Engineer.
Task: Initialize the PostgreSQL schema for "Meet Your Twin".

Create a file `supabase/migrations/20240101_init_schema.sql`.
I need you to implement three specific tables with the following constraints:

1. `profiles`:
   - `id` (UUID, PK, references auth.users)
   - `gender` (Text) -> MUST have a Check constraint allowing only 'male' or 'female'.
   - `body_weight_kg` (Numeric, Non-null)
   - `total_lifted_kg` (Numeric)
   - `dots_score` (Numeric) -> Leave this nullable for now, we will add the generator function in the next step.

2. `swipes`:
   - `from_id` (UUID), `to_id` (UUID)
   - `direction` (Text: 'left' | 'right')
   - CONSTRAINT: A Composite Unique Index on (from_id, to_id) to prevent duplicate swipes.

3. `partnerships`:
   - `id` (UUID)
   - `user_a` (UUID), `user_b` (UUID)
   - `locked_until` (Timestamp) -> Default to NOW() + 28 days.
   - `status` (Text: 'active' | 'archived')

Please generate the SQL for this schema.
# 🚀 Migration Roadmap: SQLite → Supabase PostgreSQL

## Overview
Migrate from local SQLite database to Supabase PostgreSQL cloud database with authentication.

**Estimated Timeline:** 2-3 weeks (with testing)
**Complexity:** Medium
**Risk Level:** Medium (requires careful data migration)

---

## 📋 Phase 1: Preparation & Setup (Days 1-2)

### Step 1.1: Supabase Project Setup
- [ ] Create Supabase account (if not exists)
- [ ] Create new project: "DENSE Production"
- [ ] Note down:
  - Project URL: `https://xxxxx.supabase.co`
  - Anon Key: `eyJhbGci...`
  - Service Role Key: `eyJhbGci...` (keep secret!)
- [ ] Enable email authentication in Supabase Dashboard
- [ ] Configure email templates (optional)

### Step 1.2: Install Dependencies
```bash
npm install @supabase/supabase-js drizzle-orm @drizzle-team/drizzle-kit postgres
npm install --save-dev @types/pg
```

### Step 1.3: Environment Configuration
- [ ] Create `.env` file (add to `.gitignore`)
- [ ] Add Supabase credentials:
  ```
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=eyJhbGci...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (server-side only)
  ```
- [ ] Update `supabase.config.js` to use env variables

### Step 1.4: Backup Current Data
- [ ] Create backup script to export all SQLite data to JSON
- [ ] Test restore process
- [ ] Document current user count and data volume

---

## 📋 Phase 2: Schema Migration (Days 3-5)

### Step 2.1: Convert Schema to PostgreSQL
- [ ] Create new `db/schema-postgres.ts`:
  - Convert `sqliteTable` → `pgTable`
  - Convert `text()` → `text()` or `varchar()`
  - Convert `integer()` → `integer()` or `serial()`
  - Convert `real()` → `real()` or `numeric()`
  - Convert `text()` JSON fields → `jsonb()` (better performance)
  - Update default values (SQLite `CURRENT_TIMESTAMP` → PostgreSQL `now()`)
  - Add foreign key constraints (userId → auth.users.id)

### Step 2.2: Key Schema Changes
**Important conversions:**
- `completedWorkouts: text` → `jsonb` (PostgreSQL native JSON)
- `weeklyWeights: text` → `jsonb`
- `foodEntries: text` → `jsonb`
- `ingredients: text` → `jsonb`
- `nutrition: text` → `jsonb`
- All JSON text fields → `jsonb` for better querying

**New fields to add:**
- `user_profiles.user_id` → Link to `auth.users.id` (UUID)
- `subscription_plan` field (if needed)
- `trial_status` fields (if moving from AsyncStorage)

### Step 2.3: Create Migration Scripts
- [ ] Use Drizzle Kit to generate migrations
- [ ] Create SQL migration files in Supabase Dashboard
- [ ] Test migrations on dev database first

### Step 2.4: Set Up Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Create policies:
  - Users can only read/write their own data
  - `user_id = auth.uid()` for all user-scoped tables
  - Public read for `programs` table (if needed)

---

## 📋 Phase 3: Database Client Setup (Days 6-7)

### Step 3.1: Create PostgreSQL Client
- [ ] Create `db/client-postgres.ts`:
  - Use `@supabase/supabase-js` for client-side
  - Use `postgres` package for server-side (if needed)
  - Configure connection pooling
  - Handle connection errors gracefully

### Step 3.2: Dual Database Support
- [ ] Create `db/client.ts` abstraction:
  - Detect environment (dev/prod)
  - Use SQLite in dev (optional)
  - Use Supabase in prod
  - OR: Always use Supabase (recommended)

### Step 3.3: Update Drizzle Configuration
- [ ] Update `drizzle.config.ts`:
  - Add PostgreSQL connection string
  - Configure for Supabase
  - Set up migration paths

---

## 📋 Phase 4: Authentication Migration (Days 8-10)

### Step 4.1: Integrate Supabase Auth
- [ ] Install Supabase Auth helpers
- [ ] Create `services/auth-service.ts`:
  - `signUp(email, password)`
  - `signIn(email, password)`
  - `signOut()`
  - `getCurrentUser()`
  - `resetPassword(email)`

### Step 4.2: Update Auth Store
- [ ] Modify `store/auth-store.ts`:
  - Replace `generateId()` with Supabase `auth.users.id`
  - Use Supabase session management
  - Handle auth state changes
  - Migrate existing users (see Phase 6)

### Step 4.3: User ID Migration Strategy
**Option A: Clean Migration (Recommended)**
- New users: Use Supabase Auth UUID
- Existing users: Create Supabase account on first login
- Map old `user_id` → new `auth.users.id`

**Option B: Hybrid Approach**
- Keep old user IDs temporarily
- Add `auth_user_id` column (nullable)
- Migrate gradually

### Step 4.4: Update User Creation Flow
- [ ] Modify `setupNewUser()`:
  - Require email/password (or make optional initially)
  - Create Supabase auth user first
  - Then create user_profile with `user_id = auth.uid()`

---

## 📋 Phase 5: Service Layer Updates (Days 11-13)

### Step 5.1: Update Database Services
- [ ] Update `db/services.ts`:
  - Change imports from `./client` to `./client-postgres`
  - Update queries for PostgreSQL syntax differences
  - Handle JSONB fields (already JSON, minimal changes)
  - Add error handling for network issues

### Step 5.2: Key Service Updates
**Files to update:**
- `db/services.ts` (all services)
- `store/auth-store.ts`
- `store/nutrition-store.ts`
- Any direct database access

**Changes needed:**
- Replace `db.insert().returning()` (same syntax)
- Replace `db.select().from()` (same syntax)
- Replace `db.update().set()` (same syntax)
- JSON fields: No changes (Drizzle handles JSONB automatically)

### Step 5.3: Add Offline Support (Optional)
- [ ] Implement local cache (AsyncStorage)
- [ ] Queue writes when offline
- [ ] Sync when connection restored

### Step 5.4: Update Error Handling
- [ ] Add network error handling
- [ ] Add retry logic for failed requests
- [ ] Show user-friendly error messages
- [ ] Log errors for debugging

---

## 📋 Phase 6: Data Migration (Days 14-16)

### Step 6.1: Create Migration Script
- [ ] Create `scripts/migrate-to-supabase.ts`:
  - Read all data from SQLite
  - Transform data format (if needed)
  - Upload to Supabase in batches
  - Handle duplicates
  - Verify data integrity

### Step 6.2: User Migration Strategy
**For existing users:**
1. Export SQLite user data
2. Create Supabase auth accounts (email = `user_${id}@temp.dense` or prompt for email)
3. Map old `user_id` → new `auth.users.id`
4. Migrate all related data with new user IDs

### Step 6.3: Data Migration Order
1. **User Profiles** (create auth users first)
2. **Wizard Results** (link to new user IDs)
3. **User Progress** (link to new user IDs)
4. **Daily Logs** (link to new user IDs)
5. **Custom Meals** (link to new user IDs)
6. **Programs** (can be shared/public)
7. **Sync Status** (reset or migrate)

### Step 6.4: Validation & Testing
- [ ] Count records before/after migration
- [ ] Spot-check random records
- [ ] Verify JSON fields parsed correctly
- [ ] Test queries on migrated data
- [ ] Verify RLS policies work

---

## 📋 Phase 7: Subscription Data Migration (Day 17)

### Step 7.1: Migrate Subscription Data
- [ ] Create `subscriptions` table in Supabase:
  - `user_id` (FK to auth.users)
  - `plan_id` (text)
  - `status` (active/expired/cancelled)
  - `start_date` (timestamp)
  - `end_date` (timestamp)
  - `auto_renew` (boolean)

### Step 7.2: Migrate Trial Data
- [ ] Create `trial_status` table:
  - `user_id` (FK to auth.users)
  - `start_date` (timestamp)
  - `end_date` (timestamp)
  - `is_active` (boolean)

### Step 7.3: Update Subscription Service
- [ ] Modify `services/subscription-service-legacy.js`:
  - Read from Supabase instead of AsyncStorage
  - Write to Supabase instead of AsyncStorage
  - Keep same interface (minimal code changes)

### Step 7.4: Migrate Existing Data
- [ ] Export AsyncStorage subscription data
- [ ] Import to Supabase `subscriptions` table
- [ ] Export AsyncStorage trial data
- [ ] Import to Supabase `trial_status` table

---

## 📋 Phase 8: Testing & Validation (Days 18-19)

### Step 8.1: Unit Testing
- [ ] Test all CRUD operations
- [ ] Test JSON field queries
- [ ] Test RLS policies
- [ ] Test authentication flows

### Step 8.2: Integration Testing
- [ ] Test user registration
- [ ] Test user login
- [ ] Test workout tracking
- [ ] Test nutrition logging
- [ ] Test progress tracking
- [ ] Test subscription flows

### Step 8.3: Performance Testing
- [ ] Test query performance
- [ ] Test with large datasets
- [ ] Test concurrent users
- [ ] Monitor Supabase dashboard metrics

### Step 8.4: Edge Cases
- [ ] Test offline scenarios
- [ ] Test network failures
- [ ] Test duplicate data handling
- [ ] Test migration rollback (if needed)

---

## 📋 Phase 9: Deployment (Days 20-21)

### Step 9.1: Staging Deployment
- [ ] Deploy to staging environment
- [ ] Test with real users (beta testers)
- [ ] Monitor errors and performance
- [ ] Fix any issues

### Step 9.2: Production Migration Plan
- [ ] Schedule maintenance window (if needed)
- [ ] Backup production SQLite data
- [ ] Run migration script
- [ ] Verify data integrity
- [ ] Deploy app update

### Step 9.3: Rollback Plan
- [ ] Keep SQLite code as fallback
- [ ] Document rollback procedure
- [ ] Test rollback process

### Step 9.4: Post-Deployment
- [ ] Monitor Supabase dashboard
- [ ] Monitor error logs
- [ ] Monitor user feedback
- [ ] Fix critical issues immediately

---

## 📋 Phase 10: Cleanup (Day 22+)

### Step 10.1: Remove SQLite Dependencies
- [ ] Remove `expo-sqlite` package (if not needed)
- [ ] Remove SQLite client code
- [ ] Remove migration scripts (after verification)
- [ ] Update documentation

### Step 10.2: Optimize
- [ ] Add database indexes (if needed)
- [ ] Optimize queries
- [ ] Set up monitoring/alerts
- [ ] Review RLS policies

### Step 10.3: Documentation
- [ ] Update README with new setup
- [ ] Document Supabase configuration
- [ ] Document RLS policies
- [ ] Document migration process (for future reference)

---

## 🔧 Technical Details

### Schema Conversion Examples

**SQLite:**
```typescript
export const userProgress = sqliteTable('user_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  weeklyWeights: text('weekly_weights'), // JSON string
});
```

**PostgreSQL:**
```typescript
import { pgTable, text, integer, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';

export const userProgress = pgTable('user_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => auth.users.id),
  weeklyWeights: jsonb('weekly_weights'), // Native JSONB
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### RLS Policy Example

```sql
-- Users can only access their own progress
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);
```

### Migration Script Structure

```typescript
// scripts/migrate-to-supabase.ts
async function migrateUserProfiles() {
  const sqliteUsers = await sqliteDb.select().from(userProfiles);
  
  for (const user of sqliteUsers) {
    // Create Supabase auth user
    const { data: authUser } = await supabase.auth.admin.createUser({
      email: user.email || `user_${user.id}@temp.dense`,
      password: generateTempPassword(),
    });
    
    // Create profile with new user ID
    await supabaseDb.insert(userProfiles).values({
      ...user,
      id: authUser.user.id, // Use Supabase UUID
      userId: authUser.user.id,
    });
  }
}
```

---

## ⚠️ Risks & Mitigation

### Risk 1: Data Loss
**Mitigation:**
- Multiple backups before migration
- Test migration on copy of data
- Verify record counts before/after

### Risk 2: Downtime
**Mitigation:**
- Dual-write approach (write to both during transition)
- Migrate during low-traffic period
- Have rollback plan ready

### Risk 3: User ID Mismatch
**Mitigation:**
- Create mapping table (old_id → new_id)
- Migrate all related data together
- Verify foreign key relationships

### Risk 4: Performance Issues
**Mitigation:**
- Add database indexes
- Use connection pooling
- Monitor Supabase dashboard
- Optimize queries

---

## 📊 Success Criteria

- [ ] All data migrated successfully
- [ ] All features working with Supabase
- [ ] Authentication working
- [ ] RLS policies enforced
- [ ] Performance acceptable
- [ ] No data loss
- [ ] Users can log in with email/password

---

## 🎯 Next Steps After Migration

1. **Add Email Verification** (optional)
2. **Add Password Reset Flow**
3. **Add OAuth Providers** (Google, Apple)
4. **Add Multi-Device Sync** (automatic with Supabase)
5. **Add Real-time Features** (workout sharing, etc.)
6. **Add Analytics** (Supabase has built-in)

---

## 📝 Notes

- Keep SQLite code as backup during migration
- Test thoroughly before production
- Monitor Supabase usage/billing
- Consider gradual rollout (beta users first)


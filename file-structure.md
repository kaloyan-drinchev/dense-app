dense/
├── app/ # Expo Router pages (file-based routing)
├── components/ # Reusable React components
├── services/ # Business logic & external services
├── store/ # Zustand state management
├── hooks/ # Custom React hooks
├── utils/ # Helper functions & utilities
├── db/ # Database schemas & services
├── src/features/ # Feature-specific implementations
├── assets/ # Images, videos, fonts
├── config/ # App configuration
├── constants/ # App-wide constants
├── types/ # TypeScript type definitions
└── scripts/ # Database & deployment scripts
---## 📱 App Directory (Expo Router)**File-based routing using Expo Router v3**
app/
├── layout.tsx # Root layout with navigation logic
├── index.tsx # App entry point
├── (tabs)/ # Bottom tab navigation
│ ├── layout.tsx # Tab bar configuration
│ ├── Home.tsx # Home screen wrapper
│ ├── Nutrition.tsx # Nutrition tracking
│ ├── Progress.tsx # Progress tracking
│ └── Settings.tsx # App settings
│
├── program/ # Program-related routes
│ ├── [id].tsx # Program details (dynamic)
│ ├── week/[weekId].tsx # Week details
│ ├── workout/[workoutId].tsx # Workout details
│ └── exercise/[exerciseId].tsx # Exercise details
│
├── workout-session.tsx # Active workout screen
├── workout-overview.tsx # Workout summary
├── workout-exercise-tracker.tsx # Exercise tracking
├── finished-workouts.tsx # Workout history
├── finished-workouts-detail.tsx # Individual workout details
│
├── nutrition-detail.tsx # Meal details
├── nutrition-history.tsx # Nutrition logs
├── add-food-page.tsx # Add food entry
├── single-recipe-view.tsx # Recipe viewer
│
├── Programs.tsx # All programs list
├── my-goals.tsx # Goal setting
├── my-achievements.tsx # Achievements screen
├── profile.tsx # User profile
├── profile-edit.tsx # Edit profile
│
├── ai-chat.tsx # AI assistant chat
├── photo-effects.tsx # Progress photos
├── exercise-history.tsx # Exercise history
├── manual-workout.tsx # Manual workout entry
├── cardio-workout.tsx # Cardio tracking
│
├── notification-settings.tsx # Notification preferences
├── icloud-backup.tsx # Backup settings
├── allowed-foods.tsx # Food restrictions
├── ltwins-points.tsx # Gamification
│
├── +not-found.tsx # 404 page
├── error-boundary.tsx # Error handling
└── modal.tsx # Global modal
---## 🧩 Components Directory**Reusable UI components**
components/
├── SetupWizard/ # Onboarding flow
│ ├── SetupWizard.tsx # Main wizard component
│ ├── styles.ts # Wizard styles
│ └── types.ts # Wizard types
│
├── ai-assistant/ # AI Chat Module
│ ├── core/ # Core AI logic
│ ├── components/ # AI UI components
│ └── index.ts # Module exports
│
├── SubscriptionScreen.tsx # Paywall screen
├── SubscriptionReminderModal.tsx # Subscription reminders
├── PaymentProviderSwitcher.tsx # Payment settings (legacy)
│
├── WorkoutCard.tsx # Workout display card
├── WeekCard.tsx # Week overview card
├── ExerciseCard.tsx # Exercise card
├── ExerciseTracker.tsx # Set tracking
├── ExerciseDemoModal.tsx # Exercise videos
│
├── NutritionSummary.tsx # Daily nutrition overview
├── MealSection.tsx # Meal display
├── FoodSelectionModal.tsx # Food picker
├── CustomMealsList.tsx # User meals
├── DailyMacroTargets.tsx # Macro goals
│
├── ProgressChart.tsx # Weight charts
├── WeightTracker.tsx # Weight entry
├── WorkoutProgressCharts.tsx # Workout analytics
├── WorkoutCalendarHeatMap.tsx # Activity calendar
│
├── PRCelebrationModal.tsx # Personal record celebration
├── WorkoutStartModal.tsx # Pre-workout screen
├── HomepageVideoModal.tsx # Intro video
├── VoiceInputModal.tsx # Voice logging
│
├── ErrorBoundaries.tsx # Error handling
├── AppErrorBoundaries.tsx # App-level errors
├── LoadingState.tsx # Loading indicators
└── ErrorState.tsx # Error displays
---## ⚙️ Services Directory**Business logic & external integrations**
services/
├── subscription/ # ✨ NEW: Clean subscription service
│ ├── config.ts # RevenueCat config & mock data
│ ├── index.ts # Subscription service (Trio Pattern)
│ └── README.md # Usage documentation
│
├── gemini-ai.ts # Google Gemini AI integration
├── ai-action-handlers.ts # AI action processing
├── notification-service.ts # Push notifications
├── cloud-sync-service.ts # iCloud backup
├── video-service.ts # Exercise video management
├── live-activity-service.ts # iOS Live Activities
├── apple-iap-service.js # Apple IAP (legacy)
└── db-truncate-service.ts # Database cleanup
---## 🗄️ Store Directory (Zustand)**Global state management**
store/
├── auth-store.ts # User authentication state
├── subscription-store.js # Subscription status
├── workout-store.ts # Active workout state
├── workout-cache-store.ts # Workout data cache
├── nutrition-store.ts # Nutrition tracking
├── chat-store.ts # AI chat history
└── timer-store.ts # Workout timers
---## 🪝 Hooks Directory**Custom React hooks**
hooks/
├── useAppInitialization.ts # ✨ NEW: Startup logic (fonts, auth, etc)
├── useWorkoutNotification.ts # Persistent workout notifications
├── useWorkoutTimer.ts # Workout timing logic
└── useErrorHandler.ts # Error handling hook
---## 🗃️ Database (Supabase + Drizzle ORM)
db/
├── schema.ts # SQLite schema (legacy)
├── schema-postgres.ts # PostgreSQL schema
├── client-postgres.ts # Supabase client
├── services.ts # Database service layer
├── services-supabase.ts # Supabase-specific services
├── sync.ts # Data synchronization
│
├── services/ # Specialized DB services
│ ├── workout-session-service.ts
│ └── active-workout-session-service.ts
│
└── migrations/ # Database migrations
├── postgres/ # Supabase migrations
└── version-manager.ts # Migration tracking
---## 🛠️ Utils Directory**Helper functions & utilities**
utils/
├── program-generator.ts # AI workout generation
├── workout-completion-tracker.ts # Progress tracking
├── pr-tracking.ts # Personal record detection
├── tdee-calculator.ts # Calorie calculations
├── exercise-calories.ts # Exercise calorie burn
├── cardio-calories.ts # Cardio calorie burn
├── volume-calculator.ts # Training volume metrics
├── workout-duration.ts # Time tracking
├── progress-calculator.ts # Progress analytics
├── ltwins-game.ts # Gamification logic
├── auto-sync.ts # Background sync
├── app-updates.ts # Version management
├── data-validation.ts # Input validation
├── input-sanitization.ts # Security
├── rate-limiter.ts # API throttling
└── helpers.ts # General utilities
---## 📜 Scripts Directory**Database & deployment scripts**
scripts/
├── seed-exercises.ts # Populate exercise library
├── seed-ppl-templates.ts # Seed workout templates
├── apply-rls-policies.ts # Supabase Row Level Security
├── verify-rls-policies.ts # RLS verification
├── verify-postgres-tables.ts # Schema validation
├── truncate-all-tables.ts # Database reset
├── backup-sqlite-data.ts # SQLite backup
├── cleanup-duplicate-progress.ts # Data cleanup
└── supabase-client.ts # Supabase CLI helper
---## 📚 Key Documentation Files
docs/
├── SUBSCRIPTION_REFACTOR_SUMMARY.md # Subscription system overview
├── MOCK_PAYMENTS_GUIDE.md # Mock payment testing
├── REVENUECAT_SETUP_GUIDE.md # RevenueCat setup
├── SUBSCRIPTION_TESTING_GUIDE.md # Testing guide
├── WORKOUT_REFACTOR_GUIDE.md # Workout system docs
├── MIGRATION_GUIDE.md # Data migration
├── TESTFLIGHT_READINESS_CHECKLIST.md # Release checklist
└── SEED_EXERCISES_GUIDE.md # Exercise setup
---## 🔑 Key Features by Directory### Authentication & Onboarding- `components/SetupWizard/` - User onboarding flow- `store/auth-store.ts` - Auth state management- `hooks/useAppInitialization.ts` - App startup### Subscription System ⭐ Recently Refactored- `services/subscription/` - Clean RevenueCat integration- `store/subscription-store.js` - Subscription state- `components/SubscriptionScreen.tsx` - Paywall UI### Workout System- `app/workout-session.tsx` - Active workout tracking- `store/workout-store.ts` - Workout state- `utils/program-generator.ts` - AI program creation- `db/services/workout-session-service.ts` - Workout persistence### Nutrition Tracking- `app/(tabs)/Nutrition.tsx` - Main nutrition screen- `store/nutrition-store.ts` - Nutrition state- `components/FoodSelectionModal.tsx` - Food picker- `utils/tdee-calculator.ts` - Calorie calculations### AI Integration- `components/ai-assistant/` - Chat interface- `services/gemini-ai.ts` - Google AI SDK- `services/ai-action-handlers.ts` - Action processing### Progress Tracking- `app/(tabs)/Progress.tsx` - Progress dashboard- `components/ProgressChart.tsx` - Weight charts- `utils/pr-tracking.ts` - Personal records- `utils/progress-calculator.ts` - Analytics---## 🏗️ Architecture Patterns### State Management- **Zustand** for global state- **React Context** for workout session- **AsyncStorage** for persistence### Data Layer- **Supabase** (PostgreSQL) for cloud data- **Drizzle ORM** for type-safe queries- **RLS Policies** for security### Navigation- **Expo Router** (file-based routing)- **Stack Navigation** for main flows- **Tab Navigation** for primary screens### Styling- **StyleSheet** (React Native)- **Constants** for colors & typography- **Responsive design** with flexbox---## 🚀 Getting Started

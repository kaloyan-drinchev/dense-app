# Simplified Wizard Architecture (KISS Principle)

## Current Problems:
1. **Too many state flags** (8+ flags that can conflict)
2. **Complex useEffect** with 6+ dependencies causing race conditions
3. **Multiple render checks** scattered throughout
4. **State updates conflict** with each other
5. **Timing issues** between database saves and state updates

## Proposed Solution: Single State Machine

### Phase-Based Architecture:
```typescript
type WizardPhase = 
  | 'wizard'           // User filling out wizard steps
  | 'generating'       // Program is being generated
  | 'subscription'     // Show subscription screen
  | 'complete'         // Wizard completed, navigate to home

const [phase, setPhase] = useState<WizardPhase>('wizard');
```

### Simple Flow:
1. **On Mount**: Check if wizard results exist
   - If yes → `phase = 'subscription'`
   - If no → `phase = 'wizard'`

2. **User completes wizard** → `phase = 'generating'`

3. **Program generated** → `phase = 'subscription'`

4. **User subscribes/skips** → `phase = 'complete'` → Navigate to home

### Benefits:
- ✅ Single source of truth (one state variable)
- ✅ No race conditions (no conflicting flags)
- ✅ Simple render logic (if/else based on phase)
- ✅ Easy to debug (one state to check)
- ✅ No complex useEffect dependencies

### Implementation:
```typescript
// Single useEffect on mount - check once
useEffect(() => {
  const checkPhase = async () => {
    if (!user?.id || hasCompletedWizard) return;
    
    const results = await wizardResultsService.getByUserId(user.id);
    if (results?.generatedSplit) {
      setPhase('subscription');
      setGeneratedProgramData(parseProgram(results.generatedSplit));
    } else {
      setPhase('wizard');
    }
  };
  
  checkPhase();
}, []); // Only run once on mount

// Simple render logic
if (phase === 'subscription' && generatedProgramData) {
  return <SubscriptionScreen ... />;
}

if (phase === 'generating') {
  return <GeneratingScreen ... />;
}

// Default: show wizard steps
return <WizardSteps ... />;
```


# Premium-Gated Fitness Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hard-gated free-plan-first fitness funnel so premium/pricing questions collect profile details, deliver a structured free basic plan, and only then reveal premium services including the new Special Guidance Plan.

**Architecture:** Keep the guided funnel centralized in `fitnessFlow.js`, with `aiService.js` acting as a guardrail for early premium questions outside the main flow. Rework tests around the new conversation states rather than patching the old plan-selection behavior.

**Tech Stack:** Node.js, CommonJS modules, Baileys WhatsApp bot, plain `assert` test scripts

---

### Task 1: Redesign the guided flow state machine

**Files:**
- Modify: `fitnessFlow.js`
- Test: `tests/fitnessFlow.test.js`

- [ ] **Step 1: Write the failing tests for premium gating and field collection**

```js
function testPremiumQuestionStartsFreeAssessment() {
  const result = fitnessFlow.processFlow({}, 'premium plan kya hai');

  assert.strictEqual(result.nextStep, fitnessFlow.STEP.NAME);
  assert.strictEqual(result.userData.premiumAskedEarly, true);
  assert(!/₹1999|₹4999|₹11111/.test(result.message));
}

function testCollectionCapturesMissingFieldsThroughMedicalCondition() {
  let userData = { flowStep: fitnessFlow.STEP.NAME, premiumAskedEarly: true };
  let result = fitnessFlow.processFlow(userData, 'Rahul');
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, '28');
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'male');
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, '172 cm');
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, '78 kg');
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'muscle gain');
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'moderate');
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'non veg');
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'no medical condition');

  assert.strictEqual(result.nextStep, fitnessFlow.STEP.FREE_PLAN);
  assert.strictEqual(result.userData.medicalCondition, 'No medical condition');
}
```

- [ ] **Step 2: Run the fitness flow tests to confirm the new expectations fail**

Run: `node tests/fitnessFlow.test.js`  
Expected: FAIL because `STEP.NAME` is not used for premium gating and the new states are missing.

- [ ] **Step 3: Implement the new flow states and field handlers in `fitnessFlow.js`**

```js
this.STEP = {
  WELCOME: 'welcome',
  NAME: 'name',
  AGE: 'age',
  GENDER: 'gender',
  HEIGHT: 'height',
  WEIGHT: 'weight',
  GOAL: 'goal',
  ACTIVITY_LEVEL: 'activity_level',
  FOOD_PREFERENCE: 'food_preference',
  MEDICAL_CONDITION: 'medical_condition',
  FREE_PLAN: 'free_plan',
  PREMIUM_PLAN: 'premium_plan',
  FOLLOW_UP: 'follow_up'
};

if (this.isPremiumIntent(message) && !userData.freePlanDelivered) {
  return this.startFreeAssessment(userData);
}

if (this.isWorkoutQuestion(message)) {
  return this.handleWorkoutQuestion(userData, message);
}
```

Add helper methods in the same file for:

- `isPremiumIntent`
- `isWorkoutQuestion`
- `nextMissingStep`
- `startFreeAssessment`
- `buildFreePlan`
- `getPremiumPlansMessage`
- prompt variant selection to avoid repeated wording

- [ ] **Step 4: Run the fitness flow tests to verify the new state machine passes**

Run: `node tests/fitnessFlow.test.js`  
Expected: PASS for the updated guided-flow scenarios.

- [ ] **Step 5: Commit**

```bash
git add fitnessFlow.js tests/fitnessFlow.test.js
git commit -m "feat: add premium-gated free fitness flow"
```

### Task 2: Add structured free-plan output and premium menu content

**Files:**
- Modify: `fitnessFlow.js`
- Test: `tests/fitnessFlow.test.js`

- [ ] **Step 1: Write the failing tests for free-plan format and premium menu**

```js
function testFreePlanIncludesStructuredMealsAndPremiumCTA() {
  const result = fitnessFlow.processFlow({
    flowStep: fitnessFlow.STEP.MEDICAL_CONDITION,
    name: 'Rahul',
    age: '28',
    gender: 'Male',
    height: '172 cm',
    weight: '78',
    goal: 'Muscle gain',
    activityLevel: 'Moderate',
    foodPreference: 'Non-Veg'
  }, 'no issues');

  assert(result.message.includes('Client Profile'));
  assert(result.message.includes('Morning (Empty Stomach)'));
  assert(result.message.includes('Breakfast'));
  assert(result.message.includes('This is our FREE BASIC PLAN.'));
  assert(result.message.includes('type 👉 PREMIUM'));
}

function testPremiumKeywordAfterFreePlanShowsAllFourOffers() {
  const result = fitnessFlow.processFlow({
    flowStep: fitnessFlow.STEP.FOLLOW_UP,
    freePlanDelivered: true
  }, 'PREMIUM');

  assert(result.message.includes('Monthly Diet Plan – ₹499'));
  assert(result.message.includes('Premium Transformation – ₹1999/month'));
  assert(result.message.includes('Personal Trainer'));
  assert(result.message.includes('Special Guidance Plan'));
  assert(result.message.includes('Intermediate Plan – ₹1499'));
  assert(result.message.includes('Pro Plan – ₹2999'));
}
```

- [ ] **Step 2: Run the fitness flow tests to verify the new content checks fail first**

Run: `node tests/fitnessFlow.test.js`  
Expected: FAIL because the old basic plan and premium menu do not match the new structure.

- [ ] **Step 3: Implement the new free-plan builder and premium menu text**

```js
buildFreePlan(userData) {
  return `🔹 Client Profile:
Name: ${userData.name}
Goal: ${userData.goal}
Weight: ${userData.weight} kg
Height: ${userData.height}

🔹 Diet Plan:

🌅 Morning (Empty Stomach)
...

This is our FREE BASIC PLAN.
For a more personalized and result-driven transformation, type 👉 PREMIUM`;
}

getPremiumPlansMessage() {
  return `💎 OUR PREMIUM PLANS:
...
4️⃣ Special Guidance Plan
Beginner Plan – ₹499
Intermediate Plan – ₹1499
Pro Plan – ₹2999`;
}
```

- [ ] **Step 4: Run the fitness flow tests to verify output formatting passes**

Run: `node tests/fitnessFlow.test.js`  
Expected: PASS with the updated free-plan and premium menu assertions.

- [ ] **Step 5: Commit**

```bash
git add fitnessFlow.js tests/fitnessFlow.test.js
git commit -m "feat: add free plan formatter and premium offers"
```

### Task 3: Guard AI fallback replies and cover workout guidance

**Files:**
- Modify: `aiService.js`
- Test: `tests/replyFlow.test.js`
- Test: `tests/profileFlow.test.js`

- [ ] **Step 1: Write the failing tests for early premium deflection and workout guidance**

```js
async function testEarlyPremiumReplyDeflectsToAssessmentWithoutPriceLeak() {
  const reply = await aiService.generateReply('test-user-premium', 'premium price batao', {
    lastActive: Date.now(),
    _canOfferPaid: false
  });

  assert(!/₹499|₹1999|₹2999|₹3999/.test(reply));
  assert(/name|age|weight|height/i.test(reply));
}

function testWorkoutQuestionUsesGoalBasedGuidance() {
  const result = fitnessFlow.processFlow({
    goal: 'Weight loss',
    flowStep: fitnessFlow.STEP.FOLLOW_UP,
    freePlanDelivered: true
  }, 'exercise kaise karu');

  assert(/walking|squats|push-ups|plank/i.test(result.message));
}
```

- [ ] **Step 2: Run the reply and profile tests to confirm the new checks fail**

Run: `node tests/replyFlow.test.js`  
Expected: FAIL because the fallback still uses generic early-paid messaging.

Run: `node tests/profileFlow.test.js`  
Expected: PASS or unchanged; if it fails after later edits, update assertions to match the new wording without changing intent.

- [ ] **Step 3: Update `aiService.js` to align with the hard premium gate**

```js
earlyPaidServiceReply() {
  return `Premium details share karne se pehle main aapko ek free basic plan bana deta hoon.

Bas ye details bhej do:
• Name
• Age
• Gender
• Height
• Weight
• Goal
• Activity level
• Food preference
• Any medical condition`;
}
```

Keep existing profile-aware logic intact, but ensure no early price leakage appears in fallback branches.

- [ ] **Step 4: Run all relevant tests**

Run: `node tests/fitnessFlow.test.js`  
Expected: PASS

Run: `node tests/replyFlow.test.js`  
Expected: PASS

Run: `node tests/profileFlow.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add aiService.js tests/replyFlow.test.js tests/profileFlow.test.js
git commit -m "fix: enforce premium gate in AI fallback replies"
```

## Self-Review

- Spec coverage: premium gating, required detail collection, structured free plan, premium menu pricing, workout guidance, and anti-repeat prompts are all mapped to Tasks 1-3.
- Placeholder scan: no `TODO`, `TBD`, or implicit "write tests later" steps remain.
- Type consistency: use `freePlanDelivered`, `premiumAskedEarly`, `activityLevel`, `foodPreference`, and `medicalCondition` consistently across tasks.

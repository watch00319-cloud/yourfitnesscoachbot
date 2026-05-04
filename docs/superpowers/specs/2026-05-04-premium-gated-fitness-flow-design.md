# Premium-Gated Fitness Flow Design

## Goal

Update the WhatsApp fitness bot so that when a user asks about premium services early, the bot does not reveal pricing immediately. Instead, it must first collect key profile details, generate a personalized free basic plan, and then push the premium offering with a stronger call to action.

## User Experience

### Core funnel

1. User asks about premium, pricing, plan, fees, or paid coaching.
2. Bot politely redirects them into a free assessment flow instead of showing prices immediately.
3. Bot collects these details in a conversational Hinglish flow:
   - Name
   - Age
   - Gender
   - Height
   - Weight
   - Goal
   - Activity Level
   - Food Preference
   - Medical Condition
4. Once enough data is collected, bot sends a personalized free basic diet plan in the required structured format.
5. The free plan always ends with:
   - `This is our FREE BASIC PLAN.`
   - `For a more personalized and result-driven transformation, type 👉 PREMIUM`
6. If the user then types `PREMIUM`, the bot shows the premium plans block.

### Premium gating behavior

- Early premium questions must not expose pricing before the free basic plan is delivered.
- The bot may acknowledge that premium exists, but must redirect the user toward the free plan first.
- After the free plan is delivered, the bot should push premium clearly and confidently rather than asking open-ended questions.

### Workout guidance

- If the user asks `exercise kaise karu` or similar workout-help questions, the bot should return a simple beginner-friendly workout suggestion based on the stored goal.

### Anti-repetition

- Each collection step should have multiple response variants.
- The system should rotate or vary prompts so the same wording is not repeated every time.
- Repeated premium questions before free-plan completion should still redirect, but with rephrased language and one extra useful tip when possible.

## System Design

### Main logic placement

- `fitnessFlow.js` becomes the primary place for this guided funnel.
- `aiService.js` should respect the new premium gate so fallback replies do not leak pricing too early.
- `intentHandler.js` can keep detecting premium-related intent, but downstream handling must enforce the gate.

### State model

Add or normalize conversation state so the bot can track:

- `flowStep`
- `freePlanDelivered`
- `premiumAskedEarly`
- `lastPromptKey` or similar lightweight anti-repeat marker

The flow should ask only for missing fields and avoid re-asking completed ones.

### Plan generation rules

The free basic plan should include:

- `Client Profile`
- `Diet Plan`
  - `Morning (Empty Stomach)`
  - `Breakfast`
  - `Mid-Morning Snack`
  - `Lunch`
  - `Evening Snack`
  - `Dinner`

Goal-specific behavior:

- Weight loss: calorie deficit, lighter meals, satiety-focused foods
- Weight gain: calorie surplus, energy-dense meals
- Muscle gain: high protein emphasis

Food preference and medical condition must influence meal suggestions at a basic level. If information is missing, the bot should keep collecting instead of guessing.

### Premium plan response

When user types `PREMIUM` after free-plan delivery, send this exact premium menu content in a clean, attractive format:

`💎 OUR PREMIUM PLANS:`

`1️⃣ Monthly Diet Plan – ₹499`

- Customized as per your goal
- One-time plan for 1 month
- Based on your body details

`2️⃣ Premium Transformation – ₹1999/month`

- Detailed body analysis
- Lifestyle and habit tracking
- Medical and food preference consideration
- Monthly updated diet plans

`3️⃣ Personal Trainer 🔥`

`Pricing:`

- 1 Month – ₹3999
- 3 Months – ₹4999
- 6 Months – ₹7999
- 12 Months – ₹11111

`Features:`

- Daily guidance from day start to day end
- Weekly progress tracking
- Weight monitoring
- Habit correction
- Daily motivation
- Nutrition guidance
- Custom workout plans
- Weekly workout updates
- Cardio planning
- Pro-level mentorship

`4️⃣ Special Guidance Plan`

`Beginner Plan – ₹499`

- One-month exercise chart only
- Best for clients starting bodybuilding from zero
- Simple beginner-friendly structure

`Intermediate Plan – ₹1499`

- Monthly plan based on weight, height, target weight, and goal
- More personalized than the beginner plan
- Suitable for customers with some training experience

`Pro Plan – ₹2999`

- Weekly diet plus exercise chart
- Strong follow-up for exercise and diet adherence
- Weekly monitoring
- Nutrition guidance

## Error Handling

- Invalid age, height, or weight should trigger a concise re-ask with different phrasing than the previous attempt.
- If the user sends unrelated text mid-flow, the bot should either infer the field if possible or gently bring them back to the current step.
- If the user asks premium again before all details are collected, the bot should continue the data collection flow.

## Testing

Update or add tests for:

1. Early premium inquiry does not reveal pricing.
2. Missing profile fields are collected in sequence.
3. Free basic plan includes required structure and CTA.
4. `PREMIUM` after free plan shows premium plans.
5. Workout question returns goal-based beginner guidance.
6. Repeated premium question uses redirect wording without leaking price.

## Scope Boundaries

In scope:

- Text flow updates
- Premium gating
- Structured free basic plan
- Basic anti-repetition through response variants
- Premium menu rendering

Out of scope:

- Payment processing changes
- Advanced AI memory or embeddings
- Full nutrition calculator
- Multi-language overhaul beyond current Hinglish-first behavior

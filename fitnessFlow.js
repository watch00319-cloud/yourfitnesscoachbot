/**
 * Fitness conversation flow with hard-gated premium handling.
 */
class FitnessFlow {
  constructor() {
    this.STEP = {
      WELCOME: 'welcome',
      GOAL: 'goal',
      NAME: 'name',
      AGE: 'age',
      GENDER: 'gender',
      HEIGHT: 'height',
      WEIGHT: 'weight',
      ACTIVITY_LEVEL: 'activity_level',
      FOOD_PREFERENCE: 'food_preference',
      MEDICAL_CONDITION: 'medical_condition',
      FREE_PLAN: 'free_plan',
      PREMIUM_PLAN: 'premium_plan',
      FOLLOW_UP: 'follow_up'
    };

    this.promptVariants = {
      premium_gate: [
        `Premium details dunga, but sabse pehle main aapko ek FREE BASIC PLAN bana deta hoon.\n\nStart karte hain. Aapka naam kya hai?`,
        `Pehle free basic assessment kar lete hain, phir premium options dikhaunga.\n\nSabse pehle apna name bhejo.`,
        `Bhai tension mat lo, premium bhi milega. Lekin best result ke liye pehle free basic plan ready karte hain.\n\nNaam batao.`
      ],
      name: [
        `Chalo start karte hain. Aapka naam kya hai?`,
        `Sabse pehle apna name bhej do.`,
        `Quick start ke liye naam bata do.`
      ],
      age: [
        `Nice. Ab age batao.`,
        `Theek hai, ab apni age share karo.`,
        `Good start. Ab age likho.`
      ],
      gender: [
        `Ab gender batao: Male ya Female?`,
        `Next detail: gender kya hai?`,
        `Body plan personalize karne ke liye gender chahiye: Male ya Female?`
      ],
      height: [
        `Ab height bhejo. Format: 172 cm ya 5'8".`,
        `Height share karo. 170 cm ya 5'10" format chalega.`,
        `Ab apni height bata do.`
      ],
      weight: [
        `Weight batao in kg.`,
        `Ab current weight bhejo. Example: 72 kg.`,
        `Current body weight kitna hai?`
      ],
      goal: [
        `Aapka main goal kya hai: Weight Loss, Weight Gain, ya Muscle Gain?`,
        `Target clear karte hain. Goal batao: Weight Loss / Weight Gain / Muscle Gain.`,
        `Ab goal likho: Weight Loss, Weight Gain, ya Muscle Gain.`
      ],
      activity_level: [
        `Activity level kya hai: Low, Moderate, ya High?`,
        `Roz ka activity level share karo: Low / Moderate / High.`,
        `Lifestyle ke hisaab se activity level batao.`
      ],
      food_preference: [
        `Food preference kya hai: Veg ya Non-Veg?`,
        `Diet customize karne ke liye batao: Veg ya Non-Veg?`,
        `Ab food preference share karo.`
      ],
      medical_condition: [
        `Koi medical condition, allergy, ya digestion issue hai? Nahi hai to "No medical condition" likh do.`,
        `Last detail: koi medical issue ya allergy? Agar nahi hai to "No medical condition" bhej do.`,
        `Bas ek last cheez. Medical condition ya injury hai kya?`
      ],
      invalid_age: [
        `Valid age bhejo. 10 se 100 ke beech likho.`,
        `Age thoda clear format mein bhejo. Example: 27.`,
        `Age samajh nahi aayi. Sirf number mein bhejo.`
      ],
      invalid_gender: [
        `Gender clearly likho: Male ya Female.`,
        `Please Male ya Female mein reply karo.`,
        `Ye detail clear chahiye. Male ya Female?`
      ],
      invalid_height: [
        `Height proper format mein bhejo: 172 cm ya 5'10".`,
        `Height samajh nahi aayi. Example: 168 cm.`,
        `Please height clear format mein share karo.`
      ],
      invalid_weight: [
        `Valid weight bhejo in kg. Example: 68 kg.`,
        `Weight clear format mein bhejo. 20 se 300 kg ke beech hona chahiye.`,
        `Current weight dobara bhejo. Example: 82 kg.`
      ],
      invalid_goal: [
        `Goal in 3 options mein se choose karo: Weight Loss / Weight Gain / Muscle Gain.`,
        `Target clear nahi hua. Please Weight Loss, Weight Gain, ya Muscle Gain likho.`,
        `Goal dobara bhejo: Weight Loss / Weight Gain / Muscle Gain.`
      ],
      invalid_activity: [
        `Activity level inme se choose karo: Low / Moderate / High.`,
        `Low, Moderate, ya High mein reply karo.`,
        `Activity level clear chahiye. Low / Moderate / High?`
      ],
      invalid_food: [
        `Food preference likho: Veg ya Non-Veg.`,
        `Veg ya Non-Veg mein reply karo.`,
        `Diet ke liye ye detail chahiye: Veg / Non-Veg.`
      ],
      follow_up: [
        `Agar aur detail chahiye ya exercise kaise karu poochna hai, seedha message kar do.`,
        `Next step ke liye ya to PREMIUM type karo ya workout help maango.`,
        `Plan mil gaya. Ab chaho to PREMIUM likho ya workout guidance le lo.`
      ]
    };
  }

  getWelcomeMessage() {
    return `Welcome to Our Fitness Family\n\nAapka goal kya hai?\n• Weight Loss\n• Weight Gain\n• Muscle Gain\n\nReply karo, main step-by-step guide karunga.`;
  }

  processFlow(userData = {}, userMessage = '') {
    const message = userMessage.trim();
    const normalized = message.toLowerCase();
    const currentStep = userData.flowStep || this.STEP.WELCOME;

    if (this.isGreeting(normalized)) {
      return {
        message: this.getWelcomeMessage(),
        nextStep: this.STEP.GOAL,
        userData: { ...userData, flowStep: this.STEP.GOAL }
      };
    }

    if (this.isSteroidsQuestion(normalized)) {
      return {
        message: this.handleSteroidsQuestion(),
        nextStep: currentStep,
        userData
      };
    }

    if (userData.freePlanDelivered && normalized === 'premium') {
      return this.showPremiumPlans(userData);
    }

    if (this.isPremiumIntent(normalized) && !userData.freePlanDelivered) {
      return this.startFreeAssessment(userData);
    }

    if (this.isWorkoutQuestion(normalized)) {
      return this.handleWorkoutQuestion(userData);
    }

    switch (currentStep) {
      case this.STEP.WELCOME:
        return this.handleWelcome(userData, normalized);
      case this.STEP.GOAL:
        return this.handleGoal(userData, message);
      case this.STEP.NAME:
        return this.handleName(userData, message);
      case this.STEP.AGE:
        return this.handleAge(userData, normalized);
      case this.STEP.GENDER:
        return this.handleGender(userData, normalized);
      case this.STEP.HEIGHT:
        return this.handleHeight(userData, normalized);
      case this.STEP.WEIGHT:
        return this.handleWeight(userData, normalized);
      case this.STEP.ACTIVITY_LEVEL:
        return this.handleActivityLevel(userData, normalized);
      case this.STEP.FOOD_PREFERENCE:
        return this.handleFoodPreference(userData, normalized);
      case this.STEP.MEDICAL_CONDITION:
        return this.handleMedicalCondition(userData, message);
      case this.STEP.FREE_PLAN:
        return this.handleFreePlan(userData, normalized);
      case this.STEP.PREMIUM_PLAN:
        return this.handlePremiumPlan(userData, normalized);
      case this.STEP.FOLLOW_UP:
        return this.handleFollowUp(userData, normalized);
      default:
        return this.handleWelcome(userData, normalized);
    }
  }

  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'namaste', 'hlo', 'hii', 'bhai', 'coach'];
    return greetings.includes(message);
  }

  isPremiumIntent(message) {
    return /(premium|price|pricing|paid|plan|package|fees|charges|cost|kitna|service)/i.test(message);
  }

  isWorkoutQuestion(message) {
    return /(exercise kaise karu|workout|exercise|kasrat|gym kaise|home workout)/i.test(message);
  }

  handleWelcome(userData) {
    const nextStep = this.nextMissingStep(userData) || this.STEP.GOAL;
    return this.askForStep(nextStep, userData);
  }

  handleGoal(userData, message) {
    const goal = this.parseGoal(message);
    if (!goal) {
      return this.retryStep(this.STEP.GOAL, userData, 'invalid_goal');
    }

    const nextStep = this.nextMissingStep({ ...userData, goal }, this.STEP.NAME);
    return {
      message: `Goal noted: ${goal}.\n\n${this.getPrompt(nextStep, userData)}`,
      nextStep,
      userData: { ...userData, goal, flowStep: nextStep }
    };
  }

  handleName(userData, message) {
    const name = message.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).slice(0, 3).join(' ');
    if (!name) {
      return this.retryStep(this.STEP.NAME, userData, 'name');
    }

    return this.askForNext({ ...userData, name }, this.STEP.AGE);
  }

  handleAge(userData, message) {
    const match = message.match(/\b(\d{1,3})\b/);
    const age = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(age) || age < 10 || age > 100) {
      return this.retryStep(this.STEP.AGE, userData, 'invalid_age');
    }

    return this.askForNext({ ...userData, age: String(age) }, this.STEP.GENDER);
  }

  handleGender(userData, message) {
    const gender = this.parseGender(message);
    if (!gender) {
      return this.retryStep(this.STEP.GENDER, userData, 'invalid_gender');
    }

    return this.askForNext({ ...userData, gender }, this.STEP.HEIGHT);
  }

  handleHeight(userData, message) {
    const height = this.parseHeight(message);
    if (!height) {
      return this.retryStep(this.STEP.HEIGHT, userData, 'invalid_height');
    }

    return this.askForNext({ ...userData, height }, this.STEP.WEIGHT);
  }

  handleWeight(userData, message) {
    const match = message.match(/\b(\d{1,3}(?:\.\d+)?)\b/);
    const weight = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
      return this.retryStep(this.STEP.WEIGHT, userData, 'invalid_weight');
    }

    return this.askForNext({ ...userData, weight: String(weight).replace(/\.0$/, '') }, this.STEP.GOAL);
  }

  handleActivityLevel(userData, message) {
    const activityLevel = this.parseActivityLevel(message);
    if (!activityLevel) {
      return this.retryStep(this.STEP.ACTIVITY_LEVEL, userData, 'invalid_activity');
    }

    return this.askForNext({ ...userData, activityLevel }, this.STEP.FOOD_PREFERENCE);
  }

  handleFoodPreference(userData, message) {
    const foodPreference = this.parseFoodPreference(message);
    if (!foodPreference) {
      return this.retryStep(this.STEP.FOOD_PREFERENCE, userData, 'invalid_food');
    }

    return this.askForNext({ ...userData, foodPreference }, this.STEP.MEDICAL_CONDITION);
  }

  handleMedicalCondition(userData, message) {
    const medicalCondition = this.normalizeMedicalCondition(message);
    const finalUserData = {
      ...userData,
      medicalCondition,
      freePlanDelivered: true,
      flowStep: this.STEP.FREE_PLAN
    };

    return {
      message: this.buildFreePlan(finalUserData),
      nextStep: this.STEP.FREE_PLAN,
      userData: finalUserData
    };
  }

  handleFreePlan(userData, message) {
    if (message === 'premium' || this.isPremiumIntent(message)) {
      return this.showPremiumPlans(userData);
    }

    return {
      message: this.composeFollowUp(userData),
      nextStep: this.STEP.FOLLOW_UP,
      userData: { ...userData, flowStep: this.STEP.FOLLOW_UP }
    };
  }

  handlePremiumPlan(userData, message) {
    return {
      message: `Aap inme se jo option chaho choose kar sakte ho.\n\nPayment aur onboarding ke liye WhatsApp karo: +91 98886 01933\n\nAgar chaho to main plan samjha bhi deta hoon.`,
      nextStep: this.STEP.FOLLOW_UP,
      userData: { ...userData, flowStep: this.STEP.FOLLOW_UP }
    };
  }

  handleFollowUp(userData, message) {
    if (message === 'premium' || this.isPremiumIntent(message)) {
      return this.showPremiumPlans(userData);
    }

    if (this.isWorkoutQuestion(message)) {
      return this.handleWorkoutQuestion(userData);
    }

    return {
      message: this.composeFollowUp(userData),
      nextStep: this.STEP.FOLLOW_UP,
      userData: { ...userData, flowStep: this.STEP.FOLLOW_UP }
    };
  }

  startFreeAssessment(userData) {
    const merged = {
      ...userData,
      premiumAskedEarly: true
    };
    const nextStep = this.nextMissingStep(merged, this.STEP.NAME);

    return {
      message: nextStep === this.STEP.NAME
        ? this.getPrompt('premium_gate', merged)
        : `Premium details se pehle free basic plan complete karte hain.\n\n${this.getPrompt(nextStep, merged)}`,
      nextStep,
      userData: { ...merged, flowStep: nextStep }
    };
  }

  askForNext(userData, fallbackStep) {
    const nextStep = this.nextMissingStep(userData, fallbackStep);
    if (!nextStep) {
      const finalUserData = {
        ...userData,
        freePlanDelivered: true,
        flowStep: this.STEP.FREE_PLAN
      };
      return {
        message: this.buildFreePlan(finalUserData),
        nextStep: this.STEP.FREE_PLAN,
        userData: finalUserData
      };
    }

    return {
      message: this.getPrompt(nextStep, userData),
      nextStep,
      userData: { ...userData, flowStep: nextStep }
    };
  }

  askForStep(step, userData) {
    return {
      message: this.getPrompt(step, userData),
      nextStep: step,
      userData: { ...userData, flowStep: step }
    };
  }

  retryStep(step, userData, promptKey) {
    return {
      message: this.getPrompt(promptKey, userData),
      nextStep: step,
      userData: { ...userData, flowStep: step }
    };
  }

  nextMissingStep(userData, fallbackStep = null) {
    const order = [
      [this.STEP.NAME, 'name'],
      [this.STEP.AGE, 'age'],
      [this.STEP.GENDER, 'gender'],
      [this.STEP.HEIGHT, 'height'],
      [this.STEP.WEIGHT, 'weight'],
      [this.STEP.GOAL, 'goal'],
      [this.STEP.ACTIVITY_LEVEL, 'activityLevel'],
      [this.STEP.FOOD_PREFERENCE, 'foodPreference'],
      [this.STEP.MEDICAL_CONDITION, 'medicalCondition']
    ];

    if (fallbackStep && !this.hasFieldForStep(userData, fallbackStep)) {
      return fallbackStep;
    }

    const missing = order.find(([, field]) => !userData[field]);
    return missing ? missing[0] : null;
  }

  hasFieldForStep(userData, step) {
    const map = {
      [this.STEP.NAME]: 'name',
      [this.STEP.AGE]: 'age',
      [this.STEP.GENDER]: 'gender',
      [this.STEP.HEIGHT]: 'height',
      [this.STEP.WEIGHT]: 'weight',
      [this.STEP.GOAL]: 'goal',
      [this.STEP.ACTIVITY_LEVEL]: 'activityLevel',
      [this.STEP.FOOD_PREFERENCE]: 'foodPreference',
      [this.STEP.MEDICAL_CONDITION]: 'medicalCondition'
    };
    return Boolean(userData[map[step]]);
  }

  getPrompt(key, userData) {
    const variants = this.promptVariants[key] || this.promptVariants.name;
    const lastPromptKey = userData.lastPromptKey;
    let index = Number(userData.promptVariantIndex || 0);

    if (lastPromptKey === key) {
      index += 1;
    } else {
      index = 0;
    }

    const selected = variants[index % variants.length];
    userData.lastPromptKey = key;
    userData.promptVariantIndex = index % variants.length;
    return selected;
  }

  parseGoal(message) {
    if (/(weight loss|fat loss|loss|fat|slim|pet)/i.test(message)) return 'Weight Loss';
    if (/(muscle gain|muscle|bulk|bodybuilding|strength)/i.test(message)) return 'Muscle Gain';
    if (/(weight gain|gain|skinny|dubla)/i.test(message)) return 'Weight Gain';
    return '';
  }

  parseGender(message) {
    if (/(^|\b)(male|man|boy|m)(\b|$)/i.test(message)) return 'Male';
    if (/(^|\b)(female|woman|girl|f)(\b|$)/i.test(message)) return 'Female';
    return '';
  }

  parseHeight(message) {
    const feetInches = message.match(/(\d+)\s*'\s*(\d{1,2})?/);
    if (feetInches) {
      return `${feetInches[1]}'${feetInches[2] || '0'}"`;
    }

    const altFeet = message.match(/(\d+)\s*feet?\s*(\d{1,2})?\s*inch?/i);
    if (altFeet) {
      return `${altFeet[1]}'${altFeet[2] || '0'}"`;
    }

    const cm = message.match(/(\d{2,3})\s*cm/i);
    if (cm) {
      return `${cm[1]} cm`;
    }

    return '';
  }

  parseActivityLevel(message) {
    if (message.includes('low')) return 'Low';
    if (message.includes('moderate') || message.includes('medium')) return 'Moderate';
    if (message.includes('high')) return 'High';
    return '';
  }

  parseFoodPreference(message) {
    if (/(non[\s-]?veg|nonveg|chicken|egg|anda)/i.test(message)) return 'Non-Veg';
    if (/(veg|vegetarian|paneer|dal)/i.test(message)) return 'Veg';
    return '';
  }

  normalizeMedicalCondition(message) {
    const cleaned = message.trim();
    if (!cleaned) return 'No medical condition';
    if (/(no|none|nahi|nothing)/i.test(cleaned)) return 'No medical condition';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  buildFreePlan(userData) {
    const goal = String(userData.goal || '').toLowerCase();
    const isVeg = userData.foodPreference === 'Veg';
    const profile = `🔹 Client Profile:\nName: ${userData.name}\nGoal: ${userData.goal}\nWeight: ${userData.weight} kg\nHeight: ${userData.height}`;

    let morning = '';
    let breakfast = '';
    let snack = '';
    let lunch = '';
    let evening = '';
    let dinner = '';
    let bonusTip = '';

    if (goal.includes('loss')) {
      morning = '1 glass warm water + 5 soaked almonds';
      breakfast = isVeg ? 'Oats + curd + 1 fruit' : '2 boiled eggs + oats + 1 fruit';
      snack = 'Apple ya cucumber salad';
      lunch = isVeg ? '2 roti + dal + salad + sabzi' : '2 roti + grilled chicken + salad';
      evening = 'Green tea + roasted chana';
      dinner = isVeg ? '1-2 roti + paneer bhurji + salad' : 'Saute vegetables + egg bhurji or chicken soup';
      bonusTip = 'Extra tip: daily 8k to 10k steps rakho, fat loss faster hoga.';
    } else if (goal.includes('weight gain')) {
      morning = '1 banana shake with milk and peanuts';
      breakfast = isVeg ? 'Paneer sandwich + milk' : '4 eggs + bread + milk';
      snack = 'Banana + dates + nuts';
      lunch = isVeg ? '4 roti + dal + rice + paneer' : 'Rice + chicken + curd + 2 roti';
      evening = 'Peanut chikki + lassi';
      dinner = isVeg ? 'Rice + soya or paneer + curd' : 'Rice + fish/chicken + vegetables';
      bonusTip = 'Extra tip: har meal mein calorie-dense food add karo, warna weight gain slow hoga.';
    } else {
      morning = '1 glass water + 5 soaked almonds + 1 banana';
      breakfast = isVeg ? 'Besan chilla + curd + sprouts' : 'Omelette + oats + fruit';
      snack = 'Greek yogurt ya fruit with peanuts';
      lunch = isVeg ? '2-3 roti + paneer/dal + rice + salad' : '2-3 roti + chicken + rice + salad';
      evening = 'Black coffee ya tea + roasted makhana';
      dinner = isVeg ? 'Paneer + sabzi + 2 roti' : 'Eggs or chicken + vegetables + 2 roti';
      bonusTip = 'Extra tip: muscle gain ke liye protein har meal mein include karo.';
    }

    return `${profile}

🔹 Diet Plan:

🌅 Morning (Empty Stomach)
${morning}

🥣 Breakfast
${breakfast}

🍎 Mid-Morning Snack
${snack}

🍛 Lunch
${lunch}

☕ Evening Snack
${evening}

🍽 Dinner
${dinner}

Medical Note: ${userData.medicalCondition}
${bonusTip}

This is our FREE BASIC PLAN.
For a more personalized and result-driven transformation, type 👉 PREMIUM`;
  }

  showPremiumPlans(userData) {
    return {
      message: this.getPremiumPlansMessage(),
      nextStep: this.STEP.PREMIUM_PLAN,
      userData: { ...userData, flowStep: this.STEP.PREMIUM_PLAN, freePlanDelivered: true }
    };
  }

  getPremiumPlansMessage() {
    return `💎 OUR PREMIUM PLANS:

1️⃣ Monthly Diet Plan – ₹499
✔ Customized as per your goal
✔ One-time plan for 1 month
✔ Based on your body details

2️⃣ Premium Transformation – ₹1999/month
✔ Detailed body analysis
✔ Lifestyle & habit tracking
✔ Medical & food preference consideration
✔ Monthly updated diet plans

3️⃣ Personal Trainer
💰 Pricing:
- 1 Month – ₹3999
- 3 Months – ₹4999
- 6 Months – ₹7999
- 12 Months – ₹11111

🚀 Features:
✔ Daily guidance (Day 1 to Day End)
✔ Weekly progress tracking
✔ Weight monitoring
✔ Habit correction
✔ Daily motivation
✔ Nutrition guidance
✔ Custom workout plans
✔ Weekly workout updates
✔ Cardio planning
✔ Pro-level mentorship

4️⃣ Special Guidance Plan

Beginner Plan – ₹499
✔ 1 month exercise chart only

Intermediate Plan – ₹1499
✔ Monthly plan based on weight, height, target weight, and aim

Pro Plan – ₹2999
✔ Weekly diet with exercise chart
✔ Weekly monitoring
✔ Nutrition guidance
✔ Force to follow exercise and diet

Reply with the service name that fits you best.`;
  }

  handleWorkoutQuestion(userData) {
    const goal = String(userData.goal || '').toLowerCase();

    if (goal.includes('loss')) {
      return {
        message: `Beginner workout for Weight Loss:\n1. 20 min brisk walk\n2. 3 sets squats x 12\n3. 3 sets wall push-ups x 10\n4. 3 sets plank x 20 sec\n5. 10 min light stretching\n\nTip: workout ke baad junk mat khao, warna calorie deficit break ho jata hai.`,
        nextStep: userData.flowStep || this.STEP.FOLLOW_UP,
        userData
      };
    }

    if (goal.includes('weight gain')) {
      return {
        message: `Beginner workout for Weight Gain:\n1. 3 sets bodyweight squats x 10\n2. 3 sets incline push-ups x 8\n3. 3 sets glute bridge x 12\n4. 3 sets chair dips x 8\n5. 5 min mobility\n\nTip: workout ke 60 minutes ke andar proper meal lo.`,
        nextStep: userData.flowStep || this.STEP.FOLLOW_UP,
        userData
      };
    }

    return {
      message: `Beginner workout for Muscle Gain:\n1. 3 sets squats x 12\n2. 3 sets push-ups x 8\n3. 3 sets lunges x 10 each leg\n4. 3 sets plank x 30 sec\n5. 3 sets superman hold x 15 sec\n\nTip: same workout 3-4 weeks consistently karo, phir reps increase karo.`,
      nextStep: userData.flowStep || this.STEP.FOLLOW_UP,
      userData
    };
  }

  composeFollowUp(userData) {
    return `Plan ready hai, ${userData.name || 'bhai'}.\n\n${this.getPrompt('follow_up', userData)}`;
  }

  handleSteroidsQuestion() {
    return `Bhai steroids safe shortcut nahi hote.\n\nNatural training, proper diet, aur consistency se hi long-term body banti hai.\nAgar chaho to main tumhare goal ke hisaab se natural plan set kar deta hoon.`;
  }

  isSteroidsQuestion(message) {
    return /(steroid|anabolic|dbol|testosterone|pct|cycle|gear)/i.test(message);
  }
}

module.exports = new FitnessFlow();

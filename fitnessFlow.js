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
        `Premium details dunga, but sabse pehle main aapko ek FREE BASIC PLAN bana deta hoon.\n\nPehle goal batao — Weight Loss, Weight Gain, ya Muscle Gain?`,
        `Pehle free basic assessment kar lete hain, phir premium options dikhaunga.\n\nBatao, aapka target kya hai?`,
        `Bhai tension mat lo, premium bhi milega. Lekin best result ke liye pehle free basic plan ready karte hain.\n\nGoal kya hai?`,
        `Premium ke baare mein baad mein baat karte hain. Pehle aapka plan banate hain.\n\nWeight Loss, Weight Gain, ya Muscle Gain?`,
        `Sabse pehle free plan bana deta hoon. Premium ka rasta baad mein khulenga.\n\nTo batao, goal kya hai?`
      ],
      goal: [
        `Aapka main goal kya hai: Weight Loss, Weight Gain, ya Muscle Gain?`,
        `Target clear karte hain. Goal batao: Weight Loss / Weight Gain / Muscle Gain.`,
        `Ab goal likho: Weight Loss, Weight Gain, ya Muscle Gain.`,
        `Sabse important — aap kya chahte ho? Weight Loss, Weight Gain, ya Muscle Gain?`,
        `Batao apna target. Teen option hain: Weight Loss, Weight Gain, Muscle Gain.`
      ],
      name: [
        `Chalo start karte hain. Aapka naam kya hai?`,
        `Sabse pehle apna name bhej do.`,
        `Quick start ke liye naam bata do.`,
        `Naam batao, plan personalize karne ke liye chahiye.`,
        `Bhai pehle naam to batao, phir aage badhte hain.`
      ],
      age: [
        `Nice. Ab age batao.`,
        `Theek hai, ab apni age share karo.`,
        `Good start. Ab age likho.`,
        `Age kitni hai? Plan ke liye zaroori hai.`,
        `Ab ek simple number — age kitni hai?`
      ],
      gender: [
        `Ab gender batao: Male ya Female?`,
        `Next detail: gender kya hai?`,
        `Body plan personalize karne ke liye gender chahiye: Male ya Female?`,
        `Male ya Female? Ye detail plan ko accurate banata hai.`,
        `Gender share karo — Male ya Female?`
      ],
      height: [
        `Ab height bhejo. Format: 172 cm ya 5'8".`,
        `Height share karo. 170 cm ya 5'10" format chalega.`,
        `Ab apni height bata do.`,
        `Height kitni hai? cm ya feet-inch mein batao.`,
        `Ek aur detail — height bhejo. Example: 175 cm.`
      ],
      weight: [
        `Weight batao in kg.`,
        `Ab current weight bhejo. Example: 72 kg.`,
        `Current body weight kitna hai?`,
        `Weight share karo — sirf number mein, kg mein.`,
        `Ab batao, current weight kitna chal raha hai?`
      ],
      activity_level: [
        `Activity level kya hai: Low, Moderate, ya High?`,
        `Roz ka activity level share karo: Low / Moderate / High.`,
        `Lifestyle ke hisaab se activity level batao.`,
        `Daily routine kaisi hai? Low, Moderate, ya High activity?`,
        `Kitna active rehte ho din mein? Low, Moderate, ya High?`
      ],
      food_preference: [
        `Food preference kya hai: Veg ya Non-Veg?`,
        `Diet customize karne ke liye batao: Veg ya Non-Veg?`,
        `Ab food preference share karo.`,
        `Veg khate ho ya Non-Veg? Plan ispe depend karta hai.`,
        `Ek aur cheez — Veg ya Non-Veg?`
      ],
      medical_condition: [
        `Koi medical condition, allergy, ya digestion issue hai? Nahi hai to "No medical condition" likh do.`,
        `Last detail: koi medical issue ya allergy? Agar nahi hai to "No medical condition" bhej do.`,
        `Bas ek last cheez. Medical condition ya injury hai kya?`,
        `Koi health issue ya allergy? Nahi hai to "No medical condition" likh do. Bas!`,
        `Final detail — medical condition kuch hai? Agar sab theek hai to "No medical condition" bhej do.`
      ],
      invalid_age: [
        `Valid age bhejo. 10 se 100 ke beech likho.`,
        `Age thoda clear format mein bhejo. Example: 27.`,
        `Age samajh nahi aayi. Sirf number mein bhejo.`,
        `Ye samajh nahi aaya. Age sirf number mein likho, jaise 25.`,
        `Age dobara bhejo — sirf number, 10 se 100 ke beech.`
      ],
      invalid_gender: [
        `Gender clearly likho: Male ya Female.`,
        `Please Male ya Female mein reply karo.`,
        `Ye detail clear chahiye. Male ya Female?`,
        `Sirf Male ya Female likho, aur kuch nahi.`,
        `Gender clear chahiye — Male ya Female?`
      ],
      invalid_height: [
        `Height proper format mein bhejo: 172 cm ya 5'10".`,
        `Height samajh nahi aayi. Example: 168 cm.`,
        `Please height clear format mein share karo.`,
        `Ye samajh nahi aaya. Height cm mein ya feet-inch mein bhejo.`,
        `Height dobara — format sahi hona chahiye. Jaise: 170 cm.`
      ],
      invalid_weight: [
        `Valid weight bhejo in kg. Example: 68 kg.`,
        `Weight clear format mein bhejo. 20 se 300 kg ke beech hona chahiye.`,
        `Current weight dobara bhejo. Example: 82 kg.`,
        `Ye samajh nahi aaya. Weight sirf number mein kg mein bhejo.`,
        `Weight dobara likho — sirf number, jaise 75 kg.`
      ],
      invalid_goal: [
        `Goal in 3 options mein se choose karo: Weight Loss / Weight Gain / Muscle Gain.`,
        `Target clear nahi hua. Please Weight Loss, Weight Gain, ya Muscle Gain likho.`,
        `Goal dobara bhejo: Weight Loss / Weight Gain / Muscle Gain.`,
        `Ye samajh nahi aaya. Teen mein se ek choose karo: Weight Loss, Weight Gain, Muscle Gain.`,
        `Goal clear likho — Weight Loss, Weight Gain, ya Muscle Gain.`
      ],
      invalid_activity: [
        `Activity level inme se choose karo: Low / Moderate / High.`,
        `Low, Moderate, ya High mein reply karo.`,
        `Activity level clear chahiye. Low / Moderate / High?`,
        `Ye samajh nahi aaya. Sirf Low, Moderate, ya High likho.`,
        `Activity level dobara — Low, Moderate, ya High?`
      ],
      invalid_food: [
        `Food preference likho: Veg ya Non-Veg.`,
        `Veg ya Non-Veg mein reply karo.`,
        `Diet ke liye ye detail chahiye: Veg / Non-Veg.`,
        `Sirf Veg ya Non-Veg likho.`,
        `Food preference clear chahiye — Veg ya Non-Veg?`
      ],
      follow_up: [
        `Agar aur detail chahiye ya exercise kaise karu poochna hai, seedha message kar do.`,
        `Next step ke liye ya to PREMIUM type karo ya workout help maango.`,
        `Plan mil gaya. Ab chaho to PREMIUM likho ya workout guidance le lo.`,
        `Kuch aur jaanna hai? Workout, diet, ya PREMIUM — batao.`,
        `Plan ready hai. Agar detail chahiye to PREMIUM likho, ya koi specific question poocho.`
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

    // Flow guard: never go backward in steps
    const stepOrder = [
      this.STEP.WELCOME, this.STEP.GOAL, this.STEP.NAME, this.STEP.AGE,
      this.STEP.GENDER, this.STEP.HEIGHT, this.STEP.WEIGHT,
      this.STEP.ACTIVITY_LEVEL, this.STEP.FOOD_PREFERENCE,
      this.STEP.MEDICAL_CONDITION, this.STEP.FREE_PLAN,
      this.STEP.PREMIUM_PLAN, this.STEP.FOLLOW_UP
    ];
    const currentIdx = stepOrder.indexOf(currentStep);

    if (this.isGreeting(normalized)) {
      const greetStep = currentIdx >= stepOrder.indexOf(this.STEP.NAME) ? currentStep : this.STEP.GOAL;
      return {
        message: this.getWelcomeMessage(),
        nextStep: greetStep,
        userData: { ...userData, flowStep: greetStep }
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
      return this.handleIntentOverride('workout', userData);
    }

    if (this.isDietQuestion(normalized)) {
      return this.handleIntentOverride('diet', userData);
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
        return this.handleFailsafe(userData, message);
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

    const ack = this.getGoalAck(goal);
    const motivation = this.getMotivation(userData);
    const nextStep = this.nextMissingStep({ ...userData, goal }, this.STEP.NAME);
    return {
      message: `${ack}\n\n${motivation}\n\n${this.getPrompt(nextStep, { ...userData, goal })}`,
      nextStep,
      userData: { ...userData, goal, flowStep: nextStep }
    };
  }

  handleName(userData, message) {
    const name = message.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).slice(0, 3).join(' ');
    if (!name) {
      return this.retryStep(this.STEP.NAME, userData, 'name');
    }

    const goalRef = userData.goal ? ` ${userData.goal} ke liye` : '';
    const filler = this.getFiller(userData);
    const nextStep = this.nextMissingStep({ ...userData, name }, this.STEP.AGE);
    return {
      message: `Nice to meet you, ${name}!${goalRef} saath chalenge.\n\n${filler} ${this.getPrompt(nextStep, { ...userData, name })}`,
      nextStep,
      userData: { ...userData, name, flowStep: nextStep }
    };
  }

  handleAge(userData, message) {
    const match = message.match(/\b(\d{1,3})\b/);
    const age = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(age) || age < 10 || age > 100) {
      return this.retryStep(this.STEP.AGE, userData, 'invalid_age');
    }

    const nameRef = userData.name ? ` ${userData.name},` : '';
    const nextStep = this.nextMissingStep({ ...userData, age: String(age) }, this.STEP.GENDER);
    return {
      message: `${nameRef} ${age} sahi hai. Plan aapki age ke hisaab se adjust hoga.\n\n${this.getPrompt(nextStep, { ...userData, age: String(age) })}`,
      nextStep,
      userData: { ...userData, age: String(age), flowStep: nextStep }
    };
  }

  handleGender(userData, message) {
    const gender = this.parseGender(message);
    if (!gender) {
      return this.retryStep(this.STEP.GENDER, userData, 'invalid_gender');
    }

    const nextStep = this.nextMissingStep({ ...userData, gender }, this.STEP.HEIGHT);
    return {
      message: `Got it. ${gender} body ke hisaab se plan tailor hoga.\n\n${this.getPrompt(nextStep, { ...userData, gender })}`,
      nextStep,
      userData: { ...userData, gender, flowStep: nextStep }
    };
  }

  handleHeight(userData, message) {
    const height = this.parseHeight(message);
    if (!height) {
      return this.retryStep(this.STEP.HEIGHT, userData, 'invalid_height');
    }

    const nextStep = this.nextMissingStep({ ...userData, height }, this.STEP.WEIGHT);
    return {
      message: `Height ${height} noted. BMI calc ke liye ye zaroori hai.\n\n${this.getPrompt(nextStep, { ...userData, height })}`,
      nextStep,
      userData: { ...userData, height, flowStep: nextStep }
    };
  }

  handleWeight(userData, message) {
    const match = message.match(/\b(\d{1,3}(?:\.\d+)?)\b/);
    const weight = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
      return this.retryStep(this.STEP.WEIGHT, userData, 'invalid_weight');
    }

    const insight = this.getInsight(userData);
    const nextStep = this.nextMissingStep({ ...userData, weight: String(weight).replace(/\.0$/, '') }, this.STEP.ACTIVITY_LEVEL);
    return {
      message: `${weight} kg — noted. ${insight}\n\n${this.getPrompt(nextStep, { ...userData, weight: String(weight).replace(/\.0$/, '') })}`,
      nextStep,
      userData: { ...userData, weight: String(weight).replace(/\.0$/, ''), flowStep: nextStep }
    };
  }

  handleActivityLevel(userData, message) {
    const activityLevel = this.parseActivityLevel(message);
    if (!activityLevel) {
      return this.retryStep(this.STEP.ACTIVITY_LEVEL, userData, 'invalid_activity');
    }

    const filler = this.getFiller(userData);
    const nextStep = this.nextMissingStep({ ...userData, activityLevel }, this.STEP.FOOD_PREFERENCE);
    return {
      message: `${activityLevel} activity — plan accordingly adjust hoga.\n\n${filler} ${this.getPrompt(nextStep, { ...userData, activityLevel })}`,
      nextStep,
      userData: { ...userData, activityLevel, flowStep: nextStep }
    };
  }

  handleFoodPreference(userData, message) {
    const foodPreference = this.parseFoodPreference(message);
    if (!foodPreference) {
      return this.retryStep(this.STEP.FOOD_PREFERENCE, userData, 'invalid_food');
    }

    const nameRef = userData.name || 'bhai';
    const nextStep = this.nextMissingStep({ ...userData, foodPreference }, this.STEP.MEDICAL_CONDITION);
    return {
      message: `${foodPreference} — achha ${nameRef}, diet plan isi ke around banega.\n\n${this.getPrompt(nextStep, { ...userData, foodPreference })}`,
      nextStep,
      userData: { ...userData, foodPreference, flowStep: nextStep }
    };
  }

  handleMedicalCondition(userData, message) {
    const medicalCondition = this.normalizeMedicalCondition(message);
    const nameRef = userData.name || 'bhai';
    const motivation = this.getMotivation(userData);
    const finalUserData = {
      ...userData,
      medicalCondition,
      freePlanDelivered: true,
      flowStep: this.STEP.FREE_PLAN
    };

    return {
      message: `Sab details mil gaye ${nameRef}. ${motivation}\n\n${this.buildFreePlan(finalUserData)}`,
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
    const nameRef = userData.name || 'bhai';
    const filler = this.getFiller(userData);
    return {
      message: `${nameRef}, jo plan suit kare wo choose karo.\n\nPayment aur onboarding ke liye WhatsApp karo: +91 98886 01933\n\n${filler} agar koi plan detail mein samajhna ho to batao, main explain kar dunga.`,
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
    const nextStep = this.nextMissingStep(merged, this.STEP.GOAL);

    return {
      message: nextStep === this.STEP.GOAL
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
      [this.STEP.GOAL, 'goal'],
      [this.STEP.NAME, 'name'],
      [this.STEP.AGE, 'age'],
      [this.STEP.GENDER, 'gender'],
      [this.STEP.HEIGHT, 'height'],
      [this.STEP.WEIGHT, 'weight'],
      [this.STEP.ACTIVITY_LEVEL, 'activityLevel'],
      [this.STEP.FOOD_PREFERENCE, 'foodPreference'],
      [this.STEP.MEDICAL_CONDITION, 'medicalCondition']
    ];

    // Scan order first – never skip an earlier missing field
    const missing = order.find(([, field]) => !userData[field]);
    if (missing) return missing[0];

    // All ordered fields set; check fallback
    if (fallbackStep && !this.hasFieldForStep(userData, fallbackStep)) {
      return fallbackStep;
    }

    return null;
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

This is a FREE BASIC PLAN.
Type PREMIUM for advanced coaching.`;
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
    const insight = this.getInsight(userData);

    if (goal.includes('loss')) {
      return {
        message: `🏋️ Beginner Weight Loss Workout (4-Day Plan)\n\n📌 Day 1 – Full Body\n• Brisk walk – 20 min\n• Squats – 3 sets x 12 reps\n• Wall push-ups – 3 sets x 10 reps\n• Plank – 3 sets x 20 sec\n\n📌 Day 2 – Cardio + Core\n• Jumping jacks – 3 sets x 30 sec\n• Mountain climbers – 3 sets x 10 reps\n• Bicycle crunches – 3 sets x 12 reps\n• Walking – 15 min\n\n📌 Day 3 – Rest or Light Walk\n\n📌 Day 4 – Lower Body + Cardio\n• Lunges – 3 sets x 10 each leg\n• Step-ups – 3 sets x 10 each leg\n• Glute bridge – 3 sets x 15 reps\n• Skipping – 5 min\n\n💡 ${insight}\n\nThis is a FREE BASIC PLAN.\nType PREMIUM for advanced coaching.`,
        nextStep: userData.flowStep || this.STEP.FOLLOW_UP,
        userData
      };
    }

    if (goal.includes('weight gain')) {
      return {
        message: `🏋️ Beginner Weight Gain Workout (4-Day Plan)\n\n📌 Day 1 – Push\n• Incline push-ups – 3 sets x 8 reps\n• Chair dips – 3 sets x 8 reps\n• Pike push-ups – 3 sets x 6 reps\n• Plank – 3 sets x 20 sec\n\n📌 Day 2 – Pull + Core\n• Bodyweight rows (under table) – 3 sets x 8 reps\n• Superman hold – 3 sets x 15 sec\n• Bicycle crunches – 3 sets x 12 reps\n• Dead bug – 3 sets x 10 reps\n\n📌 Day 3 – Rest or Light Mobility\n\n📌 Day 4 – Legs\n• Bodyweight squats – 3 sets x 12 reps\n• Lunges – 3 sets x 10 each leg\n• Glute bridge – 3 sets x 15 reps\n• Calf raises – 3 sets x 15 reps\n\n💡 ${insight}\n\nThis is a FREE BASIC PLAN.\nType PREMIUM for advanced coaching.`,
        nextStep: userData.flowStep || this.STEP.FOLLOW_UP,
        userData
      };
    }

    return {
      message: `🏋️ Beginner Muscle Gain Workout (4-Day Plan)\n\n📌 Day 1 – Upper Body\n• Push-ups – 4 sets x 8-12 reps\n• Diamond push-ups – 3 sets x 6-8 reps\n• Chair dips – 3 sets x 8-10 reps\n• Plank – 3 sets x 30 sec\n\n📌 Day 2 – Lower Body\n• Squats – 4 sets x 12-15 reps\n• Lunges – 3 sets x 10 each leg\n• Glute bridge – 3 sets x 15 reps\n• Calf raises – 3 sets x 20 reps\n\n📌 Day 3 – Rest or Stretching\n\n📌 Day 4 – Full Body\n• Burpees – 3 sets x 6 reps\n• Mountain climbers – 3 sets x 10 reps\n• Superman hold – 3 sets x 15 sec\n• Push-ups – 3 sets x max reps\n\n💡 ${insight}\n\nThis is a FREE BASIC PLAN.\nType PREMIUM for advanced coaching.`,
      nextStep: userData.flowStep || this.STEP.FOLLOW_UP,
      userData
    };
  }

  composeFollowUp(userData) {
    const nameRef = userData.name || 'bhai';
    const goalRef = userData.goal || '';
    const motivation = this.getMotivation(userData);
    return `${nameRef}, ${goalRef ? goalRef.toLowerCase() + ' ke liye ' : ''}plan ready hai. ${motivation}\n\n${this.getPrompt('follow_up', userData)}`;
  }

  handleSteroidsQuestion() {
    return `Bhai steroids safe shortcut nahi hote.\n\nNatural training, proper diet, aur consistency se hi long-term body banti hai.\nAgar chaho to main tumhare goal ke hisaab se natural plan set kar deta hoon.`;
  }

  getInsight(userData) {
    const insights = [
      'Protein har meal mein include karo, muscle recovery faster hogi.',
      'Sleep 7-8 hours rakho, body repair tabhi hoti hai.',
      'Pani roz 3-4 litre peeo, metabolism boost hota hai.',
      'Consistency sabse important hai – 1 din miss kiya to guilt mat, next din se wapas start.',
      'Warm-up pe skip mat karo, injury se bachata hai.',
      'Post-workout 30 min ke andar protein lo, absorption best hota hai.',
      'Processed food avoid karo, natural khana hi real fuel hai.',
      'Weekly progress track karo – weight, photos, energy level sab note karo.',
      'Rest days ko lightly walk karo, active recovery help karta hai.',
      'Sugar sweet drinks chhodo, fat loss 2x fast hoga.'
    ];
    const idx = (userData.insightIndex || 0) % insights.length;
    userData.insightIndex = idx + 1;
    return insights[idx];
  }

  getMotivation(userData) {
    const lines = [
      'Consistency rakho, result pakka milega 💪',
      'Slow progress bhi progress hai, mat ruko.',
      'Har din ek step aage badho, body follow karegi.',
      'Tum kar sakte ho, bas start karte raho.',
      'Chhota sa effort bhi zero se better hai.',
      'Discipline > motivation. Roz dikhao.',
      'Transformation overnight nahi hota, but hota zaroor hai.',
      'Focus rakho, body change ho rahi hai even if dikhe nahi abhi.'
    ];
    const idx = (userData.motivationIndex || 0) % lines.length;
    userData.motivationIndex = idx + 1;
    return lines[idx];
  }

  getFiller(userData) {
    const fillers = [
      'By the way,',
      'Aur haan,',
      'Ek cheez aur —',
      'Achha suno,',
      'Bhai ek baat batau,',
      'Dekho,',
      'Sunao,',
      'Socho,'
    ];
    const idx = (userData.fillerIndex || 0) % fillers.length;
    userData.fillerIndex = idx + 1;
    return fillers[idx];
  }

  getGoalAck(goal) {
    const acks = {
      'Weight Loss': [
        'Fat loss ka plan bana dete hain — solid approach se karenge.',
        'Weight loss challenging hai but bilkul ho sakta hai. Main saath dunga.',
        'Pet aur body fat reduce karna hai? Chalo karte hain.',
        'Good choice. Calorie deficit + right exercise = result pakka.'
      ],
      'Weight Gain': [
        'Weight gain smart way se karenge, sirf fat nahi badhana.',
        'Dublaapan chhodna hai? Proper surplus se healthy weight aayega.',
        'Mass badhana hai — diet aur training dono sahi rakhenge.',
        'Solid. Calorie surplus + strength training se weight aayega.'
      ],
      'Muscle Gain': [
        'Muscle building ke liye consistency chahiye, main plan de dunga.',
        'Body banani hai? Progressive overload + high protein se hoga.',
        'Great goal. Muscle gain requires patience but result worth hai.',
        'Muscle gain ka rasta clear hai — train smart, eat right, rest enough.'
      ]
    };
    const options = acks[goal] || acks['Muscle Gain'];
    const idx = Math.floor(Math.random() * options.length);
    return options[idx];
  }

  isDietQuestion(message) {
    return /(diet|kya khau|khana|meal|nutrition|calorie|bhook|pet bhara|recipe|recipie|ghar ka khana)/i.test(message);
  }

  handleDietQuestion(userData) {
    const goal = String(userData.goal || '').toLowerCase();
    const insight = this.getInsight(userData);

    if (!userData.freePlanDelivered) {
      const nextStep = this.nextMissingStep(userData, this.STEP.GOAL);
      return {
        message: `Bhai pehle profile complete karte hain, phir personalized diet plan bana dunga 💪\n\n${this.getPrompt(nextStep, userData)}`,
        nextStep,
        userData: { ...userData, flowStep: nextStep }
      };
    }

    let dietTip = '';
    if (goal.includes('loss')) {
      dietTip = 'Weight loss ke liye calorie deficit zaroori hai. Har meal mein protein rakho, processed food chhodo.';
    } else if (goal.includes('weight gain')) {
      dietTip = 'Weight gain ke liye calorie surplus chahiye. Har meal mein calorie-dense foods jaise peanut butter, banana, milk add karo.';
    } else {
      dietTip = 'Muscle gain ke liye high protein diet zaroori hai. 1.6-2g protein per kg bodyweight daily target rakho.';
    }

    return {
      message: `🥗 Quick Diet Tip:\n\n${dietTip}\n\n💡 ${insight}\n\nApna complete diet plan upar mila hai. Detail mein jaanne ke liye PREMIUM type karo.`,
      nextStep: userData.flowStep || this.STEP.FOLLOW_UP,
      userData
    };
  }

  handleIntentOverride(intentType, userData) {
    // Answer the question FIRST
    const answer = intentType === 'workout'
      ? this.handleWorkoutQuestion(userData)
      : this.handleDietQuestion(userData);

    // If plan is delivered, no need to resume flow — just return the answer
    if (userData.freePlanDelivered) return answer;

    // Resume flow: append next missing step prompt after the answer
    const nextStep = this.nextMissingStep(userData, this.STEP.GOAL);
    if (nextStep) {
      const flowPrompt = this.getPrompt(nextStep, userData);
      const resumeVariants = [
        `\n\nAb wapas profile pe aate hain — ${flowPrompt}`,
        `\n\nBy the way, ${flowPrompt}`,
        `\n\nAur haan, ${flowPrompt}`
      ];
      const vIdx = (userData.intentResumeIndex || 0) % resumeVariants.length;
      userData.intentResumeIndex = vIdx + 1;

      return {
        message: answer.message + resumeVariants[vIdx],
        nextStep,
        userData: { ...userData, ...answer.userData, flowStep: nextStep }
      };
    }

    return answer;
  }

  handleFailsafe(userData, message) {
    // When input doesn't match any step or intent
    const clarificationVariants = [
      'Main sahi guide karne ke liye ek cheez confirm kar lu — aap kya jaanna chahte ho?',
      'Thoda clear batao to better help kar paunga. Goal, diet, ya workout ke baare mein?',
      'Samajh nahi aaya exactly. Batao — fitness goal hai ya koi specific question?'
    ];
    const idx = (userData.failsafeIndex || 0) % clarificationVariants.length;
    userData.failsafeIndex = idx + 1;

    const currentStep = userData.flowStep || this.STEP.WELCOME;
    // If onboarding not complete, gently nudge back
    if (currentStep !== this.STEP.FOLLOW_UP && currentStep !== this.STEP.PREMIUM_PLAN) {
      const nextStep = this.nextMissingStep(userData, this.STEP.GOAL);
      if (nextStep) {
        return {
          message: `${clarificationVariants[idx]}\n\n${this.getPrompt(nextStep, userData)}`,
          nextStep,
          userData: { ...userData, flowStep: nextStep }
        };
      }
    }

    return {
      message: clarificationVariants[idx],
      nextStep: currentStep,
      userData
    };
  }

  isSteroidsQuestion(message) {
    return /(steroid|anabolic|dbol|testosterone|pct|cycle|gear)/i.test(message);
  }
}

module.exports = new FitnessFlow();

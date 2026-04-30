/**
 * Complete Fitness Business Flow Handler
 * Implements the full sales and onboarding flow for the WhatsApp bot
 */

class FitnessFlow {
  constructor() {
    // Flow states
    this.STEP = {
      WELCOME: 'welcome',
      LANGUAGE: 'language',
      NAME: 'name',
      AGE: 'age',
      GENDER: 'gender',
      WEIGHT: 'weight',
      HEIGHT: 'height',
      GOAL: 'goal',
      TIMELINE: 'timeline',
      WORKOUT_TYPE: 'workout_type',
      PLAN_SELECTION: 'plan_selection',
      BASIC_PLAN: 'basic_plan',
      PREMIUM_PLAN: 'premium_plan',
      FOLLOW_UP: 'follow_up'
    };
  }

  // Get welcome message
  getWelcomeMessage() {
    return `Welcome to Loving Hubby Fitness Family 💪

Aapka goal kya hai?
• Fat loss
• Weight gain  
• Muscle gain
• Strength
• General fitness

Bas reply karein aur hum shuru karte hain!`;
  }

  // Get language selection message
  getLanguageMessage() {
    return `Choose Language:
1 English
2 Hindi
3 Punjabi

Reply with number 🔥`;
  }

  // Process user response and determine next step
  processFlow(userData, userMessage) {
    const currentStep = userData.flowStep || this.STEP.WELCOME;
    const message = userMessage.toLowerCase().trim();
    
    // If user says hi/hello, start fresh
    if (this.isGreeting(message)) {
      return {
        message: this.getWelcomeMessage(),
        nextStep: this.STEP.GOAL,
        userData: { flowStep: this.STEP.GOAL }
      };
    }

    switch (currentStep) {
      case this.STEP.WELCOME:
        return this.handleWelcome(userData, message);
      
      case this.STEP.GOAL:
        return this.handleGoal(userData, message);
      
      case this.STEP.NAME:
        return this.handleName(userData, message);
      
      case this.STEP.AGE:
        return this.handleAge(userData, message);
      
      case this.STEP.GENDER:
        return this.handleGender(userData, message);
      
      case this.STEP.WEIGHT:
        return this.handleWeight(userData, message);
      
      case this.STEP.HEIGHT:
        return this.handleHeight(userData, message);
      
      case this.STEP.TIMELINE:
        return this.handleTimeline(userData, message);
      
      case this.STEP.WORKOUT_TYPE:
        return this.handleWorkoutType(userData, message);
      
      case this.STEP.PLAN_SELECTION:
        return this.handlePlanSelection(userData, message);
      
      case this.STEP.BASIC_PLAN:
        return this.handleBasicPlan(userData, message);
      
      case this.STEP.PREMIUM_PLAN:
        return this.handlePremiumPlan(userData, message);
      
      case this.STEP.FOLLOW_UP:
        return this.handleFollowUp(userData, message);
      
      default:
        return {
          message: this.getWelcomeMessage(),
          nextStep: this.STEP.GOAL,
          userData: { flowStep: this.STEP.GOAL }
        };
    }
  }

  isGreeting(message) {
    const greetings = ['hi', 'hello', 'hey', 'namaste', 'satsriyakal', 'hiya', 'hola'];
    return greetings.some(g => message.includes(g));
  }

  handleWelcome(userData, message) {
    // User said hi, show welcome message
    return {
      message: this.getWelcomeMessage(),
      nextStep: this.STEP.GOAL,
      userData: { ...userData, flowStep: this.STEP.GOAL }
    };
  }

  handleGoal(userData, message) {
    let goal = '';
    
    if (message.includes('fat loss') || message.includes('weight loss') || message.includes('1')) {
      goal = 'Fat loss';
    } else if (message.includes('weight gain') || message.includes('2')) {
      goal = 'Weight gain';
    } else if (message.includes('muscle gain') || message.includes('3')) {
      goal = 'Muscle gain';
    } else if (message.includes('strength') || message.includes('4')) {
      goal = 'Strength';
    } else if (message.includes('general') || message.includes('5')) {
      goal = 'General fitness';
    } else {
      // Try to detect goal from message
      if (message.includes('loss') || message.includes('fat') || message.includes('pet')) {
        goal = 'Fat loss';
      } else if (message.includes('muscle') || message.includes('bulk')) {
        goal = 'Muscle gain';
      } else if (message.includes('gain') || message.includes('weight')) {
        goal = 'Weight gain';
      } else {
        return {
          message: `Sorry Bhai! 🙏

Please choose:
• Fat loss
• Weight gain  
• Muscle gain
• Strength
• General fitness

Reply with goal name 🔥`,
          nextStep: this.STEP.GOAL,
          userData: userData
        };
      }
    }

    return {
      message: `Great choice! ${goal} ek excellent goal hai 💪

Ab tell me:
What is your name?`,
      nextStep: this.STEP.NAME,
      userData: { ...userData, goal, flowStep: this.STEP.NAME }
    };
  }

  handleName(userData, message) {
    // Extract name - take first few words as name
    const name = message.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/).slice(0, 2).join(' ');
    
    return {
      message: `Nice to meet you, ${name}! 🙏

Now tell me:
What is your age?`,
      nextStep: this.STEP.AGE,
      userData: { ...userData, name, flowStep: this.STEP.AGE }
    };
  }

  handleAge(userData, message) {
    // Extract age
    const ageMatch = message.match(/\b(\d{1,3})\b/);
    if (!ageMatch || parseInt(ageMatch[1]) < 10 || parseInt(ageMatch[1]) > 100) {
      return {
        message: `Please enter valid age (10-100 years) 🙏`,
        nextStep: this.STEP.AGE,
        userData: userData
      };
    }

    const age = ageMatch[1];

    return {
      message: `Noted! ${age} years perfect age hai 💪

Next:
Male ya Female?`,
      nextStep: this.STEP.GENDER,
      userData: { ...userData, age, flowStep: this.STEP.GENDER }
    };
  }

  handleGender(userData, message) {
    let gender = '';
    
    if (message.includes('male') || message.includes('m') || message.includes('male') || message.includes('1') || message.includes('man') || message.includes('boy')) {
      gender = 'Male';
    } else if (message.includes('female') || message.includes('f') || message.includes('2') || message.includes('woman') || message.includes('girl')) {
      gender = 'Female';
    } else {
      return {
        message: `Please specify:
Male ya Female?`,
        nextStep: this.STEP.GENDER,
        userData: userData
      };
    }

    return {
      message: `${gender}? Great! 💪

Ab tell me:
What is your current weight? (kg)`,
      nextStep: this.STEP.WEIGHT,
      userData: { ...userData, gender, flowStep: this.STEP.WEIGHT }
    };
  }

  handleWeight(userData, message) {
    // Extract weight
    const weightMatch = message.match(/\b(\d{1,3}(?:\.\d+)?)\b/);
    if (!weightMatch || parseFloat(weightMatch[1]) < 20 || parseFloat(weightMatch[1]) > 300) {
      return {
        message: `Please enter valid weight in kg (20-300) 🙏`,
        nextStep: this.STEP.WEIGHT,
        userData: userData
      };
    }

    const weight = weightMatch[1];

    return {
      message: `Noted! ${weight} kg 📝

Ab tell me:
What is your height? (feet'inches ya cm)`,
      nextStep: this.STEP.HEIGHT,
      userData: { ...userData, weight, flowStep: this.STEP.HEIGHT }
    };
  }

  handleHeight(userData, message) {
    let height = '';
    
    // Try to match feet'inches format
    const feetMatch = message.match(/(\d+)'(\d+)?/);
    if (feetMatch) {
      height = `${feetMatch[1]}'${feetMatch[2] || '0'}"`;
    } else {
      // Try cm
      const cmMatch = message.match(/(\d{2,3})\s*cm/i);
      if (cmMatch) {
        height = `${cmMatch[1]} cm`;
      } else {
        // Try just number
        const numMatch = message.match(/(\d{2,3})/);
        if (numMatch) {
          const h = parseInt(numMatch[1]);
          if (h > 100) {
            height = `${h} cm`;
          } else {
            height = `${h}'`;
          }
        }
      }
    }

    if (!height) {
      return {
        message: `Please enter height properly:
5'10" ya 178 cm format mein 🙏`,
        nextStep: this.STEP.HEIGHT,
        userData: userData
      };
    }

    return {
      message: `Perfect! ${height} 📝

Ab tell me:
Kitne time mein result chahiye?
(1 month / 3 month / 6 month / 1 year)`,
      nextStep: this.STEP.TIMELINE,
      userData: { ...userData, height, flowStep: this.STEP.TIMELINE }
    };
  }

  handleTimeline(userData, message) {
    let timeline = '';
    
    if (message.includes('1 month') || message.includes('1month') || message.includes('30')) {
      timeline = '1 month';
    } else if (message.includes('3 month') || message.includes('3month') || message.includes('3')) {
      timeline = '3 months';
    } else if (message.includes('6 month') || message.includes('6month') || message.includes('6')) {
      timeline = '6 months';
    } else if (message.includes('1 year') || message.includes('12 month') || message.includes('1year')) {
      timeline = '1 year';
    } else {
      return {
        message: `Please specify timeline:
1 month / 3 month / 6 month / 1 year`,
        nextStep: this.STEP.TIMELINE,
        userData: userData
      };
    }

    return {
      message: `${timeline}? Great target! 🎯

Last question:
Gym workout karein ya home workout?`,
      nextStep: this.STEP.WORKOUT_TYPE,
      userData: { ...userData, timeline, flowStep: this.STEP.WORKOUT_TYPE }
    };
  }

  handleWorkoutType(userData, message) {
    let workoutType = '';
    
    if (message.includes('gym') || message.includes('1')) {
      workoutType = 'Gym';
    } else if (message.includes('home') || message.includes('2')) {
      workoutType = 'Home';
    } else {
      return {
        message: `Please choose:
1 Gym
2 Home workout`,
        nextStep: this.STEP.WORKOUT_TYPE,
        userData: userData
      };
    }

    // Build user summary
    const summary = `Perfect! Ab aapka profile ready hai 📋

📝 *Your Details:*
Name: ${userData.name}
Age: ${userData.age}
Gender: ${userData.gender}
Weight: ${userData.weight} kg
Height: ${userData.height}
Goal: ${userData.goal}
Timeline: ${userData.timeline}
Workout: ${workoutType}

Ab choose karein apna plan 🔥`;

    return {
      message: summary,
      nextStep: this.STEP.PLAN_SELECTION,
      userData: { ...userData, workoutType, flowStep: this.STEP.PLAN_SELECTION }
    };
  }

  handlePlanSelection(userData, message) {
    // Check if user wants premium
    if (message.includes('premium') || message.includes('2') || message.includes('guide')) {
      return {
        message: this.getPremiumPlanMessage(),
        nextStep: this.STEP.PREMIUM_PLAN,
        userData: { ...userData, selectedPlan: 'premium', flowStep: this.STEP.PREMIUM_PLAN }
      };
    }

    // Default to basic or if user chooses basic
    return {
      message: this.getBasicPlanMessage(),
      nextStep: this.STEP.BASIC_PLAN,
      userData: { ...userData, selectedPlan: 'basic', flowStep: this.STEP.BASIC_PLAN }
    };
  }

  getBasicPlanMessage() {
    return `✅ *BASIC FREE PLAN*

Yeh raha aapka free guidance:

🥗 *Basic Diet Tips:*
1. Subah khali pet ek glass pani piyein
2. Lunch mein protein zaroor lein
3. Dinner light rakhna hai
4. Sugar aur refined oil kam karein
5. Rozana 8 glass pani piyein

🍽️ *Basic Meal Plan:*
• Breakfast: 2 roti + sabzi + chaas
• Lunch: 3 roti + dal + salad
• Snacks: Fruits ya nuts
• Dinner: 2 roti + light sabzi

💪 *Basic Workout Schedule:*
• Monday: Full body cardio
• Tuesday: Rest
• Wednesday: Strength training
• Thursday: Rest
• Friday: Cardio
• Saturday: Active rest
• Sunday: Rest

😴 *Basic Sleep Tips:*
• 7-8 hours sleep zaroori
• Sleep se pehle phone nahi
• Light dinner

💧 *Water Intake:*
• Roz 3-4 litre pani
• Workout se pehle 1 glass
• Workout ke baad 1 glass

---

Agar personalized fast result chahiye toh Premium available hai 🔥

1 Basic (Free) - Done
2 Premium Guide Plan

Reply with option 🔥`;
  }

  handleBasicPlan(userData, message) {
    // User got basic plan, now follow up
    return {
      message: `Perfect! ${userData.name} bhai, yeh plan follow karein 💪

Koi bhi question ho toh pooch sakte hain!

Agar aapko fast results chahiye toh main aapko Premium Guide de sakta hoon jisme:

✓ Custom diet chart
✓ Personal trainer guidance  
✓ Weekly tracking
✓ Daily motivation

Ready ho toh batao 🔥`,
      nextStep: this.STEP.FOLLOW_UP,
      userData: { ...userData, flowStep: this.STEP.FOLLOW_UP }
    };
  }

  getPremiumPlanMessage() {
    return `🔥 *PREMIUM GUIDE PLAN*

Choose service:

*1. Monthly Diet Chart - ₹499*
Custom monthly diet according to your goal

*2. Beginner Exercise Chart - ₹499*
30-day beginner workout plan

*3. Your Personal Trainer:*
┌─────────────────┐
│ 1 Month  - ₹1999 │
│ 3 Month  - ₹3999 │
│ 6 Month  - ₹6999 │
│ 12 Month - ₹9999 │
└─────────────────┘

*PERSONAL TRAINER FEATURES:*
✓ Day 1 to last day full guidance
✓ Weekly tracking
✓ Weight progress monitoring
✓ Habit correction push
✓ Daily motivation tips
✓ Custom plan by your lifestyle
✓ Weekly workout changes
✓ Aerobics/cardio guidance
✓ Pro level mentorship

---

Kis option mein interest hai?
1 / 2 / 3 (Personal trainer)

Reply with number 🔥`;
  }

  handlePremiumPlan(userData, message) {
    let service = '';
    let price = '';
    
    if (message.includes('1')) {
      service = 'Monthly Diet Chart';
      price = '₹499';
    } else if (message.includes('2')) {
      service = 'Beginner Exercise Chart';
      price = '₹499';
    } else if (message.includes('3') || message.includes('personal')) {
      service = 'Personal Trainer';
      price = '₹1999-9999';
    } else {
      return {
        message: `Please choose:
1 Diet Chart - ₹499
2 Exercise Chart - ₹499
3 Personal Trainer`,
        nextStep: this.STEP.PREMIUM_PLAN,
        userData: userData
      };
    }

    return {
      message: `Great choice! ${service} - ${price} 🙏

Payment ke liye WhatsApp karenge:
+91 98886 01933

Payment confirm hone ke baad plan immediately start hoga! 💪

Koi aur question ho toh pooch sakte hain 🔥`,
      nextStep: this.STEP.FOLLOW_UP,
      userData: { ...userData, selectedService: service, selectedPrice: price, flowStep: this.STEP.FOLLOW_UP }
    };
  }

  handleFollowUp(userData, message) {
    const lower = message.toLowerCase();
    
    // If user wants to continue or has questions
    if (lower.includes('yes') || lower.includes('haan') || lower.includes('ha') || lower.includes('premium') || lower.includes('guide')) {
      return {
        message: this.getPremiumPlanMessage(),
        nextStep: this.STEP.PREMIUM_PLAN,
        userData: { ...userData, flowStep: this.STEP.PREMIUM_PLAN }
      };
    }
    
    if (lower.includes('no') || lower.includes('nahi') || lower.includes('na') || lower.includes('basic') || lower.includes('done')) {
      return {
        message: `Perfect! ${userData.name} bhai, all the best for your fitness journey 💪

Koi bhi time help chahiye toh message kar sakte hain!

Stay fit, stay healthy! 🙏🔥`,
        nextStep: this.STEP.FOLLOW_UP,
        userData: { ...userData, flowStep: this.STEP.FOLLOW_UP }
      };
    }

    // Default follow up message
    return {
      message: `Bhai ready ho transformation ke liye? Main help karne ke liye yahin hoon 💪

Koi question ho toh pooch sakte hain!`,
      nextStep: this.STEP.FOLLOW_UP,
      userData: userData
    };
  }

  // Handle steroids question - never recommend
  handleSteroidsQuestion() {
    return `Bhai steroids lena bilkul safe nahi hai! 💉

Natural training aur proper diet se hi best results milte hain.

Maine aapko proper guidance dekar natural transformation kara sakta hoon. 

Kya aap proper diet aur workout se transformation chahiye? 🙏`;
  }

  // Check if user is asking about steroids
  isSteroidsQuestion(message) {
    return message.includes('steroid') || message.includes('anabolic') || message.includes('dbol') || 
           message.includes('testosterone') || message.includes('creatine') || message.includes('supplement');
  }
}

module.exports = new FitnessFlow();
const conversationStore = require('./conversationStore');
const config = require('./config');

/**
 * Elite Intent Handler - Hinglish patterns for WhatsApp Fitness Coach
 */
class IntentHandler {
  constructor() {
    this.greetingPatterns = [
      /^(hi|hello|hey|hii+|helo|namaste|namaskar|kya hal|kaise ho|sup)[\s!.]*$/i,
      /^(bhai|bro|dost|coach|sir|guru|ji)[\s!.]*$/i,
    ];

    this.farewellPatterns = [
      /^(bye|goodbye|alvida|tata|ok bye|thanks|dhanyawad|shukriya)[\s!.]*$/i,
    ];

    // Enhanced fitness goals (Hinglish)
    this.fitnessGoalPatterns = [
      /fat\s*(loss|kam)|pet|motapa|patla|slim|belly fat|weight kam|vajan kam/i,
      /muscle|gym|body bana|bulk|dola|gain|strength|takat|bicep|abs|six pack/i,
      /transform|fit ho|healthy|stamina|body building/i,
      /weight gain|dubla|skinny|patla hoon/i,
    ];

    // Diet (Hinglish)
    this.dietPatterns = [
      /diet|kya khau|khana|meal|breakfast|lunch|dinner|protein|calorie|carb/i,
      /veg|non veg|eggitarian|chicken|paneer|anda|supplement/i,
      /budget diet|sasta khana|ghar ka khana/i,
    ];

    // Workout
    this.workoutPatterns = [
      /workout|kasrat|exercise|routine|gym|push up|squat|plank|cardio/i,
      /home workout|ghar pe|sets|reps|form/i,
    ];

    // Sales triggers (HOT LEADS)
    this.salesPatterns = [
      /plan chahiye|personal coach|coaching|serious hoon|transform hona|body banana|fat lose|help chahiye/i,
      /custom|personal trainer|hire|join|enroll|kitna lagega/i,
    ];

    // Pricing
    this.subscriptionPatterns = [
      /price|cost|rate|kitna|rupee|₹|fees|charges|payment/i,
      /premium|paid|package|offer|discount/i,
    ];

    // Anabolic keywords
    this.anabolicPatterns = [
      /steroid|anabolic|test|trt|cycle|gear|pct|inject|bloodwork/i,
    ];

    // Medical
    this.medicalPatterns = [
      /thyroid|diabetes|bp|pcod|pain|injury|doctor/i,
    ];

    // Photo/progress
    this.photoPatterns = [
      /photo|pic|image|progress|before after|send photo/i,
    ];

    this.menuPatterns = [/menu|main|options|list/i];
  }

  detectIntent(userId, message) {
    const trimmedMsg = message.trim().toLowerCase();

    // Priority: Sales > Anabolic > Goals > etc.
    if (this.salesPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'sales_trigger',
        context: 'HOT LEAD! User shows buying intent. Switch to premium sales mode immediately. Use ethical upselling with exact pricing from config.'
      };
    }

    if (this.anabolicPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'anabolic',
        context: 'ANABOLIC QUERY. Educate professionally: risks, bloodwork, PCT, harm reduction. Strongly recommend natural training + doctor supervision first.'
      };
    }

    if (this.photoPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'photo_request',
        context: 'User mentioning photos. If premium, analyze next photo. Ask for front/side/back pose. Guide on lighting/angle.'
      };
    }

    if (this.subscriptionPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'subscription',
        context: 'Pricing question. Show premium services clearly. Highlight value. Guide to UPI payment.'
      };
    }

    if (this.fitnessGoalPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'fitness_goal',
        context: 'Fitness goal detected. SERIOUS user. Start 12-point analysis flow if not complete. Offer personalized premium plan.'
      };
    }

    if (this.dietPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'diet_inquiry',
        context: 'Diet question. Give short FREE tip + ask veg/budget if unknown. Upsell custom diet chart.'
      };
    }

    if (this.workoutPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'workout_inquiry',
        context: 'Workout question. Basic 3-exercise routine + ask gym/home. Upsell full coaching.'
      };
    }

    if (this.menuPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'menu',
        context: 'User wants menu. Send MAIN_MENU text.'
      };
    }

    if (this.greetingPatterns.some(p => p.test(trimmedMsg))) {
      return {
        intent: 'greeting',
        context: 'Welcome back/motivate. Ask current status or goal.'
      };
    }

    return {
      intent: 'general',
      context: 'General fitness chat. Give value, detect opportunity to upsell/analyze.'
    };
  }

  enhanceMessage(userId, message) {
    const { intent, context } = this.detectIntent(userId, message);
    const enhanced = `[INTENT: ${intent.intent}] [CONTEXT: ${context}]\n\nUser: ${message}`;
    return { enhanced, intent };
  }
}

module.exports = new IntentHandler();


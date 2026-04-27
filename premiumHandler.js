const config = require('./config');
const userStore = require('./userStore');
const aiService = require('./aiService');

/**
 * Premium Handler - Reports, Upsells, Retention
 */
class PremiumHandler {
  // Generate full CLIENT FITNESS REPORT
  static generateReport(phone) {
    const userData = userStore.getUser(phone);
    
    if (!userData.analysis_complete) {
      return 'Pehle full analysis complete kar premium report ke liye! Start karne ke liye goal bata.';
    }

    const report = `*CLIENT FITNESS REPORT* 🔥

Name: ${userData.name || 'N/A'}
Age: ${userData.age || 'N/A'} years
Height: ${userData.height || 'N/A'} cm
Current Weight: ${userData.weight || 'N/A'} kg
Target Weight: ${userData.target_weight || 'N/A'} kg
Timeline: ${userData.timeline || 'N/A'} months

Goal: ${userData.goal || 'N/A'}
Veg/Non-Veg: ${userData.veg_nonveg || 'N/A'}
Food Budget: ₹${userData.food_budget || 'N/A'}/month
Gym/Home: ${userData.gym_home || 'N/A'}
Schedule: ${userData.schedule || 'N/A'}
Medical: ${userData.medical || 'None'}
Experience: ${userData.experience || 'N/A'}

*Metabolism Estimate:* BMR ~${this.calculateBMR(userData)} cal
*Calorie Range:* ${this.calculateCalories(userData)}
*Protein Target:* ${this.calculateProtein(userData)}g/day

*Recommended Plan Overview:*
1. Training: ${this.suggestTraining(userData)}
2. Nutrition: ${this.suggestDiet(userData)}
3. Supplements: Basic whey + multi (budget depending)
4. Progress Tracking: Weekly weight + photos

${userData.premium_status ? 'Continue crushing! Update progress.' : 'Ye overview hai. FULL detailed plan premium mein! 💪'}

*Best Package for you:* ${this.suggestPackage(userData)}`;

    return report;
  }

  static calculateBMR(userData) {
    // Harris-Benedict simplified
    const weight = parseFloat(userData.weight) || 70;
    const height = parseFloat(userData.height) || 170;
    const age = parseInt(userData.age) || 25;
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  }

  static calculateCalories(userData) {
    const bmr = this.calculateBMR(userData);
    const goal = userData.goal?.toLowerCase() || '';
    if (goal.includes('loss')) return `${bmr * 0.8}-${bmr * 0.9}`;
    if (goal.includes('gain')) return `${bmr * 1.1}-${bmr * 1.2}`;
    return `${bmr * 0.9}-${bmr * 1.1}`;
  }

  static calculateProtein(userData) {
    const weight = parseFloat(userData.weight) || 70;
    return Math.round(weight * (userData.goal?.includes('gain') ? 2.2 : 1.8));
  }

  static suggestTraining(userData) {
    const gym = userData.gym_home?.toLowerCase();
    if (gym?.includes('gym')) return '4x/week split: Push/Pull/Legs/Rest';
    return '3x/week full body home workouts';
  }

  static suggestDiet(userData) {
    const veg = userData.veg_nonveg?.toLowerCase();
    if (veg?.includes('veg')) return 'Paneer/Dal/Soya + rice/roti';
    return 'Chicken/Eggs + rice/roti';
  }

  static suggestPackage(userData) {
    if (userData.goal?.includes('diet') || !userData.gym_home) {
      return `${config.SERVICES.CUSTOM_DIET.price} - Custom Diet Chart`;
    }
    return `${config.SERVICES.FULL_COACHING.price} - Complete Monthly Coaching`;
  }

  // Weekly retention message
  static getRetentionMessage(phone) {
    const user = userStore.getUser(phone);
    return `*Weekly Check-in bhai! 💪*

Current weight kitna? 
Energy level? (1-10)
Sleep hours?
Diet kitna % follow kiya?
Photos bhej (front/side)?

Update kar, plan adjust karte hain!`;
  }

  // Upsell script
  static getUpsellScript(intent) {
    return `Bro tu serious lag raha hai 🔥

Random tips se nahi, *proper strategy* chahiye.

*Mere Premium Options:*
1. Custom Diet Chart = ${config.SERVICES.CUSTOM_DIET.price}
2. Monthly Nutrition = ${config.SERVICES.NUTRITION_SUPPORT.price}
3. Full Coaching = ${config.SERVICES.FULL_COACHING.price}

Sach mein result chahiye to personally guide karunga.
UPI ready? Payment link: ${config.UPI_LINK}

Kaunsa package? Reply kar!`;
  }

  // Payment confirmation
  static confirmPayment(phone, amount, service, proof) {
    userStore.setPremiumStatus(phone, true, service, proof);
    return `Payment confirmed! ✅ 

Tu ab mera *premium client* hai bhai.
Aaj se full support - diet, workout, weekly checkins.

*Next:* Photos bhej current status ke liye.
Start karte hain transformation! 🔥`;
  }
}

module.exports = PremiumHandler;


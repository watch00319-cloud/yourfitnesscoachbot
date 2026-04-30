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
    const template = config.CLIENT_REPORT_TEMPLATE;
    
    if (!userData.analysis_complete) {
      return 'Pehle full analysis complete kar premium report ke liye! Start karne ke liye goal bata.';
    }

    const bmr = this.calculateBMR(userData);
    const calories = this.calculateCalories(userData);
    const protein = this.calculateProtein(userData);
    const workoutType = this.suggestTraining(userData);

    const report = `*CLIENT FITNESS REPORT* 🔥

${template.fields[0]} ${userData.name || 'N/A'}
${template.fields[1]} ${userData.goal || 'N/A'}
${template.fields[2]} ${userData.weight || 'N/A'}kg
${template.fields[3]} ${userData.target_weight || 'N/A'}kg
${template.fields[4]} ${userData.timeline || 'N/A'} months
${template.fields[5]} [AI Analysis: e.g. Slow metabolism, weak core]
${template.fields[6]} ${calories}
${template.fields[7]} ${protein}g
${template.fields[8]} ${workoutType}
${template.fields[9]} ${this.suggestPackage(userData)}

Next Step:
${template.nextStep}`;

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
    return `*Weekly Check-in*

- Current weight?
- Energy level?
- Diet follow hui?
- Workout done?
- Sleep kaisa hai?
- Updated photo bhejo

Update bhej dijiye, plan adjust karte hain.`;
  }

  // Upsell script
  static getUpsellScript(intent) {
    return `You seem serious about your goal.

Random advice often misses the details that matter, like your weight, routine, food preference, schedule, and medical history.

With professional guidance, you get:
• A plan matched to your body and goal
• Diet and workout adjustments as you progress
• Clear follow-up instead of guessing

Paid options are available when you are ready:
• Custom Diet Chart: ${config.SERVICES.CUSTOM_DIET.price}
• Monthly Nutrition Support: ${config.SERVICES.NUTRITION_SUPPORT.price}
• Full Personal Coaching: ${config.SERVICES.FULL_COACHING.price}

I will still guide you here step by step.`;
  }

  // Payment confirmation
  static confirmPayment(phone, amount, service, proof) {
    userStore.setPremiumStatus(phone, true, service, proof);
    return `Payment received.

Your transformation support starts now.`;
  }
  static getFollowupMessage() {
    return `Results come from consistent action.

Share your latest weight, diet, and workout status so I can guide the next step.`;
  }

}

module.exports = PremiumHandler;



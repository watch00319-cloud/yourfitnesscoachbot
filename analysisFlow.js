const userStore = require('./userStore');
const conversationStore = require('./conversationStore');
const userStates = require('./whatsapp'); // Global states from main

const ANALYSIS_QUESTIONS = {
  0: '1. Apna naam bata bhai?',
  1: '2. Age kitni hai?',
  2: '3. Height cm mein? (e.g. 170)',
  3: '4. Current weight kg? (e.g. 75)',
  4: '5. Main goal kya? (fat loss / muscle gain / strength / contest prep)',
  5: '6. Target weight kitna karna hai?',
  6: '7. Timeline? (kitne mahine/mehine)',
  7: '8. Veg / Non-veg / Eggitarian?',
  8: '9. Monthly food budget kitna? (e.g. 4000-6000)',
  9: '10. Gym jaata hai ya home workout?',
  10: '11. Daily schedule? (job time, sleep time)',
  11: '12. Koi medical issue? (thyroid, BP, injury etc)',
  12: '13. Experience level? (beginner / intermediate / advanced)'
};

/**
 * Start analysis for serious users
 */
function startAnalysis(phone) {
  conversationStore.resetAnalysis(phone);
  userStates.set(phone, { step: 0 }); // Global state
  return ANALYSIS_QUESTIONS[0];
}

/**
 * Handle analysis response
 */
async function handleAnalysisResponse(phone, response) {
  const state = userStates.get(phone);
  if (!state) return 'Analysis start karne ke liye goal bata!';

  // Save response
  const field = `step_${state.step}`;
  userStore.setUser(phone, { [field]: response });

  // Next step
  const nextStep = state.step + 1;
  conversationStore.updateAnalysisStep(phone, nextStep);
  
  if (nextStep >= 13) {
    userStates.delete(phone);
    userStore.setUser(phone, { analysis_complete: true });
    return 'Perfect bhai! Full profile save ho gaya. Ab premium report bana raha hu... 🔥';
  }

  userStates.set(phone, { step: nextStep });
  return ANALYSIS_QUESTIONS[nextStep];
}

/**
 * Check if should start analysis
 */
function shouldStartAnalysis(phone, intent) {
  const user = userStore.getUser(phone);
  const conv = conversationStore.getConversation(phone);
  
  return (intent.intent === 'fitness_goal' || intent.intent === 'sales_trigger') &&
         !user.analysis_complete &&
         conv.userData.analysis_step === 0;
}

module.exports = {
  startAnalysis,
  handleAnalysisResponse,
  shouldStartAnalysis,
  ANALYSIS_QUESTIONS
};


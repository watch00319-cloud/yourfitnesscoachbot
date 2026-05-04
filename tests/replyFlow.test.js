const assert = require('assert');

process.env.GEMINI_API_KEY = '';

const aiService = require('../aiService');
const conversationStore = require('../conversationStore');
const premiumHandler = require('../premiumHandler');

async function testFirstGreetingUsesExactOpeningMessage() {
  const reply = await aiService.generateReply('test-user-opening', 'hi', {
    _isNewUser: true,
    lastActive: Date.now()
  });

  assert.strictEqual(
    reply,
    'Tell me your goal:\n• Weight loss?\n• Muscle gain?\n• Better diet?\n• Full transformation?\n\nProfessional guidance available.'
  );
}

async function testPlanQuestionDoesNotSellTooEarly() {
  const reply = await aiService.generateReply('test-user-early-plan', 'plan chahiye', {
    _canOfferPaid: false,
    lastActive: Date.now()
  });

  assert(!/₹|paid options|custom diet chart|monthly nutrition|full personal coaching/i.test(reply));
  assert(/name/i.test(reply));
  assert(/activity level/i.test(reply));
  assert(/food preference/i.test(reply));
}

function testPremiumPitchWaitsForMeaningfulExchanges() {
  const userId = `test-user-${Date.now()}`;

  conversationStore.addMessage(userId, 'user', 'fat loss');

  assert.strictEqual(conversationStore.canPitchPremium(userId), false);

  conversationStore.addMessage(userId, 'assistant', 'Great choice...');
  conversationStore.addMessage(userId, 'user', '80 kg');
  conversationStore.addMessage(userId, 'assistant', 'Thanks...');
  conversationStore.addMessage(userId, 'user', 'age 28');
  conversationStore.addMessage(userId, 'assistant', 'Good...');
  conversationStore.addMessage(userId, 'user', 'I am serious, need plan');

  assert.strictEqual(conversationStore.canPitchPremium(userId), true);
}

function testUpsellToneIsProfessional() {
  const reply = premiumHandler.getUpsellScript('fitness_goal');

  assert(!/\bbro\b/i.test(reply));
  assert(!/🔥|💪/.test(reply));
  assert(!/UPI ready/i.test(reply));
}

async function run() {
  await testFirstGreetingUsesExactOpeningMessage();
  await testPlanQuestionDoesNotSellTooEarly();
  testPremiumPitchWaitsForMeaningfulExchanges();
  testUpsellToneIsProfessional();
  console.log('reply flow tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

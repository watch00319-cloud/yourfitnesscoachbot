const assert = require('assert');

process.env.GEMINI_API_KEY = '';

const aiService = require('../aiService');
const { parseFitnessDetails } = require('../profileParser');

function testParsesWeightAndHeight() {
  const details = parseFitnessDetails('Weight 104 kg height 5feet 11 inch');

  assert.strictEqual(details.weight, '104');
  assert.strictEqual(details.height, `5'11"`);
}

async function testAcknowledgesWeightHeightAndAsksNextQuestion() {
  const reply = await aiService.generateReply('test-user-profile', 'Weight 104 kg height 5feet 11 inch', {
    lastActive: Date.now(),
    weight: '104',
    height: `5'11"`
  });

  assert(reply.includes(`104 kg`));
  assert(reply.includes(`5'11"`));
  assert(/age and gender/i.test(reply));
  assert(!/current weight and height/i.test(reply));
}

async function testDoesNotRepeatWeightHeightAfterGoalWhenSaved() {
  const reply = await aiService.generateReply('test-user-goal-saved-profile', 'weight loss', {
    lastActive: Date.now(),
    goal: 'Weight loss',
    weight: '104',
    height: `5'11"`
  });

  assert(/weight loss/i.test(reply));
  assert(/age and gender/i.test(reply));
  assert(!/current weight and height/i.test(reply));
}

async function run() {
  testParsesWeightAndHeight();
  await testAcknowledgesWeightHeightAndAsksNextQuestion();
  await testDoesNotRepeatWeightHeightAfterGoalWhenSaved();
  console.log('profile flow tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

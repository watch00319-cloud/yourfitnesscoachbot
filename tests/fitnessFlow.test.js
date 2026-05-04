const assert = require('assert');
const fitnessFlow = require('../fitnessFlow');
const userStore = require('../userStore');
const conversationStore = require('../conversationStore');

const TEST_USER_ID = 'test-fitness-flow-user';

function resetTestUser() {
  delete userStore.users[TEST_USER_ID];
  conversationStore.conversations.delete(TEST_USER_ID);
}

function testWelcomeMessage() {
  resetTestUser();

  const result = fitnessFlow.processFlow({}, 'hi');

  assert.strictEqual(result.nextStep, fitnessFlow.STEP.GOAL);
  assert(result.message.includes('Welcome to Our Fitness Family'));
  assert(result.message.includes('Weight Loss'));
  assert(result.message.includes('Weight Gain'));
  assert(result.message.includes('Muscle Gain'));
}

function testGoalRecognition() {
  resetTestUser();

  const result = fitnessFlow.processFlow({ flowStep: fitnessFlow.STEP.GOAL }, 'fat loss');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.NAME);
  assert.strictEqual(result.userData.goal, 'Weight Loss');
}

function testPremiumQuestionStartsFreeAssessment() {
  resetTestUser();

  const result = fitnessFlow.processFlow({}, 'premium plan kya hai');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.NAME);
  assert.strictEqual(result.userData.premiumAskedEarly, true);
  assert(!/₹499|₹1999|₹2999|₹3999/.test(result.message));
}

function testCollectionCapturesMissingFieldsThroughMedicalCondition() {
  resetTestUser();

  let userData = { flowStep: fitnessFlow.STEP.NAME, premiumAskedEarly: true };
  let result = fitnessFlow.processFlow(userData, 'Rahul');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.AGE);
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, '28');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.GENDER);
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'male');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.HEIGHT);
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, '172 cm');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.WEIGHT);
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, '78 kg');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.GOAL);
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'muscle gain');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.ACTIVITY_LEVEL);
  assert.strictEqual(result.userData.goal, 'Muscle Gain');
  assert(/activity level/i.test(result.message));
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'moderate');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.FOOD_PREFERENCE);
  assert(/veg|non-veg/i.test(result.message));
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'non veg');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.MEDICAL_CONDITION);
  userData = { ...userData, ...result.userData };

  result = fitnessFlow.processFlow(userData, 'no medical condition');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.FREE_PLAN);
  assert.strictEqual(result.userData.freePlanDelivered, true);
  assert.strictEqual(result.userData.medicalCondition, 'No medical condition');
}

function testNoRepeatedQuestionsSkipsCompletedFields() {
  resetTestUser();

  const userData = {
    flowStep: fitnessFlow.STEP.WELCOME,
    name: 'Rahul',
    age: '28',
    gender: 'Male'
  };

  const result = fitnessFlow.processFlow(userData, 'what should I do next?');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.HEIGHT);
  assert(!/name/i.test(result.message));
  assert(!/age/i.test(result.message));
  assert(!/gender/i.test(result.message));
  assert(/height/i.test(result.message));
}

function testFreePlanIncludesStructuredMealsAndPremiumCTA() {
  resetTestUser();

  const result = fitnessFlow.processFlow({
    flowStep: fitnessFlow.STEP.MEDICAL_CONDITION,
    name: 'Rahul',
    age: '28',
    gender: 'Male',
    height: '172 cm',
    weight: '78',
    goal: 'Muscle Gain',
    activityLevel: 'Moderate',
    foodPreference: 'Non-Veg'
  }, 'no issues');

  assert(result.message.includes('Client Profile'));
  assert(result.message.includes('Morning (Empty Stomach)'));
  assert(result.message.includes('Breakfast'));
  assert(result.message.includes('Mid-Morning Snack'));
  assert(result.message.includes('This is our FREE BASIC PLAN.'));
  assert(result.message.includes('type 👉 PREMIUM'));
}

function testPremiumKeywordAfterFreePlanShowsAllFourOffers() {
  resetTestUser();

  const result = fitnessFlow.processFlow({
    flowStep: fitnessFlow.STEP.FOLLOW_UP,
    freePlanDelivered: true
  }, 'PREMIUM');

  assert.strictEqual(result.nextStep, fitnessFlow.STEP.PREMIUM_PLAN);
  assert(result.message.includes('Monthly Diet Plan – ₹499'));
  assert(result.message.includes('Premium Transformation – ₹1999/month'));
  assert(result.message.includes('Personal Trainer'));
  assert(result.message.includes('Special Guidance Plan'));
  assert(result.message.includes('Intermediate Plan – ₹1499'));
  assert(result.message.includes('Pro Plan – ₹2999'));
}

function testWorkoutQuestionUsesGoalBasedGuidance() {
  resetTestUser();

  const result = fitnessFlow.processFlow({
    goal: 'Weight Loss',
    flowStep: fitnessFlow.STEP.FOLLOW_UP,
    freePlanDelivered: true
  }, 'exercise kaise karu');

  assert(/walking|squats|push-ups|plank/i.test(result.message));
}

function testSteroidsQuestion() {
  resetTestUser();

  const isSteroids = fitnessFlow.isSteroidsQuestion('should I take steroids?');
  assert.strictEqual(isSteroids, true);

  const isNotSteroids = fitnessFlow.isSteroidsQuestion('how to lose weight?');
  assert.strictEqual(isNotSteroids, false);

  const response = fitnessFlow.handleSteroidsQuestion();
  assert(/steroids/i.test(response));
  assert(/natural/i.test(response));
}

async function run() {
  try {
    console.log('Running fitness flow tests...');
    testWelcomeMessage();
    testGoalRecognition();
    testPremiumQuestionStartsFreeAssessment();
    testCollectionCapturesMissingFieldsThroughMedicalCondition();
    testNoRepeatedQuestionsSkipsCompletedFields();
    testFreePlanIncludesStructuredMealsAndPremiumCTA();
    testPremiumKeywordAfterFreePlanShowsAllFourOffers();
    testWorkoutQuestionUsesGoalBasedGuidance();
    testSteroidsQuestion();
    console.log('fitness flow tests passed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

run();

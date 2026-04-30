const assert = require('assert');
const fitnessFlow = require('../fitnessFlow');
const userStore = require('../userStore');
const conversationStore = require('../conversationStore');

// Test user ID
const TEST_USER_ID = 'test-fitness-flow-user';

function resetTestUser() {
  // Clear user data and conversation history
  delete userStore.users[TEST_USER_ID];
  conversationStore.conversations.delete(TEST_USER_ID);
}

function testWelcomeMessage() {
  resetTestUser();
  
  const result = fitnessFlow.processFlow({}, 'hi');
  
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.GOAL);
  assert(result.message.includes('Welcome to Loving Hubby Fitness Family'));
  assert(result.message.includes('Aapka goal kya hai?'));
  assert(result.message.includes('Fat loss'));
  assert(result.message.includes('Weight gain'));
  assert(result.message.includes('Muscle gain'));
  assert(result.message.includes('Strength'));
  assert(result.message.includes('General fitness'));
}

function testGoalRecognition() {
  resetTestUser();
  
  // Test weight loss goal
  let result = fitnessFlow.processFlow({ flowStep: fitnessFlow.STEP.GOAL }, 'fat loss');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.NAME);
  assert(result.message.includes('Great choice'));
  assert(result.message.includes('Fat loss'));
  
  // Test muscle gain goal
  resetTestUser();
  result = fitnessFlow.processFlow({ flowStep: fitnessFlow.STEP.GOAL }, 'muscle gain');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.NAME);
  assert(result.message.includes('Great choice'));
  assert(result.message.includes('Muscle gain'));
}

function testDataCollectionWithoutRepeats() {
  resetTestUser();
  
  let userData = { flowStep: fitnessFlow.STEP.NAME };
  let result;
  
  // Test name collection
  result = fitnessFlow.processFlow(userData, 'rahul');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.AGE);
  assert(result.userData.name === 'rahul');
  
  // Update userData with the result
  userData = { ...userData, ...result.userData };
  
  // Test age collection
  result = fitnessFlow.processFlow(userData, '28');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.GENDER);
  assert(result.userData.age === '28');
  
  // Update userData with the result
  userData = { ...userData, ...result.userData };
  
  // Test gender collection
  result = fitnessFlow.processFlow(userData, 'male');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.WEIGHT);
  assert(result.userData.gender === 'Male');
  
  // Update userData with the result
  userData = { ...userData, ...result.userData };
  
  // Test weight collection
  result = fitnessFlow.processFlow(userData, '80 kg');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.HEIGHT);
  assert(result.userData.weight === '80');
  
  // Update userData with the result
  userData = { ...userData, ...result.userData };
  
  // Test height collection
  result = fitnessFlow.processFlow(userData, '5\'11"');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.TIMELINE);
  console.log('Actual height value:', JSON.stringify(result.userData.height));
  assert(result.userData.height === '5\'11"');
  
  // Update userData with the result
  userData = { ...userData, ...result.userData };
  
  // Test timeline collection
  result = fitnessFlow.processFlow(userData, '3 months');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.WORKOUT_TYPE);
  assert(result.userData.timeline === '3 months');
  
  // Update userData with the result
  userData = { ...userData, ...result.userData };
  
  // Test workout type collection
  result = fitnessFlow.processFlow(userData, 'gym');
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.PLAN_SELECTION);
  assert(result.userData.workoutType === 'Gym');
}

function testNoRepeatedQuestions() {
  resetTestUser();
  
  let userData = {
    flowStep: fitnessFlow.STEP.NAME,
    name: 'rahul',
    age: '28',
    gender: 'Male'
  };
  
  // If user already provided name, age, and gender, bot should NOT ask for them again
  let result = fitnessFlow.processFlow(userData, 'what should I do next?');
  
  // The response should NOT ask for name, age, or gender
  assert(!result.message.includes('name'));
  assert(!result.message.includes('age'));
  assert(!result.message.includes('gender'));
  
  // It should ask for the next missing piece of information
  assert(result.message.includes('weight'));
}

function testPlanSelection() {
  resetTestUser();
  
  // Create a user with all required data
  const userData = {
    flowStep: fitnessFlow.STEP.PLAN_SELECTION,
    name: 'rahul',
    age: '28',
    gender: 'Male',
    weight: '80',
    height: '5\'11"',
    goal: 'Fat loss',
    timeline: '3 months',
    workoutType: 'Gym'
  };
  
  const result = fitnessFlow.processFlow(userData, 'what plans do you have?');
  
  assert.strictEqual(result.nextStep, fitnessFlow.STEP.BASIC_PLAN);
  assert(result.message.includes('Choose Plan'));
  assert(result.message.includes('Basic Free Plan'));
  assert(result.message.includes('Premium Guide Plan'));
}

function testBasicPlan() {
  resetTestUser();
  
  const userData = {
    flowStep: fitnessFlow.STEP.BASIC_PLAN,
    name: 'rahul',
    age: '28',
    gender: 'Male',
    weight: '80 kg',
    height: '5 feet 11 inch',
    goal: 'Fat loss',
    timeline: '3 months',
    workout_type: 'gym'
  };
  
  const result = fitnessFlow.processFlow(userData, 'tell me about basic plan');
  
  assert(result.message.includes('Basic Free Plan'));
  assert(result.message.includes('Basic Diet Tips'));
  assert(result.message.includes('Basic Workout Tips'));
  assert(result.message.includes('Basic Water Intake'));
  assert(result.message.includes('Basic Exercise Schedule'));
  assert(result.message.includes('Motivation Tips'));
}

function testPremiumPlan() {
  resetTestUser();
  
  const userData = {
    flowStep: fitnessFlow.STEP.PREMIUM_PLAN,
    name: 'rahul',
    age: '28',
    gender: 'Male',
    weight: '80',
    height: '5\'11"',
    goal: 'Fat loss',
    timeline: '3 months',
    workout_type: 'gym'
  };
  
  const result = fitnessFlow.processFlow(userData, 'tell me about premium plans');
  
  assert(result.message.includes('Diet Plans'));
  assert(result.message.includes('Workout Plans'));
  assert(result.message.includes('Women Special Plans'));
  assert(result.message.includes('VIP Personal Coaching'));
  assert(result.message.includes('₹499'));
  assert(result.message.includes('₹1999'));
}

function testSteroidsQuestion() {
  resetTestUser();
  
  const isSteroids = fitnessFlow.isSteroidsQuestion('should I take steroids?');
  assert.strictEqual(isSteroids, true);
  
  const isNotSteroids = fitnessFlow.isSteroidsQuestion('how to lose weight?');
  assert.strictEqual(isNotSteroids, false);
  
  const response = fitnessFlow.handleSteroidsQuestion();
  assert(response.includes('steroids'));
  assert(response.includes('natural'));
  assert(response.includes('professional guidance'));
}

async function run() {
  try {
    console.log('Running fitness flow tests...');
    
    testWelcomeMessage();
    console.log('✅ Welcome message test passed');
    
    testGoalRecognition();
    console.log('✅ Goal recognition test passed');
    
    testDataCollectionWithoutRepeats();
    console.log('✅ Data collection without repeats test passed');
    
    testNoRepeatedQuestions();
    console.log('✅ No repeated questions test passed');
    
    testPlanSelection();
    console.log('✅ Plan selection test passed');
    
    testBasicPlan();
    console.log('✅ Basic plan test passed');
    
    testPremiumPlan();
    console.log('✅ Premium plan test passed');
    
    testSteroidsQuestion();
    console.log('✅ Steroids question test passed');
    
    console.log('\n🎉 All fitness flow tests passed!');
    console.log('The bot correctly handles: hi → goal → data → premium flow without repeating questions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

run();
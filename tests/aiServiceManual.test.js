const aiService = require('..\/aiService');

async function run() {
  console.log('\n== aiService Manual Test ==\n');

  const cases = [
    {label: 'First contact (hi)', from: 'user1', msg: 'hi', userData: {}},
    {label: 'Goal reply (lose weight)', from: 'user1', msg: 'I want to lose weight', userData: { lastActive: Date.now() }},
    {label: 'Early premium question', from: 'user1', msg: 'How much is the premium plan?', userData: { lastActive: Date.now() }},
    {label: 'Profile update', from: 'user1', msg: 'Weight 80 kg height 172 cm', userData: { lastActive: Date.now() }},
    {label: 'Workout question (exercise kaise karu)', from: 'user1', msg: 'exercise kaise karu', userData: { lastActive: Date.now(), goal: 'Weight Loss' }}
  ];

  for (const c of cases) {
    try {
      const out = await aiService.generateReply(c.from, c.msg, c.userData);
      console.log(`-- ${c.label} --`);
      console.log(out);
      console.log('\n');
    } catch (err) {
      console.error(`Error running case ${c.label}:`, err.message);
    }
  }
}

run().catch(e => console.error(e));

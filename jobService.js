const userStore = require('./userStore');

class JobService {
  constructor() {
    this.STEP = {
      START: 'job_start',
      ROLE: 'job_role',
      EXPERIENCE: 'job_experience',
      LOCATION: 'job_location',
      CONTACT: 'job_contact',
      DONE: 'job_done'
    };
  }

  processFlow(userId, text) {
    const user = userStore.getUser(userId) || {};
    const step = user.jobStep || this.STEP.START;
    const msg = text.trim();

    switch (step) {
      case this.STEP.START:
        userStore.setUser(userId, { jobStep: this.STEP.ROLE });
        return { reply: 'Chalo, batao kaunsa role chahiye — example: Sales, Delivery, Data Entry, Developer. Main aapke liye options dhoondhunga.', done: false };

      case this.STEP.ROLE:
        userStore.setUser(userId, { jobRole: msg, jobStep: this.STEP.EXPERIENCE });
        return { reply: `Achha — role set hogaya: *${msg}*.
Kitne saal ka experience hai aapka is role mein? (example: 1 year, 3 years)`, done: false };

      case this.STEP.EXPERIENCE:
        userStore.setUser(userId, { jobExperience: msg, jobStep: this.STEP.LOCATION });
        return { reply: `Perfect. Experience noted: *${msg}*.
Ab batao — kis shehar ya area mein kaam chahiye aapko?`, done: false };

      case this.STEP.LOCATION:
        userStore.setUser(userId, { jobLocation: msg, jobStep: this.STEP.CONTACT });
        return { reply: `Got it — location: *${msg}*.
Ab final step: apna contact share karo (WhatsApp number ya email) taaki hum follow up kar saken.`, done: false };

      case this.STEP.CONTACT:
        userStore.setUser(userId, { jobContact: msg, jobStep: this.STEP.DONE });
        return { reply: `Shukriya! Hum aapke liye best matches dhoondhenge aur jaldi contact karenge. Agar aur kuch add karna ho, abhi bata sakte ho.`, done: true };

      default:
        userStore.setUser(userId, { jobStep: this.STEP.ROLE });
        return { reply: 'Chalo start karte hain. Kaunsa role chahiye aapko?', done: false };
    }
  }
}

module.exports = new JobService();

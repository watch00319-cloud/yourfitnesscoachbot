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
        return { reply: 'Kya role chahiye aapko? (example: Sales, Delivery, Data entry, Developer)', done: false };

      case this.STEP.ROLE:
        userStore.setUser(userId, { jobRole: msg, jobStep: this.STEP.EXPERIENCE });
        return { reply: `Achha — role: ${msg}. Kitne saal ka experience hai aapka?`, done: false };

      case this.STEP.EXPERIENCE:
        userStore.setUser(userId, { jobExperience: msg, jobStep: this.STEP.LOCATION });
        return { reply: `Got it. Aap kis shehar mein kaam karna chahte ho?`, done: false };

      case this.STEP.LOCATION:
        userStore.setUser(userId, { jobLocation: msg, jobStep: this.STEP.CONTACT });
        return { reply: `Share your preferred contact (WhatsApp number or email) so we can follow up.`, done: false };

      case this.STEP.CONTACT:
        userStore.setUser(userId, { jobContact: msg, jobStep: this.STEP.DONE });
        return { reply: `Thanks — hum aapko best matches bhej denge jaldi. Koi aur madad chahiye?`, done: true };

      default:
        userStore.setUser(userId, { jobStep: this.STEP.ROLE });
        return { reply: 'Chalo start karte hain. Kaunsa role chahiye aapko?', done: false };
    }
  }
}

module.exports = new JobService();

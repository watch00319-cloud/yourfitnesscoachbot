const fs = require('fs');
const path = require('path');

class JobStore {
  constructor(file = './job-submissions.json') {
    this.file = path.resolve(file);
    this.submissions = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.file)) return JSON.parse(fs.readFileSync(this.file, 'utf8')) || [];
    } catch (err) {
      console.warn('JobStore load error', err.message);
    }
    return [];
  }

  save() {
    try {
      fs.writeFileSync(this.file, JSON.stringify(this.submissions, null, 2));
    } catch (err) {
      console.error('JobStore save error', err.message);
    }
  }

  addSubmission(submission) {
    submission._id = Date.now() + Math.floor(Math.random() * 1000);
    submission.createdAt = new Date().toISOString();
    this.submissions.unshift(submission);
    // keep only last 200
    this.submissions = this.submissions.slice(0, 200);
    this.save();
    return submission;
  }

  getRecent(limit = 50) {
    return this.submissions.slice(0, limit);
  }
}

module.exports = new JobStore();

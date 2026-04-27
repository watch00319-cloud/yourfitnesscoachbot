const fs = require('fs');
const path = require('path');

class UserStore {
  constructor(dataFile = './user-data.json') {
    this.dataFile = path.resolve(dataFile);
    this.users = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dataFile)) {
        return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      }
    } catch (err) {
      console.warn('UserStore load error:', err.message);
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.users, null, 2));
    } catch (err) {
      console.error('UserStore save error:', err.message);
    }
  }

  getUser(chatId) {
    return this.users[chatId] || {};
  }

  setUser(chatId, data) {
    this.users[chatId] = { ...this.getUser(chatId), ...data, lastActive: Date.now() };
    this.save();
  }

  updateStreak(chatId) {
    const user = this.getUser(chatId);
    const today = new Date().toDateString();
    if (user.lastActiveDate === today) return user.streak || 0;
    const streak = user.lastActiveDate === new Date(Date.now() - 86400000).toDateString() ? (user.streak || 0) + 1 : 1;
    this.setUser(chatId, { streak, lastActiveDate: today });
    return streak;
  }

  generateReferral(chatId) {
    const code = `REF${chatId.slice(-6)}${Math.random().toString(36).slice(-4).toUpperCase()}`;
    this.setUser(chatId, { referralCode: code });
    return code;
  }
}

module.exports = new UserStore();

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
      console.warn('UserStore load:', err.message);
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.users, null, 2));
    } catch (err) {
      console.error('UserStore save:', err.message);
    }
  }

  getUser(phone) {
    return this.users[phone] || {};
  }

  setUser(phone, newData) {
    // CRITICAL FIX: Merge old + new data FIRST
    const oldData = this.getUser(phone);
    const mergedData = { ...oldData, ...newData, lastActive: Date.now() };
    
    // Then calculate analysis_complete on FULL merged data
    mergedData.analysis_complete = this.isAnalysisComplete(mergedData);
    
    this.users[phone] = mergedData;
    this.save();
    return mergedData;
  }

  isAnalysisComplete(userData) {
    const required = ['name', 'age', 'height', 'weight', 'goal', 'target_weight', 'timeline', 'veg_nonveg', 'food_budget', 'gym_home', 'schedule', 'medical', 'experience'];
    return required.every(field => userData[field] && userData[field].toString().trim());
  }

  updateStreak(phone) {
    const user = this.getUser(phone);
    const today = new Date().toDateString();
    if (user.lastActiveDate === today) return user.streak || 0;
    
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const streak = user.lastActiveDate === yesterday ? (user.streak || 0) + 1 : 1;
    
    this.setUser(phone, { streak, lastActiveDate: today });
    return streak;
  }

  generateReferral(phone) {
    const code = `FIT${phone.slice(-6)}${Math.random().toString(36).slice(-4).toUpperCase()}`;
    this.setUser(phone, { referralCode: code });
    return code;
  }

  setPremiumStatus(phone, status, service, paymentProof = '') {
    this.setUser(phone, {
      premium_status: status,
      premium_service: service,
      premium_start: status ? Date.now() : null,
      payment_proof: paymentProof,
      last_checkin: status ? Date.now() : null
    });
  }

  updateCheckin(phone, weight, energy, sleep, adherence, photos = []) {
    this.setUser(phone, {
      last_checkin: Date.now(),
      current_weight: weight,
      energy_level: energy,
      sleep_hours: sleep,
      diet_adherence: adherence,
      recent_photos: photos
    });
  }

  // Railway safe file ops
  getStats() {
    return {
      totalUsers: Object.keys(this.users).length,
      premiumUsers: Object.values(this.users).filter(u => u.premium_status).length,
      activeToday: Object.values(this.users).filter(u => {
        return Date.now() - (u.lastActive || 0) < 86400000;
      }).length
    };
  }
}

module.exports = new UserStore();


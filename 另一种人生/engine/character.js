/**
 * 「另一种人生」—— 角色属性引擎
 * 动态属性系统，公式驱动，不写死数据
 */
class CharacterEngine {
  constructor(name = '你') {
    this.name = name;
    this.age = 22;
    this.body = { energy: 100, energyMax: 100, health: 85, hunger: 30, fatigue: 10, appearance: 50, sick: false, sickType: null, sickDays: 0 };
    this.mind = { happiness: 60, stress: 20, loneliness: 30, inspiration: 40, willpower: 70, mood: 'normal' };
    this.social = { reputation: 10, credit: 60, charm: 30 };
    this.finance = { cash: 2000, savings: 5000, debt: 0, monthlyRent: 800, assets: [], income: 0, expense: 0 };
    this.skills = {
      coding: { level: 0, exp: 0, name: '编程', icon: '💻' },
      cooking: { level: 1, exp: 0, name: '烹饪', icon: '🍳' },
      fitness: { level: 0, exp: 0, name: '健身', icon: '💪' },
      social: { level: 1, exp: 0, name: '社交', icon: '🗣️' },
      music: { level: 0, exp: 0, name: '音乐', icon: '🎵' },
      art: { level: 0, exp: 0, name: '绘画', icon: '🎨' },
      writing: { level: 0, exp: 0, name: '写作', icon: '✍️' },
      business: { level: 0, exp: 0, name: '商业', icon: '📊' },
      driving: { level: 0, exp: 0, name: '驾驶', icon: '🚗' },
      fishing: { level: 0, exp: 0, name: '钓鱼', icon: '🎣' },
      gardening: { level: 0, exp: 0, name: '种植', icon: '🌱' },
      negotiate: { level: 0, exp: 0, name: '谈判', icon: '🤝' }
    };
    this.job = { current: null, company: null, position: null, salary: 0, performance: 50, daysWorked: 0 };
    this.housing = { type: 'rent_shared', location: 'oldtown', quality: 30, garden: { plots: [], level: 0, maxPlots: 2 }, pets: [] };
    this.vehicle = null;
    this.inventory = [];
    this.statusEffects = [];
    this.achievements = [];
    this.stats = { totalDays: 0, moneyEarned: 0, moneySpent: 0, npcsMetCount: 0 };
  }

  hourlyUpdate(time) {
    this.body.hunger = Math.min(100, this.body.hunger + 3);
    this.body.energy = Math.max(0, this.body.energy - 2);
    const isNight = time.hour >= 21 || time.hour < 6;
    this.body.fatigue = Math.min(100, this.body.fatigue + (isNight ? 5 : 2));
    this.mind.willpower = Math.max(0, this.mind.willpower - 1);
    this.mind.loneliness = Math.min(100, this.mind.loneliness + 0.5);
    if (time.weather === 'sunny') this.mind.happiness = Math.min(100, this.mind.happiness + 1);
    if (time.weather === 'rainy') this.mind.happiness = Math.max(0, this.mind.happiness - 1);
    if (time.weather === 'stormy') this.mind.stress = Math.min(100, this.mind.stress + 2);
    this._updateMood();
    this._checkSick();
  }

  dailyUpdate(time) {
    this.stats.totalDays++;
    for (const sk of Object.values(this.skills)) {
      if (!sk._used && sk.exp > 0) sk.exp = Math.max(0, sk.exp - 1);
      sk._used = false;
    }
    this.statusEffects = this.statusEffects.filter(e => (--e.duration) > 0);
    if (this.body.sick && --this.body.sickDays <= 0) { this.body.sick = false; this.body.sickType = null; }
    if (time.day === 1) this._monthSettle();
  }

  _updateMood() {
    const h = this.mind.happiness, s = this.mind.stress;
    if (h > 80 && s < 20) this.mind.mood = 'ecstatic';
    else if (h > 60 && s < 40) this.mind.mood = 'happy';
    else if (s > 80) this.mind.mood = 'anxious';
    else if (h < 20 && s > 60) this.mind.mood = 'depressed';
    else if (h < 30) this.mind.mood = 'sad';
    else this.mind.mood = 'normal';
  }

  get moodName() {
    return { ecstatic:'😆 超开心', happy:'😊 开心', normal:'😐 平静', sad:'😢 低落', depressed:'😞 抑郁', anxious:'😰 焦虑', angry:'😠 愤怒' }[this.mind.mood] || '😐 平静';
  }

  _checkSick() {
    if (this.body.sick) return null;
    const risk = (this.body.fatigue > 80 ? 0.05 : 0) + (this.body.health < 30 ? 0.05 : 0) + (this.mind.stress > 80 ? 0.03 : 0);
    if (Math.random() < risk) {
      const types = [{ type: 'cold', name: '感冒', days: 3 }, { type: 'fever', name: '发烧', days: 2 }, { type: 'stomach', name: '肠胃炎', days: 2 }];
      const s = types[Math.floor(Math.random() * types.length)];
      Object.assign(this.body, { sick: true, sickType: s, sickDays: s.days });
      return s;
    }
    return null;
  }

  _monthSettle() {
    this.finance.cash -= this.finance.monthlyRent;
    this.finance.expense += this.finance.monthlyRent;
    if (this.job.current) {
      this.finance.cash += this.job.salary;
      this.finance.income += this.job.salary;
      this.stats.moneyEarned += this.job.salary;
    }
    if (this.finance.debt > 0) this.finance.debt = Math.round(this.finance.debt * 1.005);
  }

  doAction(action) {
    if (action.effects) {
      for (const [path, val] of Object.entries(action.effects)) {
        const p = path.split('.');
        let t = this;
        for (let i = 0; i < p.length - 1; i++) t = t[p[i]];
        t[p[p.length - 1]] = Math.max(0, Math.min(100, (t[p[p.length - 1]] || 0) + val));
      }
    }
    if (action.skillGain) for (const [s, exp] of Object.entries(action.skillGain)) this.gainExp(s, exp);
    if (action.cost) { this.finance.cash -= action.cost; this.finance.expense += action.cost; }
    if (action.earn) { this.finance.cash += action.earn; this.finance.income += action.earn; }
  }

  gainExp(name, amount) {
    const sk = this.skills[name];
    if (!sk || sk.level >= 10) return null;
    sk.exp += amount;
    sk._used = true;
    const need = (sk.level + 1) * 20;
    if (sk.exp >= need) { sk.exp -= need; sk.level++; return { name: sk.name, level: sk.level }; }
    return null;
  }

  get workEfficiency() {
    const f = 1 - this.body.fatigue / 150;
    const m = { happy: 1.2, ecstatic: 1.4, sad: 0.7, depressed: 0.4, anxious: 0.6 }[this.mind.mood] || 1;
    return Math.max(0.1, f * m * (this.body.sick ? 0.5 : 1));
  }

  get netWorth() {
    return this.finance.cash + this.finance.savings - this.finance.debt + this.finance.assets.reduce((s, a) => s + (a.value || 0), 0);
  }

  serialize() { return JSON.parse(JSON.stringify(this)); }
  deserialize(d) { Object.assign(this, d); }
}

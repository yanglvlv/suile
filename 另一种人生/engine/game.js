/**
 * 「另一种人生」—— 游戏主控制器 v2
 * 串联所有引擎 + NPC主动行为 + 成就 + 绩效系统
 */
class Game {
  constructor() {
    this.time = new TimeEngine();
    this.player = new CharacterEngine('你');
    this.npcs = new NPCEngine();
    this.events = new EventEngine();
    this.locations = new LocationEngine();
    this.economy = new EconomyEngine();
    this.messages = [];
    this.paused = false;
    this.started = false;
    this.onUpdate = null;
    this.onAchievement = null; // 成就回调

    this.time.on('hourChange', () => this._onHourChange());
    this.time.on('dayChange', () => this._onDayChange());
  }

  start() {
    this.started = true;
    this.addMessage('🌅 新的一天开始了！你睁开眼，准备迎接这座城市的一切。', 'system');
    this.addMessage(`📍 你在：${this.locations.locations[this.locations.currentLocation].icon} ${this.locations.locations[this.locations.currentLocation].name}`, 'location');
    this._notify();
  }

  doAction(actionId, locationId) {
    if (!this.started || this.paused) return;
    const loc = this.locations.locations[locationId || this.locations.currentLocation];
    if (!loc) return;
    const action = loc.actions.find(a => a.id === actionId);
    if (!action) return;

    if (action.cost && this.player.finance.cash < action.cost) {
      this.addMessage(`💸 钱不够！需要 $${action.cost}`, 'warning');
      this._notify();
      return;
    }

    // 执行行动
    this.player.doAction(action);
    const hrs = Math.floor((action.duration || 60) / 60);
    const mins = (action.duration || 60) % 60;
    const timeStr = hrs > 0 ? `${hrs}小时${mins > 0 ? mins + '分钟' : ''}` : `${mins}分钟`;
    this.addMessage(`${action.icon} ${action.name}（${timeStr}）`, 'action');

    // 技能提示
    if (action.skillGain) {
      for (const [sk, exp] of Object.entries(action.skillGain)) {
        const result = this.player.gainExp(sk, 0);
        const skill = this.player.skills[sk];
        if (skill) this.addMessage(`  ${skill.icon} ${skill.name} 经验+${exp}`, 'skill');
        // 升级特效
        if (result) this.addMessage(`  🎉 ${skill.name} 升到了 Lv.${skill.level}！`, 'achievement');
      }
    }

    // 工作绩效动态计算
    if (action.jobReq && this.player.job.current) {
      const eff = this.player.workEfficiency;
      if (actionId === 'work_hard') {
        const perfGain = Math.round(5 * eff);
        this.player.job.performance = Math.min(100, this.player.job.performance + perfGain);
        this.addMessage(`  📊 绩效 +${perfGain}（效率：${Math.round(eff*100)}%）`, 'info');
      } else if (actionId === 'work_normal') {
        const perfGain = Math.round(2 * eff);
        this.player.job.performance = Math.min(100, this.player.job.performance + perfGain);
      } else if (actionId === 'work_slack') {
        this.player.job.performance = Math.max(0, this.player.job.performance - 3);
        this.addMessage(`  📊 绩效 -3（摸鱼被发现了？）`, 'warning');
      }
      this.player.job.daysWorked++;
    }

    // 推进时间
    this.time.advance(action.duration || 60);

    // 触发随机事件
    const triggered = this.events.check(this.player, this.time, this.npcs);
    for (const evt of triggered) {
      this.addMessage(`${evt.icon} ${evt.text}`, 'event');
    }

    // 检查成就
    this._checkAchievements();

    // 彩票
    if (actionId === 'buy_lottery') {
      if (!this.player.inventory) this.player.inventory = [];
      this.player.inventory.push('lottery');
      this.addMessage('🎰 买了一张彩票！周日开奖~', 'info');
    }

    this._notify();
  }

  goTo(locationId) {
    if (!this.started) return;
    const from = this.locations.currentLocation;
    if (from === locationId) return;

    const travelTime = this.locations.getTravelTime(from, locationId);
    const toLoc = this.locations.locations[locationId];
    if (!toLoc) return;

    const [open, close] = toLoc.openHours;
    const arriveHour = this.time.hour + Math.floor(travelTime / 60);
    if (close <= 24 && (arriveHour < open || arriveHour >= close)) {
      this.addMessage(`🚫 ${toLoc.name} 还没开门（${open}:00~${close > 24 ? (close-24) : close}:00）`, 'warning');
      this._notify();
      return;
    }

    this.locations.currentLocation = locationId;
    this.time.advance(travelTime);
    this.player.body.energy = Math.max(0, this.player.body.energy - 3);
    this.addMessage(`🚶 前往 ${toLoc.icon} ${toLoc.name}（${travelTime}分钟路程）`, 'travel');

    const npcsHere = this.npcs.getNPCsAtLocation(locationId, this.time);
    if (npcsHere.length > 0) {
      const names = npcsHere.map(n => `${n.avatar}${n.name}`).join('、');
      this.addMessage(`👀 这里有：${names}`, 'info');
    }

    const triggered = this.events.check(this.player, this.time, this.npcs);
    for (const evt of triggered) {
      this.addMessage(`${evt.icon} ${evt.text}`, 'event');
    }

    this._checkAchievements();
    this._notify();
  }

  interactNPC(npcId, type) {
    const result = this.npcs.interact(npcId, type, this.player);
    if (!result) return;
    for (const msg of result.messages) this.addMessage(msg, 'social');
    if (result.cost) {
      this.player.finance.cash -= result.cost;
      this.addMessage(`  💸 花费 $${result.cost}`, 'cost');
    }
    if (result.effects) {
      if (result.effects.happiness) this.player.mind.happiness = Math.min(100, this.player.mind.happiness + result.effects.happiness);
    }
    this.player.mind.loneliness = Math.max(0, this.player.mind.loneliness - 10);
    this.time.advance(30);
    this._checkAchievements();
    this._notify();
  }

  buyStock(stockId, shares) {
    const r = this.economy.buyStock(stockId, shares, this.player);
    this.addMessage(r.success ? `📈 ${r.msg}` : `❌ ${r.msg}`, r.success ? 'economy' : 'warning');
    this._notify();
    return r;
  }

  sellStock(stockId, shares) {
    const r = this.economy.sellStock(stockId, shares, this.player);
    this.addMessage(r.success ? `📉 ${r.msg}` : `❌ ${r.msg}`, r.success ? 'economy' : 'warning');
    this._notify();
    return r;
  }

  deposit(amount) {
    if (this.player.finance.cash < amount) { this.addMessage('❌ 现金不足', 'warning'); this._notify(); return; }
    this.player.finance.cash -= amount;
    this.player.finance.savings += amount;
    this.addMessage(`🏦 存入 $${amount}`, 'economy');
    this._notify();
  }

  withdraw(amount) {
    if (this.player.finance.savings < amount) { this.addMessage('❌ 存款不足', 'warning'); this._notify(); return; }
    this.player.finance.savings -= amount;
    this.player.finance.cash += amount;
    this.addMessage(`🏦 取出 $${amount}`, 'economy');
    this._notify();
  }

  _onHourChange() {
    this.player.hourlyUpdate(this.time);
    if (this.player.body.energy < 15) this.addMessage('⚠️ 体力快见底了，该休息了！', 'warning');
    if (this.player.body.hunger > 80) this.addMessage('⚠️ 肚子饿得咕咕叫...赶紧吃点东西！', 'warning');
    if (this.player.body.fatigue > 85) this.addMessage('⚠️ 累到极限了...再不睡要倒下了。', 'warning');
    if (this.player.mind.stress > 85) this.addMessage('⚠️ 压力已经快撑不住了...做点放松的事吧。', 'warning');
  }

  _onDayChange() {
    this.player.dailyUpdate(this.time);
    this.economy.dailyUpdate(this.time, this.events);

    // NPC主动行为
    const npcMsgs = this.npcs.dailyBehavior(this.player, this.time);
    for (const msg of npcMsgs) {
      this.addMessage(`📱 ${msg.text}`, msg.type);
    }

    // 绩效自然衰减
    if (this.player.job.current) {
      this.player.job.performance = Math.max(0, this.player.job.performance - 1);
    }

    this.locations.currentLocation = 'home';
    this.addMessage(`\n🌅 === ${this.time.dateString} ${this.time.weatherNames[this.time.weather]} ${this.time.temperature}°C ===`, 'newday');

    // 宠物系统
    if (this.player.housing.pets?.length > 0) {
      const pet = this.player.housing.pets[0];
      this.addMessage(`🐱 ${pet.name}蹭了蹭你的腿，喵~`, 'info');
      this.player.mind.happiness = Math.min(100, this.player.mind.happiness + 3);
      this.player.mind.loneliness = Math.max(0, this.player.mind.loneliness - 5);
    }

    this._checkAchievements();
  }

  _checkAchievements() {
    const newAchs = this.events.checkAchievements(this.player);
    for (const ach of newAchs) {
      this.addMessage(`🏆 解锁成就：${ach.icon} ${ach.name} —— ${ach.desc}`, 'achievement');
      if (this.onAchievement) this.onAchievement(ach);
    }
  }

  addMessage(text, type = 'info') {
    this.messages.push({ text, type, time: `${this.time.timeString}` });
    if (this.messages.length > 100) this.messages.shift();
  }

  _notify() { if (this.onUpdate) this.onUpdate(); }

  save(slot = 0) {
    const data = {
      time: this.time.serialize(), player: this.player.serialize(),
      npcs: this.npcs.serialize(), events: this.events.serialize(),
      locations: this.locations.serialize(), economy: this.economy.serialize(),
      messages: this.messages.slice(-30)
    };
    localStorage.setItem(`life_save_${slot}`, JSON.stringify(data));
  }

  load(slot = 0) {
    const raw = localStorage.getItem(`life_save_${slot}`);
    if (!raw) return false;
    const data = JSON.parse(raw);
    this.time.deserialize(data.time);
    this.player.deserialize(data.player);
    this.npcs.deserialize(data.npcs);
    this.events.deserialize(data.events);
    this.locations.deserialize(data.locations);
    this.economy.deserialize(data.economy);
    this.messages = data.messages || [];
    this.started = true;
    this.addMessage('📂 存档已读取！', 'system');
    this._notify();
    return true;
  }

  hasSave(slot = 0) { return !!localStorage.getItem(`life_save_${slot}`); }
}

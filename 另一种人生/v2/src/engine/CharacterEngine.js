/**
 * CharacterEngine v2 — 角色属性引擎
 * 五维六性 + 饱腹 + 动机 + 状态异常
 */
export class CharacterEngine {
  constructor(name = '你') {
    this.name = name
    this.age = 22

    // === 物理层 ===
    this.body = {
      energy: 100,      // 体力 — 行动消耗货币
      energyMax: 100,
      health: 85,       // 健康
      hunger: 30,       // 饥饿度(0=饱,100=饿)
      fatigue: 10,      // 疲劳
      appearance: 50,   // 外貌
      sick: false,      // 是否生病
      sickType: null,   // 生病类型
      sickDays: 0       // 剩余病天数
    }

    // === 精神层 ===
    this.mind = {
      happiness: 60,    // 心情
      stress: 20,       // 压力 (累积型)
      motivation: 70,   // 动机 (影响成功率)
      inspiration: 40,  // 灵感
      mood: 'normal',  // 情绪状态
      get moodValue() { return this.happiness }
    }

    // === 社会层 ===
    this.social = {
      reputation: 10,   // 声望
      credit: 60,       // 信用
      charm: 30         // 魅力
    }

    // === 经济层 ===
    this.cash = 2000
    this.savings = 5000
    this.debt = 0

    // === 职业 ===
    this.job = {
      current: null,
      company: null,
      position: null,
      salary: 0,
      performance: 50,
      daysWorked: 0
    }

    // === 技能 (12种) ===
    this.skills = {
      coding:    { level:0, exp:0, name:'编程', icon:'💻' },
      cooking:   { level:1, exp:0, name:'烹饪', icon:'🍳' },
      fitness:   { level:0, exp:0, name:'健身', icon:'💪' },
      social:    { level:1, exp:0, name:'社交', icon:'🗣️' },
      music:     { level:0, exp:0, name:'音乐', icon:'🎵' },
      art:       { level:0, exp:0, name:'绘画', icon:'🎨' },
      writing:   { level:0, exp:0, name:'写作', icon:'✍️' },
      business:  { level:0, exp:0, name:'商业', icon:'📊' },
      driving:   { level:0, exp:0, name:'驾驶', icon:'🚗' },
      fishing:   { level:0, exp:0, name:'钓鱼', icon:'🎣' },
      gardening: { level:0, exp:0, name:'种植', icon:'🌱' },
      negotiate: { level:0, exp:0, name:'谈判', icon:'🤝' }
    }

    // === 生活 ===
    this.housing = { type:'rent_shared', location:'oldtown' }
    this.pets = []
    this.inventory = []

    // === 统计 ===
    this.stats = {
      totalDays: 0,
      moneyEarned: 0,
      moneySpent: 0,
      npcsMetCount: 0
    }

    // 用餐记录（三餐系统）
    this.meals = { breakfast: false, lunch: false, dinner: false }
  }

  /** 每小时被动更新 */
  hourlyUpdate(time) {
    const b = this.body, m = this.mind

    b.hunger = Math.min(100, b.hunger + 3)        // 饿
    b.energy = Math.max(0, b.energy - 2)             // 累
    const isNight = time.hour >= 21 || time.hour < 6
    b.fatigue = Math.min(100, b.fatigue + (isNight ? 5 : 2))
    m.motivation = Math.max(0, m.motivation - 0.5)

    if (time.weather === 'sunny') m.happiness = Math.min(100, m.happiness + 1)
    if (['rainy','stormy'].includes(time.weather)) m.happiness = Math.max(0, m.happiness - 1)
    if (time.weather === 'stormy') m.stress = Math.min(100, m.stress + 2)

    this._updateMood()
    this._checkSick()
    this._checkMealPenalties(time)
  }

  /** 每日更新 */
  dailyUpdate(time) {
    this.stats.totalDays++
    
    // 技能衰减（用进废退）
    for (const sk of Object.values(this.skills)) {
      if (!sk._used && sk.exp > 0) sk.exp = Math.max(0, sk.exp - 1)
      sk._used = false
    }

    // 重置每日用餐
    this.meals = { breakfast: false, lunch: false, dinner: false }

    // 生病恢复
    if (this.body.sick && --this.body.sickDays <= 0) {
      this.body.sick = false; this.body.sickType = null
    }

    // 月结算
    if (time.day === 1) this._monthSettle()
  }

  _updateMood() {
    const h = this.mind.happiness, s = this.mind.stress
    if (h > 80 && s < 20) this.mind.mood = 'ecstatic'
    else if (h > 60 && s < 40) this.mind.mood = 'happy'
    else if (s > 80) this.mind.mood = 'anxious'
    else if (h < 20 && s > 60) this.mind.mood = 'depressed'
    else if (h < 30) this.mind.mood = 'sad'
    else this.mind.mood = 'normal'
  }

  _checkSick() {
    if (this.body.sick) return
    const risk =
      (this.body.fatigue > 80 ? 0.05 : 0) +
      (this.body.health < 30 ? 0.05 : 0) +
      (this.mind.stress > 80 ? 0.03 : 0)
    if (Math.random() < risk) {
      const types = [
        { type:'cold', name:'感冒', days:3 },
        { type:'fever', name:'发烧', days:2 },
        { type:'stomach', name:'肠胃炎', days:2 }
      ]
      const s = types[Math.floor(Math.random()*types.length)]
      Object.assign(this.body, { sick:true, sickType:s, sickDays:s.days })
    }
  }

  /** 三餐惩罚检查 */
  _checkMealPenalties(time) {
    const hour = time.hour
    
    // 午餐惩罚
    if (!this.meals.lunch && hour >= 14 && hour < 18) {
      // 下午效率减半效果通过动机体现
      this.mind.motivation = Math.max(0, this.mind.motivation - 5)
    }
    // 晚餐惩罚
    if (!this.meals.dinner && hour >= 21) {
      this.body.energy = Math.max(0, this.body.energy - 5)
    }
  }

  _monthSettle() {
    // 房租等固定支出
    const rent = 800
    this.cash -= rent
    this.stats.moneySpent += rent
    
    // 工资
    if (this.job.current) {
      this.cash += this.job.salary
      this.stats.moneyEarned += this.job.salary
    }
    // 债务利息
    if (this.debt > 0) this.debt = Math.round(this.debt * 1.005)
  }

  /**
   * 行动执行
   */
  doAction(action) {
    if (action.effects) {
      for (const [path, val] of Object.entries(action.effects)) {
        this.applyEffect(path, val)
      }
    }
    if (action.skillGain) {
      for (const [sk, exp] of Object.entries(action.skillGain)) {
        this.gainExp(sk, exp)
      }
    }
    if (action.cost) this.spendCash(action.cost)
    if (action.earn) this.earnCash(action.earn)
  }

  applyEffect(path, value) {
    const parts = path.split('.')
    let target = this
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]]
    const key = parts[parts.length - 1]
    target[key] = Math.max(0, Math.min(100, (target[key]||0) + value))
  }

  gainExp(name, amount) {
    const sk = this.skills[name]
    if (!sk || sk.level >= 10) return null
    sk.exp += amount; sk._used = true
    const need = (sk.level + 1) * 20
    if (sk.exp >= need) {
      sk.exp -= need; sk.level++
      return { name: sk.name, level: sk.level }
    }
    return null
  }

  spendCash(amount) {
    this.cash -= amount
    this.stats.moneySpent += amount
  }

  earnCash(amount) {
    this.cash += amount
    this.stats.moneyEarned += amount
  }

  setJob(jobData) {
    Object.assign(this.job, jobData)
  }

  /** 工作效率（受状态影响） */
  get workEfficiency() {
    const f = 1 - this.body.fatigue / 150
    const moodMap = { happy:1.2, ecstatic:1.4, sad:0.7, depressed:0.4, anxious:0.6 }
    const m = moodMap[this.mind.mood] || 1
    return Math.max(0.1, f * m * (this.body.sick ? 0.5 : 1))
  }

  /** 总资产 */
  get netWorth() {
    return this.cash + this.savings - this.debt
  }

  /** 行动成功概率（受动机影响） */
  getActionSuccessRate(baseRate = 1) {
    const mot = this.mind.motivation
    if (mot >= 70) return baseRate * 1.15
    if (mot >= 30) return baseRate
    if (mot >= 10) return baseRate * 0.7
    return baseRate * 0.3  // 低动机时容易失败
  }

  serialize() {
    const data = JSON.parse(JSON.stringify({
      name:this.name, age:this.age, body:this.body, mind:this.mind,
      social:this.social, cash:this.cash, savings:this.savings,
      debt:this.debt, job:this.job, skills:this.skills,
      housing:this.housing, pets:this.pets, inventory:this.inventory,
      stats:this.stats, meals:this.meals
    }))
    return data
  }

  deserialize(d) {
    Object.assign(this, d)
  }
}

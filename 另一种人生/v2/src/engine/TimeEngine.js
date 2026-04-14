/**
 * TimeEngine v2 — 时间系统
 * 连续时间轴 + 天气 + 季节 + 时段
 */
export class TimeEngine {
  constructor() {
    this.year = 1
    this.month = 3
    this.day = 1
    this.hour = 6
    this.minute = 0
    this.dayOfWeek = 1 // 1=周一

    // 天气
    this.weather = 'sunny'
    this.temperature = 22
    this.weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy']
    this.weatherNames = {
      sunny: '☀️ 晴', cloudy: '⛅ 多云', rainy: '🌧️ 雨',
      stormy: '⛈️ 暴雨', snowy: '❄️ 雪', foggy: '🌫️ 雾', windy: '💨 大风'
    }

    // 季节配置
    this.seasonConfig = {
      spring: { months: [3,4,5], tempRange: [12,28],
        weatherWeights: { sunny:35, cloudy:25, rainy:25, windy:10, foggy:5 } },
      summer: { months: [6,7,8], tempRange: [25,40],
        weatherWeights: { sunny:40, cloudy:15, rainy:15, stormy:15, windy:5, foggy:5 } },
      autumn:  { months: [9,10,11], tempRange: [8,25],
        weatherWeights: { sunny:30, cloudy:30, rainy:15, windy:15, foggy:10 } },
      winter: { months: [12,1,2], tempRange: [-5,12],
        weatherWeights: { sunny:20, cloudy:25, rainy:10, snowy:25, foggy:10, windy:10 } }
    }

    this.listeners = {}
    this._generateDailyWeather()
  }

  get season() {
    for (const [s, cfg] of Object.entries(this.seasonConfig)) {
      if (cfg.months.includes(this.month)) return s
    }
    return 'spring'
  }

  get seasonName() {
    return { spring:'🌸 春', summer:'☀️ 夏', autumn:'🍂 秋', winter:'❄️ 冬' }[this.season]
  }

  get dayOfWeekName() {
    return ['', '周一','周二','周三','周四','周五','周六','周日'][this.dayOfWeek]
  }

  get isWeekday() { return this.dayOfWeek <= 5 }
  get isWeekend() { return this.dayOfWeek > 5 }

  /** 当前时段 */
  get timeOfDay() {
    const h = this.hour
    if (h >= 6 && h < 9) return 'earlyMorning'
    if (h >= 9 && h < 12) return 'morning'
    if (h >= 12 && h < 14) return 'noon'
    if (h >= 14 && h < 18) return 'afternoon'
    if (h >= 18 && h < 21) return 'evening'
    if (h >= 21 || h < 2) return 'night'
    return 'lateNight'
  }

  get timeOfDayName() {
    return {
      earlyMorning:'🌅 清晨', morning:'🌤️ 上午', noon:'☀️ 中午',
      afternoon:'🌇 下午', evening:'🌆 傍晚', night:'🌙 夜晚',
      lateNight:'🌑 深夜'
    }[this.timeOfDay]
  }

  get timeString() {
    return `${String(this.hour).padStart(2,'0')}:${String(this.minute).padStart(2,'0')}`
  }

  get dateString() {
    return `第${this.year}年 ${this.month}月${this.day}日 ${this.dayOfWeekName}`
  }

  /**
   * 推进时间（分钟）
   */
  advance(minutes) {
    const oldHour = this.hour
    const oldDay = this.day
    const oldMonth = this.month
    const oldSeason = this.season
    const oldWeek = this.dayOfWeek

    this.minute += minutes
    while (this.minute >= 60) { this.minute -= 60; this.hour++ }

    // 凌晨2点强制跳到次日6点（强制睡觉）
    while (this.hour >= 26) { this.hour -= 24; this._advanceDay() }
    if (this.hour >= 2 && this.hour < 6 && oldHour >= 21) {
      this.hour = 6; this.minute = 0; this._advanceDay()
    }

    if (this.hour !== oldHour) this._emit('hourChange')
    if (this.day !== oldDay) {
      this._generateDailyWeather()
      this._emit('dayChange')
    }
    if (this.dayOfWeek === 1 && oldWeek === 7) this._emit('weekChange')
    if (this.month !== oldMonth) this._emit('monthChange')
    if (this.season !== oldSeason) this._emit('seasonChange')
  }

  _advanceDay() {
    this.day++
    this.dayOfWeek = (this.dayOfWeek % 7) + 1
    const daysInMonth = [0,31,28,31,30,31,30,31,31,30,31,30,31]
    if (this.day > daysInMonth[this.month]) {
      this.day = 1; this.month++
      if (this.month > 12) { this.month = 1; this.year++ }
    }
  }

  _generateDailyWeather() {
    const cfg = this.seasonConfig[this.season]
    const weights = cfg.weatherWeights
    const total = Object.values(weights).reduce((a,b)=>a+b, 0)
    let rand = Math.random() * total
    for (const [type, w] of Object.entries(weights)) {
      rand -= w
      if (rand <= 0) { this.weather = type; break }
    }
    const [min, max] = cfg.tempRange
    this.temperature = Math.round(min + Math.random() * (max - min))
    if (['rainy','stormy'].includes(this.weather)) this.temperature -= 3
    if (this.weather === 'sunny') this.temperature += 2
  }

  on(event, cb) {
    if (!this.listeners[event]) this.listeners[event] = []
    this.listeners[event].push(cb)
  }

  _emit(event) {
    ;(this.listeners[event]||[]).forEach(cb => cb(this))
  }

  serialize() {
    return { year:this.year, month:this.month, day:this.day,
      hour:this.hour, minute:this.minute, dayOfWeek:this.dayOfWeek,
      weather:this.weather, temperature:this.temperature }
  }

  deserialize(d) { Object.assign(this, d) }
}

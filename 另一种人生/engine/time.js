/**
 * 「另一种人生」—— 时间系统引擎
 * 管理游戏内连续时间轴、天气、季节
 */
class TimeEngine {
  constructor() {
    // 游戏开始：某年3月1日（春天）周一 6:00
    this.year = 1;
    this.month = 3;
    this.day = 1;
    this.hour = 6;
    this.minute = 0;
    this.dayOfWeek = 1; // 1=周一 ... 7=周日

    // 天气系统
    this.weather = 'sunny';
    this.temperature = 22;
    this.weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'windy'];
    this.weatherNames = {
      sunny: '☀️ 晴天', cloudy: '⛅ 多云', rainy: '🌧️ 下雨',
      stormy: '⛈️ 暴风雨', snowy: '🌨️ 下雪', foggy: '🌫️ 大雾', windy: '💨 大风'
    };

    // 季节配置
    this.seasonConfig = {
      spring: { months: [3, 4, 5], tempRange: [12, 28], weatherWeights: { sunny: 35, cloudy: 25, rainy: 25, windy: 10, foggy: 5, stormy: 0, snowy: 0 } },
      summer: { months: [6, 7, 8], tempRange: [25, 40], weatherWeights: { sunny: 40, cloudy: 15, rainy: 15, stormy: 15, windy: 5, foggy: 5, snowy: 0 } },
      autumn: { months: [9, 10, 11], tempRange: [8, 25], weatherWeights: { sunny: 30, cloudy: 30, rainy: 15, windy: 15, foggy: 10, stormy: 0, snowy: 0 } },
      winter: { months: [12, 1, 2], tempRange: [-5, 12], weatherWeights: { sunny: 20, cloudy: 25, rainy: 10, snowy: 25, foggy: 10, windy: 10, stormy: 0 } }
    };

    // 事件回调
    this.listeners = { hourChange: [], dayChange: [], weekChange: [], monthChange: [], seasonChange: [] };

    // 生成今天的天气
    this._generateDailyWeather();
  }

  /** 获取当前季节 */
  get season() {
    for (const [s, cfg] of Object.entries(this.seasonConfig)) {
      if (cfg.months.includes(this.month)) return s;
    }
    return 'spring';
  }

  get seasonName() {
    return { spring: '🌸 春天', summer: '☀️ 夏天', autumn: '🍂 秋天', winter: '❄️ 冬天' }[this.season];
  }

  /** 获取星期几中文名 */
  get dayOfWeekName() {
    return ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][this.dayOfWeek];
  }

  /** 是否工作日 */
  get isWeekday() {
    return this.dayOfWeek <= 5;
  }

  /** 是否周末 */
  get isWeekend() {
    return this.dayOfWeek > 5;
  }

  /** 获取当前时段 */
  get timeOfDay() {
    if (this.hour >= 6 && this.hour < 9) return 'earlyMorning';
    if (this.hour >= 9 && this.hour < 12) return 'morning';
    if (this.hour >= 12 && this.hour < 14) return 'noon';
    if (this.hour >= 14 && this.hour < 18) return 'afternoon';
    if (this.hour >= 18 && this.hour < 21) return 'evening';
    if (this.hour >= 21 || this.hour < 2) return 'night';
    return 'lateNight';
  }

  get timeOfDayName() {
    return {
      earlyMorning: '🌅 清晨', morning: '🌤️ 上午', noon: '☀️ 中午',
      afternoon: '🌇 下午', evening: '🌆 傍晚', night: '🌙 夜晚', lateNight: '🌑 深夜'
    }[this.timeOfDay];
  }

  /** 获取格式化时间字符串 */
  get timeString() {
    const h = String(this.hour).padStart(2, '0');
    const m = String(this.minute).padStart(2, '0');
    return `${h}:${m}`;
  }

  get dateString() {
    return `第${this.year}年 ${this.month}月${this.day}日 ${this.dayOfWeekName}`;
  }

  /** 推进时间 */
  advance(minutes) {
    const oldHour = this.hour;
    const oldDay = this.day;
    const oldMonth = this.month;
    const oldSeason = this.season;
    const oldWeek = this.dayOfWeek;

    this.minute += minutes;
    while (this.minute >= 60) {
      this.minute -= 60;
      this.hour++;
    }

    // 过了凌晨2点自动跳到第二天6点（强制睡觉）
    while (this.hour >= 26) { // 次日2点 = 26
      this.hour -= 24;
      this._advanceDay();
    }
    // 如果在2:00~5:59之间，跳到6:00
    if (this.hour >= 2 && this.hour < 6 && oldHour >= 21) {
      this.hour = 6;
      this.minute = 0;
      this._advanceDay();
    }

    // 触发事件
    if (this.hour !== oldHour) this._emit('hourChange');
    if (this.day !== oldDay) {
      this._generateDailyWeather();
      this._emit('dayChange');
    }
    if (this.dayOfWeek === 1 && oldWeek === 7) this._emit('weekChange');
    if (this.month !== oldMonth) this._emit('monthChange');
    if (this.season !== oldSeason) this._emit('seasonChange');
  }

  /** 推进一天 */
  _advanceDay() {
    this.day++;
    this.dayOfWeek = (this.dayOfWeek % 7) + 1;
    const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (this.day > daysInMonth[this.month]) {
      this.day = 1;
      this.month++;
      if (this.month > 12) {
        this.month = 1;
        this.year++;
      }
    }
  }

  /** 生成每日天气 */
  _generateDailyWeather() {
    const cfg = this.seasonConfig[this.season];
    const weights = cfg.weatherWeights;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (const [type, weight] of Object.entries(weights)) {
      rand -= weight;
      if (rand <= 0) { this.weather = type; break; }
    }
    const [min, max] = cfg.tempRange;
    this.temperature = Math.round(min + Math.random() * (max - min));
    // 天气微调温度
    if (this.weather === 'rainy' || this.weather === 'stormy') this.temperature -= 3;
    if (this.weather === 'sunny') this.temperature += 2;
  }

  /** 注册事件监听 */
  on(event, callback) {
    if (this.listeners[event]) this.listeners[event].push(callback);
  }

  _emit(event) {
    (this.listeners[event] || []).forEach(cb => cb(this));
  }

  /** 序列化 */
  serialize() {
    return {
      year: this.year, month: this.month, day: this.day,
      hour: this.hour, minute: this.minute, dayOfWeek: this.dayOfWeek,
      weather: this.weather, temperature: this.temperature
    };
  }

  deserialize(data) {
    Object.assign(this, data);
  }
}

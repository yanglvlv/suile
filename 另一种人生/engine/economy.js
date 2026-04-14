/**
 * 「另一种人生」—— 经济/股票系统
 * 动态股票市场 + 房产 + 理财 + 彩票
 */
class EconomyEngine {
  constructor() {
    this.stocks = this._initStocks();
    this.properties = this._initProperties();
    this.funds = [
      { id: 'stable', name: '稳健理财', icon: '🛡️', rate: 0.003, risk: 0.001, desc: '低风险低收益' },
      { id: 'balanced', name: '平衡基金', icon: '⚖️', rate: 0.008, risk: 0.005, desc: '中等风险' },
      { id: 'aggressive', name: '高增长基金', icon: '🚀', rate: 0.02, risk: 0.015, desc: '高风险高收益' }
    ];
    this.playerStocks = {};   // { stockId: { shares, avgCost } }
    this.playerFunds = {};    // { fundId: amount }
    this.playerProperties = []; // 拥有的房产
    this.lotteryNumbers = null;
    this.marketSentiment = 50; // 0~100 市场情绪
    this.economyCycle = 'normal'; // boom / normal / recession
    this.dayCount = 0;
  }

  _initStocks() {
    return [
      { id: 'tech1', name: '星云科技', icon: '💻', sector: 'tech', price: 45, basePrice: 45, volatility: 0.06, trend: 0 },
      { id: 'tech2', name: '量子智能', icon: '🤖', sector: 'tech', price: 120, basePrice: 120, volatility: 0.08, trend: 0 },
      { id: 'food1', name: '美味集团', icon: '🍔', sector: 'food', price: 28, basePrice: 28, volatility: 0.03, trend: 0 },
      { id: 'food2', name: '鲜农股份', icon: '🌾', sector: 'food', price: 15, basePrice: 15, volatility: 0.04, trend: 0 },
      { id: 'estate1', name: '金城地产', icon: '🏗️', sector: 'estate', price: 80, basePrice: 80, volatility: 0.05, trend: 0 },
      { id: 'retail1', name: '乐购零售', icon: '🛒', sector: 'retail', price: 35, basePrice: 35, volatility: 0.04, trend: 0 },
      { id: 'media1', name: '星光传媒', icon: '🎬', sector: 'media', price: 55, basePrice: 55, volatility: 0.07, trend: 0 },
      { id: 'energy1', name: '绿能环保', icon: '🔋', sector: 'energy', price: 22, basePrice: 22, volatility: 0.05, trend: 0 },
      { id: 'bank1', name: '汇通银行', icon: '🏦', sector: 'finance', price: 50, basePrice: 50, volatility: 0.03, trend: 0 },
      { id: 'pharma1', name: '康泰医药', icon: '💊', sector: 'pharma', price: 68, basePrice: 68, volatility: 0.06, trend: 0 }
    ];
  }

  _initProperties() {
    return [
      { id: 'apt_old', name: '老城区小公寓', area: 'oldtown', price: 30000, rent: 600, appreciation: 0.001, icon: '🏚️' },
      { id: 'apt_dt', name: '市中心公寓', area: 'downtown', price: 80000, rent: 1500, appreciation: 0.003, icon: '🏢' },
      { id: 'apt_cbd', name: 'CBD豪华公寓', area: 'cbd', price: 200000, rent: 3500, appreciation: 0.004, icon: '🏙️' },
      { id: 'shop_old', name: '老城区商铺', area: 'oldtown', price: 50000, rent: 1200, appreciation: 0.002, icon: '🏪' },
      { id: 'shop_art', name: '文创区商铺', area: 'artdistrict', price: 70000, rent: 1800, appreciation: 0.005, icon: '🎨' },
      { id: 'house', name: '郊区独栋别墅', area: 'suburb', price: 350000, rent: 0, appreciation: 0.002, icon: '🏡' }
    ];
  }

  /** 每日股票更新 */
  dailyUpdate(time, events) {
    this.dayCount++;
    // 每30天可能切换经济周期
    if (this.dayCount % 30 === 0) {
      const r = Math.random();
      if (r < 0.2) this.economyCycle = 'boom';
      else if (r < 0.4) this.economyCycle = 'recession';
      else this.economyCycle = 'normal';
    }
    // 市场情绪波动
    const cycleMod = { boom: 5, normal: 0, recession: -5 }[this.economyCycle] || 0;
    this.marketSentiment = Math.max(5, Math.min(95, this.marketSentiment + (Math.random() - 0.5) * 20 + cycleMod));

    // 更新每支股票
    for (const stock of this.stocks) {
      // 趋势惯性
      stock.trend = stock.trend * 0.7 + (Math.random() - 0.48) * stock.volatility * 0.3;
      // 市场情绪影响
      const sentimentEffect = (this.marketSentiment - 50) / 500;
      // 均值回归
      const reversion = (stock.basePrice - stock.price) / stock.basePrice * 0.02;
      // 计算价格变化
      const change = stock.price * (stock.trend + sentimentEffect + reversion + (Math.random() - 0.5) * stock.volatility);
      stock.price = Math.max(1, Math.round((stock.price + change) * 100) / 100);
      // 记录历史（简单保存最近30天）
      if (!stock.history) stock.history = [];
      stock.history.push(stock.price);
      if (stock.history.length > 30) stock.history.shift();
    }

    // 房产增值
    for (const prop of this.playerProperties) {
      const template = this.properties.find(p => p.id === prop.id);
      if (template) {
        prop.currentValue = Math.round(prop.currentValue * (1 + template.appreciation));
      }
    }

    // 基金收益
    for (const [fid, amount] of Object.entries(this.playerFunds)) {
      const fund = this.funds.find(f => f.id === fid);
      if (fund && amount > 0) {
        const returnRate = fund.rate + (Math.random() - 0.5) * fund.risk * 2;
        this.playerFunds[fid] = Math.round(amount * (1 + returnRate));
      }
    }

    // 生成每周彩票号码
    if (time.dayOfWeek === 7) {
      this.lotteryNumbers = Array.from({ length: 6 }, () => Math.floor(Math.random() * 36) + 1).sort((a, b) => a - b);
    }
  }

  /** 买股票 */
  buyStock(stockId, shares, character) {
    const stock = this.stocks.find(s => s.id === stockId);
    if (!stock) return { success: false, msg: '股票不存在' };
    const total = Math.round(stock.price * shares);
    if (character.finance.cash < total) return { success: false, msg: '现金不足' };
    character.finance.cash -= total;
    if (!this.playerStocks[stockId]) this.playerStocks[stockId] = { shares: 0, avgCost: 0 };
    const ps = this.playerStocks[stockId];
    ps.avgCost = (ps.avgCost * ps.shares + total) / (ps.shares + shares);
    ps.shares += shares;
    return { success: true, msg: `买入 ${stock.name} ${shares}股，花费 $${total}` };
  }

  /** 卖股票 */
  sellStock(stockId, shares, character) {
    const stock = this.stocks.find(s => s.id === stockId);
    const ps = this.playerStocks[stockId];
    if (!stock || !ps || ps.shares < shares) return { success: false, msg: '持仓不足' };
    const total = Math.round(stock.price * shares);
    character.finance.cash += total;
    ps.shares -= shares;
    const profit = total - Math.round(ps.avgCost * shares);
    if (ps.shares === 0) delete this.playerStocks[stockId];
    return { success: true, msg: `卖出 ${stock.name} ${shares}股，获得 $${total}，${profit >= 0 ? '盈利' : '亏损'} $${Math.abs(profit)}` };
  }

  /** 买基金 */
  buyFund(fundId, amount, character) {
    if (character.finance.cash < amount) return { success: false, msg: '现金不足' };
    character.finance.cash -= amount;
    this.playerFunds[fundId] = (this.playerFunds[fundId] || 0) + amount;
    const fund = this.funds.find(f => f.id === fundId);
    return { success: true, msg: `购入 ${fund.name} $${amount}` };
  }

  /** 赎回基金 */
  sellFund(fundId, character) {
    const amount = this.playerFunds[fundId] || 0;
    if (amount <= 0) return { success: false, msg: '没有持仓' };
    character.finance.cash += amount;
    this.playerFunds[fundId] = 0;
    return { success: true, msg: `赎回获得 $${amount}` };
  }

  /** 计算股票总市值 */
  get stockPortfolioValue() {
    let total = 0;
    for (const [sid, ps] of Object.entries(this.playerStocks)) {
      const stock = this.stocks.find(s => s.id === sid);
      if (stock) total += stock.price * ps.shares;
    }
    return Math.round(total);
  }

  /** 计算总投资资产 */
  get totalInvestmentValue() {
    const fundTotal = Object.values(this.playerFunds).reduce((s, v) => s + v, 0);
    const propTotal = this.playerProperties.reduce((s, p) => s + p.currentValue, 0);
    return this.stockPortfolioValue + fundTotal + propTotal;
  }

  serialize() {
    return { stocks: this.stocks, playerStocks: this.playerStocks, playerFunds: this.playerFunds,
      playerProperties: this.playerProperties, marketSentiment: this.marketSentiment,
      economyCycle: this.economyCycle, dayCount: this.dayCount };
  }
  deserialize(d) { Object.assign(this, d); }
}

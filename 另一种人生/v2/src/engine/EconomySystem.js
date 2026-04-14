/**
 * EconomySystem v2 — 经济系统
 * 股票 + 存款/贷款 + 彩票
 */
export class EconomySystem {
  constructor() {
    this.stocks = this._initStocks()
    this.playerStocks = {}
    this.lotteryNumbers = null
    this.marketSentiment = 50
    this.economyCycle = 'normal' // boom / normal / recession
    this.dayCount = 0
  }

  _initStocks() {
    return [
      { id:'tech1', name:'星云科技', icon:'💻', sector:'tech',
        price:45, basePrice:45, volatility:0.06, trend:0, history:[45] },
      { id:'tech2', name:'量子智能', icon:'🤖', sector:'tech',
        price:120, basePrice:120, volatility:0.08, trend:0, history:[120] },
      { id:'food1', name:'美味集团', icon:'🍔', sector:'food',
        price:28, basePrice:28, volatility:0.03, trend:0, history:[28] },
      { id:'food2', name:'鲜农股份', icon:'🌾', sector:'food',
        price:15, basePrice:15, volatility:0.04, trend:0, history:[15] },
      { id:'estate1', name:'金城地产', icon:'🏗️', sector:'estate',
        price:80, basePrice:80, volatility:0.05, trend:0, history:[80] },
      { id:'retail1', name:'乐购零售', icon:'🛒', sector:'retail',
        price:35, basePrice:35, volatility:0.04, trend:0, history:[35] },
      { id:'media1', name:'星光传媒', icon:'🎬', sector:'media',
        price:55, basePrice:55, volatility:0.07, trend:0, history:[55] },
      { id:'energy1', name:'绿能环保', icon:'🔋', sector:'energy',
        price:22, basePrice:22, volatility:0.05, trend:0, history:[22] },
      { id:'bank1', name:'汇通银行', icon:'🏦', sector:'finance',
        price:50, basePrice:50, volatility:0.03, trend:0, history:[50] },
      { id:'pharma1', name:'康泰医药', icon:'💊', sector:'pharma',
        price:68, basePrice:68, volatility:0.06, trend:0, history:[68] }
    ]
  }

  /** 每日更新股票市场 */
  dailyUpdate(time, eventSystem) {
    this.dayCount++

    // 经济周期切换 (每30天)
    if (this.dayCount % 30 === 0) {
      const r = Math.random()
      this.economyCycle = r < 0.2 ? 'boom' : r < 0.4 ? 'recession' : 'normal'
    }

    // 市场情绪
    const cycleMod = { boom:5, normal:0, recession:-5 }[this.economyCycle] || 0
    this.marketSentiment = Math.max(5, Math.min(95,
      this.marketSentiment + (Math.random()-0.5)*20 + cycleMod))

    // 更新每只股票
    for (const stock of this.stocks) {
      // 趋势惯性
      stock.trend = stock.trend * 0.7 + (Math.random()-0.48) * stock.volatility * 0.3
      const sentimentEffect = (this.marketSentiment - 50) / 500
      const reversion = (stock.basePrice - stock.price) / stock.basePrice * 0.02
      const change = stock.price *
        (stock.trend + sentimentEffect + reversion + (Math.random()-0.5)*stock.volatility)
      stock.price = Math.max(1, Math.round((stock.price+change)*100)/100)
      stock.history.push(stock.price)
      if (stock.history.length > 30) stock.history.shift()
    }

    // 彩票
    if (time.dayOfWeek === 7) {
      this.lotteryNumbers = Array.from({length:6}, ()=>
        Math.floor(Math.random()*36)+1).sort((a,b)=>a-b)
    }
  }

  buyStock(stockId, shares, character) {
    const s = this.stocks.find(x=>x.id===stockId)
    if (!s) return { success:false, msg:'股票不存在' }
    const total = Math.round(s.price*shares)
    if (character.cash < total) return { success:false, msg:'现金不足' }
    
    character.spendCash(total)
    if (!this.playerStocks[stockId]) this.playerStocks[stockId]={shares:0,avgCost:0}
    const ps=this.playerStocks[stockId]
    ps.avgCost=(ps.avgCost*ps.shares+total)/(ps.shares+shares)
    ps.shares+=shares
    return { success:true, msg:`买入 ${s.name} ${shares}股，$${total}` }
  }

  sellStock(stockId, shares, character) {
    const s=this.stocks.find(x=>x.id===stockId)
    const ps=this.playerStocks[stockId]
    if(!s||!ps||ps.shares<shares) return{success:false,msg:'持仓不足'}
    const total=Math.round(s.price*shares)
    character.earnCash(total)
    const profit=total-Math.round(ps.avgCost*shares)
    ps.shares-=shares
    if(ps.shares===0) delete this.playerStocks[stockId]
    return{success:true, msg:`卖出 ${s.name} ${shares}股，$${total}，${profit>=0?'盈利':'亏损'} $${Math.abs(profit)}`}
  }

  get portfolioValue() {
    let total=0
    for(const [sid,ps] of Object.entries(this.playerStocks)) {
      const s=this.stocks.find(x=>x.id===sid)
      if(s) total+=s.price*ps.shares
    }
    return Math.round(total)
  }

  serialize(){
    return{ stocks:this.stocks, playerStocks:this.playerStocks,
      marketSentiment:this.marketSentiment, economyCycle:this.economyCycle,
      dayCount:this.dayCount }
  }
  deserialize(d){ Object.assign(this,d) }
}

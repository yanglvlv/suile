/**
 * NPCEngine v2 — NPC AI + 对话树 + 关系系统
 * 每个NPC有独立性格、日程、对话树、记忆
 */
export class NPCEngine {
  constructor() {
    this.npcs = {}
    this.pendingMessages = []
    this._initNPCs()
  }

  _initNPCs() {
    const templates = [
      { id:'xiaowang', name:'小王', gender:'male', age:24, job:'程序员',
        avatar:'👨‍💻', bio:'你合租的室友，为人热心，喜欢打游戏。',
        personality:{ extroversion:70, kindness:80, humor:60, ambition:50 },
        relation:{ trust:10, intimacy:5, respect:10, like:10 }, relationLevel:'stranger',
        met:false, mood:'normal', memory:[], recentTopics:[],
        schedule:{
          weekday:{ 9:'office',12:'restaurant',13:'office',18:'home',20:'home' },
          weekend:{ 10:'home',14:'park',18:'restaurant' }
        }},
      { id:'linxi', name:'林夕', gender:'female', age:23, job:'咖啡师',
        avatar:'👩‍🎨', bio:'文创区咖啡店的咖啡师，安静温柔，喜欢画画。',
        personality:{ extroversion:40, kindness:75, humor:50, ambition:60 },
        relation:{ trust:10, intimacy:5, respect:10, like:10 }, relationLevel:'stranger',
        met:false, mood:'normal', memory:[], recentTopics:[],
        schedule:{
          weekday:{ 8:'cafe',15:'cafe',17:'park',20:'home' },
          weekend:{ 10:'cafe',14:'library',18:'home' }
        }},
      { id:'zhangge', name:'张哥', gender:'male', age:35, job:'项目经理',
        avatar:'👔', bio:'你的顶头上司，做事雷厉风行，要求很高。',
        personality:{ extroversion:60, kindness:40, humor:30, ambition:90 },
        relation:{ trust:10, intimacy:5, respect:10, like:10 }, relationLevel:'stranger',
        met:false, mood:'normal', memory:[], recentTopics:[],
        schedule:{
          weekday:{ 8:'office',12:'restaurant',13:'office',21:'bar' },
          weekend:{ 10:'gym',14:'mall',19:'restaurant' }
        }},
      { id:'laochen', name:'老陈', gender:'male', age:52, job:'小吃摊主',
        avatar:'👨‍🍳', bio:'老城区卖面的大叔，热情豪爽，认识半条街的人。',
        personality:{ extroversion:80, kindness:90, humor:70, ambition:20 },
        relation:{ trust:10, intimacy:5, respect:10, like:10 }, relationLevel:'stranger',
        met:false, mood:'normal', memory:[], recentTopics:[],
        schedule:{
          weekday:{ 5:'convenience',7:'restaurant',14:'restaurant',21:'home' },
          weekend:{ 5:'convenience',7:'restaurant',14:'park',20:'home' }
        }},
      { id:'meimei', name:'美美', gender:'female', age:26, job:'自媒体博主',
        avatar:'💁‍♀️', bio:'社交达人，粉丝十万+，总有各种内部消息。',
        personality:{ extroversion:90, kindness:50, humor:80, ambition:85 },
        relation:{ trust:10, intimacy:5, respect:10, like:10 }, relationLevel:'stranger',
        met:false, mood:'normal', memory:[], recentTopics:[],
        schedule:{
          weekday:{ 10:'cafe',14:'mall',18:'restaurant',21:'bar' },
          weekend:{ 11:'mall',15:'cafe',20:'bar' }
        }},
      { id:'dawei', name:'大卫', gender:'male', age:28, job:'健身教练',
        avatar:'🏋️', bio:'阳光开朗的健身教练，每天都元气满满。',
        personality:{ extroversion:85, kindness:70, humor:60, ambition:40 },
        relation:{ trust:10, intimacy:5, respect:10, like:10 }, relationLevel:'stranger',
        met:false, mood:'normal', memory:[], recentTopics:[],
        schedule:{
          weekday:{ 7:'gym',12:'restaurant',13:'gym',20:'home' },
          weekend:{ 8:'gym',12:'park',16:'gym',20:'bar' }
        }},
      { id:'lili', name:'莉莉', gender:'female', age:30, job:'银行职员',
        avatar:'👩‍💼', bio:'做事认真严谨的银行人，懂很多理财知识。',
        personality:{ extroversion:45, kindness:60, humor:35, ambition:70 },
        relation:{ trust:10, intimacy:5, respect:10, like:10 }, relationLevel:'stranger',
        met:false, mood:'normal', memory:[], recentTopics:[],
        schedule:{
          weekday:{ 8:'bank',12:'restaurant',13:'bank',18:'library',21:'home' },
          weekend:{ 10:'home',14:'mall',18:'restaurant' }
        }},
      { id:'afei', name:'阿飞', gender:'male', age:22, job:'外卖骑手',
        avatar:'🛵', bio:'乐天派外卖小哥，总能聊出各种奇葩故事。',
        personality:{ extroversion:65, kindness:75, humor:85, ambition:30 },
        relation:{ trust:10, intimacy:5, respect:10, like:10 }, relationLevel:'stranger',
        met:false, mood:'normal', memory:[], recentTopics:[],
        schedule:{
          weekday:{ 10:'restaurant',14:'convenience',18:'restaurant',22:'home' },
          weekend:{ 10:'convenience',14:'restaurant',18:'bar' }
        }}
    ]
    templates.forEach(t => {
      this.npcs[t.id] = { ...t,
        lastInteractionDay:0, posX:200, posY:200
      }
    })
  }

  getNPC(id) {
    return this.npcs[id] || null
  }

  /** 获取NPC当前位置（基于时间+日程）*/
  getNPCLocation(npcId, time) {
    const npc = this.npcs[npcId]
    if (!npc) return null
    const sched = time.isWeekday ? npc.schedule.weekday : npc.schedule.weekend
    let loc = 'home'
    for (const [hr, place] of Object.entries(sched).sort((a,b)=>+a[0]-+b[0])) {
      if (time.hour >= +hr) loc = place
    }
    return loc
  }

  /** 获取某地点的所有NPC */
  getNPCsAtLocation(locationId, time) {
    return Object.values(this.npcs).filter(npc =>
      this.getNPCLocation(npc.id, time) === locationId
    )
  }

  /**
   * 动态开场白 — 根据玩家状态和情境生成
   */
  getDynamicGreeting(npcId, player, time) {
    const npc = this.npcs[npcId]
    if (!npc) return '...'

    const pool = npc.dialogPool || this._getDefaultDialogPool(npc)
    
    // 根据玩家状态选分类别
    let cat = 'greetings'
    if (player.mind.happiness > 70) cat = 'happy'
    else if (player.mind.happiness < 30 || ['sad','depressed'].includes(player.mind.mood)) cat = 'sad'
    else if (player.body.fatigue > 70 || player.body.energy < 25) cat = 'tired'
    if (['rainy','stormy'].includes(time.weather) && Math.random() < 0.4) cat = 'rainy'

    const lines = pool[cat] || pool.greetings || ['你好。']
    const line = lines[Math.floor(Math.random() * lines.length)]

    // 关系前缀
    let prefix = ''
    if (!npc.met) {
      prefix = `你第一次遇到${npc.name}。\n${npc.bio}\n\n`
    } else {
      const relMap = { closeFriend:'一看到你就笑了：', friend:'朝你走过来：',
        acquaintance:'认出了你：', default:'看了你一眼：' }
      const key = npc.relationLevel === 'stranger' ? 'default' : npc.relationLevel
      prefix = `${npc.name}${relMap[key] || ''}`
    }

    return prefix + `"${line}"`
  }

  _getDefaultDialogPool(npc) {
    // 默认对话池（每个NPC应该有自己的，这里做兜底）
    return {
      greetings:['你好。','嗯？','有什么事？'],
      happy:['今天看起来不错啊！','心情很好？'],
      sad:['怎么了？','不太好吗？'],
      tired:['累了？','要注意休息。'],
      rainy:['下雨了...','带伞了吗？'],
      topics:['最近怎么样？','还好吗？']
    }
  }

  /**
   * 社交互动
   */
  interact(npcId, type, character, time, world) {
    const npc = this.npcs[npcId]
    if (!npc) return null

    if (!npc.met) { npc.met = true; character.stats.npcsMetCount++ }

    const results = { messages: [], effects: {} }

    // 基础效果表
    const effectsMap = {
      greet:     { trust:+1, like:+1, intimacy:0 },
      chat:      { trust:+2, like:+2, intimacy:+2 },
      deepTalk:  { trust:+5, like:+3, intimacy:+5 },
      treat:     { trust:+3, like:+5, intimacy:+3, cost:80 },
      gift:      { trust:+2, like:+6, intimacy:+4, cost:50 },
      hangout:   { trust:+3, like:+4, intimacy:+5 },
      askHelp:   { trust:-2, like:-1, intimacy:+2 }
    }
    const eff = effectsMap[type] || {}

    for (const [key, val] of Object.entries(eff)) {
      if (key !== 'cost') npc.relation[key] = Math.max(0, Math.min(100, npc.relation[key] + val))
    }

    results.cost = eff.cost || 0

    // 生成互动文本
    const topicText = this.getRandomTopic(npc)
    const actionTexts = {
      greet: () => `你和${npc.name}打了个招呼。`,
      chat: () => `你和${npc.name}聊了起来。\n${topicText}`,
      deepTalk: () => `你和${npc.name}进行了一次深入交谈。\n${topicText}\n你们彼此更了解了。`,
      treat: () => `你请${npc.name}吃了一顿饭。\n${npc.name}："谢谢你！下次我请！"`,
      gift: () => `你送了${npc.name}一份礼物。\n${npc.personality.extroversion>60 ? '"哇！谢谢！"' : '"这...太客气了。"'}`,
      hangout: () => `你和${npc.name}一起出去玩了！度过了愉快的时光。`,
      askHelp: () => {
        const willHelp = npc.relation.trust > 30 && npc.personality.kindness > 50
        return willHelp ? `"没问题，我帮你。"` : `"这个...不太方便。"`
      }
    }
    results.messages.push((actionTexts[type] || actionTexts.chat)())

    // 性格回应
    if (npc.personality.extroversion > 60 && type !== 'greet') npc.relation.like++
    if (npc.personality.humor > 60 && Math.random() < 0.3) {
      results.messages.push(`${npc.name}讲了个笑话逗你开心。`)
      results.effects.happiness = 3
    }

    // 更新关系等级
    this._updateRelationLevel(npc)

    // 记录记忆
    npc.memory.push({ type, summary: results.messages[0],
      day: time?.day || 1, playerMood: character.mind.mood })
    if (npc.memory.length > 30) npc.memory.shift()

    // 口碑传播
    if (['treat','gift'].includes(type)) this._spreadReputation(npcId, 'positive')

    return results
  }

  _updateRelationLevel(npc) {
    const t = npc.relation.trust + npc.relation.like + npc.relation.intimacy
    if (t > 200) npc.relationLevel = 'closeFriend'
    else if (t > 120) npc.relationLevel = 'friend'
    else if (t > 50) npc.relationLevel = 'acquaintance'
    else npc.relationLevel = 'stranger'
  }

  _spreadReputation(sourceId, type) {
    const source = this.npcs[sourceId]
    if (!source || source.relationLevel === 'stranger') return
    for (const npc of Object.values(this.npcs)) {
      if (npc.id === sourceId || !npc.met) continue
      if (Math.random() < source.personality.extroversion / 200) {
        const change = type === 'positive' ? 2 : -3
        npc.relation.like = Math.max(0, Math.min(100, npc.relation.like + change))
      }
    }
  }

  getRandomTopic(npc) {
    const topics = npc.dialogPool?.topics || ['最近怎么样？']
    const avail = topics.filter((_, i) => !npc.recentTopics.includes(i))
    const pool = avail.length > 0 ? avail : topics
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    const idx = topics.indexOf(chosen)
    npc.recentTopics.push(idx)
    if (npc.recentTopics.length > 3) npc.recentTopics.shift()
    return chosen
  }

  getRelationLabel(npcId) {
    const labels = { stranger:'陌生人', acquaintance:'认识', friend:'朋友', closeFriend:'密友' }
    return labels[this.npcs[npcId]?.relationLevel] || '陌生人'
  }

  /** NPC每日主动行为 */
  dailyBehavior(player, time) {
    const msgs = []
    for (const npc of Object.values(this.npcs)) {
      if (!npc.met) continue
      const total = npc.relation.trust + npc.relation.like + npc.relation.intimacy
      const daysSince = time.day - (npc.lastInteractionDay || 0)

      // 朋友主动联系
      if (total > 80 && daysSince > 3 && Math.random() < 0.2) {
        msgs.push({ text:`${npc.name}给你发消息："最近忙吗？好久没见了。"`, type:'social' })
      }

      // 密友帮忙
      if (npc.relationLevel === 'closeFriend' && player.cash < 200 && Math.random() < 0.15) {
        const amount = Math.floor(Math.random()*300)+200
        player.cash += amount
        msgs.push({ text:`${npc.name}知道你手头紧，转了 $${amount} 给你`, type:'social' })
        npc.relation.trust = Math.min(100, npc.relation.trust+5)
      }

      // NPC机会
      if (npc.job==='自媒体博主' && total>100 && Math.random()<0.08) {
        msgs.push({ text:`美美："有个品牌合作活，你要不要接？"`, type:'opportunity' })
      }

      // 心情波动
      npc.mood = ['happy','normal','normal','normal','sad'][Math.floor(Math.random()*5)]
    }
    return msgs
  }

  serialize() {
    return JSON.parse(JSON.stringify({
      npcs: Object.fromEntries(
        Object.entries(this.npcs).map(([k,v])=>[k,{ ...v, dialogPool:undefined }])
      )
    }))
  }

  deserialize(d) {
    if (d.npcs) {
      for (const [id, data] of Object.entries(d.npcs)) {
        if (this.npcs[id]) Object.assign(this.npcs[id], data)
      }
    }
  }
}

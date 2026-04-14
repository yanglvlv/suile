/**
 * EventSystem v2 — 事件引擎
 * 因果链条件触发 + 连锁事件 + 叙事驱动
 */
export class EventSystem {
  constructor(world) {
    this.world = world
    this.eventPool = this._initEvents()
    this.eventLog = []
    this.achievements = []
    this.achievementDefs = this._initAchievements()
    this.chainState = {} // 跟踪因果链状态
  }

  _initEvents() {
    return [
      // === 经济类 ===
      { id:'found_money', cat:'economy', icon:'💰',
        cond:(c)=>Math.random()<0.03,
        exec:(c)=>{
          const a=Math.floor(Math.random()*50)+10
          c.cash+=a; c.stats.moneyEarned+=a
          return {text:`路边捡到了 $${a}！运气不错~`}
        }},
      { id:'wallet_lost', cat:'economy', icon:'😱',
        cond:(c,t)=>c.cash>500 && (t.timeOfDay==='night'||t.timeOfDay==='lateNight') && Math.random()<0.02,
        exec:(c)=>{
          const l=Math.floor(c.cash*0.2); c.cash-=l; c.stats.moneySpent+=l
          c.mind.happiness=Math.max(0,c.mind.happiness-10)
          c.mind.stress=Math.min(100,c.mind.stress+15)
          return {text:`钱包被偷了！损失 $${l}...要更小心了。`}
        }},
      { id:'rent_up', cat:'economy', icon:'🏠',
        cond:(c,t)=>t.day===1 && Math.random()<0.08,
        exec:(c)=>{
          const i=80; c.stats.moneySpent+=i
          c.mind.stress=Math.min(100,c.mind.stress+8)
          return {text:`房东来消息：下个月房租涨 $${i}...`}
        }},
      { id:'bonus', cat:'economy', icon:'🎉',
        cond:(c,t)=>c.job.current && c.job.performance>70 && t.day===15 && Math.random()<0.3,
        exec:(c)=>{
          const b=Math.floor(c.salary*0.2); c.cash+=b; c.stats.moneyEarned+=b
          c.mind.happiness=Math.min(100,c.mind.happiness+10)
          return {text:`绩效不错！老板发了 $${b} 奖金！`}
        }},

      // === 社交类 ===
      { id:'friend_call', cat:'social', icon:'📱',
        cond:(c,t,n)=>{
          const f=Object.values(n.npcs).filter(x=>x.met&&x.relationLevel!=='stranger')
          return f.length>0 && Math.random()<0.07
        },
        exec:(c,t,n)=>{
          const fs=Object.values(n.npcs).filter(x=>x.met&&x.relationLevel!=='stranger')
          const f=fs[Math.floor(Math.random()*fs.length)]
          f.relation.intimacy=Math.min(100,f.relation.intimacy+2)
          c.mind.loneliness=c.mind.loneliness?Math.max(0,c.mind.loneliness-5):0
          return {text:`${f.name}突然打了个电话，聊了二十分钟。`}
        }},
      { id:'gossip', cat:'social', icon:'🗣️',
        cond:(t)=>['noon','evening'].includes(t.timeOfDay) && Math.random()<0.05,
        exec:()=>{
          const g=['听说CBD那家公司又裁员了','附近新开了一家超好吃的小店','有人在公园捡到一只柯基']
          return {text:g[Math.floor(Math.random()*g.length)]}
        }},
      { id:'neighbor_noise', cat:'social', icon:'😤',
        cond:(c,t)=>t.timeOfDay==='night' && (c.housing?.type==='rent_shared') && Math.random()<0.06,
        exec:(c)=>{
          c.mind.stress=Math.min(100,c.mind.stress+8)
          c.mind.happiness=Math.max(0,c.mind.happiness-5)
          c.body.fatigue=Math.min(100,c.body.fatigue+8)
          return {text:'隔壁邻居深夜放音乐，吵得睡不着...'}
        }},

      // === 身体类（因果链）===
      { id:'headache', cat:'body', icon:'🤕',
        cond:(c,_,__,chain)=>c.mind.stress>60 && c.body.fatigue>50 && Math.random()<0.08,
        exec:(c,_,__,chain)=>{
          c.body.energy-=15; c.mind.happiness-=5
          chain.headacheCount=(chain.headacheCount||0)+1
          return {text:'压力太大加上疲劳，突然一阵头疼...'}
        }},
      { id:'insomnia', cat:'body', icon:'😵',
        cond:(c,_,__,chain)=>c.mind.stress>70 && (chain.headacheCount||0)>0 && Math.random()<0.1,
        exec:(c)=>{
          c.body.fatigue+=15; c.mind.stress+=5; c.mind.happiness-=5
          return {text:'翻来覆去睡不着...失眠了。'}
        }},
      { id:'forced_hospital', cat:'body', icon:'🏥',
        cond:(c)=>c.body.health<20 && !c.body.sick && Math.random()<0.15,
        exec:(c)=>{
          c.body.sick=true; c.body.sickType={type:'exhaustion',name:'过劳'}; c.body.sickDays=3
          c.cash-=300; c.stats.moneySpent+=300
          return {text:'身体撑不住了，被紧急送医！花了$300，医生说必须休息三天。'}
        }},
      { id:'good_sleep', cat:'body', icon:'😴',
        cond:(c,t)=>t.hour===6 && c.body.fatigue<20 && Math.random()<0.25,
        exec:(c)=>{
          c.body.energy=Math.min(100,c.body.energy+15)
          c.mind.happiness=Math.min(100,c.mind.happiness+8)
          return {text:'昨晚睡得特别香！今天元气满满~'}
        }},
      { id:'workout_high', cat:'body', icon:'✨',
        cond:(c)=>c.skills.fitness?.level>=2 && c.body.energy>50 && Math.random()<0.08,
        exec:(c)=>{
          c.mind.happiness+=12; c.mind.stress-=10; c.body.appearance=(c.body.appearance||50)+1
          return {text:'运动后的多巴胺让你感觉超级好！'}
        }},

      // === 灵感/机遇 ===
      { id:'creative_spark', cat:'opportunity', icon:'💡',
        cond:(c,t)=>c.mind.inspiration>60 && ['rainy','cloudy'].includes(t.weather) && Math.random()<0.08,
        exec:(c)=>{
          c.mind.inspiration+=20
          return {text:'窗外的雨声激发了你的灵感，涌现出绝妙的想法！'}
        }},
      { id:'job_offer', cat:'opportunity', icon:'💼',
        cond:(c)=>c.social.reputation>30 && c.skills.coding?.level>=3 && Math.random()<0.04,
        exec:()=>{
          return {text:'一家大公司HR联系你了，想约面试。难得的机会！'}
        }},
      { id:'side_hustle', cat:'opportunity', icon:'✍️',
        cond:(c)=>c.skills.writing?.level>=2 && Math.random()<0.05,
        exec:(c)=>{
          const earn=50+c.skills.writing.level*30; c.cash+=earn; c.stats.moneyEarned+=earn
          return {text:`你写的文章火了！平台给了 $${earn} 稿费！`}
        }},

      // === 天气联动 ===
      { id:'rain_no_umbrella', cat:'weather', icon:'🌧️',
        cond:(c,t)=>t.weather==='rainy' && Math.random()<0.12,
        exec:(c)=>{
          c.body.health-=3; c.mind.happiness-=3
          return {text:'出门没带伞被淋了一阵...要注意别感冒了。'}
        }},
      { id:'sunset', cat:'weather', icon:'🌅',
        cond:(c,t)=>t.weather==='sunny' && t.timeOfDay==='evening' && Math.random()<0.15,
        exec:(c)=>{
          c.mind.happiness+=8; c.mind.stress-=5; c.mind.inspiration=(c.mind.inspiration||40)+5
          return {text:'抬头看到绝美晚霞，驻足了好一会儿。'}
        }},
      { id:'snow_fun', cat:'weather', icon:'❄️',
        cond:(c,t)=>t.weather==='snowy' && Math.random()<0.1,
        exec:(c)=>{
          c.mind.happiness+=10; c.mind.stress-=8
          return {text:'下雪了！整个城市银装素裹，你忍不住踩了几脚。'}
        }},

      // === 随机奇遇 ===
      { id:'stray_cat', cat:'random', icon:'🐱',
        cond:(c,t)=>t.timeOfDay==='evening' && (!c.pets||c.pets.length===0) && Math.random()<0.04,
        exec:(c)=>{
          c.mind.happiness+=5; c.pets=(c.pets||[]); c.pets.push({type:'cat',name:'小橘',mood:80})
          return {text:'路边遇到一只小橘猫一直蹭你腿...你决定带它回家！🐱'}
        }},
      { id:'lucky_day', cat:'random', icon:'🌟',
        cond:(c)=>c.mind.happiness>80 && Math.random()<0.03,
        exec:(c)=>{
          c.cash+=200; c.social.charm=(c.social.charm||30)+2; c.mind.inspiration=(c.mind.inspiration||40)+10
          return {text:'今天运气爆棚！什么事都顺顺利利！'}
        }},
      { id:'old_friend', cat:'random', icon:'🤗',
        cond:(t)=>t.timeOfDay==='afternoon' && Math.random()<0.02,
        exec:(c)=>{
          c.mind.happiness+=10
          if(c.mind.loneliness!==undefined) c.mind.loneliness=Math.max(0,(c.mind.loneliness||30)-10)
          return {text:'在街上偶遇多年不见的老同学！约好下次一起吃饭。'}
        }}
    ]
  }

  _initAchievements() {
    return [
      { id:'first_job', name:'打工人', desc:'找到第一份工作', icon:'💼',
        cond:c=>c.job.current, unlocked:false },
      { id:'first_10k', name:'小有积蓄', desc:'存款破万', icon:'💰',
        cond:c=>(c.cash+(c.savings||0))>=10000, unlocked:false },
      { id:'social_butterfly', name:'社交达人', desc:'认识5人以上', icon:'🦋',
        cond:c=>c.stats.npcsMetCount>=5, unlocked:false },
      { id:'fitness_lv3', name:'健身达人', desc:'健身Lv3', icon:'💪',
        cond:c=>c.skills.fitness?.level>=3, unlocked:false },
      { id:'coding_lv5', name:'代码高手', desc:'编程Lv5', icon:'👨‍💻',
        cond:c=>c.skills.coding?.level>=5, unlocked:false },
      { id:'cat_owner', name:'铲屎官', desc:'收养猫咪', icon:'🐱',
        cond:c=>c.pets?.length>0, unlocked:false },
      { id:'survived_30', name:'月光族', desc:'度过30天', icon:'📅',
        cond:c=>c.stats.totalDays>=30, unlocked:false },
      { id:'rich', name:'有钱人', desc:'总资产5万', icon:'🤑',
        cond:c=>(c.cash+(c.savings||0)-(c.debt||0))>=50000, unlocked:false }
    ]
  }

  /** 检查并触发事件 */
  check(character, time, npcEngine) {
    const triggered = []
    for (const evt of this.eventPool) {
      try {
        if (evt.cond(character, time, npcEngine, this.chainState)) {
          const result = evt.exec(character, time, npcEngine, this.chainState)
          triggered.push({ ...result, id:evt.id, icon:evt.icon || '📢', type:evt.cat })
          this.eventLog.push({ ...triggered[triggered.length-1],
            time: `${time.dateString} ${time.timeString}` })
          if (this.eventLog.length > 50) this.eventLog.shift()
        }
      } catch(e) { /* skip */ }
    }
    return triggered
  }

  /** 检查成就 */
  checkAchievements(character) {
    const newAchs = []
    for (const ach of this.achievementDefs) {
      if (ach.unlocked) continue
      try {
        if (ach.cond(character)) {
          ach.unlocked = true
          newAchs.push(ach)
        }
      } catch(e) {}
    }
    return newAchs
  }

  serialize() {
    return { log:this.eventLog, chain:this.chainState,
      achievements:this.achievements,
      defs:this.achievementDefs.map(a=>({id:a.id,unlocked:a.unlocked})) }
  }
  deserialize(d) {
    if(d?.log) this.eventLog=d.log
    if(d?.chain) this.chainState=d.chain
    if(d?.achievements) this.achievements=d.achievements
    if(d?.defs) d.defs.forEach(s=>{
      const a=this.achievementDefs.find(x=>x.id===s.id)
      if(a) a.unlocked=s.unlocked
    })
  }
}

/**
 * 「另一种人生」—— 事件引擎 v2
 * 因果链条件触发 + 连锁事件 + 成就系统
 */
class EventEngine {
  constructor() {
    this.eventPool = this._initEvents();
    this.activeEvents = [];
    this.eventLog = [];
    this.achievements = [];
    this.achievementDefs = this._initAchievements();
    this.chainState = {}; // 跟踪因果链状态
  }

  _initEvents() {
    return [
      // === 经济类 ===
      { id:'found_money', cat:'economy', weight:3,
        cond:(c,t)=>Math.random()<0.03,
        exec:(c)=>{ const a=Math.floor(Math.random()*50)+10; c.finance.cash+=a; return {text:`路边发现了 $${a}！运气不错~`,icon:'💰',effects:{cash:a}}; }},
      { id:'wallet_lost', cat:'economy', weight:2,
        cond:(c,t)=>c.finance.cash>500 && (t.timeOfDay==='night'||t.timeOfDay==='lateNight') && Math.random()<0.02,
        exec:(c)=>{ const l=Math.floor(c.finance.cash*0.2); c.finance.cash-=l; c.mind.happiness-=10; c.mind.stress+=15; return {text:`钱包被偷了！损失 $${l}...要更小心了。`,icon:'😱'}; }},
      { id:'stock_tip', cat:'economy', weight:2,
        cond:(c,t,n)=>{ const f=Object.values(n.npcs).filter(x=>x.relationLevel==='friend'||x.relationLevel==='closeFriend'); return f.length>0&&Math.random()<0.05; },
        exec:(c)=>{ c.mind.inspiration+=10; return {text:'一个朋友私下告诉你，最近科技板块有大动作，值得关注。',icon:'📈'}; }},
      { id:'rent_increase', cat:'economy', weight:1,
        cond:(c,t)=>t.day===1&&Math.random()<0.08,
        exec:(c)=>{ const i=Math.floor(c.finance.monthlyRent*0.08); c.finance.monthlyRent+=i; c.mind.stress+=8; return {text:`房东来消息了：下个月房租涨 $${i}...月租现在 $${c.finance.monthlyRent}。`,icon:'🏠'}; }},
      { id:'freelance_offer', cat:'economy', weight:2,
        cond:(c)=>c.skills.coding?.level>=2 && c.social.reputation>20 && Math.random()<0.06,
        exec:(c)=>{ const pay=c.skills.coding.level*80+100; c.finance.cash+=pay; c.mind.stress+=5; return {text:`接到一个外包单子！用了半天搞定，赚了 $${pay}。`,icon:'💻'}; }},
      { id:'bonus', cat:'economy', weight:2,
        cond:(c,t)=>c.job.current && c.job.performance>70 && t.day===15 && Math.random()<0.3,
        exec:(c)=>{ const b=Math.floor(c.job.salary*0.2); c.finance.cash+=b; c.mind.happiness+=10; return {text:`绩效不错！老板发了 $${b} 奖金！`,icon:'🎉'}; }},

      // === 社交类 ===
      { id:'friend_call', cat:'social', weight:3,
        cond:(c,t,n)=>{ const f=Object.values(n.npcs).filter(x=>x.met&&x.relationLevel!=='stranger'); return f.length>0&&Math.random()<0.07; },
        exec:(c,t,n)=>{ const fs=Object.values(n.npcs).filter(x=>x.met&&x.relationLevel!=='stranger'); const f=fs[Math.floor(Math.random()*fs.length)]; f.relation.intimacy=Math.min(100,f.relation.intimacy+2); c.mind.loneliness=Math.max(0,c.mind.loneliness-5); return {text:`${f.name}突然给你打了个电话，聊了二十分钟，心情好了不少。`,icon:'📱'}; }},
      { id:'gossip', cat:'social', weight:3,
        cond:(c,t)=>(t.timeOfDay==='noon'||t.timeOfDay==='evening')&&Math.random()<0.05,
        exec:(c)=>{ c.mind.happiness+=3; const gossips=['听说CBD那家公司又裁员了...','附近新开了一家超好吃的店！','有人在公园捡到了一只柯基！']; return {text:gossips[Math.floor(Math.random()*gossips.length)],icon:'🗣️'}; }},
      { id:'neighbor_noise', cat:'social', weight:2,
        cond:(c,t)=>t.timeOfDay==='night'&&c.housing.type==='rent_shared'&&Math.random()<0.06,
        exec:(c)=>{ c.mind.stress+=8; c.mind.happiness-=5; c.body.fatigue+=8; return {text:'隔壁邻居深夜放音乐，吵得你翻来覆去睡不着...明天要不要去沟通一下？',icon:'😤'}; }},
      { id:'met_stranger', cat:'social', weight:2,
        cond:(c,t)=>t.timeOfDay==='afternoon'&&c.social.charm>20&&Math.random()<0.04,
        exec:(c)=>{ c.social.charm+=1; c.mind.loneliness-=3; return {text:'在路上偶遇一个有趣的人，聊了几句交换了联系方式。也许以后会成为朋友？',icon:'🤝'}; }},

      // === 身体类（因果链）===
      { id:'headache', cat:'body', weight:3,
        cond:(c)=>c.mind.stress>60&&c.body.fatigue>50&&Math.random()<0.08,
        exec:(c,t,n,chain)=>{ c.body.energy-=15; c.mind.happiness-=5; chain.headacheCount=(chain.headacheCount||0)+1; return {text:'压力太大加上疲劳，突然一阵头疼...需要好好休息了。',icon:'🤕'}; }},
      { id:'insomnia', cat:'body', weight:2,
        cond:(c,t,n,chain)=>c.mind.stress>70&&(chain.headacheCount||0)>0&&Math.random()<0.1,
        exec:(c)=>{ c.body.fatigue+=15; c.mind.stress+=5; c.mind.happiness-=5; return {text:'翻来覆去睡不着...脑子里全是乱七八糟的想法。失眠了。',icon:'😵'}; }},
      { id:'forced_hospital', cat:'body', weight:1,
        cond:(c,t,n,chain)=>c.body.health<20&&!c.body.sick&&Math.random()<0.15,
        exec:(c)=>{ c.body.sick=true; c.body.sickType={type:'exhaustion',name:'过劳'}; c.body.sickDays=3; c.finance.cash-=300; return {text:'身体终于撑不住了，被紧急送去医院...花了$300，医生说必须休息三天。',icon:'🏥'}; }},
      { id:'good_sleep', cat:'body', weight:3,
        cond:(c,t)=>t.hour===6&&c.body.fatigue<20&&Math.random()<0.25,
        exec:(c)=>{ c.body.energy=Math.min(100,c.body.energy+15); c.mind.happiness+=8; return {text:'昨晚睡得特别香！今天元气满满～',icon:'😴'}; }},
      { id:'workout_high', cat:'body', weight:2,
        cond:(c)=>c.skills.fitness?.level>=2&&c.body.energy>50&&Math.random()<0.08,
        exec:(c)=>{ c.mind.happiness+=12; c.mind.stress-=10; c.body.appearance+=1; return {text:'运动后的多巴胺让你感觉超级好！整个人都在发光！',icon:'✨'}; }},

      // === 灵感/机遇 ===
      { id:'creative_spark', cat:'opportunity', weight:2,
        cond:(c,t)=>c.mind.inspiration>60&&(t.weather==='rainy'||t.weather==='cloudy')&&Math.random()<0.08,
        exec:(c)=>{ c.mind.inspiration+=20; return {text:'窗外的雨声激发了你的灵感，脑子里涌现出一个绝妙的想法！',icon:'💡'}; }},
      { id:'job_offer', cat:'opportunity', weight:2,
        cond:(c)=>c.social.reputation>30&&c.skills.coding?.level>=3&&Math.random()<0.04,
        exec:(c)=>{ return {text:'一家大公司的HR联系了你，说对你很感兴趣，想约个面试。这是个难得的机会！',icon:'💼'}; }},
      { id:'side_hustle', cat:'opportunity', weight:2,
        cond:(c)=>c.skills.writing?.level>=2&&Math.random()<0.05,
        exec:(c)=>{ const earn=50+c.skills.writing.level*30; c.finance.cash+=earn; return {text:`你写的一篇文章获得了不少关注，平台给了 $${earn} 稿费！`,icon:'✍️'}; }},

      // === 天气联动 ===
      { id:'rain_no_umbrella', cat:'weather', weight:3,
        cond:(c,t)=>t.weather==='rainy'&&Math.random()<0.12,
        exec:(c)=>{ c.body.health-=3; c.mind.happiness-=3; return {text:'出门没带伞，被淋了一阵...要注意别感冒了。',icon:'🌧️'}; }},
      { id:'beautiful_sunset', cat:'weather', weight:3,
        cond:(c,t)=>t.weather==='sunny'&&t.timeOfDay==='evening'&&Math.random()<0.15,
        exec:(c)=>{ c.mind.happiness+=8; c.mind.stress-=5; c.mind.inspiration+=5; return {text:'抬头看到一片绝美的晚霞，橙红色铺满了整个天空。驻足了好一会儿。',icon:'🌅'}; }},
      { id:'snow_fun', cat:'weather', weight:2,
        cond:(c,t)=>t.weather==='snowy'&&Math.random()<0.1,
        exec:(c)=>{ c.mind.happiness+=10; c.mind.stress-=8; return {text:'下雪了！整个城市银装素裹，你忍不住在雪地里踩了几脚，心情大好。',icon:'❄️'}; }},

      // === 随机奇遇 ===
      { id:'lottery_small', cat:'random', weight:2,
        cond:(c)=>c.inventory?.includes('lottery')&&Math.random()<0.12,
        exec:(c)=>{ const p=Math.floor(Math.random()*100)+20; c.finance.cash+=p; c.inventory=c.inventory.filter(i=>i!=='lottery'); return {text:`彩票中了！虽然只有 $${p}，但也是白来的嘛！`,icon:'🎉'}; }},
      { id:'stray_cat', cat:'random', weight:1,
        cond:(c,t)=>t.timeOfDay==='evening'&&c.housing.pets.length===0&&Math.random()<0.04,
        exec:(c)=>{ c.mind.happiness+=5; c.housing.pets.push({type:'cat',name:'小橘',mood:80}); return {text:'路边遇到一只小橘猫，它一直蹭你的腿不肯走...你决定带它回家了！🐱',icon:'🐱'}; }},
      { id:'lucky_day', cat:'random', weight:1,
        cond:(c)=>c.mind.happiness>80&&Math.random()<0.03,
        exec:(c)=>{ c.finance.cash+=200; c.social.charm+=2; c.mind.inspiration+=10; return {text:'今天运气爆棚！什么事都顺顺利利，感觉全世界都在帮你！',icon:'🌟'}; }},
      { id:'old_friend', cat:'random', weight:1,
        cond:(c,t)=>t.timeOfDay==='afternoon'&&Math.random()<0.02,
        exec:(c)=>{ c.mind.happiness+=10; c.mind.loneliness-=10; return {text:'在街上偶遇了一个多年不见的老同学！你们聊了好久，约了下次一起吃饭。',icon:'🤗'}; }}
    ];
  }

  _initAchievements() {
    return [
      { id:'first_job', name:'打工人', desc:'找到第一份工作', icon:'💼', cond:(c)=>c.job.current, unlocked:false },
      { id:'first_10k', name:'小有积蓄', desc:'存款突破$10,000', icon:'💰', cond:(c)=>c.finance.cash+c.finance.savings>=10000, unlocked:false },
      { id:'social_butterfly', name:'社交达人', desc:'认识5个以上的人', icon:'🦋', cond:(c)=>c.stats.npcsMetCount>=5, unlocked:false },
      { id:'fitness_lv3', name:'健身达人', desc:'健身技能达到3级', icon:'💪', cond:(c)=>c.skills.fitness?.level>=3, unlocked:false },
      { id:'coding_lv5', name:'代码高手', desc:'编程技能达到5级', icon:'👨‍💻', cond:(c)=>c.skills.coding?.level>=5, unlocked:false },
      { id:'cooking_lv3', name:'美食家', desc:'烹饪技能达到3级', icon:'👨‍🍳', cond:(c)=>c.skills.cooking?.level>=3, unlocked:false },
      { id:'cat_owner', name:'铲屎官', desc:'收养一只猫', icon:'🐱', cond:(c)=>c.housing.pets?.length>0, unlocked:false },
      { id:'survived_30', name:'月光族', desc:'度过30天', icon:'📅', cond:(c)=>c.stats.totalDays>=30, unlocked:false },
      { id:'rich', name:'有钱人', desc:'总资产突破$50,000', icon:'🤑', cond:(c)=>c.finance.cash+c.finance.savings>=50000, unlocked:false },
      { id:'stress_free', name:'佛系人生', desc:'压力降到10以下', icon:'🧘', cond:(c)=>c.mind.stress<10, unlocked:false },
    ];
  }

  /** 检查并触发事件 */
  check(character, time, npcEngine) {
    const triggered = [];
    for (const evt of this.eventPool) {
      try {
        if (evt.cond(character, time, npcEngine, this.chainState)) {
          const result = evt.exec(character, time, npcEngine, this.chainState);
          result.id = evt.id;
          result.name = evt.name || evt.id;
          triggered.push(result);
          this.eventLog.push({ ...result, time: time.dateString + ' ' + time.timeString });
          if (this.eventLog.length > 50) this.eventLog.shift();
        }
      } catch(e) {}
    }
    this.activeEvents = triggered;
    return triggered;
  }

  /** 检查成就 */
  checkAchievements(character) {
    const newAchievements = [];
    for (const ach of this.achievementDefs) {
      if (ach.unlocked) continue;
      try {
        if (ach.cond(character)) {
          ach.unlocked = true;
          this.achievements.push({ ...ach, time: new Date().toISOString() });
          newAchievements.push(ach);
        }
      } catch(e) {}
    }
    return newAchievements;
  }

  serialize() { return { log:this.eventLog, chain:this.chainState, achievements:this.achievements, defs:this.achievementDefs.map(a=>({id:a.id,unlocked:a.unlocked})) }; }
  deserialize(d) {
    if (d?.log) this.eventLog = d.log;
    if (d?.chain) this.chainState = d.chain;
    if (d?.achievements) this.achievements = d.achievements;
    if (d?.defs) d.defs.forEach(s => { const a = this.achievementDefs.find(x=>x.id===s.id); if (a) a.unlocked = s.unlocked; });
  }
}

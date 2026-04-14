/**
 * 「另一种人生」—— NPC 系统引擎 v2
 * 动态对话 + 主动行为 + 口碑传播 + 情境感知
 */
class NPCEngine {
  constructor() {
    this.npcs = {};
    this.pendingMessages = []; // NPC主动发来的消息队列
    this._initNPCs();
  }

  _initNPCs() {
    const templates = [
      { id: 'xiaowang', name: '小王', gender: 'male', age: 24, job: '程序员', location: 'cbd',
        personality: { extroversion: 70, kindness: 80, humor: 60, ambition: 50 },
        avatar: '👨‍💻', bio: '你合租的室友，为人热心，喜欢打游戏。',
        dialogPool: {
          greetings: ['哟，回来啦！', '今天怎么样？', '嘿嘿，在呢！'],
          happy: ['你今天看起来心情不错啊！', '有什么好事分享一下？'],
          sad: ['怎么了？看你不太开心...', '要不一起打两把游戏解闷？'],
          tired: ['你看起来好累...早点休息吧。', '要不要帮你带杯咖啡？'],
          rainy: ['下雨天，适合窝在家里打游戏！', '出门记得带伞啊！'],
          topics: ['最近有款新游戏超火的！', '你知道吗，张哥又在加班了...', '中午一起吃饭？', '周末一起去网吧不？', '我在学一个新框架，有点头疼...']
        }
      },
      { id: 'linxi', name: '林夕', gender: 'female', age: 23, job: '咖啡师', location: 'artdistrict',
        personality: { extroversion: 40, kindness: 75, humor: 50, ambition: 60 },
        avatar: '👩‍🎨', bio: '文创区咖啡店的咖啡师，安静温柔，喜欢画画。',
        dialogPool: {
          greetings: ['你好呀~', '...嗯，来了。', '今天要喝什么？'],
          happy: ['你笑起来很好看。', '看你心情不错~'],
          sad: ['怎么了...要不要坐下来聊聊？', '给你做杯特调，暖暖心。'],
          tired: ['看你很疲惫...要不要来杯提神的？', '别太累了...'],
          rainy: ['下雨天，咖啡店里特别安静，我很喜欢。', '雨天适合画画...'],
          topics: ['我最近在画一幅新作品...', '昨天看了一部很好的电影。', '你有没有觉得，这个城市的傍晚特别美？', '我在想要不要开个画展...', '那边新开了一家书店，一起去看看？']
        }
      },
      { id: 'zhangge', name: '张哥', gender: 'male', age: 35, job: '项目经理', location: 'cbd',
        personality: { extroversion: 60, kindness: 40, humor: 30, ambition: 90 },
        avatar: '👔', bio: '你的顶头上司，做事雷厉风行，要求很高。',
        dialogPool: {
          greetings: ['嗯。', '有事？', '来了。'],
          happy: ['效率不错，继续保持。', '看起来状态很好，多干点活。'],
          sad: ['收起你的情绪，这是职场。', '有困难就说，别影响工作。'],
          tired: ['年轻人要能吃苦。', '累？我比你忙十倍。'],
          rainy: ['下雨也要准时到。', '天气不好，路上注意安全。'],
          topics: ['下季度KPI要提30%。', '客户那边催得紧，抓紧时间。', '你的代码review了吗？', '下周有个重要presentation，准备一下。', '公司可能要裁员...你别说出去。']
        }
      },
      { id: 'laochen', name: '老陈', gender: 'male', age: 52, job: '小吃摊主', location: 'oldtown',
        personality: { extroversion: 80, kindness: 90, humor: 70, ambition: 20 },
        avatar: '👨‍🍳', bio: '老城区卖面的大叔，热情豪爽，认识半条街的人。',
        dialogPool: {
          greetings: ['哎呦！小伙子来啦！', '今天想吃啥？', '来来来，坐！'],
          happy: ['年轻人就该开开心心的！', '笑得这么开心，遇到好事了？'],
          sad: ['咋了？来，先吃碗面，什么烦恼都能解决。', '别难过啊，生活嘛，总有起起落落。'],
          tired: ['看你累坏了，来碗热汤面提提神。', '年轻人别太拼命了。'],
          rainy: ['下雨天生意清淡，要不坐下来喝碗汤？', '这雨下得，老寒腿又犯了...'],
          topics: ['这条街啊，我卖了二十年面了。', '听说对面那个铺子要换人了。', '你知道吗，小王昨天带了个姑娘来吃面...', '我女儿今年高考，压力大得很。', '这个月菜价涨了不少啊。']
        }
      },
      { id: 'meimei', name: '美美', gender: 'female', age: 26, job: '自媒体博主', location: 'downtown',
        personality: { extroversion: 90, kindness: 50, humor: 80, ambition: 85 },
        avatar: '💁‍♀️', bio: '社交达人，粉丝十万+，总有各种内部消息。',
        dialogPool: {
          greetings: ['Hi~拍张合照呗！', '嗨！最近可忙了~', 'Hey！好久不见！'],
          happy: ['你今天状态好好啊！是不是有什么好事？', '快快快，分享一下你的快乐秘诀！'],
          sad: ['怎么了宝？谁欺负你了？', '别不开心啦，我请你喝奶茶！'],
          tired: ['你也太拼了吧...注意身体啊！', '要不要我帮你介绍个按摩的地方？超好的！'],
          rainy: ['下雨天拍照好出片！', '天气这么差，宅家刷剧吧~'],
          topics: ['告诉你一个内幕，XXX那个品牌要搞大事了...', '最近有个赚钱的路子，要不要听听？', '我昨天粉丝又涨了五千！', '你觉得我发这条内容好不好？', '有个品牌找我合作，但是我在犹豫...']
        }
      },
      { id: 'dawei', name: '大卫', gender: 'male', age: 28, job: '健身教练', location: 'downtown',
        personality: { extroversion: 85, kindness: 70, humor: 60, ambition: 40 },
        avatar: '🏋️', bio: '阳光开朗的健身教练，每天都元气满满。',
        dialogPool: {
          greetings: ['兄弟！来锻炼啊！', 'Yo！今天练啥？', '嗨！看到你就开心！'],
          happy: ['状态不错啊！正适合来一组！', '今天你可以多加点重量！'],
          sad: ['不开心？来练一组就好了！运动分泌多巴胺！', '兄弟，出一身汗比什么都管用。'],
          tired: ['有点累的话就做做拉伸吧。', '别硬撑，身体最重要。'],
          rainy: ['下雨了正好不用跑步，室内练起来！', '雨天健身房人少，包场了哈哈！'],
          topics: ['最近在备赛，饮食控制太严了...', '你体脂多少？要不要测一下？', '我一哥们开了个拳击馆，一起去试试？', '蛋白粉别乱买，我给你推荐个好的。', '你核心力量得加强啊兄弟。']
        }
      },
      { id: 'lili', name: '莉莉', gender: 'female', age: 30, job: '银行职员', location: 'cbd',
        personality: { extroversion: 45, kindness: 60, humor: 35, ambition: 70 },
        avatar: '👩‍💼', bio: '做事认真严谨的银行人，懂很多理财知识。',
        dialogPool: {
          greetings: ['你好。', '嗯，有什么事？', '...来了。'],
          happy: ['看起来收益不错？', '心情好是好事，但别冲动消费。'],
          sad: ['投资有风险...别太放在心上。', '需要帮你看看财务状况吗？'],
          tired: ['工作是不是太累了？要注意劳逸结合。', '我也经常加班...能理解。'],
          rainy: ['雨天路滑，出行注意安全。', '这种天气适合在家看看理财书。'],
          topics: ['最近有个基金表现不错，你感兴趣吗？', '利率又要调了，提前做好准备。', '你的资产配置太激进了，我建议分散一下。', '别把鸡蛋放在一个篮子里。', '年底了，该做做财务总结了。']
        }
      },
      { id: 'afei', name: '阿飞', gender: 'male', age: 22, job: '外卖骑手', location: 'oldtown',
        personality: { extroversion: 65, kindness: 75, humor: 85, ambition: 30 },
        avatar: '🛵', bio: '乐天派外卖小哥，总能聊出各种奇葩故事。',
        dialogPool: {
          greetings: ['嘿！又见面了！', '路过路过~', '忙着呢，但可以聊两句！'],
          happy: ['哈哈你今天看起来不错嘛！', '笑啥呢？带我一个呗！'],
          sad: ['别丧啦！来听我讲个今天送外卖的奇葩事！', '人生嘛，就像我的电瓶车，总有没电的时候。'],
          tired: ['你也累？我今天跑了50单了...', '累了就歇歇，单子明天还有，命只有一条。'],
          rainy: ['下雨天单子多但路难走，又爱又恨...', '雨天补贴多！下吧下吧哈哈！'],
          topics: ['你猜我今天送餐遇到了啥？一个人点了10杯奶茶！', '告诉你个秘密，那家网红店其实贼难吃。', '我攒够钱要去考驾照了！', '有个大姐每天固定给我点好评，感动。', '你知道这条街哪家最好吃吗？我全知道！']
        }
      }
    ];
    templates.forEach(t => {
      this.npcs[t.id] = {
        ...t,
        relation: { trust: 10, intimacy: 5, respect: 10, like: 10 },
        relationLevel: 'stranger',
        memory: [],
        recentTopics: [], // 最近聊过的话题索引
        schedule: this._genSchedule(t),
        lastInteraction: null,
        lastInteractionDay: 0,
        met: false,
        mood: 'normal' // NPC也有心情
      };
    });
  }

  _genSchedule(npc) {
    const schedules = {
      '程序员': { weekday: { 9: 'office', 12: 'restaurant', 13: 'office', 18: 'home', 20: 'home' }, weekend: { 10: 'home', 14: 'park', 18: 'restaurant' } },
      '咖啡师': { weekday: { 8: 'cafe', 15: 'cafe', 17: 'park', 20: 'home' }, weekend: { 10: 'cafe', 14: 'library', 18: 'home' } },
      '项目经理': { weekday: { 8: 'office', 12: 'restaurant', 13: 'office', 21: 'bar' }, weekend: { 10: 'gym', 14: 'mall', 19: 'restaurant' } },
      '小吃摊主': { weekday: { 5: 'convenience', 7: 'restaurant', 14: 'restaurant', 21: 'home' }, weekend: { 5: 'convenience', 7: 'restaurant', 14: 'park', 20: 'home' } },
      '自媒体博主': { weekday: { 10: 'cafe', 14: 'mall', 18: 'restaurant', 21: 'bar' }, weekend: { 11: 'mall', 15: 'cafe', 20: 'bar' } },
      '健身教练': { weekday: { 7: 'gym', 12: 'restaurant', 13: 'gym', 20: 'home' }, weekend: { 8: 'gym', 12: 'park', 16: 'gym', 20: 'bar' } },
      '银行职员': { weekday: { 8: 'bank', 12: 'restaurant', 13: 'bank', 18: 'library', 21: 'home' }, weekend: { 10: 'home', 14: 'mall', 18: 'restaurant' } },
      '外卖骑手': { weekday: { 10: 'restaurant', 14: 'convenience', 18: 'restaurant', 22: 'home' }, weekend: { 10: 'convenience', 14: 'restaurant', 18: 'bar' } }
    };
    return schedules[npc.job] || schedules['外卖骑手'];
  }

  getNPCLocation(npcId, time) {
    const npc = this.npcs[npcId];
    if (!npc) return null;
    const sched = time.isWeekday ? npc.schedule.weekday : npc.schedule.weekend;
    let loc = 'home';
    for (const [hour, place] of Object.entries(sched).sort((a, b) => +a[0] - +b[0])) {
      if (time.hour >= +hour) loc = place;
    }
    return loc;
  }

  getNPCsAtLocation(locationId, time) {
    return Object.values(this.npcs).filter(npc => this.getNPCLocation(npc.id, time) === locationId);
  }

  /** 情境感知动态对话 */
  getDynamicGreeting(npcId, player, time) {
    const npc = this.npcs[npcId];
    if (!npc || !npc.dialogPool) return `${npc.name}看着你。`;
    const pool = npc.dialogPool;

    // 根据玩家状态选择对话类型
    let category = 'greetings';
    if (player.mind.happiness > 70) category = 'happy';
    else if (player.mind.happiness < 30 || player.mind.mood === 'sad' || player.mind.mood === 'depressed') category = 'sad';
    else if (player.body.fatigue > 70 || player.body.energy < 25) category = 'tired';
    if (time.weather === 'rainy' || time.weather === 'stormy') {
      if (Math.random() < 0.4) category = 'rainy';
    }

    const lines = pool[category] || pool.greetings;
    const line = lines[Math.floor(Math.random() * lines.length)];

    // 关系等级影响
    const rel = npc.relationLevel;
    let prefix = '';
    if (!npc.met) prefix = `你第一次遇到${npc.name}。${npc.bio}\n\n`;
    else if (rel === 'closeFriend') prefix = `${npc.name}一看到你就笑了：`;
    else if (rel === 'friend') prefix = `${npc.name}朝你走过来：`;
    else if (rel === 'acquaintance') prefix = `${npc.name}认出了你：`;
    else prefix = `${npc.name}看了你一眼：`;

    return prefix + `"${line}"`;
  }

  /** 获取NPC的话题（不重复） */
  getRandomTopic(npcId) {
    const npc = this.npcs[npcId];
    if (!npc?.dialogPool?.topics) return '...';
    const topics = npc.dialogPool.topics;
    // 过滤掉最近聊过的
    const available = topics.filter((_, i) => !npc.recentTopics.includes(i));
    const pool = available.length > 0 ? available : topics;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const idx = topics.indexOf(chosen);
    npc.recentTopics.push(idx);
    if (npc.recentTopics.length > 3) npc.recentTopics.shift();
    return chosen;
  }

  /** 社交互动 v2 */
  interact(npcId, type, character) {
    const npc = this.npcs[npcId];
    if (!npc) return null;
    if (!npc.met) { npc.met = true; character.stats.npcsMetCount++; }

    const results = { messages: [], relationChange: {}, effects: {} };
    const compat = this._calcCompatibility(npc, character);

    // 基础互动效果
    const interactions = {
      greet: { trust: 1, like: 1, intimacy: 0 },
      chat: { trust: 2, like: Math.round(2 * compat), intimacy: 2 },
      deepTalk: { trust: 5, like: 3, intimacy: 5 },
      treat: { trust: 3, like: 5, intimacy: 3, cost: 80 },
      gift: { trust: 2, like: 6, intimacy: 4, cost: 50 },
      askHelp: { trust: -2, like: -1, intimacy: 2 },
      hangout: { trust: 3, like: 4, intimacy: 5 }
    };
    const inter = interactions[type];
    if (!inter) return null;

    // 应用关系变化
    for (const key of ['trust', 'like', 'intimacy', 'respect']) {
      if (inter[key]) {
        const old = npc.relation[key] || 0;
        npc.relation[key] = Math.max(0, Math.min(100, old + (inter[key] || 0)));
        results.relationChange[key] = inter[key];
      }
    }
    results.cost = inter.cost || 0;

    // 动态生成互动文字
    const topic = this.getRandomTopic(npcId);
    const typeTexts = {
      greet: () => `你和${npc.name}打了个招呼。`,
      chat: () => `你和${npc.name}聊了起来。\n${npc.name}说："${topic}"`,
      deepTalk: () => `你和${npc.name}进行了一次深入的交谈。\n${npc.name}说："${topic}"\n你们聊了很久，彼此更了解了。`,
      treat: () => `你请${npc.name}吃了一顿饭。\n${npc.name}看起来很开心："谢谢你！下次我请！"`,
      gift: () => `你送了${npc.name}一个小礼物。\n${npc.name}${npc.personality.extroversion > 60 ? '惊喜地说："哇！谢谢你！"' : '有些不好意思："这...太客气了。"'}`,
      askHelp: () => {
        const willHelp = npc.relation.trust > 30 && npc.personality.kindness > 50;
        return willHelp ? `你向${npc.name}寻求帮助。\n${npc.name}说："没问题，我帮你。"` : `你向${npc.name}寻求帮助。\n${npc.name}犹豫了一下："这个...我不太方便。"`;
      },
      hangout: () => `你和${npc.name}一起出去玩了！\n你们${['逛了逛街','打了打游戏','看了场电影','在公园散了散步','去吃了好吃的'][Math.floor(Math.random()*5)]}，度过了开心的时光。`
    };
    results.messages.push((typeTexts[type] || typeTexts.chat)());

    // NPC性格回应
    if (npc.personality.extroversion > 60 && type !== 'greet') {
      npc.relation.like = Math.min(100, npc.relation.like + 1);
    }
    if (npc.personality.humor > 60 && Math.random() < 0.3) {
      results.messages.push(`${npc.name}讲了个笑话逗你开心。`);
      results.effects.happiness = 3;
    }

    // 关系等级更新
    const total = npc.relation.trust + npc.relation.like + npc.relation.intimacy;
    if (total > 200) npc.relationLevel = 'closeFriend';
    else if (total > 120) npc.relationLevel = 'friend';
    else if (total > 50) npc.relationLevel = 'acquaintance';
    else npc.relationLevel = 'stranger';

    // 记忆
    npc.memory.push({ type, summary: results.messages[0], mood: character.mind.mood });
    if (npc.memory.length > 30) npc.memory.shift();
    npc.lastInteraction = Date.now();

    // 口碑传播：好事/坏事会在NPC间传播
    if (type === 'treat' || type === 'gift') {
      this._spreadReputation(npcId, 'positive', character);
    }

    return results;
  }

  /** 口碑传播 */
  _spreadReputation(sourceNpcId, type, character) {
    const source = this.npcs[sourceNpcId];
    if (!source || source.relationLevel === 'stranger') return;
    // 朋友的朋友也会知道
    for (const npc of Object.values(this.npcs)) {
      if (npc.id === sourceNpcId || !npc.met) continue;
      const spreadChance = source.personality.extroversion / 200;
      if (Math.random() < spreadChance) {
        const change = type === 'positive' ? 2 : -3;
        npc.relation.like = Math.max(0, Math.min(100, npc.relation.like + change));
      }
    }
  }

  /** NPC主动行为（每天调用一次）*/
  dailyBehavior(player, time) {
    this.pendingMessages = [];
    for (const npc of Object.values(this.npcs)) {
      if (!npc.met) continue;
      const rel = npc.relation;
      const total = rel.trust + rel.like + rel.intimacy;
      const daysSince = time.day - (npc.lastInteractionDay || 0);

      // 朋友主动联系
      if (total > 80 && daysSince > 3 && Math.random() < 0.2) {
        const msgs = [
          `${npc.name}给你发消息："最近忙吗？好久没见了。"`,
          `${npc.name}来电话了："嘿，周末有空不？出来聚聚。"`,
          `${npc.name}发来一条动态，@了你。`
        ];
        this.pendingMessages.push({ npcId: npc.id, text: msgs[Math.floor(Math.random() * msgs.length)], type: 'social' });
      }

      // 密友在你困难时帮忙
      if (npc.relationLevel === 'closeFriend' && player.finance.cash < 200 && Math.random() < 0.15) {
        const amount = Math.floor(Math.random() * 300) + 200;
        player.finance.cash += amount;
        this.pendingMessages.push({ npcId: npc.id, text: `${npc.name}知道你最近手头紧，悄悄转了 $${amount} 给你："先用着，别客气。"`, type: 'social' });
        npc.relation.trust = Math.min(100, npc.relation.trust + 5);
      }

      // NPC带来机会
      if (npc.job === '自媒体博主' && total > 100 && Math.random() < 0.08) {
        this.pendingMessages.push({ npcId: npc.id, text: `美美说："我有个品牌合作的活，需要人帮忙，报酬不错，你要不要接？"`, type: 'opportunity' });
      }
      if (npc.job === '银行职员' && total > 80 && Math.random() < 0.06) {
        this.pendingMessages.push({ npcId: npc.id, text: `莉莉悄悄告诉你："下周有个理财产品收益很高，提前跟你说一声。"`, type: 'economy' });
      }

      // NPC心情波动
      npc.mood = ['happy','normal','normal','normal','sad'][Math.floor(Math.random()*5)];
    }
    return this.pendingMessages;
  }

  _calcCompatibility(npc, character) {
    const socialSkill = (character.skills.social?.level || 0) * 0.1 + 0.5;
    const charmBonus = character.social.charm / 100;
    return Math.min(2, socialSkill + charmBonus);
  }

  getRelationLabel(npcId) {
    const labels = { stranger: '陌生人', acquaintance: '认识', friend: '朋友', closeFriend: '密友' };
    return labels[this.npcs[npcId]?.relationLevel] || '陌生人';
  }

  serialize() { return JSON.parse(JSON.stringify({ npcs: this.npcs, pending: this.pendingMessages })); }
  deserialize(d) { if (d.npcs) { this.npcs = d.npcs; this.pendingMessages = d.pending || []; } else { this.npcs = d; this.pendingMessages = []; } }
}

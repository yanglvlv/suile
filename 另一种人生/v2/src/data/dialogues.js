/**
 * 对话树系统 — 每个NPC的完整对话数据
 * 结构: nodeId -> { text, choices[], effects{}, conditions{} }
 * 支持条件分支、关系变化、事件触发
 */

export const DialogueTrees = {

  // ════════════════════════════════════════
  // 小王 — 室友 / 程序员
  // 性格：外向、热心、幽默
  // 关系线：室友 → 好基友 → 铁哥们
  // ════════════════════════════════════════
  xiaowang: {
    root: {
      text: (ctx) => {
        if (!ctx.met) return "哟，新搬来的？我是小王，住你隔壁房间。有啥事随时喊我！"
        if (ctx.time.hour >= 23) return "这么晚还没睡？要不要来把游戏？"
        if (ctx.relation.intimacy > 60 && ctx.location === 'home') return "回来了！今天怎么样？"
        const greetings = [
          "嘿，又见面了！",
          "哟，今天精神不错啊~",
          "最近忙啥呢，好久没聊了。",
          "哎等等，你听说了吗——算了先不说。"
        ]
        return greetings[Math.floor(Math.random() * greetings.length)]
      },
      choices: [
        {
          text: "聊聊天",
          next: 'chat',
          condition: () => true,
          hint: '🗣️'
        },
        {
          text: "一起打游戏？",
          next: 'gaming',
          condition: (ctx) => ctx.location === 'home',
          hint: '🎮'
        },
        {
          text: "问问工作上的事",
          next: 'work_talk',
          condition: (ctx) => ctx.playerJob?.includes('程序') || ctx.playerJob?.includes('开发'),
          hint: '💻'
        },
        {
          text: "借点钱",
          next: 'borrow_money',
          condition: (ctx) => ctx.relation.trust > 40,
          hint: '💰'
        }
      ]
    },

    chat: {
      text: (ctx) => {
        const topics = {
          stranger: ["你是做什么工作的呀？感觉你挺忙的。", "这城市生活节奏真快，有时候觉得喘不过气...", "对了，你知道附近哪有好吃的推荐吗？"],
          acquaintance: ["最近那个新出的游戏你玩了没？超上头！", "我觉得我们该找个周末一起出去浪一下。", "说真的，你这人挺靠谱的，跟你合租挺开心。"],
          friend: ["兄弟我跟你说个秘密...算了下次吧哈哈", "周末要不组队去爬山？我看朋友圈有人去了不错", "你有没有觉得最近房租又要涨了？烦死了"],
          close: ["说实话，有些话我只敢跟你说。", "咱俩认识这么久了，有什么困难尽管开口。", "以后不管发生啥，我站你这边。"]
        }
        const level = ctx.relationLevel || 'stranger'
        const pool = topics[level] || topics.stranger
        return pool[Math.floor(Math.random() * pool.length)]
      },
      choices: [
        { text: "继续聊", next: 'chat_deep', hint: '💬' },
        { text: "换个话题", next: 'chat_topic', hint: '🔄' },
        { text: "告辞了", next: 'end', hint: '👋' }
      ],
      effects: { intimacy: 1, trust: 0.5 }
    },

    chat_deep: {
      text: (ctx) => {
        if (ctx.mood === 'stressed') return "看你脸色不太好啊，工作压力大？别硬扛着，身体要紧。"
        if (ctx.playerMoney < 500) return "手头紧？没事，大家都有难的时候。熬过去就好了。"
        const deepLines = [
          "其实我有时候也迷茫...写了这么多年代码，不知道未来在哪。",
          "你说咱们这种打工人，最后能混成啥样？",
          "我有想过回老家发展，但又放不下这边的一切...",
          "你知道吗，上次我差点辞职了。后来想了想还是算了。"
        ]
        return deepLines[Math.floor(Math.random() * deepLines.length)]
      },
      choices: [
        { text: '"我也经常这样想"', next: 'chat_empathy', hint: '🤝' },
        { text: '"别想太多，活在当下"', next: 'chat_chill', hint: '😌' },
        { text: '"那你到底想要什么？"', next: 'chat_question', hint: '❓' }
      ],
      effects: { intimacy: 3, trust: 2 }
    },

    chat_empathy: {
      text: "是吧！所以我说咱俩能聊到一块去。唉，至少还有你懂我。",
      choices: [
        { text: "干杯（以茶代酒）", next: 'end', effects: { intimacy: 5, like: 3 }, hint: '🍻' },
        { text: "以后常聊聊", next: 'end', hint: '👋' }
      ],
      effects: { intimacy: 2 }
    },

    chat_chill: {
      text: "你说得轻巧...不过也对，想太多确实没用。走，吃点东西去？",
      choices: [
        { text: "好啊，走吧！", next: 'end', effects: { intimacy: 3, happiness: 5 }, hint: '🍜' },
        { text: "下次吧", next: 'end', hint: '👋' }
      ]
    },

    chat_question: {
      text: "(沉默了一会儿)...说实话我也不知道。可能就是想要那种...被需要的感觉吧。算了不扯这些了！",
      choices: [
        { text: "我会支持你的", next: 'end', effects: { trust: 4, intimacy: 3 }, hint: '❤️' },
        { text: "加油", next: 'end', hint: '💪' }
      ],
      effects: { trust: 2 }
    },

    chat_topic: {
      text: (ctx) => {
        const topics = [
          "诶你看新闻了吗？那家大厂又在裁员了...",
          "昨天我看到一只超可爱的流浪猫！在楼下花坛那边。",
          "你觉得咱们房东怎么样？感觉人还行就是有点抠...",
          "最近有什么好看的电影吗？我想找时间看一部。"
        ]
        return topics[Math.floor(Math.random() * topics.length)]
      },
      choices: [
        { text: "接话聊下去", next: 'chat', hint: '💬' },
        { text: "改天再聊", next: 'end', hint: '👋' }
      ],
      effects: { intimacy: 1 }
    },

    gaming: {
      text: "来啊！正好我在打排位，缺个队友。上号上号！",
      choices: [
        { text: "来一把！", next: 'gaming_play', hint: '🎮' },
        { text: "今天就算了", next: 'root', hint: '🙅' }
      ],
      effects: { happiness: 3, intimacy: 2 }
    },

    gaming_play: {
      text: (ctx) => {
        const results = ["卧槽这波操作绝了！", "稳住稳住...nice！", "哎呀失误了，下波一定！", "哈哈哈哈太秀了吧"]
        return results[Math.floor(Math.random() * results.length)] + "\n\n(打了两个小时，眼睛都花了)"
      },
      choices: [
        { text: "明天再来", next: 'end', hint: '😴' },
        { text: "再来一局", next: 'gaming_play', hint: '🔄' }
      ],
      effects: { fatigue: 10, happiness: 8, intimacy: 3, energy: -15 }
    },

    work_talk: {
      text: "哦你也做技术的？那咱算同行了！你在哪个方向？前端后端？",
      choices: [
        { text: "前端", next: 'work_front', hint: '🖥️' },
        { text: "后端", next: 'work_back', hint: '⚙️' },
        { text: "全栈都做", next: 'work_fullstack', hint: '🔧' }
      ],
      effects: { respect: 2 }
    },

    work_front: {
      text: "前端啊，CSS那些搞得人头秃吧哈哈哈！不过现在前端越来越重要了，Vue React什么的。",
      choices: [
        { text: "交流一下技术", next: 'work_tech_chat', hint: '📚' },
        { text: "以后多交流", next: 'end', hint: '🤝' }
      ],
      effects: { intimacy: 3, inspiration: 3 }
    },

    work_back: {
      text: "后端？厉害啊，我现在主要写后端，微服务那一套搞死人。你用什么语言？Java? Go?",
      choices: [
        { text: "交流一下技术", next: 'work_tech_chat', hint: '📚' },
        { text: "以后多交流", next: 'end', hint: '🤝' }
      ],
      effects: { intimacy: 3, inspiration: 3 }
    },

    work_fullstack: {
      text: "全栈？？牛啊！现在全栈最值钱了，啥都能搞定。求带啊大佬！",
      choices: [
        { text: "哈哈互相学习", next: 'work_tech_chat', hint: '📚' },
        { text: "有空教你", next: 'end', effects: { respect: 5 }, hint: '👨‍🏫' }
      ],
      effects: { respect: 3, intimacy: 2 }
    },

    work_tech_chat: {
      text: "说到技术，我觉得最重要的是持续学习。不然分分钟被淘汰...哎又焦虑了哈哈",
      choices: [
        { text: "确实，共勉", next: 'end', effects: { motivation: 3, trust: 2 }, hint: '💪' },
        { text: "别太拼了注意休息", next: 'end', hint: '😌' }
      ],
      effects: { intimacy: 2 }
    },

    borrow_money: {
      text: (ctx) => {
        if (ctx.relation.trust < 50) return "呃...这个...我手头也不宽裕..."
        if (ctx.relation.trust >= 70) return "多少？说吧，能帮肯定帮。"
        return "出什么事了？需要多少？我先看看..."
      },
      choices: [
        { text: "借500应急", next: 'borrow_500', condition: (ctx) => ctx.relation.trust > 50, hint: '💵' },
        { text: "借1000周转", next: 'borrow_1000', condition: (ctx) => ctx.relation.trust > 65, hint: '💰' },
        { text: "算了不打扰了", next: 'end', hint: '👋' }
      ]
    },

    borrow_500: {
      text: "500啊，行，拿去。不用着急还，啥时候有了再说。(获得500元)",
      choices: [{ text: "谢谢兄弟！", next: 'end', hint: '🙏' }],
      effects: { money: 500, trust: -2, intimacy: 3 } // 借钱关系微妙变化
    },

    borrow_1000: {
      text: "1000...行吧，咱俩谁跟谁。转账你了哈。(获得1000元)\n\n(小王的脸色有点复杂)",
      choices: [{ text: "一定尽快还！", next: 'end', hint: '🙏' }],
      effects: { money: 1000, trust: -5, intimacy: 2 } // 大额借钱会降低信任
    },

    end: {
      text: (ctx) => {
        const byes = [
          "好的，回头聊！", "OK，有事找我~", "走了啊，注意安全！", "拜拜~"
        ]
        return byes[Math.floor(Math.random() * byes.length)]
      },
      choices: [],
      isEnd: true
    }
  },

  // ════════════════════════════════════════
  // 林夕 — 咖啡师 / 文艺女青年
  // 性格：内向、温柔、有艺术气质
  // 关系线：顾客 → 熟客 → 知心朋友 → 暧昧对象
  // ════════════════════════════════════════
  linxi: {
    root: {
      text: (ctx) => {
        if (!ctx.met) return "...(正在认真地打奶泡)...啊，抱歉没注意到您。请问想喝点什么？"
        if (ctx.time.hour >= 21) return "这么晚还来啊...店里快打烊了呢。(微笑)"
        if (ctx.location !== 'cafe') return "咦？在这里碰到你，好巧。"
        if (ctx.relation.intimacy > 50) return "你来啦~ 还是老样子？"
        const greetings = [
          "欢迎光临，今天想喝点什么？",
          "外面风很大吧？先进来暖暖。",
          "今天的新品是桂花拿铁，要试试吗？",
          "...(看到你) 啊，是你呀。"
        ]
        return greetings[Math.floor(Math.random() * greetings.length)]
      },
      choices: [
        { text: "点一杯咖啡", next: 'order_coffee', hint: '☕' },
        { text: "聊聊天", next: 'chat', condition: (ctx) => ctx.relation.intimacy > 15, hint: '💬' },
        { text: "问她最近在画什么", next: 'art_talk', hint: '🎨' },
        { text: "邀请她出去", next: 'invite_out', condition: (ctx) => ctx.relation.intimacy > 45 && ctx.time.hour >= 18, hint: '🌙' }
      ]
    },

    order_coffee: {
      text: "好的，请稍等...\n\n(她熟练地操作咖啡机，动作很优雅)",
      choices: [
        { text: "你的手艺真好", next: 'compliment_skill', hint: '✨' },
        { text: "谢谢，多少钱？", next: 'pay_coffee', hint: '💰' },
        { text: "你自己喜欢喝什么？", next: 'personal_preference', hint: '❓' }
      ],
      effects: { money: -25 }
    },

    compliment_skill: {
      text: "(微微一笑) 谢谢...其实还有很多要学的。你喜欢喝咖啡吗？不只是为了提神那种？",
      choices: [
        { text: "很喜欢，尤其是你做的", next: 'flirt_light', hint: '😊' },
        { text: "还行吧，主要是来放松", next: 'casual_reply', hint: '😌' }
      ],
      effects: { happiness: 3, intimacy: 1 }
    },

    flirt_light: {
      text: "(脸稍微红了一下)...你、你说话总是这样吗...(低头继续擦杯子)",
      choices: [
        { text: "我说的是实话", next: 'flirt_continue', hint: '❤️' },
        { text: "哈哈开玩笑的", next: 'back_off', hint: '😅' }
      ],
      effects: { intimacy: 3 }
    },

    flirt_continue: {
      text: "(小声)...谢谢。\n\n(气氛突然安静下来，只有咖啡机的嗡嗡声)",
      choices: [
        { text: "那...周末有空吗？", next: 'invite_date', hint: '📅' },
        { text: "(安静地享受这个时刻)", next: 'end', hint: '🌸' }
      ],
      effects: { intimacy: 5, like: 3 }
    },

    invite_date: {
      text: "周末...嗯...我可以看看行程。(耳根有点红)\n\n如果你来的话...我会准备特别款式的。",
      choices: [
        { text: "一言为定", next: 'date_confirmed', hint: '💌' },
        { text: "你考虑好了告诉我", next: 'end_gentle', hint: '🙂' }
      ],
      effects: { intimacy: 6, like: 5 }
    },

    date_confirmed: {
      text: "...好。那就这么说定了。\n\n(林夕的笑容比平时的更真实了一些)\n\n★ 触发约会事件：周末下午在咖啡店 ★",
      choices: [{ text: '(离开时心情很好)', next: 'end', hint: '🌟' }],
      triggerEvent: 'date_linxi_weekend'
    },

    back_off: {
      text: "(松了一口气但似乎又有点失望?) ...嗯，你真爱开玩笑。",
      choices: [{ text: "咖啡好了吗？", next: 'pay_coffee', hint: '☕' }]
    },

    casual_reply: {
      text: "嗯，很多人都是这样。能把这里当成一个可以放松的地方，我很开心。",
      choices: [
        { text: "这里确实很舒服", next: 'chat_deep', hint: '🏠' },
        { text: "你为什么想开咖啡店？", next: 'origin_story', hint: '📖' }
      ],
      effects: { intimacy: 2 }
    },

    pay_coffee: {
      text: "25元，给您。\n\n(递过来一杯拉花精致的咖啡)",
      choices: [
        { text: "坐一会儿再走", next: 'chat', hint: '💬' },
        { text: "带走，谢谢", next: 'end', hint: '👋' }
      ]
    },

    personal_preference: {
      text: "(思考了一下)...我喜欢手冲。单品豆的那种，能尝到不同产地的味道。你呢？",
      choices: [
        { text: "我不懂咖啡，教教我？", next: 'coffee_lesson', hint: '📚' },
        { text: "我喜欢甜的", next: 'sweet_tooth', hint: '🍯' }
      ],
      effects: { intimacy: 2 }
    },

    coffee_lesson: {
      text: "教你的话...嗯，下次你不忙的时候我可以慢慢给你讲。\n\n从产地、烘焙程度到冲泡手法...其实每杯咖啡都有自己的故事。",
      choices: [
        { text: "那我一定要来听", next: 'promise_return', hint: '✨' },
        { text: "听起来很有趣", next: 'end', hint: '👍' }
      ],
      effects: { intimacy: 4, trust: 2 }
    },

    promise_return: {
      text: "(点头) 嗯，我等你。\n\n★ 林夕对你的好感度上升了 ★",
      choices: [{ text: '(拿着咖啡离开了)', next: 'end', hint: '☕' }],
      effects: { intimacy: 3, like: 4 }
    },

    sweet_tooth: {
      text: "(笑) 甜的话...莫奇塔或者焦糖玛奇朵？下次给你多做一点糖浆。(开玩笑的语气)",
      choices: [{ text: "哈哈好啊", next: 'end', hint: '😄' }],
      effects: { intimacy: 2, happiness: 2 }
    },

    chat: {
      text: (ctx) => {
        const lines = {
          stranger: ["你经常来这里吗？", "看你的样子像是刚下班...", "今天天气不错呢。"],
          acquaintance: ["最近工作忙吗？你看起来有点累。", "我前两天画了一幅新的，还没完成...", "你有没有推荐的书籍？我想找点新的灵感。"],
          friend: ["其实开咖啡店没有想象中那么浪漫...很累的。", "有时候觉得这个城市好大好空...", "(犹豫了一下) 你...觉得我是一个什么样的人？"],
          close: ["谢谢你每次都来。...不只是因为生意啦。", "有你在的时候，店里的空气好像都不一样了。", "...我不想只做你的咖啡师朋友了。"]
        }
        const level = ctx.relationLevel || 'stranger'
        return (lines[level] || lines.stranger)[Math.floor(Math.random() * (lines[level] || lines.stranger).length)]
      },
      choices: [
        { text: "深入聊聊", next: 'chat_deep', hint: '💭' },
        { text: "说说自己的近况", next: 'share_self', hint: '🗣️' },
        { text: "先这样吧", next: 'end', hint: '👋' }
      ]
    },

    chat_deep: {
      text: "(放下手里的活，认真地看着你)",
      choices: [
        { text: '"你好像有心事"', next: 'worry_about_her', hint: '🤔' },
        { text: '"你画画多久了？"', next: 'art_history', hint: '🎨' },
        { text: '"你觉得幸福是什么？"', next: 'philosophy', hint: '💭' }
      ],
      effects: { intimacy: 2 }
    },

    worry_about_her: {
      text: "...有一点吧。主要是...觉得自己好像一直停在原地。别人都在往前走，只有我还在开这家小店。",
      choices: [
        { text: '"你已经很棒了"', next: 'encourage', hint: '💪' },
        { text: '"想改变的话就去改变"', next: 'push_change', hint: '🔥' },
        { text: '"也许停下也是一种前进"', next: 'wisdom', hint: '🌟' }
      ],
      effects: { trust: 3 }
    },

    encourage: {
      text: "(眼眶微红)...谢谢。你是第一个这样说的人。",
      choices: [{ text: "随时可以找我聊天", next: 'end_warm', hint: '❤️' }],
      effects: { intimacy: 8, like: 5 }
    },

    push_change: {
      text: "(沉默了一会儿)...你说得对。但我害怕...害怕改变之后失去现在拥有的一切。",
      choices: [{ text: "不会失去我的支持", next: 'support_promise', hint: '🤝' }],
      effects: { trust: 4, intimacy: 3 }
    },

    support_promise: {
      text: "(抬头看着你，眼神里有什么在发光)...真的吗？",
      choices: [{ text: "真的", next: 'end_warm', hint: '💕' }],
      effects: { intimacy: 7, like: 6, trust: 5 }
    },

    wisdom: {
      text: "(若有所思)...停下也是前进...吗？(轻轻重复了几遍) 我好像明白了什么。谢谢你。",
      choices: [{ text: "希望对你有帮助", next: 'end', hint: '🌟' }],
      effects: { intimacy: 5, trust: 4, inspiration: 5 }
    },

    art_history: {
      text: "从小就开始画了...父母不支持，说是不务正业。但我停不下来。画画是我唯一能表达自己的方式。",
      choices: [
        { text: "给我看看你的画", next: 'see_art', hint: '🖼️' },
        { text: "坚持到现在不容易", next: 'respect_art', hint: '👏' }
      ],
      effects: { trust: 3, intimacy: 2 }
    },

    see_art: {
      text: "现在？这里...不太方便...不过如果你愿意的话，哪天我可以带来给你看。\n\n(声音越来越小)",
      choices: [
        { text: "我很期待", next: 'promise_art', hint: '✨' },
        { text: "不着急", next: 'end', hint: '😊' }
      ],
      effects: { intimacy: 4, like: 3 }
    },

    promise_art: {
      text: "(点头，嘴角微微上扬)...嗯。到时候叫你。",
      choices: [{ text: '(心里暖暖地离开了)', next: 'end', hint: '🎨' }],
      effects: { intimacy: 3 }
    },

    respect_art: {
      text: "(苦笑) 不容易吗...有时候也想放弃的。但每次拿起画笔就...停不下来。",
      choices: [{ text: "那就是热爱吧", next: 'end_inspired', hint: '💡' }],
      effects: { intimacy: 3, inspiration: 3 }
    },

    philosophy: {
      text: "(愣了一下然后笑了)...你怎么突然问这么深的问题？\n\n(认真地想了一会儿)...幸福大概就是...做自己想做的事，和想在一起的人在一起吧。",
      choices: [
        { text: "说得真好", next: 'end_warm', hint: '❤️' },
        { text: "那你幸福吗？", next: 'ask_happiness', hint: '🤔' }
      ],
      effects: { intimacy: 3 }
    },

    ask_happiness: {
      text: "(看着窗外的街景)...以前不觉得。但最近...开始觉得好像差一点点。\n\n(转过头看了你一眼然后迅速移开视线)",
      choices: [
        { text: "差什么呢？", next: 'push_feelings', hint: '💕' },
        { text: "会找到的", next: 'end_gentle', hint: '🌸' }
      ],
      effects: { intimacy: 5 }
    },

    push_feelings: {
      text: "...你还非要问出来啊。(脸涨红了)\n\n...就是你这个笨蛋啦！\n\n(说完立刻转身假装忙碌去了)",
      choices: [{ text: '(心跳加速了一秒)', next: 'end_confession', hint: '💘' }],
      effects: { intimacy: 10, like: 10, triggerEvent: 'linxi_confession' }
    },

    art_talk: {
      text: (ctx) => !ctx.met
        ? "啊？你...怎么知道我画画的？"
        : "最近在画一组城市夜景...想把这座城市的每个时刻都记录下来。",
      choices: [
        { text: "能给我描述一下吗？", next: 'art_describe', hint: '🖼️' },
        { text: "我也想学画画", next: 'learn_art', hint: '🎨' },
        { text: "你有办过展吗？", next: 'art_exhibit', hint: '🖼️' }
      ],
      effects: { intimacy: 2 }
    },

    art_describe: {
      text: "嗯...比如凌晨四点的便利店灯光，或者下雨天的公交站台...那些没人注意的瞬间。\n\n我觉得它们才是这座城市真正的表情。",
      choices: [{ text: "说得好美", next: 'compliment_art', hint: '✨' }],
      effects: { inspiration: 5, intimacy: 3 }
    },

    compliment_art: {
      text: "(不好意思地笑)...没、没有那么啦。只是自己随便画画...",
      choices: [{ text: "我相信你会成功的", next: 'encourage', hint: '💪' }]
    },

    learn_art: {
      text: "你想学？那...我可以教你的基础。虽然我不是专业老师...",
      choices: [
        { text: "太好了！什么时候？", next: 'art_class_invite', hint: '📅' },
        { text: "怕耽误你时间", next: 'polite_decline', hint: '😅' }
      ],
      effects: { intimacy: 3 }
    },

    art_class_invite: {
      text: "每周二晚上店休，你可以来...如果你不介意的话。\n\n(用手指无意识地画着桌面的花纹)",
      choices: [{ text: "说好了", next: 'end', hint: '✅' }],
      effects: { intimacy: 4, skillGain: { art: 1 } }
    },

    polite_decline: {
      text: "不会耽误的...其实教别人的时候我自己也能学到新东西。",
      choices: [{ text: "那就这么说定了", next: 'end', hint: '🤝' }],
      effects: { intimacy: 2 }
    },

    art_exhibit: {
      text: "(摇头) 还没有...觉得自己还不够好。也许有一天吧。\n\n(看向窗外) 如果能在一个小小的画廊里展出就好了。哪怕只有一个观众。",
      choices: [
        { text: "我会去做你的观众", next: 'promise_viewer', hint: '🎫' },
        { text: "你一定可以的", next: 'encourage', hint: '💪' }
      ]
    },

    promise_viewer: {
      text: "(转过头来，眼中有星光)...真的？\n\n...那我要努力了。不能让观众失望。",
      choices: [{ text: '(约定成立)', next: 'end', hint: '⭐' }],
      effects: { intimacy: 6, like: 4, motivation: 5 }
    },

    origin_story: {
      text: "为什么开咖啡店吗...?(思考了很久)\n\n大概是因为...这里让我感到安全吧。可以一边做咖啡一边画画，没有人催我，没有人对我有期望。",
      choices: [
        { text: "安全很重要", next: 'agree_safety', hint: '🛡️' },
        { text: "但也该勇敢试试", next: 'brave_try', hint: '🦁' }
      ],
      effects: { trust: 3, intimacy: 3 }
    },

    agree_safety: {
      text: "嗯...你能理解真好。大多数人会说'你应该出去闯闯'之类的话。",
      choices: [{ text: "每个人节奏不一样", next: 'end', hint: '🎵' }],
      effects: { trust: 4, intimacy: 3 }
    },

    brave_try: {
      text: "(沉默良久)...我知道。我只是...还没准备好而已。\n\n但如果有个人陪我一起的话...也许可以试试。",
      choices: [{ text: "我陪你", next: 'support_promise', hint: '🤝' }],
      effects: { intimacy: 5, trust: 3 }
    },

    invite_out: {
      text: (ctx) => {
        if (ctx.time.hour >= 20) return "现在？这么晚...去哪里？"
        return "出去？...现在吗？"
      },
      choices: [
        { text: "去看电影", next: 'invite_movie', hint: '🎬' },
        { text: "去公园散步", next: 'invite_walk', hint: '🌳' },
        { text: "就在附近走走", nearby: 'invite_stroll', hint: '🚶' }
      ]
    },

    invite_movie: {
      text: "看电影...好啊。有一部文艺片我想看很久了但一个人不想去。",
      choices: [{ text: "那就走吧", next: 'date_start', hint: '🍿' }],
      effects: { intimacy: 4, money: -80 }
    },

    invite_walk: {
      text: "散步...晚上的公园应该很安静吧。好，我去换件衣服。",
      choices: [{ text: "门口等你", next: 'date_start', hint: '🌙' }],
      effects: { intimacy: 3 }
    },

    invite_stroll: {
      text: "嗯...好吧，反正也快下班了。稍等我五分钟。",
      choices: [{ text: "好", next: 'date_start', hint: '✨' }],
      effects: { intimacy: 2 }
    },

    date_start: {
      text: "★ 开始与林夕的约会 ★\n\n(她披着一件浅色的外套走出来，月光洒在她的头发上)",
      choices: [{ text: '(继续)', next: 'end_date', hint: '💕' }],
      triggerEvent: 'date_linxi',
      effects: { happiness: 15, stress: -10 }
    },

    share_self: {
      text: "嗯？你想说什么？(放下手中的杯子认真倾听)",
      choices: [
        { text: "说说工作压力", next: 'share_work', hint: '💼' },
        { text: "说说对未来的迷茫", next: 'share_future', hint: '🔮' },
        { text: "没什么，就是想找人说话", next: 'just_talk', hint: '💬' }
      ],
      effects: { intimacy: 2, trust: 1 }
    },

    share_work: {
      text: "(静静地听完)...听起来很辛苦。但你还在坚持，这说明你比你想象的要坚强。",
      choices: [{ text: "谢谢倾听", next: 'end_warm', hint: '🙏' }],
      effects: { stress: -8, intimacy: 3, trust: 2 }
    },

    share_future: {
      text: "迷茫...我懂这种感觉。(轻轻叹气)\n\n但其实迷茫说明你还在寻找。最可怕的不是迷茫，而是放弃了寻找。",
      choices: [{ text: "你说得对", next: 'end_inspired', hint: '💡' }],
      effects: { motivation: 5, intimacy: 4, trust: 3, inspiration: 3 }
    },

    just_talk: {
      text: "(微笑) 那就聊呗。反正现在也没什么客人。\n\n...和你聊天很开心。",
      choices: [{ text: "我也是", next: 'end_warm', hint: '😊' }],
      effects: { happiness: 8, intimacy: 3 }
    },

    end_warm: {
      text: "(温柔的微笑)...嗯。路上小心。",
      choices: [], isEnd: true
    },

    end_gentle: {
      text: "(轻轻点头)...嗯。再见。",
      choices: [], isEnd: true
    },

    end_inspired: {
      text: "(看着你的眼睛)...去吧，去做想做的事。\n\n★ 获得灵感 +5 ★",
      choices: [], isEnd: true
    },

    end_confession: {
      text: "(心跳声好大声...)\n\n★ 与林夕的关系进入了新阶段 ★",
      choices: [], isEnd: true
    },

    end_date: {
      text: "(今天的月色很美好...)",
      choices: [], isEnd: true
    },

    end: {
      text: (ctx) => {
        const byes = [
          "慢走，欢迎再来~", "路上小心...", "拜拜，明天见。"
        ]
        return byes[Math.floor(Math.random() * byes.length)]
      },
      choices: [], isEnd: true
    }
  },

  // ════════════════════════════════════════
  // 张哥 — 项目经理 / 上司
  // 性格：外向偏强势、野心大、要求高
  // 关系线：下属 → 得力干将 → 核心团队成员
  // ════════════════════════════════════════
  zhangge: {
    root: {
      text: (ctx) => {
        if (!ctx.met) return "(皱眉上下打量你)...新人？先自我介绍一下。"
        if (ctx.location === 'office') {
          const officeLines = [
            "那个项目进度怎么样了？",
            "客户又在催了，你们加把劲。",
            "方案发我邮箱了没？我还没看到。",
            "(正在打电话)...嗯对...好...行了先这样。(挂断) 你有什么事？"
          ]
          return officeLines[Math.floor(Math.random() * officeLines.length)]
        }
        if (ctx.location === 'bar') {
          return "(领带已经松开了，手里端着酒)...哦，是你啊。下班了就别叫我张哥了。"
        }
        const outsideLines = [
          "哟，在这碰到了。休假？",
          "...(正忙着看手机)...啊？有事说。",
          "别的地方见到你还真不习惯。"
        ]
        return outsideLines[Math.floor(Math.random() * outsideLines.length)]
      },
      choices: [
        { text: "汇报工作进度", next: 'report_work', hint: '📊', condition: (ctx) => ctx.location === 'office' },
        { text: "请教问题", next: 'ask_advice', hint: '❓' },
        { text: "申请加薪", next: 'raise_request', hint: '💰', condition: (ctx) => ctx.respect > 30 },
        { text: "闲聊几句", next: 'casual_chat', hint: '💬', condition: (ctx) => ctx.location !== 'office' || ctx.time.hour >= 19 },
        { text: "告辞", next: 'end', hint: '👋' }
      ]
    },

    report_work: {
      text: "说吧，简洁点。我三分钟后有个会。",
      choices: [
        { text: '"进度正常，按计划推进"', next: 'report_normal', hint: '✅' },
        { text: '"遇到一些困难但正在解决"', next: 'report_issue', hint: '⚠️' },
        { text: '"提前完成了"', next: 'report_ahead', hint: '🚀', condition: (ctx) => ctx.reputation > 20 }
      ],
      effects: {}
    },

    report_normal: {
      text: "嗯。继续保持。别掉链子就行。",
      choices: [{ text: "明白", next: 'end', hint: '👍' }],
      effects: { reputation: 1, respect: 0.5 }
    },

    report_issue: {
      text: "(眉头紧锁) 什么困难？资源不够？还是技术问题？\n\n...说具体点，我来协调。",
      choices: [
        { text: "详细说明情况", next: 'explain_issue', hint: '📝' },
        { text: "我们自己能解决", next: 'handle_self', hint: '💪' }
      ],
      effects: {}
    },

    explain_issue: {
      text: "(听完)...行，我知道了。你去跟产品那边沟通一下需求变更的事，其他的我来安排。\n\n遇到问题不要憋着不报，早说早解决。",
      choices: [{ text: "谢谢张哥", next: 'end_respect', hint: '🙏' }],
      effects: { reputation: 3, respect: 2, trust: 2 }
    },

    handle_self: {
      text: "哦？有志气。行，给你们两天时间。搞不定再找我。\n\n(看了看表) 去忙吧。",
      choices: [{ text: "好的", next: 'end', hint: '💪' }],
      effects: { reputation: 2, respect: 1 }
    },

    report_ahead: {
      text: "(意外地抬头看了一眼)...提前完成了？质量呢？\n\n...行，不错。这次算你做得好。下个项目给你加点难度。",
      choices: [
        { text: "没问题", next: 'end_praised', hint: '😤' },
        { text: "希望能给些更多机会", next: 'ask_opportunity', hint: '📈' }
      ],
      effects: { reputation: 5, respect: 3, motivation: 5 }
    },

    ask_opportunity: {
      text: "(靠在椅背上) 想要更多机会？那就要证明你不只是能完成任务，而是能带领团队。\n\n最近有个新项目在筹备负责人选，你感兴趣的话可以准备一下。",
      choices: [
        { text: "非常感兴趣！", next: 'project_lead_hint', hint: '🎯' },
        { text: "我还需要准备一下", next: 'end_thinking', hint: '🤔' }
      ],
      effects: { ambition: 3, reputation: 2 }
    },

    project_lead_hint: {
      text: "急什么。先把手上这件事做好，下周找我详细聊。\n\n(意味深长地看了你一眼)",
      choices: [{ text: '(心里燃起了斗志)', next: 'end', hint: '🔥' }],
      effects: { motivation: 8, reputation: 2 },
      triggerHint: 'project_leadership'
    },

    ask_advice: {
      text: "什么事？快点说，我很忙。",
      choices: [
        { text: "关于职业发展", next: 'advice_career', hint: '📈' },
        { text: "关于技术难题", next: 'advice_technical', hint: '🔧' },
        { text: "关于人际关系", next: 'advice_social', hint: '🤝' }
      ],
      effects: { trust: 1 }
    },

    advice_career: {
      text: (ctx) => ctx.respect < 30
        ? "职业发展？先把本职工作做好再说别的。基础不牢，什么都白搭。"
        : "...这个问题嘛。(难得的正经表情)\n\n你现在处于一个关键阶段。要么深耕技术成为专家，要么往管理方向发展。两条路都可以，但要趁早决定。",
      choices: [
        { text: "您觉得我适合哪个方向？", next: 'ask_direction', hint: '🧭' },
        { text: "我会好好考虑的", next: 'end_grateful', hint: '🙏' }
      ],
      effects: { inspiration: 3, respect: 1 }
    },

    ask_direction: {
      text: "(沉思片刻)...你执行力不错，沟通能力也可以。如果愿意承担压力的话，管理路线可能更适合你。\n\n当然，最终还是要看你自己。",
      choices: [{ text: "谢谢指点", next: 'end_grateful', hint: '🙏' }],
      effects: { ambition: 5, motivation: 5, respect: 2 }
    },

    advice_technical: {
      text: "技术问题是吧？什么领域？说清楚。\n\n(出乎意料地耐心起来——毕竟他当年也是技术出身)",
      choices: [
        { text: "详细描述问题", next: 'tech_solved', hint: '🔧' }
      ],
      effects: { inspiration: 5, intellect: 2, respect: 1 }
    },

    tech_solved: {
      text: "(听完分析)...你这个思路有问题。应该这样做...\n\n(居然讲了十五分钟，把问题的本质剖析得很清楚)",
      choices: [{ text: "原来如此！受教了", next: 'end_respect', hint: '🎓' }],
      effects: { intellect: 3, respect: 3, skillGain: { problem_solving: 2 } }
    },

    advice_social: {
      text: "(冷笑) 人际关系？办公室里记住一条：少说话多做事。不要站队，不要八卦。\n\n...当然，该表现的时候必须表现。机会不等人。",
      choices: [
        { text: "记住了", next: 'end', hint: '📝' },
        { text: "那怎么才能被注意到？", next: 'how_to_be_noticed', hint: '👀' }
      ],
      effects: { social: 1 }
    },

    how_to_be_noticed: {
      text: "(压低声音) 关键项目的关键节点。在老板面前露脸的机会不多，抓住了就是你的。\n\n...这事我就说这一次。好好把握。",
      choices: [{ text: "(默默记下了)", next: 'end_secret', hint: '🤫' }],
      effects: { social: 2, ambition: 3, trust: 2, reputation: 1 }
    },

    raise_request: {
      text: "加薪？(挑眉) 你的理由是什么？",
      choices: [
        { text: "业绩突出", next: 'raise_performance', hint: '📊', condition: (ctx) => ctx.reputation > 35 },
        { text: "市场行情涨了", next: 'raise_market', hint: '📈' },
        { text: "生活压力大", next: 'raise_personal', hint: '💸' }
      ],
      effects: {}
    },

    raise_performance: {
      text: "业绩...嗯，你最近确实做得不错。(翻看手机上的数据)\n\n行，我会在绩效评估时帮你争取的。能加多少不敢保证，但应该会有调整。",
      choices: [
        { text: "谢谢张哥！", next: 'end_good', hint: '🎉' },
        { text: "希望能加多一点", next: 'push_more', hint: '🤞' }
      ],
      effects: { motivation: 5, money: 200 }
    },

    raise_market: {
      text: "市场行情？(不耐烦) 别人都来跟我说市场行情。你要是真有能力，市场自然会来找你。\n\n拿出成绩来，钱不是求出来的。",
      choices: [{ text: "我知道了", next: 'end_hard', hint: '😤' }],
      effects: { motivation: -2 }
    },

    raise_personal: {
      text: "(皱眉) 谁的生活压力不大？公司不是慈善机构。\n\n...不过如果你真的有困难，可以先预支部分奖金。",
      choices: [
        { text: "不需要，我就是问问", next: 'end', hint: '😅' },
        { text: "那预支一些吧", next: 'advance_pay', hint: '💰' }
      ]
    },

    advance_pay: {
      text: "行，去找财务填个单子。最多预支半个月。\n\n(语气缓和了一点) 有困难早点说，别硬撑。",
      choices: [{ text: "谢谢", next: 'end_soft', hint: '🙏' }],
      effects: { money: Math.floor(ctx?.playerSalary || 3000 / 2), trust: 2 }
    },

    casual_chat: {
      text: (ctx) => {
        if (ctx.location === 'bar') return "(喝了一口酒)...下了班就不想谈工作了。你呢？最近怎么样？"
        return "(难得地没有在看手机)...嗯？"
      },
      choices: [
        { text: "挺好的，就是有点累", next: 'casual_tired', hint: '😓' },
        { text: "张哥平时都干嘛？", next: 'casual_life', hint: '🎯' },
        { text: "听说您之前也是做技术的？", next: 'casual_past', hint: '📖' }
      ],
      effects: { intimacy: 1 }
    },

    casual_tired: {
      text: "累就对了。不累的人要么是废物要么是老板。\n\n(自嘲地笑) 开玩笑的。适当休息也很重要。身体垮了赚再多也没意义。",
      choices: [{ text: "张哥也会说这种话？", next: 'surprised', hint: '😲' }],
      effects: { trust: 2, intimacy: 2 }
    },

    surprised: {
      text: "(少见地露出笑容) 怎么，以为我是机器人？\n\n...我也是人啊。也有累的时候，也有想做却做不到的事情。",
      choices: [
        { text: "比如什么？", next: 'zhangge_vulnerable', hint: '💭' },
        { text: "没想到这一面", next: 'new_side', hint: '👤' }
      ],
      effects: { intimacy: 3, trust: 3 }
    },

    zhangge_vulnerable: {
      text: "(沉默了很久，几乎以为他不会回答了)\n\n...家庭吧。平衡不了工作和家庭。孩子都快不认识我了。\n\n(一口气喝完了杯子里的酒)",
      choices: [
        { text: "对不起提起这个", next: 'apologize', hint: '😔' },
        { text: "也许可以试着多陪陪家人", next: 'suggest_family', hint: '👨‍👩‍👧' }
      ],
      effects: { intimacy: 5, trust: 5 }
    },

    suggest_family: {
      text: "(苦笑) 说得容易...算了，不聊这个了。\n\n(拍了拍你的肩膀) 你好好干。别像我一样。",
      choices: [{ text: '(心中五味杂陈)', next: 'end_deep', hint: '💭' }],
      effects: { intimacy: 4, motivation: 3, wisdom: 2 }
    },

    apologize: {
      text: "没关系。说出来也好，憋着更难受。\n\n...今天说的话你就当没听见。上班照旧。",
      choices: [{ text: '(点头)', next: 'end_deep', hint: '🤐' }],
      effects: { trust: 4, intimacy: 4 }
    },

    new_side: {
      text: "每个人都有很多面。只是工作中不方便展示罢了。\n\n你也不错，能让人放松下来聊天。继续加油。",
      choices: [{ text: '(看到了不一样的上司)', next: 'end', hint: '👤' }],
      effects: { respect: 3, intimacy: 2, trust: 2 }
    },

    casual_life: {
      text: "我？除了工作就是工作。(无奈地笑)\n\n偶尔打打高尔夫——应酬用的。真正属于自己的时间...很少。",
      choices: [
        { text: "该找点爱好了", next: 'suggest_hobby', hint: '🎯' },
        { text: "成功总要付出代价", next: 'cost_of_success', hint: '⚖️' }
      ],
      effects: { intimacy: 2 }
    },

    suggest_hobby: {
      text: "爱好？...(认真思考) 你说得对。年轻时我其实很喜欢摄影。现在相机都在柜子里落灰了。",
      choices: [{ text: "可以重新捡起来啊", next: 'encourage_photo', hint: '📷' }],
      effects: { intimacy: 3, trust: 2 }
    },

    encourage_photo: {
      text: "(眼中闪过一丝光芒)...也许吧。\n\n(看了看时间) 行了，不早了。回去吧。\n\n...谢谢。",
      choices: [{ text: '(张哥说谢谢？)', next: 'end_surprise', hint: '😯' }],
      effects: { intimacy: 4, trust: 4 }
    },

    cost_of_success: {
      text: "代价...是啊。(望着远处)\n\n你年轻，还有选择的机会。好好想想自己真正要的是什么。不要等到我这个年纪才后悔。",
      choices: [{ text: '(这句话深深印在了心里)', next: 'end_wisdom', hint: '💡' }],
      effects: { wisdom: 3, motivation: 3, intimacy: 2 }
    },

    casual_past: {
      text: "(眼神变了变)...嗯，做了十年技术。\n\n后来觉得天花板太高够不着，就转管理了。\n\n有时候还挺怀念写代码的日子。单纯多了。",
      choices: [
        { text: "为什么不两者兼顾？", next: 'tech_manage_both', hint: '🔄' },
        { text: "技术背景做管理是优势", next: 'tech_advantage', hint: '💪' }
      ],
      effects: { respect: 2, intimacy: 2 }
    },

    tech_manage_both: {
      text: "两者兼顾？(笑) 年轻人就是天真。\n\n...不过也不是不可能。关键是找到平衡点。我当年就没找好。",
      choices: [{ text: "我会吸取教训的", next: 'end_learn', hint: '📚' }],
      effects: { wisdom: 2, motivation: 2, respect: 2 }
    },

    tech_advantage: {
      text: "优势？(认真地点头) 这倒是真的。懂技术就不会被下面人忽悠。\n\n你如果以后走管理路线，技术底子千万不能丢。",
      choices: [{ text: "记住了", next: 'end', hint: '📝' }],
      effects: { motivation: 3, ambition: 2, respect: 1 }
    },

    end_praised: { text: "去吧，别骄傲。", choices: [], isEnd: true, effects: { motivation: 5 } },
    end_respect: { text: "嗯。行了去忙吧。", choices: [], isEnd: true, effects: { respect: 2 } },
    end_grateful: { text: "好好干。", choices: [], isEnd: true },
    end_thinking: { text: "想好了来找我。", choices: [], isEnd: true, effects: { motivation: 2 } },
    end_good: { text: "别到处说啊。", choices: [], isEnd: true, effects: { happiness: 8 } },
    end_hard: { text: "努力吧。", choices: [], isEnd: true, effects: { motivation: -1 } },
    end_soft: { text: "...行了去吧。", choices: [], isEnd: true, effects: { trust: 1 } },
    end_secret: { text: "(点头) 嗯。", choices: [], isEnd: true },
    end_deep: { text: "(起身) 回去了？路上小心。", choices: [], isEnd: true },
    end_surprise: { text: "(罕见地微笑) 明天见。", choices: [], isEnd: true, effects: { respect: 2, trust: 2 } },
    end_wisdom: { text: "(拍拍你的肩膀) 走吧年轻人。", choices: [], isEnd: true, effects: { wisdom: 2 } },
    end_learn: { text: "嗯。聪明人。", choices: [], isEnd: true, effects: { respect: 1 } },
    end: { text: "嗯。", choices: [], isEnd: true }
  },

  // ════════════════════════════════════════
  // 老陈 — 小吃摊主 / 街坊大叔
  // 性格：极度外向、热心肠、幽默、接地气
  // 关系线：路人 → 熟客 → 干儿子/干女儿
  // ════════════════════════════════════════
  laochen: {
    root: {
      text: (ctx) => {
        if (!ctx.met) return "哎！小伙子/小姑娘！来来来！刚出锅的！趁热吃！"
        if (ctx.location === 'restaurant') return "来啦来啦！今天想吃点啥？叔给你弄好的！"
        if (ctx.location === 'market') return "哟！买菜呢？今儿菜新鲜着呢！"
        if (ctx.relation.intimacy > 50) return "哎呀我的好(兄弟/闺女)来了！快坐快坐！"
        return "来啦！老规矩？"
      },
      choices: [
        { text: "吃东西", next: 'eat', hint: '🍜' },
        { text: "聊天唠嗑", next: 'chat', hint: '💬' },
        { text: "打听消息", next: 'gossip', hint: '📢' },
        { text: "求助", next: 'ask_favor', hint: '🆘', condition: (ctx) => ctx.relation.trust > 35 }
      ]
    },

    eat: {
      text: "好嘞！今天招牌是牛肉面！加了秘制辣油的！(吆喝)\n\n要啥？",
      choices: [
        { text: "牛肉面 (25元)", next: 'beef_noodle', hint: '🍜' },
        { text: "小笼包 (15元)", next: 'xiaolongbao', hint: '🥟' },
        { text: "豆浆油条套餐 (12元)", next: 'breakfast', hint: '🥛' },
        { text: "今天有什么特别推荐的？", next: 'special', hint: '⭐' }
      ]
    },

    beef_noodle: {
      text: "好勒！大碗牛肉面一碗！(朝后厨喊)\n\n(不一会端上来一大碗，汤色红亮，牛肉块头十足)\n\n来来来！趁热！凉了就不好吃了！",
      choices: [
        { text: "(大口吃起来，真香)", next: 'eat_happy', hint: '😋' },
        { text: "叔的手艺越来越好了", next: 'compliment_food', hint: '👨‍🍳' }
      ],
      effects: { hunger: -50, happiness: 8, money: -25 }
    },

    eat_happy: {
      text: "好吃吧！嘿嘿！这可是叔传了三代人的秘方！\n\n多吃点！看你瘦的！再加个蛋？算叔请你的！",
      choices: [
        { text: "那就恭敬不如从命了", next: 'free_egg', hint: '🥚' },
        { text: "不用了不用够了", next: 'polite_refuse', hint: '🙅' }
      ]
    },

    free_egg: {
      text: "(笑着加了个荷包蛋) 吃吧吃吧！年轻人就是要吃饱了才有力气干活！\n\n(满足地看着你吃)",
      choices: [{ text: '(心里暖暖的)', next: 'end_warm', hint: '❤️' }],
      effects: { hunger: -10, happiness: 5, intimacy: 3, trust: 2, money: -25 }
    },

    polite_refuse: {
      text: "害！客气啥！下次再来啊！叔天天在这！",
      choices: [{ text: "一定一定", next: 'end', hint: '👋' }]
    },

    compliment_food: {
      text: "(乐得合不拢嘴) 好吃就好好吃就好！\n\n你叔我这辈子别的不会，就这手艺还算凑合！\n\n(得意地抹了抹围裙)",
      choices: [{ text: "不只是凑合，是最好的", next: 'best_compliment', hint: '⭐' }],
      effects: { happiness: 3, intimacy: 2 }
    },

    best_compliment: {
      text: "(愣了一下然后大笑) 哈哈哈哈！你这孩子嘴巴真甜！\n\n行了行了别贫了！赶紧吃！面都要坨了！",
      choices: [{ text: '(笑着大口吃面)', next: 'end_happy', hint: '😄' }],
      effects: { intimacy: 3, like: 2, happiness: 5 }
    },

    xiaolongbao: {
      text: "小笼包！好嘞！一笼八个！刚蒸出来的烫着呢慢点吃！\n\n(端上一笼晶莹剔透的小笼包)",
      choices: [{ text: "(小心翼翼咬一口)", next: 'eat_bao', hint: '😋' }],
      effects: { hunger: -35, happiness: 6, money: -15 }
    },

    eat_bao: {
      text: "怎么样？皮薄馅大吧！这可是叔每天早上四点起来现包的！",
      choices: [{ text: "太好吃了", next: 'end', hint: '👍' }],
      effects: { intimacy: 2, happiness: 3 }
    },

    breakfast: {
      text: "早啊！豆浆油条！经典搭配！健康！(大声)\n\n来！趁热喝！",
      choices: [{ text: '(熟悉的早餐味道)', next: 'breakfast_eat', hint: '🌅' }],
      effects: { hunger: -30, happiness: 5, energy: 8, money: -12 }
    },

    breakfast_eat: {
      text: " slow down! 别噎着！年轻人吃饭就是急！(递过来一杯水)\n\n吃饱了才有劲去奋斗！",
      choices: [{ text: "谢谢叔", next: 'end_morning', hint: '☀️' }],
      effects: { motivation: 3, intimacy: 1 }
    },

    special: {
      text: "(神秘地凑近) 今天？嘿嘿！\n\n叔弄了点特别的——红烧狮子头！祖传做法！一天只做十份！\n\n要的话手慢无啊！",
      choices: [
        { text: "来一份！(48元)", next: 'lion_head', hint: '🦁' },
        { text: "有点贵...", next: 'hesitate', hint: '💸' }
      ]
    },

    lion_head: {
      text: "好眼光！等着！\n\n(端上一个硕大的红烧狮子头，色泽金黄，香气扑鼻)\n\n尝尝！不好吃不要钱！(其实本来就不要钱哈哈哈)!",
      choices: [(text: "(咬一口...入口即化...)", next: 'lion_amazing', hint: '🤩')],
      effects: { hunger: -70, happiness: 15, money: -48, health: 2 }
    },

    lion_amazing: {
      text: "怎么样！！(紧张地看着你的表情)\n\n好吃吧好吃吧！！",
      choices: [
        { text: "叔！这也太好吃了！", next: 'laochen_happy', hint: '🎉' },
        { text: "可以去开店了！", next: 'laochen_proud', hint: '🏆' }
      ],
      effects: { intimacy: 5, happiness: 10 }
    },

    hesitate: {
      text: "贵？不贵不贵！这都是真材实料！\n\n...算了算了，看你也是熟人了，收你35！\n\n就这一份啊！卖完没了！",
      choices: [
        { text: "那来一份", next: 'lion_head_discount', hint: '🦁' },
        { text: "还是算了", next: 'end', hint: '👋' }
      ]
    },

    lion_head_discount: {
      text: "这就对咯！等着！\n\n(同样端上狮子头)\n\n吃吧吃吧！好吃下次再来！",
      choices: [{ text: '(感动)', next: 'end', hint: '❤️' }],
      effects: { hunger: -70, happiness: 12, money: -35, intimacy: 3 }
    },

    laochen_happy: {
      text: "(高兴得直拍大腿) 哈哈哈哈！我就知道！我老陈的手艺可不是吹的！\n\n(周围的人都看过来了)\n\n...咳咳！低调低调！吃你的！",
      choices: [{ text: '(被感染得也跟着笑)', next: 'end_joyful', hint: '😂' }],
      effects: { happiness: 8, stress: -10, intimacy: 5 }
    },

    laochen_proud: {
      text: "(眼睛一亮) 开店？！(摆手) 哎呀不行不行！叔就这样挺好！\n\n...不过你这么说叔心里高兴！比赚一万块钱还高兴！",
      choices: [{ text: "值得！", next: 'end_joyful', hint: '⭐' }],
      effects: { happiness: 10, intimacy: 5, motivation: 3 }
    },

    chat: {
      text: (ctx) => {
        const lines = [
          "来来来坐着聊！站着干啥！(拉过一张凳子)",
          "最近咋样啊？工作顺利不？",
          "叔问你啊，有对象了没？",
          "这条街上就没有叔不认识的！你问啥都知道！",
          "(擦着手) 说吧，想聊啥？叔听着呢！"
        ]
        return lines[Math.floor(Math.random() * lines.length)]
      },
      choices: [
        { text: "聊聊这条街的故事", next: 'street_stories', hint: '🏘️' },
        { text: "叔你年轻时候什么样？", next: 'laochen_youth', hint: '📸' },
        { text: "说说您的家常", next: 'family_chat', hint: '👨‍👩‍👧' },
        { text: "给我讲讲人生道理", next: 'life_wisdom', hint: '📖' }
      ],
      effects: { intimacy: 2 }
    },

    street_stories: {
      text: "嘿！你可问对人了！\n\n这条街啊，三十年前就是最热闹的地儿！那时候这儿是个大集市！\n\n(滔滔不绝讲了半小时)",
      choices: [{ text: "(津津有味地听着)", next: 'story_enjoy', hint: '👂' }],
      effects: { inspiration: 3, intimacy: 3, local_knowledge: 2 }
    },

    story_enjoy: {
      text: "有意思吧！历史就在身边啊！\n\n现在年轻人都不知道这些了...你能听进去叔很高兴！",
      choices: [{ text: "以后多给我讲讲", next: 'end', hint: '📚' }],
      effects: { trust: 2, intimacy: 3 }
    },

    laochen_youth: {
      text: "(眼神变得悠远) 年轻时候啊...\n\n叔当年可是这条街最帅的小伙子！(挺起胸)\n\n追你婶子的时候可是费了大劲了！追了整整三年！",
      choices: [
        { text: "三年？那么难追？", next: 'love_story', hint: '💕' },
        { text: "叔当年一定很帅", next: 'flatter_laochen', hint: '😄' }
      ]
    },

    love_story: {
      text: "难？那是相当难！(感慨)\n\n你婶子当年是纺织厂的一枝花！追她的人从这里排到城门口！\n\n叔就凭着一股韧劲儿！每天给她送早饭！送了整整一年零八个月！\n\n最后她感动了！(满脸幸福)",
      choices: [{ text: "真浪漫", next: 'romantic_end', hint: '💕' }],
      effects: { intimacy: 4, happiness: 5 }
    },

    romantic_end: {
      text: "浪漫个屁！就是死缠烂打！(大笑)\n\n...不过话说回来，真心才是最重要的。现在年轻人太浮躁了，动不动就分。\n\n找到个好姑娘/小伙子，就好好珍惜！",
      choices: [{ text: "记住了叔", next: 'end_warm', hint: '❤️' }],
      effects: { wisdom: 2, intimacy: 3 }
    },

    flatter_laochen: {
      text: "(得意) 那必须的！你叔我当年那张脸，啧啧！\n\n(掏出钱包里泛黄的老照片给你看)\n\n你看你看！帅不帅！",
      choices: [
        { text: "确实帅！(由衷地)", next: 'genuine_compliment', hint: '👍' },
        { text: "和现在也差不多嘛", next: 'still_handsome', hint: '😏' }
      ],
      effects: { intimacy: 3, like: 3 }
    },

    genuine_compliment: {
      text: "(美滋滋地收起照片) 是吧！遗传！我儿子也长得帅！\n\n...唉可惜他在外地，一年也就回来一两次。(神情黯淡了一瞬又恢复)",
      choices: [{ text: "很想他吧？", next: 'miss_son', hint: '👦' }]
    },

    still_handsome: {
      text: "哈哈哈你这孩子就会哄叔开心！(拍你肩膀)\n\n行了行了！去吃你的面！都要凉了！",
      choices: [{ text: '(笑着去吃面)', next: 'end', hint: '😄' }],
      effects: { intimacy: 3, happiness: 5 }
    },

    miss_son: {
      text: "(顿了一下，用围裙擦了擦手) ...\n\n想啊...怎么能不想。\n\n但他有自己的事业，叔不能拖后腿不是？\n\n只要他好好的，叔在这里卖面也安心。",
      choices: [
        { text: "您是个好父亲", next: 'good_father', hint: '👨' },
        { text: "让他多回来嘛", next: 'suggest_visit', hint: '✈️' }
      ],
      effects: { intimacy: 5, trust: 4 }
    },

    good_father: {
      text: "(眼眶红了) ...好父亲谈不上，就是个普通老头子。\n\n(转过身假装忙碌)\n\n...你吃面吧。叔给你多加个蛋。",
      choices: [{ text: '(鼻子一酸)', next: 'end_moving', hint: '😢' }],
      effects: { intimacy: 6, trust: 5, hunger: -10 }
    },

    suggest_visit: {
      text: "(摇头) 他忙...大城市压力大。\n\n不过今年过年说回来的。到时候带你来家里坐坐！让你婶子做饭给你吃！",
      choices: [{ text: "好啊！一定去！", next: 'promise_visit', hint: '🏠' }],
      effects: { intimacy: 4, happiness: 5 }
    },

    family_chat: {
      text: "家常？嗨！也就是柴米油盐呗！\n\n你婶子身体还行，就是腰不太好。我让她歇着她不听，非要去跳广场舞！\n\n(无奈地笑) 拿她没办法。",
      choices: [
        { text: "跳舞对身体有好处", next: 'dancing_good', hint: '💃' },
        { text: "该定期检查一下", next: 'health_check', hint: '🏥' }
      ],
      effects: { intimacy: 3 }
    },

    dancing_good: {
      text: "是倒是...就是那天差点扭了腰把我吓坏了！\n\n后来我给她买了护腰，这才放心点。\n\n老了老了就怕生病啊...",
      choices: [{ text: "您身体还好吧？", next: 'care_laochen', hint: '❤️' }]
    },

    care_laochen: {
      text: "我？我好着呢！(拍胸脯)\n\n每天早起锻炼！身体倍儿棒！就是有时候站一天腰酸...\n\n(揉了揉腰) ...没事没事！习惯了！",
      choices: [{ text: "别太累了", next: 'end_care', hint: '🤗' }],
      effects: { intimacy: 4, trust: 2 }
    },

    life_wisdom: {
      text: "(停下手中的活，认真地) 人生道理？\n\n叔一个卖面的能懂啥道理...非要说的话就一句：\n\n**做人要像这碗面——劲道但不能硬，柔软但不能烂。**\n\n(得意地等你的反应)",
      choices: [
        { text: "说得好！", next: 'wisdom_appreciated', hint: '👏' },
        { text: "叔你是个哲学家啊", next: 'philosopher_laochen', hint: '🧠' }
      ],
      effects: { wisdom: 3, intimacy: 2 }
    },

    wisdom_appreciated: {
      text: "(大笑) 哈哈哈哈！哲学家！我可不敢当！\n\n这就是生活教出来的！活久了自然就懂了！\n\n你还年轻，以后就明白了！",
      choices: [{ text: "希望能活到明白的那天", next: 'end', hint: '🌟' }],
      effects: { motivation: 3, wisdom: 2 }
    },

    philosopher_laochen: {
      text: "哲学家？啥玩意儿？是不是说我像个胖和尚？(摸摸肚子)\n\n哈哈哈哈！行了别逗叔了！吃面吃面！",
      choices: [{ text: '(被逗乐了)', next: 'end', hint: '😄' }],
      effects: { happiness: 8, stress: -5, intimacy: 3 }
    },

    gossip: {
      text: "(眼睛一亮 凑过来) 打听啥？！\n\n叔这条街的消息灵通着呢！你想知道啥？！",
      choices: [
        { text: "最近有什么大事", next: 'big_news', hint: '📰' },
        { text: "谁家的八卦", next: 'neighbor_gossip', hint: '🗣️' },
        { text: "有没有什么赚钱的门路", next: 'money_tip', hint: '💰' }
      ],
      effects: { intimacy: 1 }
    },

    big_news: {
      text: (ctx) => {
        const newsList = [
          "听说CBD那边要建一个新的购物中心了！好大好大！",
          "那条老街说要拆迁了！住了几十年的人都不舍得搬！",
          "菜市场要翻新了！以后环境要好多了！不过租金估计也要涨...",
          "最近治安不太好，晚上别走偏僻的路啊！"
        ]
        return newsList[Math.floor(Math.random() * newsList.length)]
      },
      choices: [
        { text: "详情呢？", next: 'gossip_detail', hint: '🔍' },
        { text: "还有其他的吗？", next: 'gossip', hint: '🔄' }
      ],
      effects: { local_knowledge: 2 }
    },

    gossip_detail: {
      text: "(压低声音) 详情嘛...\n\n(讲了五分钟)\n\n...这话你别往外说是叔告诉你的啊！",
      choices: [{ text: "放心吧叔", next: 'end_secret', hint: '🤫' }],
      effects: { local_knowledge: 3, trust: 1 }
    },

    neighbor_gossip: {
      text: "(四处张望了一下) 咱们悄悄说啊...\n\n(开始绘声绘色地讲述邻居们的各种故事)",
      choices: [{ text: "(听得目瞪口呆)", next: 'gossip_shocked', hint: '😱' }],
      effects: { intimacy: 2, social: 1 }
    },

    gossip_shocked: {
      text: "惊讶吧！这世界上啥事都有！(拍大腿)\n\n所以说啊，过日子就是看戏！比电视剧精彩多了！",
      choices: [{ text: "确实", next: 'end', hint: '😂' }],
      effects: { happiness: 5 }
    },

    money_tip: {
      text: "(警惕地看了看四周) 赚钱？\n\n(小声) ...那个新开的夜市摊位好像在招租。位置不错。\n\n还有就是，听说银行在推一款理财产品收益还不错...不过风险自担啊！",
      choices: [
        { text: "夜市摊位？详细说说", next: 'night_market_info', hint: '🌙' },
        { text: "理财产品？", next: 'finance_tip', hint: '📊' },
        { text: "谢谢叔提供信息", next: 'end_grateful', hint: '🙏' }
      ],
      effects: { business_opportunity: 1 }
    },

    night_market_info: {
      text: "就在城南那条小吃街！每晚人都爆满！\n\n租金一个月大概三千多...你如果有兴趣可以去看看。\n\n叔就是觉得你可能合适...年轻人脑子灵活嘛！",
      choices: [
        { text: "我考虑一下", next: 'consider_business', hint: '💭' },
        { text: "我没本钱啊", next: 'no_capital', hint: '💸' }
      ],
      effects: { ambition: 2, business_knowledge: 2 }
    },

    consider_business: {
      text: "考虑考虑！不着急！这是大事！\n\n...要是真做了，叔教你做菜！保你生意红火！",
      choices: [{ text: "一言为定！", next: 'business_promise', hint: '🤝' }],
      effects: { intimacy: 4, trust: 3, cooking: 1 }
    },

    no_capital: {
      text: "本钱嘛...(思考)\n\n刚开始可以从小做起！不用多大摊位！叔当年不也是从小推车开始的吗！\n\n实在不行叔可以借你一点启动资金！",
      choices: [
        { text: "真的吗叔？", next: 'laochen_offer_money', hint: '💰' },
        { text: "不用了我再想办法", next: 'end', hint: '🤔' }
      ]
    },

    laochen_offer_money: {
      text: "真的！叔虽然不是大富大贵但这点钱还是有的！\n\n你是个好孩子叔看得出来！值得投资！\n\n需要多少说个数！",
      choices: [
        { text: "借5000启动资金", next: 'borrow_5000', hint: '💵', condition: (ctx) => ctx.relation.trust > 55 },
        { text: "我再想想", next: 'end', hint: '🤔' }
      ]
    },

    borrow_5000: {
      text: "五千？行！(毫不犹豫)\n\n(从围裙口袋掏出一叠钞票)\n\n拿着！赚了再还！亏了...算了不说了！叔信得过你！",
      choices: [{ text: "(接过钱 手沉甸甸的)", next: 'end_grateful_debt', hint: '😭' }],
      effects: { money: 5000, trust: 5, intimacy: 8, debt: 5000 }
    },

    finance_tip: {
      text: "理财产品嘛...叔不懂那些高科技的东西。\n\n但是莉莉——银行的那个姑娘——她懂的！你可以去问问她！\n\n就说老陈介绍的！",
      choices: [{ text: "好的我去找莉莉", next: 'end_referral', hint: '👩‍💼' }],
      effects: { hint: 'visit_lili_for_finance' }
    },

    ask_favor: {
      text: "(收起笑容 认真地) 啥事？说！\n\n只要叔能帮忙的 绝不含糊！",
      choices: [
        { text: "遇到困难了需要帮助", next: 'need_help', hint: '🆘' },
        { text: "想找个人/打听个路", next: 'find_someone', hint: '🔍' },
        { text: "想学做菜", next: 'learn_cooking', hint: '👨‍🍳' }
      ]
    },

    need_help: {
      text: (ctx) => {
        if (ctx.playerMoney < 100) return "(看到你的样子就明白了)\n\n来来来！先坐下！饿了吧？叔给你弄点吃的！(不由分说把你按在凳子上)"
        return "遇到啥难事了？跟叔说说！能帮的一定帮！"
      },
      choices: [
        { text: "(说出困难)", next: 'tell_problem', hint: '😢' },
        { text: "没事 就是想找人说说话", next: 'just_talk_laochen', hint: '💬' }
      ]
    },

    tell_problem: {
      text: "(静静地听完 叹了口气)\n\n...孩子，人生就是这样。有高峰就有低谷。\n\n叔活了五十多年 啥大风大浪没见过？挺过去 就好了！",
      choices: [
        { text: "叔...谢谢", next: 'thanks_laochen', hint: '😭' },
        { text: "我能挺过去的", next: 'be_strong', hint: '💪' }
      ],
      effects: { motivation: 8, stress: -10, intimacy: 5, trust: 4 }
    },

    thanks_laochen: {
      text: "(拍你的背) 好孩子！哭出来就好！\n\n(递过来一杯热茶)\n\n喝了！然后重新出发！叔看好你！",
      choices: [{ text: '(重整旗鼓)', next: 'end_reborn', hint: '🔥' }],
      effects: { happiness: 5, motivation: 10, stress: -15 }
    },

    be_strong: {
      text: "(欣慰地笑) 对！就是这个劲头！\n\n叔就知道你不是轻易放弃的人！有啥需要随时来找叔！",
      choices: [{ text: '(握住老陈的手)', next: 'end_grateful', hint: '🤝' }],
      effects: { motivation: 8, confidence: 3 }
    },

    just_talk_laochen: {
      text: "(坐下 给你倒了杯茶)\n\n想说啥就说 啥不想说就坐着。\n\n叔这里永远是避风港。",
      choices: [{ text: '(安安静静坐了很久)', next: 'end_peace', hint: '☮️' }],
      effects: { stress: -15, happiness: 3, intimacy: 4 }
    },

    learn_cooking: {
      text: "学做菜？！好啊！\n\n(兴奋地搓手) 叔的传家宝手艺终于有继承人了！\n\n来来来！先从最基础的开始！切葱花！",
      choices: [
        { text: "好！请师傅指教！", next: 'cooking_lesson', hint: '👨‍🍳' },
        { text: "我可能没天赋...", next: 'no_talent', hint: '😅' }
      ],
      effects: { cooking_materials: 1 }
    },

    cooking_lesson: {
      text: "(认真地示范) 看！刀要这样握！手腕用力 不是胳膊用力！\n\n(手把手教了你一个小时)\n\n不错不错！有天赋！比叔当年强多了！",
      choices: [{ text: "谢谢师父！", next: 'end_cooking_skill', hint: '🎓' }],
      effects: { cooking: 5, intimacy: 4, skillGain: { cooking: 3 } }
    },

    no_talent: {
      text: "胡说！没有人学不会做饭！\n\n就是火候和时间的问题！多练练就行了！\n\n每周来叔这里！叔免费教你！",
      choices: [{ text: "真的吗？太好了！", next: 'cooking_promise', hint: '✅' }],
      effects: { cooking: 2, intimacy: 5, motivation: 3 }
    },

    find_someone: {
      text: "找人？这条街上没有叔不认识的！\n\n谁？你说！名字 地址 特征 都行！",
      choices: [{ text: "(描述要找的人)", next: 'search_result', hint: '🔍' }],
      effects: { local_knowledge: 1 }
    },

    search_result: {
      text: "(想了想)\n\n哦！你说那个人啊！我知道！住在XX巷X号！每天早上七点出门！\n\n要我带你去吗？",
      choices: [
        { text: "太感谢了！", next: 'end_helpful', hint: '🙏' },
        { text: "不用了 我自己去", next: 'end', hint: '👍' }
      ],
      effects: { trust: 2 }
    },

    // 结束节点集合
    end_warm: { text: "好孩子！常来啊！", choices: [], isEnd: true, effects: { happiness: 5 } },
    end_happy: { text: "(笑) 慢走啊！", choices: [], isEnd: true, effects: { happiness: 8, stress: -5 } },
    end_joyful: { text: "哈哈哈哈！下次再来啊！", choices: [], isEnd: true, effects: { happiness: 12, stress: -8 } },
    end_morning: { text: "去奋斗吧年轻人！", choices: [], isEnd: true, effects: { motivation: 5 } },
    end_moving: { text: "(挥手) 走好！", choices: [], isEnd: true, effects: { happiness: 3, intimacy: 2 } },
    end_care: { text: "你也是个好孩子！(挥手)", choices: [], isEnd: true },
    end_peace: { text: "(安静地陪你坐着...时光仿佛慢了下来)", choices: [], isEnd: true, effects: { stress: -20, peace: 5 } },
    end_reborn: { text: "(目送你离去 目光中满是期许)", choices: [], isEnd: true },
    end_grateful: { text: "(挥着沾满面粉的手) 别客气！有事就来！", choices: [], isEnd: true, effects: { happiness: 5 } },
    end_grateful_debt: { text: "(拍你肩膀) 好好干！叔等你好消息！", choices: [], isEnd: true },
    end_referral: { text: "去吧去吧！", choices: [], isEnd: true },
    end_helpful: { text: "小事一桩！", choices: [], isEnd: true, effects: { trust: 2 } },
    end_cooking_skill: { text: "(骄傲地) 出师了出师了！", choices: [], isEnd: true, effects: { happiness: 8 } },
    end_cooking_promise: { text: "说定了啊！下周同一时间！", choices: [], isEnd: true },
    end_promise_visit: { text: "一言为定！", choices: [], isEnd: true },
    end_secret: { text: "(点头) 嘿嘿 行了去吧！", choices: [], isEnd: true },
    end: { text: "慢走啊！常来！", choices: [], isEnd: true }
  }

  // ════════════════════════════════════════
  // 美美 — 自媒体博主 / 社交达人
  // 性格：极度外向、时尚、爱八卦
  // 关系线：粉丝 → 朋友 → 合作伙伴 / 姐妹
  // ════════════════════════════════════════
  meimei: {
    root: {
      text: (ctx) => {
        if (!ctx.met) return "(正在自拍)...哎呀！你谁啊？等等让我拍完这张。\n\n...OK！你好呀~你是新搬来的？"
        if (ctx.location === 'cafe') return "嗨！又来喝咖啡？巧了我也在！来坐来坐！"
        if (ctx.location === 'mall') return "天哪你也来逛街？！快帮我看看这件衣服好看不！(转圈)"
        if (ctx.relation.intimacy > 50) return "亲爱的！！想死我了！！！(扑过来)"
        const lines = [
          "哈喽哈喽！今天气色不错哦~",
          "哎你来啦！我正想找人聊天呢！",
          "(放下手机) 哟，稀客嘛~",
          "等下等下...(发了一条朋友圈)...好了你说！"
        ]
        return lines[Math.floor(Math.random() * lines.length)]
      },
      choices: [
        { text: "聊聊天", next: 'chat', hint: '💬' },
        { text: "打听消息/八卦", next: 'gossip', hint: '📢' },
        { text: "请教自媒体运营", next: 'social_media', hint: '📱' },
        { text: "一起出去玩", next: 'hangout', hint: '🎉' }
      ]
    },

    chat: {
      text: (ctx) => {
        const pool = {
          stranger: ["你平时喜欢做什么呀？看你的样子挺有趣的！", "你玩小红书吗？关注我没？嘿嘿~", "你是什么星座的？感觉你应该是个很有意思的人！"],
          acquaintance: ["最近有个超火的展你要不要一起去？", "我跟你说！昨天遇到一件超级无语的事...", "对了你有对象吗？我认识好多人可以给你介绍哈哈"],
          friend: ["宝！你必须听我说这个瓜！巨好吃！(凑近)", "其实做网红也没表面上那么光鲜啦...压力也很大。", "(叹气) 有时候觉得好累啊...要维持人设要营业..."],
          close: ["说实话有些事我只敢跟你说。(认真脸)", "你是我真正信任的人之一。真的。", "...谢谢你一直在我身边。(罕见地安静了一会)"]
        }
        const level = ctx.relationLevel || 'stranger'
        return (pool[level] || pool.stranger)[Math.floor(Math.random() * (pool[level] || pool.stranger).length)]
      },
      choices: [
        { text: "深入聊聊", next: 'chat_deep', hint: '💭' },
        { text: "你最近怎么样", next: 'ask_her', hint: '❤️' },
        { text: "先这样吧", next: 'end', hint: '👋' }
      ],
      effects: { intimacy: 1, happiness: 2 }
    },

    chat_deep: {
      text: (ctx) => ctx.mood === 'stressed'
        ? "诶你怎么看起来不太开心？出什么事了？跟我说说！"
        : "你知道吗，我觉得你是一个很特别的人。",
      choices: [
        { text: "说说我的烦恼", next: 'share_worry', hint: '😔' },
        { text: "为什么特别？", next: 'why_special', hint: '❓' },
        { text: "你才是特别的那个", next: 'compliment_back', hint: '✨' }
      ],
      effects: { intimacy: 2 }
    },

    share_worry: {
      text: "(认真地听完)...天哪...\n\n(出乎意料地没有立刻说话)\n\n...对不起我不知道你一直在承受这些。早知道的话我会更常来找你的。",
      choices: [{ text: "(被她的真诚打动了)", next: 'meimei_sincere', hint: '💕' }],
      effects: { stress: -10, intimacy: 6, trust: 5, happiness: 3 }
    },

    meimei_sincere: {
      text: "以后不管发生什么，第一时间告诉我好吗？\n\n我不是只会说废话的网红...我也是你的朋友。(握住你的手)",
      choices: [{ text: "谢谢你美美", next: 'end_warm', hint: '❤️' }],
      effects: { intimacy: 5, like: 3, trust: 4 }
    },

    why_special: {
      text: "(歪头想了想)\n\n嗯...怎么说呢。你身上有一种让人安心的气质？就是跟你在一起不用装。\n\n你知道我平时多累吗？要笑要美要保持形象...但在你面前就不需要。",
      choices: [
        { text: "你可以做真实的自己", next: 'be_yourself', hint: '🦋' },
        { text: "我喜欢真实的美美", next: 'like_real', hint: '💖' }
      ],
      effects: { intimacy: 4, trust: 3 }
    },

    be_yourself: {
      text: "(眼睛有点红)...你说的是真的吗？\n\n(深呼吸)...好吧。那我就不装了。\n\n其实我很害怕...怕有一天大家不喜欢我了，怕过气了...",
      choices: [{ text: "不会的，我们都在", next: 'reassure', hint: '🤗' }],
      effects: { intimacy: 7, trust: 6, like: 4 }
    },

    reassure: {
      text: "(擦了擦眼角) ...你这个人怎么这么会安慰人啦！\n\n(用力吸鼻子) 行了行了不煽情了！怪不好意思的！",
      choices: [{ text: '(笑了)', next: 'end_happy', hint: '😊' }],
      effects: { happiness: 10, stress: -10, intimacy: 4 }
    },

    compliment_back: {
      text: "(愣住然后大笑) 哈哈哈哈你会说话！\n\n(但笑容里带着一丝真实的开心)\n\n...谢谢。你是真心说的对吧？",
      choices: [{ text: "当然", next: 'end_flirted', hint: '😏' }],
      effects: { like: 4, intimacy: 3, charm: 2 }
    },

    ask_her: {
      text: "我？(拨弄了一下头发)\n\n就那样呗~忙死！今天要拍三个视频还要直播！但是粉丝宝宝们可爱了所以值了！",
      choices: [
        { text: "要注意休息", next: 'care_meimei', hint: '🌸' },
        { text: "粉丝多少了？", next: 'follower_count', hint: '📊' }
      ]
    },

    care_meimei: {
      text: "(心里暖暖的) 谢谢关心~我知道的~\n\n你也是啊！别光操心别人自己不注意身体！(戳你额头)",
      choices: [{ text: "知道啦", next: 'end', hint: '😄' }],
      effects: { intimacy: 2, health: 1 }
    },

    follower_count: {
      text: "(得意地亮手机屏幕) 十二万+了！！离目标又近一步！\n\n等我到二十万我就开自己的品牌！！你到时候必须支持啊！！",
      choices: [
        { text: "一定支持", next: 'support_promise', hint: '🛍️' },
        { text: "到时请我吃饭", next: 'dinner_request', hint: '🍽️' }
      ],
      effects: { intimacy: 2 }
    },

    support_promise: {
      text: "一言为定！！(伸出小拇指)\n\n拉钩！",
      choices: [(text: "(拉钩)", next: 'pinky_promise', hint: '🤙')],
      effects: { intimacy: 4, trust: 2 }
    },

    pinky_promise: {
      text: "耶！！好开心！！\n\n★ 与美美的羁绊加深了 ★",
      choices: [], isEnd: true,
      effects: { happiness: 8, intimacy: 3 }
    },

    dinner_request: {
      text: "请吃饭？那可不行！(傲娇脸)\n\n...我要请你吃！毕竟你是我最好的朋友之一嘛~\n\n说定了！等我忙完这阵！",
      choices: [{ text: "等你哦", next: 'end', hint: '📅' }],
      effects: { intimacy: 3 }
    },

    gossip: {
      text: "(眼睛瞬间亮了) 八卦？？！\n\n(压低声音 四处张望)\n\n你想知道啥？！娱乐圈？商业圈？还是这条街的？我全都知道！！！",
      choices: [
        { text: "最新的大瓜", next: 'big_drama', hint: '🍉' },
        { text: "谁和谁在一起了", next: 'dating_news', hint: '💕' },
        { text: "有什么内幕消息", next: 'insider_info', hint: '🤫' },
        { text: "关于某个人的", next: 'about_someone', hint: '👤' }
      ],
      effects: {}
    },

    big_drama: {
      text: "(激动地拍桌子) 你绝对想不到！！\n\n(开始绘声绘色地讲述一个惊人的故事...)",
      choices: [{ text: "(目瞪口呆)", next: 'gossip_shocked', hint: '😱' }],
      effects: { social_knowledge: 3, happiness: 8, intimacy: 2 }
    },

    dating_news: {
      text: "(神秘兮兮地) 我告诉你一个秘密...但你不能告诉别人哦！\n\n(小声说了五分钟)",
      choices: [{ text: "天哪！", next: 'gossip_shocked', hint: '😲' }],
      effects: { social: 2, intimacy: 2 }
    },

    insider_info: {
      text: "(看了看四周 确认安全后)\n\n这个信息可是花钱买来的...算了免费告诉你！\n\n(分享了一个有价值的行业内部消息)",
      choices: [{ text: "太有用了！", next: 'end_valuable', hint: '💡' }],
      effects: { business_knowledge: 2, inspiration: 3, money_opportunity: 1 },
      triggerHint: 'insider_tip'
    },

    about_someone: {
      text: "谁？说名字！(拿出小本本准备记录模式)",
      choices: [
        { text: "问问张哥的事", next: 'about_zhangge', hint: '👔' },
        { text: "问问林夕的事", next: 'about_linxi', hint: '☕' },
        { text: "问问莉莉的事", next: 'about_lili', hint: '👩‍💼' }
      ],
      effects: { social: 1 }
    },

    about_zhangge: {
      text: "张哥？哦那个项目经理！(翻笔记)\n\n听说他最近压力超大 公司在裁员他得做决策...挺惨的其实。\n\n不过他对下属还行 就是要求高了点。",
      choices: [{ text: "谢谢情报", next: 'end', hint: '📝' }],
      effects: { social_knowledge: 1 }
    },

    about_linxi: {
      text: "林夕？咖啡店那个文静姑娘？(托腮)\n\n她好像...嗯怎么说呢 感觉她对你有意思哦~\n\n我观察过的！每次你来她都会偷偷看你！",
      choices: [
        { text: "真的吗？！", next: 'linxi_reveal', hint: '😳' },
        { text: "你别瞎说", next: 'deny_linxi', hint: '😅' }
      ],
      effects: {}
    },

    linxi_reveal: {
      text: "哼哼 我美美的情报从来没错过！\n\n追她啊！她那种女孩子要慢慢来的！急不得！\n\n加油！姐支持你！(比心)",
      choices: [{ text: '(心跳加速)', next: 'end_crush_hint', hint: '💓' }],
      effects: { motivation: 5, confidence: 3 },
      triggerHint: 'linxi_crush'
    },

    deny_linxi: {
      text: "(眯起眼睛盯着你看了三秒)\n\n...你耳朵红了哦。(微笑)\n\n承认吧~喜欢一个人不可耻~",
      choices: [{ text: '(无言以对)', next: 'end_embarrassed', hint: '😳' }],
      effects: {}
    },

    about_lili: {
      text: "莉莉啊~银行的那个冰山美人？(思考)\n\n她表面高冷但其实人挺好的！而且超级有钱...不对 是理财能力超强！\n\n如果你有闲钱一定要找她咨询！",
      choices: [{ text: "好的记住了", next: 'end', hint: '📝' }],
      effects: { finance_knowledge: 1 }
    },

    gossip_shocked: {
      text: "震惊了吧！！我就说嘛！！\n\n这种事情也就我能第一时间知道！跟着我有肉吃！(得意)",
      choices: [{ text: "你太厉害了", next: 'end', hint: '👑' }],
      effects: { charm: 1, social: 1, happiness: 5 }
    },

    social_media: {
      text: (ctx) => !ctx.met
        ? "你想学做自媒体？！太好了！我可以教你啊！"
        : "哦？对这个感兴趣？(来了精神)\n\n我可以教你的！从选题到剪辑到运营！全套！",
      choices: [
        { text: "求指教！", next: 'sm_lesson', hint: '📚' },
        { text: "先了解一下", next: 'sm_intro', hint: '❓' },
        { text: "能不能合作？", next: 'sm_collab', hint: '🤝' }
      ],
      effects: { inspiration: 2 }
    },

    sm_intro: {
      text: "简单来说就是：找到你的定位→持续产出内容→建立粉丝群体→变现！\n\n听起来简单但执行起来很难的！需要坚持需要创意需要运气！\n\n不过你有潜质！我看人很准的！",
      choices: [
        { text: "那我试试？", next: 'sm_try', hint: '✨' },
        { text: "还是算了吧", next: 'end', hint: '🙅' }
      ],
      effects: { ambition: 2, inspiration: 2 }
    },

    sm_try: {
      text: "这就对咯！！来来来我给你规划一下！\n\n(掏出笔记本开始疯狂写写画画)\n\n首先你得确定方向...然后...",
      choices: [{ text: "(认真听讲中)", next: 'sm_plan_done', hint: '📝' }],
      effects: { social_media_skill: 2, creativity: 2, ambition: 3 }
    },

    sm_plan_done: {
      text: "好了！这是你的初步方案！拿回去好好研究！\n\n有问题随时问我！姐罩你！(甩头发)\n\n★ 获得自媒体入门指南 ★",
      choices: [], isEnd: true,
      effects: { skillGain: { social_media: 2 }, motivation: 5 }
    },

    sm_collab: {
      text: "合作？！(眼睛放光)\n\n可以啊！我一直想找个搭档一起做内容！两个人碰撞出来的火花肯定不一样！\n\n你有什么特长？",
      choices: [
        { text: "我会写文案", next: 'collab_writer', hint: '✍️' },
        { text: "我会拍摄/剪辑", next: 'collab_video', hint: '🎬' },
        { text: "我什么都会一点", next: 'collab_allrounder', hint: '🌟' }
      ],
      effects: { ambition: 3, opportunity: 1 }
    },

    collab_writer: {
      text: "文案？！太棒了！！我就是缺好的文案！！\n\n我们可以这样：我负责出镜和运营 你负责写脚本和文案！分成五五！怎么样！",
      choices: [
        { text: "成交！", next: 'deal_made', hint: '🤝' },
        { text: "我再想想", next: 'end', hint: '🤔' }
      ],
      effects: { writing: 2 }
    },

    collab_video: {
      text: "拍摄剪辑？！！人才啊！！\n\n你知道找人剪视频多贵吗！！如果你加入的话成本直接降一半！！\n\n合作吧合作吧！！",
      choices: [
        { text: "好啊！", next: 'deal_made', hint: '🤝' },
        { text: "让我考虑一下时间", next: 'end', hint: '⏰' }
      ],
      effects: { video_editing: 2 }
    },

    collab_allrounder: {
      text: "全能型选手？！(星星眼)\n\n这种人最稀缺了！你确定不是在骗我？！\n\n(上下打量你) ...好吧我相信你！来吧！我们需要你！",
      choices: [{ text: "那就合作吧", next: 'deal_made', hint: '🤝' }],
      effects: { allrounder_bonus: 1 }
    },

    deal_made: {
      text: "耶！！合作愉快！！(击掌)\n\n★ 与美美达成合作关系 ★\n\n接下来我们一起搞大事！！先加个微信！",
      choices: [], isEnd: true,
      effects: { income: 500, motivation: 8, happiness: 10 },
      triggerEvent: 'partnership_meimei'
    },

    hangout: {
      text: "出去玩？！现在？！(兴奋跳起来)\n\n去哪里去哪里？！我有好多想去的地方！！",
      choices: [
        { text: "KTV唱歌", next: 'ktv_date', hint: '🎤' },
        { text: "逛街购物", next: 'shopping_date', hint: '🛍️' },
        { text: "去酒吧", next: 'bar_date', hint: '🍺' },
        { text: "看电影", next: 'movie_date', hint: '🎬' }
      ],
      effects: { happiness: 5 }
    },

    ktv_date: {
      text: "KTV！！好！！我最爱唱了！！走起！！\n\n(拉着你就跑)\n\n★ 与美美去KTV ★\n\n(唱了三个小时 她唱得居然还不错)",
      choices: [], isEnd: true,
      effects: { happiness: 15, stress: -15, fatigue: 15, money: -150 }
    },

    shopping_date: {
      text: "逛街！！走走走！！我要买衣服！！\n\n(到了商场就开始疯狂试衣服)\n\n你帮我看这个好看不！这个呢？！这个呢？！",
      choices: [], isEnd: true,
      effects: { happiness: 12, fashion: 1, fatigue: 10, money: -200 }
    },

    bar_date: {
      text: "酒吧？！今晚要嗨起来！！\n\n(换了一套超辣的衣服)\n\n走吧宝贝！今晚我们是全场的焦点！！",
      choices: [], isEnd: true,
      effects: { happiness: 18, stress: -20, energy: -20, money: -300, charisma: 1 }
    },

    movie_date: {
      text: "电影好啊！可以安静地坐着吃爆米花！\n\n看什么看什么？喜剧？爱情片？恐怖片？\n\n我都可以！只要你请我吃爆米花就行哈哈哈！",
      choices: [], isEnd: true,
      effects: { happiness: 10, stress: -8, money: -80 }
    },

    end_warm: { text: "爱你哟~拜拜~(飞吻)", choices: [], isEnd: true, effects: { happiness: 5 } },
    end_happy: { text: "下次再约哦~ mua!", choices: [], isEnd: true, effects: { happiness: 8 } },
    end_flirted: { text: "(脸红) 你...你少来这套！", choices: [], isEnd: true, effects: { like: 2, charm: 1 } },
    end_crush_hint: { text: "(目送你离开 若有所思地笑了笑)", choices: [], isEnd: true },
    end_embarrassed: { text: "哈哈哈哈 你的反应太可爱了！", choices: [], isEnd: true, effects: { happiness: 5 } },
    end_valuable: { text: "不客气~ 信息共享嘛~ 下次有好消息再告诉你！", choices: [], isEnd: true },
    like_real: { text: "(沉默了一瞬然后笑了)...傻瓜。(轻轻捶了你一下)", choices: [], isEnd: true, effects: { intimacy: 5, like: 5 } },
    end: { text: "拜拜~ 记得关注我哦~(比心)", choices: [], isEnd: true }
  },

  // ════════════════════════════════════════
  // 大卫 — 健身教练 / 阳光型男
  // 性格：极度外向、阳光、正能量爆棚
  // 关系线：学员 → 好友 → 搭档 / 互相激励的兄弟
  // ════════════════════════════════════════
  dawei: {
    root: {
      text: (ctx) => {
        if (!ctx.met) return "(正在给一个学员纠正动作)...好！保持住！(看到你) 哟！新面孔！来健身的吗？"
        if (ctx.location === 'gym') return "YO！来训练了？！今天状态怎么样！",
        if (ctx.location === 'park') return "哈！晨跑吗？巧了我也刚跑完十公里！(展示肌肉)",
        const lines = [
          "嘿哥们/姐妹！今天精神不错啊！",
          "来啦来啦！最近练得咋样？",
          "(拍你肩膀) 看起来壮实了不少嘛！",
          "YO！！(比了个耶)"
        ]
        return lines[Math.floor(Math.random() * lines.length)]
      },
      choices: [
        { text: "聊健身的事", next: 'fitness_talk', hint: '🏋️' },
        { text: "求训练指导", next: 'training', hint: '💪' },
        { text: "闲聊", next: 'chat', hint: '💬' },
        { text: "约一起运动", next: 'workout_together', hint: '🏃' }
      ]
    },

    fitness_talk: {
      text: (ctx) => {
        const topics = [
          "你想增肌还是减脂？这俩思路完全不一样的！",
          "三分练七分吃！饮食才是关键中的关键！",
          "你知道吗，其实睡眠对增肌的影响比训练还大！",
          "核心！核心！核心！重要的事情说三遍！所有动作都从核心发力！"
        ]
        return topics[Math.floor(Math.random() * topics.length)]
      },
      choices: [
        { text: "详细讲讲", next: 'fitness_detail', hint: '📚' },
        { text: "我想增肌", next: 'muscle_gain', hint: '💪' },
        { text: "我想减脂", next: 'fat_loss', hint: '🔥' }
      ],
      effects: { fitness_knowledge: 2, motivation: 3 }
    },

    fitness_detail: {
      text: "OK听好了！(认真模式)\n\n第一：训练要有计划不能瞎练。第二：营养要跟上蛋白质碳水脂肪比例要对。第三：休息要够肌肉是在休息时长的不是在训练时长。\n\n懂了吗？",
      choices: [
        { text: "懂了！", next: 'dawei_proud', hint: '✅' },
        { text: "能给我写个计划吗？", next: 'ask_plan', hint: '📋' }
      ],
      effects: { fitness: 2, health: 1 }
    },

    dawei_proud: {
      text: "好学生！！(竖大拇指)\n\n就这样保持下去！三个月后你会感谢自己的！",
      choices: [{ text: '(充满斗志)', next: 'end_motivated', hint: '🔥' }],
      effects: { motivation: 8, confidence: 3 }
    },

    ask_plan: {
      text: "写计划？没问题！(掏出笔记本)\n\n先说说你的情况：年龄、体重、目标、每周能练几天、有没有伤病...\n\n(开始专业地记录)",
      choices: [{ text: '(回答了所有问题)', next: 'plan_done', hint: '📝' }],
      effects: { skillGain: { fitness: 3 }, motivation: 5 }
    },

    plan_done: {
      text: "好了！这是你的个性化训练计划！(递过来)\n\n★ 获得大卫定制训练计划 ★\n\n按这个练一个月！有问题随时问我！",
      choices: [], isEnd: true,
      effects: { health: 2, motivation: 6, strength: 1 },
      triggerHint: 'training_plan'
    },

    muscle_gain: {
      text: "增肌好啊！增肌就是力量加量！\n\n多吃蛋白质！鸡胸肉牛肉鸡蛋牛奶！每天每公斤体重1.5-2克蛋白！\n\n训练上以复合动作为主——深蹲硬拉卧推划船！这些才是王道！",
      choices: [
        { text: "深蹲硬拉卧推？", next: 'big_three', hint: '🏋️' },
        { text: "吃什么具体点？", next: 'diet_detail', hint: '🍗' }
      ],
      effects: { strength: 1, fitness: 2 }
    },

    big_three: {
      text: "对！健身界的三大项！也是衡量力量的标准！\n\n我教你标准动作！(开始示范)\n\n看好了！背部挺直！核心收紧！下蹲到大腿平行地面！起！",
      choices: [{ text: '(跟着练习)', next: 'practice_session', hint: '🏋️‍♂️' }],
      effects: { strength: 2, fitness: 2, energy: -10, skillGain: { strength: 1 } }
    },

    practice_session: {
      text: "不错不错！有天赋！姿势基本正确！\n\n再来五组！每组八个！加油加油！！(在旁边疯狂鼓励)",
      choices: [{ text: '(咬牙坚持完成了)', next: 'session_complete', hint: '😤💦' }],
      effects: { strength: 3, fatigue: 15, health: 1, happiness: 8, motivation: 5 }
    },

    session_complete: {
      text: "干得漂亮！！！(击掌)\n\n这就是坚持的力量！你比自己想象的强得多！\n\n继续保持！下次我们练上肢！",
      choices: [{ text: '(浑身酸痛但很满足)', next: 'end_sore', hint: '💪😅' }],
      effects: { intimacy: 3, confidence: 4 }
    },

    diet_detail: {
      text: "饮食的话我来给你列个清单！\n\n早餐：鸡蛋+燕麦+牛奶。午餐：糙米+鸡胸肉+蔬菜。晚餐：鱼肉+红薯+沙拉。\n\n训练前后还要加餐！训练前吃香蕉训练后喝蛋白粉！",
      choices: [{ text: "记下来了", next: 'end_nutrition', hint: '📝' }],
      effects: { nutrition_knowledge: 3, cooking: 1 }
    },

    fat_loss: {
      text: "减脂的核心就六个字：热量缺口+力量训练。\n\n不要只做有氧！那样掉的是肌肉和水分！要保留肌肉同时燃烧脂肪！\n\n力量训练提高基础代谢让你躺着也在消耗热量！",
      choices: [
        { text: "那怎么制造热量缺口？", next: 'calorie_deficit', hint: '🔢' },
        { text: "推荐什么训练方式？", next: 'fat_training', hint: '🏋️' }
      ],
      effects: { fitness: 2, health: 1 }
    },

    calorie_deficit: {
      text: "简单说就是摄入<消耗！\n\n每天制造300-500卡路里的缺口就行！别太猛不然代谢会崩！\n\n少吃加工食品多吃天然食物！戒糖戒油炸！多喝水！每天至少3升！",
      choices: [{ text: "明白了！", next: 'end_focused', hint: '🎯' }],
      effects: { health: 2, discipline: 2 }
    },

    fat_training: {
      text: "减脂期最好的训练是HIIT（高强度间歇训练）加上大重量力量训练！\n\nHIIT燃脂效率是有氧的两倍以上！而且还有后燃效应——练完后24小时都在持续燃烧！\n\n要不要我带你来一轮HIIT体验一下？",
      choices: [
        { text: "来吧！", next: 'hiit_session', hint: '🔥' },
        { text: "下次吧", next: 'end', hint: '😅' }
      ]
    },

    hiit_session: {
      text: "好！准备！(计时器启动)\n\n波比跳30秒！休息15秒！开合跳30秒！休息15秒！登山跑30秒！休息15秒！\n\n四轮！开始！！！",
      choices: [{ text: '(拼了命地完成了)', next: 'hiit_done', hint: '😵‍💫💦' }],
      effects: { fat_loss: 3, cardio: 3, energy: -25, fatigue: 20, health: 2, stress: -12, happiness: 10 }
    },

    hiit_done: {
      text: "牛逼！！！(扶着你的肩膀)\n\n你看你做到了！刚才觉得自己不行了吧？但你就是做到了！\n\n这就是身体的力量也是意志力的力量！",
      choices: [{ text: '(大口喘气但笑得很开心)', next: 'end_exhausted', hint: '😅❤️' }],
      effects: { confidence: 5, motivation: 8, intimacy: 4 }
    },

    training: {
      text: "想训练？来对地方了！\n\n(上下打量你) 先做个体测看看你的基础数据。\n\n站上去！这台仪器可以测体脂率肌肉量骨密度等等！",
      choices: [{ text: '(站上了体测仪)', next: 'body_test', hint: '⚖️' }],
      effects: { health_knowledge: 1 }
    },

    body_test: {
      text: "(看着数据) 嗯...让我看看...\n\n(表情逐渐严肃然后突然笑了)\n\n哈哈开玩笑的！数据还不错！就是体脂稍微高了一点肌肉量不够！\n\n但没关系！这都是可以改变的！",
      choices: [
        { text: "那我该怎么改？", next: 'fix_plan', hint: '🔧' },
        { text: "真的还行吗？", next: 'reassurance', hint: '😌' }
      ],
      effects: {}
    },

    fix_plan: {
      text: "改？当然可以改！(撸起袖子)\n\n但我要先问你一个问题——你准备好了吗？\n\n因为改变需要时间需要汗水需要毅力。不是三天打鱼两天晒网能做到的。",
      choices: [
        { text: "我准备好了！", next: 'commitment', hint: '🔥' },
        { text: "我不确定...", next: 'uncertain', hint: '🤔' }
      ]
    },

    commitment: {
      text: "(伸出手) 好！那我们击掌为盟！\n\n从今天开始你就是我的重点关注对象！我会盯着你训练盯着你饮食盯着你休息！\n\n不许偷懒！不许放弃！能做到吗？",
      choices: [{ text: "能！", next: 'pledge', hint: '🤝' }],
      effects: { motivation: 10, ambition: 4, discipline: 3, intimacy: 3 }
    },

    pledge: {
      text: "好！！(用力握手)\n\n★ 成为大卫的重点训练学员 ★\n\n明天同一时间来找我！我们开始正式训练！",
      choices: [], isEnd: true,
      effects: { triggerEvent: 'training_with_dawei' }
    },

    uncertain: {
      text: "(蹲下来和你平视)\n\n不确定也没关系。大多数人开始的时候都不确定的。\n\n重要的是你愿意尝试第一步。哪怕只是今天跟我一起散个步也好。\n\n健康是一辈子的事不急在一时。",
      choices: [
        { text: "你说得对，我先试试", next: 'first_step', hint: '👣' },
        { text: "我再想想", next: 'end', hint: '🤔' }
      ],
      effects: { trust: 3, intimacy: 2 }
    },

    first_step: {
      text: "这就对了！(站起来拍了拍手)\n\n走！我们先去公园走两圈！边走边聊！",
      choices: [(text: '(和他一起走向公园)', next: 'walk_together', hint: '🌳')],
      effects: { health: 1, happiness: 3, energy: -5, intimacy: 2 }
    },

    walk_together: {
      text: "(并肩走着 阳光很好)\n\n你知道吗 我最喜欢这份工作的原因不是因为教人健身。\n\n而是能看到一个人从不自信到自信 从弱到强的全过程。\n\n那种变化...比任何奖杯都珍贵。",
      choices: [
        { text: "你真的很热爱这个行业", next: 'passion_chat', hint: '❤️' },
        { text: "我也想成为那样的人", next: 'want_change', hint: '🌟' }
      ],
      effects: { trust: 3, intimacy: 3, inspiration: 3 }
    },

    passion_chat: {
      text: "(停下脚步 看着你微笑)\n\n谢谢你这么说。\n\n是的我很热爱。虽然有时候也很累很烦——遇到不想练的学员 处理各种琐事...但当看到他们进步的时候一切都值了。",
      choices: [{ text: "你是个好教练", next: 'good_coach', hint: '👍' }],
      effects: { like: 3, intimacy: 4, respect: 2 }
    },

    good_coach: {
      text: "(不好意思地挠头) 嘿嘿 谢谢...\n\n你也挺好的。能感觉到你是个真诚的人。\n\n交个朋友？不只是教练和学员那种。",
      choices: [{ text: "好！朋友！", next: 'friends_made', hint: '🤝' }],
      effects: { intimacy: 6, trust: 5, friendship: 1 }
    },

    friends_made: {
      text: "耶！(击掌)\n\n★ 与大卫成为好友 ★\n\n以后一起训练一起进步！有困难互相支持！(展示二头肌)",
      choices: [], isEnd: true
    },

    want_change: {
      text: "(停下来 认真地看着你)\n\n你可以的。每个人都可以。\n\n关键是找到那个让自己想要改变的契机。如果你已经找到了那就勇敢迈出去。\n\n如果还没找到...也许我可以帮你找到它。",
      choices: [{ text: "谢谢大卫", next: 'end_inspired', hint: '✨' }],
      effects: { motivation: 8, confidence: 4, wisdom: 2 }
    },

    reassurance: {
      text: "(拍你肩膀) 真的！别自己吓自己！\n\n你的底子比很多人好多了！只需要一点时间和正确的引导！\n\n相信自己！也相信我！我不会让你失望的！",
      choices: [{ text: "(心里踏实了很多)", next: 'end_reassured', hint: '😊' }],
      effects: { confidence: 4, trust: 3, happiness: 5 }
    },

    chat: {
      text: (ctx) => {
        const pool = {
          stranger: ["你平时运动吗？", "你是做什么工作的？感觉你气质不错~", "你怎么想到来健身房的？"],
          acquaintance: ["最近练得咋样？有感觉没？", "对了 你知道那个新开的蛋白粉店吗？据说打折！"],
          friend: ["兄弟/姐妹！今天状态超好的！(展示手臂)", "说实话 有时候我也想偷懒...但是不行啊 要做榜样！", "(压低声音) 其实我也有烦恼的啦 只是平时不爱说而已"],
          close: ["跟你在一起总是很开心 很放松。(真诚地)", "你知道吗 你是我为数不多真正信任的人之一。", "不管发生什么 我都站在你这边。(握拳)"]
        }
        return (pool[ctx.relationLevel] || pool.stranger)[Math.floor(Math.random() * (pool[ctx.relationLevel] || pool.stranger).length)]
      },
      choices: [
        { text: "聊聊你的事", next: 'about_dawei', hint: '🏋️' },
        { text: "说说自己的近况", next: 'share_self', hint: '🗣️' },
        { text: "讨论人生理想", next: 'life_ideals', hint: '⭐' }
      ],
      effects: { intimacy: 1, happiness: 2 }
    },

    about_dawei: {
      text: "我？我就是个普通的健身教练啊！(大笑)\n\n以前是个小胖子 你信吗？200斤！(拍肚子)\n\n后来被喜欢的人拒绝了...说是喜欢有自律的人...然后就走上这条路了哈哈哈！",
      choices: [
        { text: "哇变化这么大？", next: 'transformation', hint: '😲' },
        { text: "那个女生后来呢？", next: 'ex_girl', hint: '💔' }
      ],
      effects: { intimacy: 3, trust: 2 }
    },

    transformation: {
      text: "是啊！花了三年！从200斤到现在的样子！\n\n中间无数次想放弃 无数次暴饮暴食后又重新开始...\n\n所以我说每个人都能改变！因为我就是个活生生的例子！",
      choices: [{ text: "(被深深打动了)", next: 'end_inspired', hint: '🔥' }],
      effects: { motivation: 10, confidence: 5, discipline: 3 }
    },

    ex_girl: {
      text: "(摸了摸后脑勺) 她？\n\n...后来她结婚了 新郎不是我哈哈哈！(爽朗地笑)\n\n不过我现在很感激她 如果没有她拒绝我 可能我还是那个200斤的自卑胖子！",
      choices: [{ text: "你心态真好", next: 'positive_attitude', hint: '☀️' }],
      effects: { wisdom: 3, happiness: 3, intimacy: 3 }
    },

    positive_attitude: {
      text: "不是心态好 是真的这么觉得！\n\n人生中发生的每一件事都有它的意义。当时可能看不懂 但回过头来就会发现 它们都是成长的一部分！\n\n所以不管遇到什么 都要积极面对！(握拳)",
      choices: [{ text: "(被他的正能量感染了)", next: 'end_positive', hint: '☀️' }],
      effects: { happiness: 10, motivation: 8, optimism: 3 }
    },

    share_self: {
      text: (ctx) => ctx.mood === 'stressed'
        ? "嘿 兄弟/姐妹 你看起来不太对劲。(认真脸) 出什么事了？跟我说！"
        : "哦？说说看！我在听！(盘腿坐下)",
      choices: [
        { text: "(说了最近的困扰)", next: 'dawei_listen', hint: '😔' },
        { text: "没什么 就是想找人说话", next: 'just_talk', hint: '💬' }
      ],
      effects: { intimacy: 2 }
    },

    dawei_listen: {
      text: "(认真地听完 没有打断)\n\n...(沉默了一会儿)\n\n我知道现在说什么都感觉很空洞。但我只想告诉你一件事——你不是一个人。\n\n无论什么时候 无论发生什么 我都在。(伸出拳头)",
      choices: [
        { text: "(碰拳)", next: 'fist_bump', hint: '👊' },
        { text: "(忍不住眼眶红了)", next: 'emotional', hint: '😭' }
      ],
      effects: { stress: -15, intimacy: 7, trust: 6, happiness: 5 }
    },

    fist_bump: {
      text: "(用力碰了一下)\n\n这就对了！男子汉/女汉子！擦干眼泪继续战斗！\n\n有什么需要随时叫我！随叫随到！",
      choices: [{ text: '(重燃斗志)', next: 'end_fire', hint: '🔥' }],
      effects: { motivation: 12, confidence: 6, courage: 3 }
    },

    emotional: {
      text: "(愣了一下然后轻轻抱住了你)\n\n哭吧 没关系的。在我这里不需要坚强。\n\n(安静地陪着你)",
      choices: [{ text: '(哭了出来 压力释放了很多)', next: 'after_cry', hint: '😢→😌' }],
      effects: { stress: -25, intimacy: 8, trust: 8, peace: 5 }
    },

    after_cry: {
      text: "(递过来一条毛巾)\n\n好点了吗？\n\n...记住这种感觉。把压力释放出来之后 就能重新出发了。\n\n你比你想象的要强大得多。",
      choices: [{ text: '(点头)', end: 'end_healed', hint: '💚' }],
      effects: { happiness: 8, motivation: 10, mental_health: 5 }
    },

    just_talk: {
      text: "好啊！我最喜欢聊天了！(笑)\n\n说吧 什么都行！健身的 不健身的 深度的 肤浅的 我都能接住！",
      choices: [
        { text: "随便聊聊生活", next: 'life_chat', hint: '🌈' },
        { text: "聊聊梦想", next: 'dreams_chat', hint: '🌟' }
      ],
      effects: { intimacy: 2, happiness: 3 }
    },

    life_chat: {
      text: "生活嘛 就是起起伏伏！\n\n有高潮就有低谷 关键是你用什么样的心态去面对！\n\n我每天都告诉自己一句话——**今天又是充满可能性的一天！**",
      choices: [{ text: "这句话真好", next: 'quote_appreciate', hint: '💡' }],
      effects: { optimism: 3, happiness: 5, motivation: 4 }
    },

    quote_appreciate: {
      text: "是吧！这是我师父告诉我的！\n\n他是个超级厉害的老教练 现在七十岁了还天天训练！\n\n他就是我的榜样！我希望到了他那个年纪也能保持这种热情！",
      choices: [{ text: "你一定会做到的", next: 'believe_dawei', hint: '✨' }],
      effects: { intimacy: 3, trust: 2 }
    },

    believe_dawei: {
      text: "(眼睛亮了) 谢谢！有你这句话我就更有动力了！\n\n来！为了我们的未来！碰个拳！(伸出手)",
      choices: [(text: "(碰拳)", next: 'end_energized', hint: '⚡')],
      effects: { motivation: 8, energy: 5, intimacy: 3, happiness: 8 }
    },

    dreams_chat: {
      text: "梦想？我的梦想啊...\n\n(想了想)\n\n开一家属于自己的健身房！不用很大但要很有特色！让每个进来的人都能感受到运动的快乐而不是压力！",
      choices: [
        { text: "这个梦想一定可以实现", next: 'dream_support', hint: '🎯' },
        { text: "需要帮忙吗？", next: 'offer_help', hint: '🤝' }
      ],
      effects: { intimacy: 3, ambition: 2 }
    },

    dream_support: {
      text: "(握拳) 一定能！只要努力没有什么不可能的！\n\n等我的健身房开业了你必须是VIP会员！终身免费！(拍胸脯)",
      choices: [{ text: "一言为定！", next: 'dream_promise', hint: '🤙' }],
      effects: { intimacy: 4, trust: 3, motivation: 3 }
    },

    dream_promise: {
      text: "说定了！(再次击掌)\n\n到那时候我们一起举杯庆祝！用蛋白粉代替酒哈哈哈！",
      choices: [], isEnd: true,
      effects: { happiness: 10, motivation: 5, intimacy: 3 }
    },

    offer_help: {
      text: "帮忙？(惊讶然后感动)\n\n...真的吗？你愿意帮我？\n\n(眼眶微红) 其实最缺的就是启动资金和管理经验...如果你能在任何一方面帮到我就太好了！",
      choices: [
        { text: "我可以投资/出钱", next: 'invest_gym', hint: '💰' },
        { text: "我可以帮你管理运营", next: 'manage_gym', hint: '📊' },
        { text: "我能帮的一定帮", next: 'help_anyway', hint: '🤝' }
      ],
      effects: { intimacy: 5, trust: 4 }
    },

    invest_gym: {
      text: "投资？！(跳起来)\n\n天哪你是认真的吗？！这可是大事！！\n\n(冷静下来) ...不过我们需要好好规划一下。你有空的时候我们坐下来详细谈？",
      choices: [{ text: "好 约个时间", next: 'business_meeting', hint: '📅' }],
      effects: { business_opportunity: 1, intimacy: 4 },
      triggerHint: 'gym_investment'
    },

    manage_gym: {
      text: "管理运营？！你做过这方面的工作吗？\n\n(越听越兴奋) 天呐 这正是我缺少的部分！我只懂训练不懂经营啊！\n\n如果我们合作的话...你负责运营 我负责教学...完美搭配！",
      choices: [{ text: "可以考虑合作", next: 'partnership_discuss', hint: '🤝' }],
      effects: { business_knowledge: 2, opportunity: 1 }
    },

    help_anyway: {
      text: "(深深地看了你一眼)\n\n...谢谢你。真的。\n\n不需要你现在做什么。光是听到你这句话我就觉得很温暖了。\n\n(张开双臂) 来 抱一个！",
      choices: [(text: "(拥抱)", next: 'bro_hug', hint: '🤗')],
      effects: { intimacy: 8, trust: 7, happiness: 10, peace: 5 }
    },

    bro_hug: {
      text: "(用力拍你的背)\n\n好了！男人/女人之间的拥抱到此为止！哈哈哈哈！\n\n走吧！去训练！今天的汗还没有流够呢！(拉着你就往器械区走)",
      choices: [], isEnd: true,
      effects: { energy: 5, motivation: 8, happiness: 8 }
    },

    workout_together: {
      text: "一起运动？！YES！！我最喜欢了！！\n\n(兴奋得原地做了两个波比跳)\n\n做什么？跑步？游泳？爬山？还是健身房？你选！",
      choices: [
        { text: "晨跑", next: 'morning_run', hint: '🌅' },
        { text: "健身房训练", next: 'gym_session', hint: '🏋️' },
        { text: "户外徒步", next: 'hiking', hint: '⛰️' }
      ],
      effects: { happiness: 5 }
    },

    morning_run: {
      text: "晨跑！好选择！新陈代谢最好的时候！(看表)\n\n明天早上六点？老地方公园门口？不见不散！\n\n(做了一个健美姿势) 到时候让你见识一下什么叫配速！",
      choices: [], isEnd: true,
      triggerEvent: 'morning_run_with_dawei',
      effects: { health: 2, cardio: 2, motivation: 5 }
    },

    gym_session: {
      text: "健身房！主场作战！哈哈哈！\n\n来吧！我今天给你安排一套杀手级训练！做完保证你走路都发飘！\n\n(邪恶地笑了) 怕不怕？",
      choices: [
        { text: "来吧谁怕谁！", next: 'killer_workout', hint: '😤' },
        { text: "轻点...我怕", next: 'go_easy', hint: '😰' }
      ],
      effects: {}
    },

    killer_workout: {
      text: "好样的！我喜欢这种态度！(吹哨子)\n\n热身五分钟！然后：深蹲四组！卧推四组！引体向上四组！平板支撑两组每组一分钟！最后HIIT收尾！\n\n预备——开始！！！",
      choices: [{ text: '(地狱般的一个小时后)', next: 'workout_done', hint: '💀→💪' }],
      effects: { strength: 4, cardio: 3, fitness: 3, fatigue: 25, energy: -20, hunger: 20, stress: -18, happiness: 12, health: 3 }
    },

    go_easy: {
      text: "哈哈哈怕什么！有我在不会让你受伤的！\n\n放心我会根据你的情况调整强度的！安全第一！\n\n来！我们先从轻松的热身开始！(放起了音乐)",
      choices: [{ text: '(其实强度也不低...)', next: 'workout_done_light', hint: '😅💪' }],
      effects: { strength: 2, cardio: 2, fitness: 2, fatigue: 15, energy: -10, hunger: 10, stress: -10, happiness: 8, health: 2 }
    },

    workout_done: {
      text: "(看着瘫在地上的你)\n\n...哈哈哈哈！！牛！！你居然全部完成了！！\n\n(把你拉起来) 走！请你吃顿好的补补！你值得！",
      choices: [], isEnd: true,
      effects: { confidence: 6, intimacy: 4, money: -50, hunger: -40, happiness: 10 }
    },

    workout_done_light: {
      text: "不错不错！完成度很高！(递水和毛巾)\n\n感觉怎么样？是不是比想象中好？\n\n运动就是这么神奇——开始前抗拒 过程中痛苦 完成后爽翻天！",
      choices: [], isEnd: true,
      effects: { confidence: 3, intimacy: 3, happiness: 8 }
    },

    hiking: {
      text: "徒步？！太棒了我爱死户外了！！\n\n我知道一条超棒的路线！山顶风景绝了！大概三个小时往返！\n\n周末去？我们可以叫上更多人一起！",
      choices: [], isEnd: true,
      triggerEvent: 'hiking_with_dawei',
      effects: { health: 3, nature: 3, happiness: 10, peace: 5 }
    },

    life_ideals: {
      text: "人生理想？(认真思考)\n\n嗯...我觉得人生的意义就是不断超越自己。\n\n不是超越别人而是超越昨天的自己。每天进步一点点 日积月累就会产生质的飞跃。\n\n听起来很鸡汤吧？但这是我真的相信的事情。",
      choices: [
        { text: "不鸡汤 很有道理", next: 'agree_philosophy', hint: '💡' },
        { text: "但现实没那么简单", next: 'reality_check', hint: '🌍' }
      ],
      effects: { wisdom: 2, inspiration: 3 }
    },

    agree_philosophy {
      text: "(惊喜地) 你也这么认为？！太好了！！\n\n终于找到一个志同道合的人了！\n\n你知道吗大多数人都觉得我在灌鸡汤...只有你懂！",
      choices: [{ text: "因为你说的是实话", next: 'truth_teller', hint: '✨' }],
      effects: { trust: 4, intimacy: 4, connection: 2 }
    },

    truth_teller: {
      text: "(沉默了一瞬 然后露出了最真挚的笑容)\n\n...谢谢你。真的。\n\n在这个世界上能遇到懂你的人 太难得了。\n\n珍惜。(轻轻捶了一下你的胸口)",
      choices: [], isEnd: true,
      effects: { happiness: 12, intimacy: 6, trust: 5, soul_connection: 1 }
    },

    reality_check: {
      text: "(点头) 你说得对。现实确实复杂得多。\n\n有房贷车贷 有家庭责任 有社会压力...不是每个人都能随心所欲地追求理想的。\n\n但这不代表我们应该放弃。哪怕每天只能做一点点 也是在向理想靠近。",
      choices: [{ text: "(若有所思)", next: 'end_thinking', hint: '💭' }],
      effects: { wisdom: 3, maturity: 2, realism: 2 }
    },

    end_motivated: { text: "加油！我看好你！(竖大拇指)", choices: [], isEnd: true, effects: { motivation: 8 } },
    end_sore: { text: "酸就对说明练到位了！回家拉伸！明天见！", choices: [], isEnd: true, effects: { health: 1 } },
    end_exhausted: { text: "(递水) 慢慢喝 别急！你今天超级棒！", choices: [], isEnd: true, effects: { happiness: 8 } },
    end_focused: { text: "目标明确！行动起来！", choices: [], isEnd: true, effects: { motivation: 5 } },
    end_nutrition: { text: "饮食是基础！记住我的话！", choices: [], isEnd: true },
    end_reassured: { text: "对自己有信心！你能行的！", choices: [], isEnd: true, effects: { confidence: 3 } },
    end_inspired: { text: "(拍你肩膀) 去吧！创造属于你的人生！", choices: [], isEnd: true, effects: { motivation: 6, inspiration: 3 } },
    end_positive: { text: "保持正能量！每一天都是新的！", choices: [], isEnd: true, effects: { happiness: 6, optimism: 2 } },
    end_fire: { text: "燃烧吧！！(做出火焰手势)", choices: [], isEnd: true, effects: { motivation: 10 } },
    end_healed: { text: "(微笑) 好了！去洗把脸！又是崭新的一天！", choices: [], isEnd: true },
    end_energized: { text: "能量满满！！去吧少年/少女！", choices: [], isEnd: true, effects: { energy: 5 } },
    end_thinking: { text: "(点头) 好好想想。答案在你心里。", choices: [], isEnd: true, effects: { wisdom: 2 } },
    end: { text: "走了！记得明天来训练！不许偷懒！(指你)", choices: [], isEnd: true, effects: { motivation: 3 } }
  },

  // ════════════════════════════════════════
  // 莉莉 — 银行职员 / 冰山美人
  // 性格：内向偏理性、严谨、聪明
  // 关系线：客户 → 理财顾问 → 深交知己
  // ════════════════════════════════════════
  lili: {
    root: {
      text: (ctx) => {
        if (!ctx.met) return "(正在整理文件)...请问办理什么业务？\n\n(推了推眼镜 抬头看你)"
        if (ctx.location === 'bank') return "又来了？这次办什么业务？(职业微笑)"
        if (ctx.location === 'library') return "哦...是你。(放下手中的书) 这里比较安静。"
        if (ctx.relation.intimacy > 50) return "...(看到你 嘴角微微上扬) 你来了。"
        const lines = [
          "你好。",
          "...有事吗？",
          "(点头致意)",
          "(正在看手机) ...嗯？你来了啊。"
        ]
        return lines[Math.floor(Math.random() * lines.length)]
      },
      choices: [
        { text: "咨询理财", next: 'finance', hint: '📊' },
        { text: "聊天", next: 'chat', hint: '💬', condition: (ctx) => ctx.relation.intimacy > 15 || ctx.location !== 'bank' },
        { text: "约她出去", next: 'invite', hint: '🌙', condition: (ctx) => ctx.relation.intimacy > 40 && ctx.time.hour >= 18 && ctx.location !== 'bank' }
      ]
    },

    finance: {
      text: "理财咨询？请坐。\n\n(拿出笔记本和笔)\n\n先了解一下您的情况：收入水平、风险承受能力、理财目标、投资期限...",
      choices: [
        { text: "保守型理财", next: 'conservative', hint: '🛡️' },
        { text: "稳健型理财", next: 'balanced', hint: '⚖️' },
        { text: "激进型投资", next: 'aggressive', hint: '🚀' },
        { text: "我是新手什么都不懂", next: 'beginner', hint: '🐣' }
      ],
      effects: {}
    },

    conservative: {
      text: "保守型的话，我建议以下配置：\n\n60%定期存款/国债（保本保息），30%货币基金（流动性好），10%黄金ETF（对冲通胀）。\n\n年化收益大约在3-4%左右，但几乎零风险。",
      choices: [
        { text: "详细讲讲", next: 'detail_conservative', hint: '📝' },
        { text: "收益有点低", next: 'low_return', hint: '📉' }
      ],
      effects: { finance_knowledge: 3, intellect: 1 }
    },

    detail_conservative: {
      text: "具体来说：\n\n- 国债：三年期2.5%左右，国家信用背书\n- 大额存单：利率比普通定存高0.5-1%\n- 货基：如余额宝类产品，随存随取\n- 黄金：长期抗通胀，建议占总资产5-10%\n\n需要我帮你制定具体的配置方案吗？",
      choices: [
        { text: "好 请帮我规划", next: 'make_plan', hint: '📋' },
        { text: "我再考虑一下", next: 'end', hint: '🤔' }
      ]
    },

    low_return: {
      text: "(推眼镜) 低是低了点，但要看您的需求是什么。\n\n如果这笔钱短期内要用，那安全第一。如果是闲钱长期不用，可以适当提高风险偏好获取更高收益。",
      choices: [
        { text: "那我应该选哪种", next: 'assess_needs', hint: '❓' },
        { text: "我有部分闲钱", next: 'has_idle_money', hint: '💰' }
      ],
      effects: { finance_knowledge: 1 }
    },

    assess_needs: {
      text: "(认真分析)\n\n那我来帮您做一个风险评估。回答我几个问题：\n\n1. 这笔钱多久不需要用？\n2. 能接受多大的亏损比例？\n3. 有没有紧急备用金？（建议留6个月生活费）",
      choices: [{ text: '(回答了问题)', next: 'risk_assessed', hint: '✅' }],
      effects: { finance_knowledge: 2 }
    },

    risk_assessed: {
      text: "根据您的回答，我建议采用**核心-卫星策略**：\n\n70%稳健配置（债券+指数基金）+30%进取配置（行业基金+个股）\n\n这样既保证了基础安全又有超额收益的可能。",
      choices: [
        { text: "就按这个方案来！", next: 'plan_confirmed', hint: '✅' },
        { text: "能再调整一下比例吗", next: 'adjust_ratio', hint: '⚙️' }
      ],
      effects: { finance_knowledge: 3, investment_skill: 2 }
    },

    plan_confirmed: {
      text: "好的。我会帮您准备详细的配置方案文档。\n\n★ 获得莉莉的专业理财方案 ★\n\n...另外作为提醒：投资有风险 入市需谨慎。任何承诺高收益低风险的都要警惕诈骗。",
      choices: [], isEnd: true,
      effects: { money: -100, finance_knowledge: 5, wisdom: 1, trust: 2 },
      triggerHint: 'lili_financial_plan'
    },

    adjust_ratio: {
      text: "当然可以根据您的偏好调整。\n\n(拿出计算器)\n\n如果您更保守可以把进取部分降到20% 更激进可以提到40%。但我不建议超过50%，那样波动会很大。",
      choices: [{ text: "那就30%吧", next: 'plan_confirmed', hint: '✅' }],
      effects: { finance_knowledge: 1 }
    },

    has_idle_money: {
      text: "有闲钱的话选择空间就大多了。\n\n(难得地露出一丝兴趣)\n\n我可以给您介绍一些中等风险的产品——混合型基金、REITs、可转债等。年化目标6-12%。",
      choices: [
        { text: "详细介绍这些产品", next: 'mid_risk_products', hint: '📊' },
        { text: "你有推荐的基金吗？", next: 'fund_recommend', hint: '📈' }
      ],
      effects: { finance_knowledge: 2 }
    },

    mid_risk_products: {
      text: "(专业模式开启)\n\n**混合型基金**：股债搭配灵活，适合震荡市\n**REITs**：不动产投资信托，收房租+增值双重收益\n**可转债**：下有保底上不封顶，攻守兼备\n\n每种都有不同的风险收益特征...",
      choices: [{ text: "(认真记笔记)", next: 'learning_finance', hint: '📝' }],
      effects: { finance_knowledge: 4, intellect: 2, skillGain: { finance: 2 } }
    },

    learning_finance: {
      text: "(看你记得很认真)\n\n...你学东西很快嘛。\n\n(语气柔和了一些)\n\n以后有什么不懂的可以随时问我。虽然我不是私人理财师但...朋友之间帮忙还是可以的。",
      choices: [{ text: "我们是朋友了吗？", next: 'friend_confirm', hint: '🤔' }],
      effects: { intimacy: 3, trust: 2 }
    },

    friend_confirm: {
      text: "(停笔看了你一眼 ...耳根微微泛红)\n\n...如果你愿意的话。\n\n(低头继续写文件 但嘴角藏不住笑意)",
      choices: [], isEnd: true,
      effects: { intimacy: 4, like: 3, happiness: 5 }
    },

    fund_recommend: {
      text: "(犹豫了一下)\n\n...这个我不能在正式场合给你推荐，涉及合规问题。\n\n(压低声音) 但如果你私下问我的话...(看四周) 我自己持有的是XX科技和XX医疗。仅作参考不构成投资建议哦。",
      choices: [
        { text: "谢谢你的内幕信息！", next: 'insider_tip_received', hint: '🤫' },
        { text: "你自己也买基金？", next: 'lili_invests', hint: '💰' }
      ],
      effects: { insider_tip: 1, intimacy: 3, trust: 2 }
    },

    insider_tip_received: {
      text: "嘘！别到处说！会被投诉的！\n\n(但眼中带着笑意)\n\n...好了 快去办业务吧 别让人看见我们聊这么久。",
      choices: [{ text: '(心里暗自窃喜)', next: 'end_secret_smile', hint: '😏' }],
      effects: { intimacy: 2, happiness: 3 },
      triggerHint: 'stock_tip_from_lili'
    },

    lili_invests: {
      text: "(意外被问到私人话题 愣了一下)\n\n...嗯 是的。银行员工也要理财啊 不然工资怎么跑赢通胀。\n\n我从2019年开始定投指数基金 年化大概11%。不算多但胜在稳定。",
      choices: [
        { text: "能教教我怎么定投吗？", next: 'dca_lesson', hint: '📚' },
        { text: "你真厉害", next: 'compliment_lili', hint: '⭐' }
      ],
      effects: { finance_knowledge: 3, intimacy: 2 }
    },

    dca_lesson: {
      text: "定投(Dollar Cost Averaging)的核心就是：固定时间投入固定金额。\n\n市场跌的时候同样金额买到更多份额 涨的时候买到较少 长期下来成本就被平滑了。\n\n关键在于坚持。至少坚持一个完整牛熊周期（通常7-10年）才能看到效果。",
      choices: [(text: "(受益匪浅)", next: 'end_grateful', hint: '🙏')],
      effects: { finance_knowledge: 5, discipline: 2, patience: 2, skillGain: { investing: 3 } }
    },

    compliment_lili: {
      text: ...(推眼镜掩饰表情)\n\n...没有啦 只是一般水平。\n\n(小声) 谢谢你能注意到这些。",
      choices: [{ text: "(她害羞的样子很少见)", next: 'end_shy_lili', hint: '😳' }],
      effects: { like: 4, intimacy: 3, charm: 1 }
    },

    balanced: {
      text: "稳健型是最常见的选择。\n\n建议配置：40%债券/固收 + 40%宽基指数基金 + 10%行业主题基金 + 10%现金管理\n\n预期年化5-8%，最大回撤控制在10-15%以内。",
      choices: [
        { text: "帮我做一份详细方案", next: 'make_plan', hint: '📋' },
        { text: "我想了解更多", next: 'finance_deep', hint: '📖' }
      ]
    },

    aggressive: {
      text: "(挑眉) 激进型？胆子不小。\n\n(罕见地露出挑战性的笑容)\n\n那你可以关注：成长股、科创板、加密货币(少量)、期权策略、期货...\n\n但我必须提醒你——高收益伴随高风险。做好亏损30-50%的心理准备。",
      choices: [
        { text: "我能承受", next: 'can_handle_risk', hint: '💪' },
        { text: "也许我还是稳一点好", next: 'back_to_balanced', hint: '🔄' }
      ],
      effects: { ambition: 2, courage: 1 }
    },

    can_handle_risk: {
      text: "好。既然你这么说。\n\n(从抽屉里拿出一叠资料——这是内部研报 不对外)\n\n...你别告诉别人是我给你的。最近有几个板块值得关注：新能源、AI应用、生物医药。",
      choices: [(text: '(接过珍贵的资料)', next: 'got_internal_report', hint: '📄')],
      effects: { finance_knowledge: 4, business_knowledge: 2, intimacy: 4, trust: 3 },
      triggerHint: 'internal_research_report'
    },

    got_internal_report: {
      text: "记住：这只是研究参考 不构成投资建议。而且市场瞬息万变 要有自己的判断。\n\n(认真地) ...还有，别亏太多。我不希望看到你因为投资影响生活。",
      choices: [{ text: "你是在关心我？", next: 'care_detected', hint: '❤️' }],
      effects: { intimacy: 3, like: 2 }
    },

    care_detected: {
      text: ...(立刻恢复职业面孔) ...\n\n这是基本的客户服务准则。所有客户我都会这样说的。\n\n(但手指无意识地卷着头发)",
      choices: [
        { text: "只是客户吗？", next: 'just_client', hint: '🤔' },
        { text: "明白了 谢谢", next: 'end', hint: '👍' }
      ]
    },

    just_client: {
      text: ...(沉默了几秒)\n\n...不是所有客户都会让我把内部研报给他们的。\n\n(站起身整理文件) 办理完了的话...可以走了。\n\n...周末有空吗？有个财经讲座 你可能感兴趣。(不看你说完就快步走开了)",
      choices: [], isEnd: true,
      effects: { intimacy: 6, like: 5, triggerEvent: 'invite_lili_lecture' }
    },

    back_to_balanced: {
      text: "明智的选择。承认自己的风险偏好是成熟投资者的第一步。",
      choices: [{ text: "那给我推荐稳健方案", next: 'balanced', hint: '⚖️' }]
    },

    beginner: {
      text: "(难得地放下了职业面具 露出温和的表情)\n\n没关系 每个人都是从新手开始的。\n\n我可以从最基本的讲起：复利的力量、资产配置、分散投资...你想从哪里开始？",
      choices: [
        { text: "从最基础的开始", next: 'basics_101', hint: '🏫' },
        { text: "直接告诉我该买什么", next: 'what_to_buy', hint: '🛒' }
      ],
      effects: { patience: 1 }
    },

    basics_101: {
      text: "OK。第一课：**复利是世界第八大奇迹**。\n\n(在纸上画图)\n\n假设你每月投2000元 年化10%：10年后约41万 20年后约152万 30年后约450万。\n\n时间是你最大的朋友。",
      choices: [(text: "(震惊于复利的威力)", next: 'compound_shock', hint: '😲')],
      effects: { finance_knowledge: 3, motivation: 5, intellect: 1 }
    },

    compound_shock: {
      text: "这就是为什么越早开始投资越好。\n\n(看着你认真的样子 微微一笑)\n\n...你学习态度很好。我很欣赏这一点。",
      choices: [
        { text: "继续教我", next: 'continue_learning', hint: '🎓' },
        { text: "你笑起来很好看", next: 'compliment_smile', hint: '😊' }
      ],
      effects: { intimacy: 2 }
    },

    continue_learning: {
      text: "好。第二课：**资产配置决定90%的收益**。\n\n选股选基其实没那么重要 真正重要的是你在股票 债券 现金 房产等各类资产上的分配比例。\n\n这叫现代投资组合理论(MPT)，诺贝尔经济学奖级别的发现...",
      choices: [(text: '(听得入迷)', next: 'deep_learning_session', hint: '🧠')],
      effects: { finance_knowledge: 5, intellect: 3, skillGain: { investing: 2 } }
    },

    deep_learning_session: {
      text: "(讲了半个小时 完全忘记了自己还在银行)\n\n...啊。(回过神来 看了看表)\n\n抱歉 讲太久了。你...还想继续听吗？\n\n如果不忙的话 可以找个咖啡厅慢慢聊。(说完意识到这句话的含义 耳朵红了)",
      choices: [
        { text: "好啊！走吧！", next: 'coffee_invite_accepted', hint: '☕' },
        { text: "今天先到这里", next: 'end_gentle', hint: '😊' }
      ],
      effects: { intimacy: 4, happiness: 3 }
    },

    coffee_invite_accepted: {
      text: (!!!真的要去吗？！)(慌乱了一秒然后镇定)\n\n...好。等我换件衣服。五分钟。\n\n(快步走向后台 走到一半回头) 对了 今天算我请你。就当是...理财咨询服务费的反向支付吧。\n\n(不等回应就快步离开了)",
      choices: [], isEnd: true,
      triggerEvent: 'coffee_with_lili',
      effects: { intimacy: 6, like: 6, happiness: 12 }
    },

    compliment_smile: {
      text: ...(僵住三秒)\n\n你...你今天来到底是办业务的还是来...\n\n(说不下去 转过头去假装整理桌面 但脖子红透了)",
      choices: [{ text: '(她的反应太可爱了)', next: 'end_flustered', hint: '😊💕' }],
      effects: { like: 5, intimacy: 4, charm: 2 }
    },

    what_to_buy: {
      text: "(严肃起来) 如果你是完全的新手 我只给一个建议：\n\n**沪深300指数基金**。定投。每月固定日期投入固定金额。持续五年以上。\n\n其他的等你懂了再加。",
      choices: [{ text: "就这么简单？", next: 'simple_is_best', hint: '❓' }],
      effects: { finance_knowledge: 2 }
    },

    simple_is_best: {
      text: "最简单的往往是最有效的。\n\n大部分主动基金经理都跑不赢指数。与其花大量时间研究个股不如老老实实买指数。\n\n...当然 如果你愿意深入学习的话 我可以教你更多。(微微一笑)",
      choices: [
        { text: "我愿意学！", next: 'continue_learning', hint: '🎓' },
        { text: "先按你说的做", next: 'start_index_fund', hint: '📈' }
      ]
    },

    start_index_fund: {
      text: "好。去开户 然后设置自动定投。\n\n(递过来一张名片)\n\n有问题随时联系我。这是我的私人微信 不是工作号。\n\n(意识到自己说了什么 迅速补充) 工作时间以外回复可能会慢一些...",
      choices: [{ text: '(收下名片 心跳加速了一拍)', next: 'got_wechat', hint: '📱' }],
      effects: { intimacy: 4, like: 3, contact_lili: 1 },
      triggerHint: 'lili_wechat'
    },

    got_wechat: {
      text: ...(假装忙碌不再看你 但耳朵尖红红的)\n\n...下一个 请问103号窗口办理业务。",
      choices: [], isEnd: true,
      effects: { happiness: 8, intimacy: 2 }
    },

    chat: {
      text: (ctx) => {
        const pool = {
          stranger: ["...下班了？这里人不多。", "你也喜欢看书？", "(合上书) 有事吗？"],
          acquaintance: ["最近怎么样？工作顺利？", "...(犹豫了一下) 谢谢你上次...", "你经常来这里吗？"],
          friend: ["(看到你 笑容明显真实了很多) 你来了。", "我在想一个问题...你觉得人为什么要努力赚钱？", "你知道吗 你是我唯一愿意在工作之外聊天的朋友。"],
          close: ["(放下书 专注地看着你) 我一直在想你什么时候会来。", "...有些话我只敢跟你说。", "(轻声) 你对我来说...很特别。"]
        }
        return (pool[ctx.relationLevel] || pool.stranger)[Math.floor(Math.random() * (pool[ctx.relationLevel] || pool.stranger).length)]
      },
      choices: [
        { text: "深入聊聊", next: 'deep_chat', hint: '💭' },
        { text: "聊聊她的想法", next: 'her_mind', hint: '🧠' },
        { text: "分享自己的想法", next: 'share_thoughts', hint: '💭' }
      ],
      effects: { intimacy: 2 }
    },

    deep_chat: {
      text: (ctx) => ctx.mood === 'stressed'
        ? "(敏锐地察觉到了什么) ...你不开心？"
        : "(安静地看着你 眼神温柔)",
      choices: [
        { text: "说说烦恼", next: 'share_worry', hint: '😔' },
        { text: "只是想看看你", next: 'just_see_her', hint: '👀' }
      ]
    },

    share_worry: {
      text: "(安静地听完 没有打断 没有急着给建议)\n\n...(轻轻叹气)\n\n...我不知道该怎么帮你。但我可以陪着你。",
      choices: [{ text: "(眼泪掉了下来)", next: 'cry_together', hint: '😢' }],
      effects: { stress: -20, intimacy: 8, trust: 7, peace: 5 }
    },

    cry_together: {
      text: "(递过来一张纸巾 然后静静地坐在旁边)\n\n...哭出来就好。我一直觉得 人不应该总是那么坚强。\n\n(过了一会儿) 好些了吗？",
      choices: [
        { text: "好多了 谢谢你", next: 'thank_you_lili', hint: '🙏' },
        { text: "(靠在她的肩膀上)", next: 'lean_on_her', hint: '🧑‍🤝‍🧑' }
      ],
      effects: { happiness: 5, comfort: 5 }
    },

    thank_you_lili: {
      text: "不用谢。...你对我来说也很重要。\n\n(说完这句话自己也愣住了 脸迅速变红)\n\n我...我是说 作为朋友。",
      choices: [
        { text: '"只是朋友吗？"', next: 'just_friends_q', hint: '❤️' },
        { text: "(笑着不拆穿)", next: 'let_it_slide', hint: '😊' }
      ]
    },

    just_friends_q: {
      text: ...(僵住了)
\n\n...(良久)\n\n...我不想只是朋友。(声音很轻 几乎听不见)\n\n但你不需要现在回答我。我知道你还没准备好。我只是...想让你知道。",
      choices: [
        { text: "我也喜欢你", next: 'mutual_feeling', hint: '💕' },
        { text: "让我想想", next: 'need_time', hint: '⏰' }
      ],
      effects: { intimacy: 10, like: 10, love_confession: 1 }
    },

    mutual_feeling: {
      text: ...(眼睛睁大 泪光闪烁)\n\n...真的吗？(声音颤抖)\n\n(深呼吸 平复情绪)\n\n...好的。那 从今往后 我们不再是普通朋友了。\n\n(伸出手) 可以牵吗？",
      choices: [(text: "(握住她的手)", next: 'hold_hands', hint: '🤝❤️')],
      effects: { happiness: 20, love: 1, stress: -25, peace: 10 },
      triggerEvent: 'romance_lili'
    },

    hold_hands: {
      text: ...(手心温暖而微微出汗)\n\n...你的手很暖和。\n\n(靠在你肩膀上)\n\n★ 与莉莉的关系升华为恋人 ★",
      choices: [], isEnd: true
    },

    need_time: {
      text: ...(点点头 眼中有失落但更多的是理解)\n\n好。我等。\n\n不管多久我都等。\n\n(微笑) 毕竟 我已经等了很久了。再多等一会儿也没关系。",
      choices: [{ text: '(心中五味杂陈)', next: 'end_touched', hint: '💙' }],
      effects: { intimacy: 8, like: 7, respect: 5 }
    },

    lean_on_her: {
      text: *(身体僵硬了一瞬然后放松)*

\n...(轻轻地让你靠着)

\n这里永远为你敞开。
      choices: [], isEnd: true,
      effects: { peace: 10, stress: -20, intimacy: 8, happiness: 8 }
    },

    let_it_slide: {
      text: ...(似乎松了一口气 又似乎有些失望)\n\n...你这个人 总是这样。
      choices: [{ text: '(神秘地笑了)', next: 'end_mysterious', hint: '😏' }],
      effects: { intimacy: 3, charm: 1 }
    },

    just_see_her: {
      text: ...(愣住 脸颊染上一抹粉色)

\n...你这个人 怎么总说这种话。
      choices: [
        { text: '因为是真的', next: 'honest_words', hint: '💗' },
        { text: '逗你的', next: 'teasing', hint: '😄' }
      ]
    },

    honest_words: {
      text: ...(低头 手指绞着衣角)

\n...笨蛋。

\n(很小声的)
      choices: [], isEnd: true,
      effects: { like: 5, intimacy: 5, happiness: 10 }
    },

    teasing: {
      text: ...(瞪了你一眼 但眼睛里有笑意)

\n你啊...

\n(拿起书挡住脸 但耳朵通红)
      choices: [], isEnd: true,
      effects: { like: 3, intimacy: 3, happiness: 6 }
    },

    her_mind: {
      text: "我的想法？(思考)\n\n...有时候在想 这样日复一日的工作是不是我想要的。\n\n银行稳定 体面 收入也不错。但总觉得少了点什么。",
      choices: [
        { text: "少了什么？", next: 'missing_something', hint: '❓' },
        { text: "你想做什么？", next: 'dream_ask', hint: '⭐' }
      ],
      effects: { intimacy: 3, trust: 2 }
    },

    missing_something: {
      text: ...(望着窗外)

\n...热情吧 可能。或者是意义。

\n每天处理数字 帮人理财 但感觉不到自己在创造任何价值。

\n(转头看你) 你有没有这种感觉？
      choices: [
        { text: "有 经常", next: 'shared_feeling', hint: '🤝' },
        { text: "还没有 但我能理解", next: 'understand', hint: '💡' }
      ]
    },

    shared_feeling: {
      text: ...(眼神变得柔和)

\n...原来你也是。

\n(轻轻叹气) 这个世界上 能理解这种感觉的人不多。很高兴遇到了你。
      choices: [{ text: '我也是', next: 'soul_connection', hint: '💙' }],
      effects: { soul_connection: 1, intimacy: 6, trust: 5 }
    },

    soul_connection: {
      text: ...(沉默良久)

\n...你知道吗 我不太善于表达情感。

\n但在你面前 不知道为什么 就想说真心话。

\n(直视你的眼睛) 谢谢你愿意倾听。
      choices: [], isEnd: true,
      effects: { intimacy: 7, trust: 6, peace: 5, happiness: 8 }
    },

    understand: {
      text: "你能理解就已经很难得了。\n\n(微笑) 很多人听到这种说法会觉得矫情或者不知足。\n\n...谢谢你愿意认真对待我的感受。",
      choices: [{ text: "你的感受很重要", next: 'important_to_me', hint: '❤️' }],
      effects: { intimacy: 4, trust: 3, like: 2 }
    },

    important_to_me: {
      text: ...(屏住呼吸)

\n...你也是。

\n对我而言。

\n(快速低下头)
      choices: [], isEnd: true,
      effects: { like: 6, intimacy: 6, happiness: 10 }
    },

    dream_ask: {
      text: "我想做什么？(苦笑)\n\n...小时候想当作家。写那种能让读者哭出来的故事。\n\n后来现实来了 选了金融 因为'更有前途'。现在偶尔还会写点什么 但再也不敢给别人看了。",
      choices: [
        { text: "我想看你的作品", next: 'want_read', hint: '📖' },
        { text: "为什么不追求梦想呢？", next: 'why_not_dream', hint: '⭐' }
      ],
      effects: { intimacy: 4, trust: 3 }
    },

    want_read: {
      text: ...(惊慌)

\n不行！那些写得很烂的！

\n...(看到你的眼神)

\n...好吧。如果你真的想看的话。

\n(从包里掏出一个笔记本 递给你时手有些抖)
      choices: [{ text: '(翻开笔记本)', next: 'read_her_work', hint: '📓' }],
      effects: { intimacy: 6, trust: 5, like: 4, art: 1 }
    },

    read_her_work: {
      text: *(紧张地看着你的表情变化 一字一句地观察)*

\n...怎么样？(小心翼翼)

\n(你的评价对她来说意味着一切)
      choices: [
        { text: "写得非常好", next: 'praise_writing', hint: '⭐' },
        { text: "你应该继续写作", next: 'encourage_write', hint: '✍️' }
      ],
      effects: { inspiration: 5, intimacy: 4 }
    },

    praise_writing: {
      text: *(眼眶红了)*

\n...你是第一个说这话的人。

\n*(接过笔记本紧紧抱在胸口)*

\n...谢谢。真的谢谢。
      choices: [{ text: '你应该发表出来', next: 'suggest_publish', hint: '📚' }],
      effects: { confidence: 5, happiness: 15, intimacy: 5 }
    },

    suggest_publish: {
      text: "发表？(摇头)\n\n...算了 我不敢。\n\n(犹豫了一会儿) 但如果你说可以的话...也许我可以试试？\n\n只发一篇！就一篇！",
      choices: [{ text: '一定要发！', next: 'publish_promise', hint: '📢' }],
      effects: { courage: 3, ambition: 2, intimacy: 3 }
    },

    publish_promise: {
      text: *(深呼吸)*

\n好。我说到做到。\n\n*★ 莉莉决定尝试发表作品 ★*

\n(握紧拳头) 如果发表了 第一本要送给的人就是你。
      choices: [], isEnd: true,
      effects: { happiness: 18, motivation: 8, intimacy: 5 },
      triggerEvent: 'lili_publishes'
    },

    encourage_write: {
      text: "...(咬着嘴唇)\n\n你总是知道该说什么。\n\n(合上笔记本) 好。我会继续写的。为了你 也为了我自己。\n\n(抬头) 谢谢你没有嘲笑我的梦想。",
      choices: [{ text: '梦想不值得嘲笑', end: 'dreams_matter', hint: '✨' }],
      effects: { confidence: 4, motivation: 8, intimacy: 5 }
    },

    dreams_matter: {
      text: *(看着你很久很久)*

\n...(轻声) 你是个特别的人。

\n*(站起来)* 我该回家了。但是...明天还能见到你吗？
      choices: [{ text: '一定', next: 'tomorrow_promise', hint: '📅' }],
      effects: { intimacy: 6, like: 5, happiness: 10 }
    },

    tomorrow_promise: {
      text: *(微笑 真正的那种发自内心的微笑)*

\n好。一言为定。

\n*(转身离开 走出几步后回头)*

\n...晚安。(声音很轻)
      choices: [], isEnd: true,
      effects: { peace: 5, happiness: 12, motivation: 5 }
    },

    why_not_dream: {
      text: "为什么？(自嘲)\n\n因为现实不允许吧。房贷 父母期望 社会压力...\n\n(摇头) 也许有一天我会勇敢一次。但不是现在。",
      choices: [
        { text: "那一天会来的", next: 'that_day_comes', hint: '🌟' },
        { text: "我可以支持你", next: 'support_dream', hint: '🤝' }
      ],
      effects: { intimacy: 4, trust: 3 }
    },

    that_day_comes: {
      text: *(眼中闪过一丝光芒)*

\n...你会陪我等到那天吗？

\n(不等回答) 开玩笑的。我自己的人生我自己负责。\n\n但...有你在身边的话 会容易很多。
      choices: [{ text: '我会一直在这里', next: 'always_here', hint: '💙' }],
      effects: { intimacy: 6, trust: 5, like: 4 }
    },

    always_here: {
      text: ...(喉头滚动了一下)

\n...你这个人是魔鬼吗 为什么总能说出让我心动的话。

\n*(转过身去)* 走了。再见。

\n*(声音有些哑)* 明天见。
      choices: [], isEnd: true,
      effects: { happiness: 14, intimacy: 5, like: 5 }
    },

    support_dream: {
      text: "支持我？(认真地看着你)\n\n...你知道这意味着什么吗？放弃稳定的工作 去追逐一个不确定的梦想。可能失败可能后悔。\n\n你还愿意支持？",
      choices: [
        { text: '无论成败 都支持', next: 'no_matter_what', hint: '🛡️' },
        { text: '即使失败我也在你身边', next: 'there_for_you', hint: '🤗' }
      ],
      effects: { intimacy: 6, trust: 6 }
    },

    no_matter_what: {
      text: *(泪水终于落了下来)*

\n...(擦掉眼泪)

\n...从来没有人对我说过这样的话。

\n*(走向你 停在你面前)*

\n我不需要你现在做任何承诺。但请你记住此刻说的话。

\n*(轻轻拥抱了一下然后快速退开)*

\n好了 我真的要走了。晚安。
      choices: [], isEnd: true,
      effects: { happiness: 16, peace: 8, intimacy: 8, trust: 8, love: 1 }
    },

    there_for_you: {
      text: *(微笑 泪光未干)*

\n这就够了。真的。

\n有人愿意在我身边 就已经比什么都重要了。

\n*(递过来一张纸条)* 这是我的地址。如果想聊天的话 可以来找我。

\n*(快步离开)*
      choices: [], isEnd: true,
      effects: { intimacy: 7, address_lili: 1, happiness: 12 },
      triggerHint: 'lili_address'
    },

    share_thoughts: {
      text: "哦？说说看。(放下书认真倾听)\n\n(这个姿态说明她在乎你的想法)",
      choices: [
        { text: "谈谈人生方向", next: 'life_direction', hint: '🧭' },
        { text: "谈谈最近的感悟", next: 'recent_insight', hint: '💡' },
        { text: "随便聊聊", next: 'casual_chat', hint: '☕' }
      ],
      effects: { intimacy: 2 }
    },

    life_direction: {
      text: *(听完沉思)*

\n人生方向啊...这个问题我也没有标准答案。

\n但我相信一件事：重要的不是方向对不对 而是你是否在朝着某个方向前进。

\n停滞不前才是最可怕的。
      choices: [
        { text: "很有道理", next: 'wise_words', hint: '💡' },
        { text: "那你找到方向了吗？", next: 'her_direction', hint: '🔍' }
      ],
      effects: { wisdom: 2, intellect: 1 }
    },

    wise_words: {
      text: *(淡淡地笑)*

\n谢谢。不过这些都是书上看来的。

\n真正的生活智慧 还是要在实践中获得。

\n*(看着你)* 和你聊天总能让我想到新的东西。这也是我喜欢和你说话的原因。
      choices: [], isEnd: true,
      effects: { intimacy: 4, inspiration: 2, like: 2 }
    },

    her_direction: {
      text: *(摇头)*

\n还没有完全确定。但最近有一个模糊的想法...

\n*(犹豫了一下)*

\n也许我应该去做一些真正有意义的事。不只是赚钱 而是帮助别人。

\n比如财务知识普及 让更多人避免被骗...类似这样的事。
      choices: [
        { text: "这个想法很棒", next: 'great_idea', hint: '⭐' },
        { text: "我可以帮你", next: 'help_her', hint: '🤝' }
      ],
      effects: { intimacy: 4, trust: 3 }
    },

    great_idea: {
      text: *(眼睛亮了起来)*

\n...真的吗？你觉得可行？

\n*(兴奋地说了好几分钟关于财务普及的计划)*

\n...对不起 说太多了。我就是一说起这个就控制不住。
      choices: [{ text: "我很喜欢听你说这些", next: 'like_listening', hint: '💙' }],
      effects: { ambition: 3, motivation: 5, intimacy: 4 }
    },

    like_listening: {
      text: *(脸红了)*

\n...你这个人。

\n*(小声)* 谢谢。

\n*(重新打开书 但一个字也看不进去)*
      choices: [], isEnd: true,
      effects: { like: 5, intimacy: 4, happiness: 8 }
    },

    help_her: {
      text: *(惊喜地看着你)*

\n你要帮我？

\n...你知道这可能没有任何经济回报吗？甚至可能要贴钱贴时间？

\n(看到你坚定的眼神) ...

\n好。那就一起吧。
      choices: [{ text: '(击掌约定)', next: 'pact_made', hint: '🤝' }],
      effects: { partnership: 1, ambition: 4, motivation: 8, intimacy: 5 },
      triggerEvent: 'financial_literacy_project'
    },

    pact_made: {
      text: *★ 与莉莉达成共同项目约定 ★*

\n*(郑重地点头)*

\n这件事我不会轻易开始的。一旦开始就会全力以赴。

\n所以你也要做好准备哦。
      choices: [], isEnd: true,
      effects: { responsibility: 2, purpose: 3, happiness: 10 }
    },

    recent_insight: {
      text: "感悟？说来听听。\n\n(身体前倾表示兴趣)",
      choices: [
        { text: "分享一个深刻的领悟", next: 'share_epiphany', hint: '💡' },
        { text: "就是一些乱七八糟的想法", next: 'random_thoughts', hint: '🌀' }
      ]
    },

    share_epiphany: {
      text: *(认真听着 点头)*

\n...你说得对。这就是所谓的"顿悟"时刻吧。

\n*(思考)* 其实我觉得 人生就是由无数个这样的小瞬间组成的。每一个感悟都在塑造我们成为什么样的人。
      choices: [{ text: '说得太好了', next: 'end_appreciated', hint: '✨' }],
      effects: { wisdom: 2, philosophy: 1, intimacy: 3 }
    },

    random_thoughts: {
      text: *(笑)*

\n"乱七八糟"的想法往往是最有趣的。

\n说吧 我洗耳恭听。不管多奇怪都可以。
      choices: [{ text: '(畅所欲言)', next: 'free_talk', hint: '🗣️' }],
      effects: { creativity: 1, intimacy: 3, happiness: 4 }
    },

    free_talk: {
      text: *(听完笑了)*

\n你真的很有趣。和你聊天永远不会无聊。

\n*(看了看表)* ...时间过得好快。下次再来找我聊天好吗？
      choices: [{ text: '一定', next: 'end_promise_next', hint: '📅' }],
      effects: { happiness: 6, intimacy: 3 }
    },

    casual_chat: {
      text: "随便聊聊？好。\n\n*(放松下来)*

\n最近在读一本书 关于行为经济学的。你知道人做决策很多时候是非理性的吗？即使自以为很理性...
      choices: [
        { text: "展开讲讲", next: 'book_discussion', hint: '📚' },
        { text: "你对这个感兴趣？", next: 'interest_ask', hint: '❓' }
      ],
      effects: { intellect: 1, intimacy: 2 }
    },

    book_discussion: {
      text: *(眼睛亮了 终于找到了感兴趣的话题)*

\n这本书超有意思！作者通过大量实验证明...

\n*(滔滔不绝讲了二十分钟)*

\n...啊抱歉 说太多了。你是不是觉得我很无聊？
      choices: [
        { text: "一点也不 我很爱听", next: 'love_hearing', hint: '💙' },
        { text: "你讲得很生动", next: 'engaging_talker', hint: '🗣️' }
      ],
      effects: { intellect: 3, finance_knowledge: 2, intimacy: 4 }
    },

    love_hearing: {
      text: *(愣住)*

\n...你真的这么觉得？(小心翼翼地问)

\n*(得到肯定后 脸上绽开罕见的灿烂笑容)*

\n...谢谢。很少有人愿意听我讲这些东西了。
      choices: [], isEnd: true,
      effects: { like: 5, intimacy: 5, happiness: 12 }
    },

    engaging_talker: {
      text: *(满意地点头)*

\n谢谢。也许我应该去当老师哈哈。

\n*(开玩笑)* 不过如果真的开了财务知识普及课 你一定要来做第一个学生。
      choices: [{ text: '一定捧场', next: 'first_student', hint: '🎓' }],
      effects: { intimacy: 3, humor: 1 }
    },

    first_student: {
      text: *★ 成为莉莉未来课程的第一位承诺学员 ★*

\n一言为定！

\n*(伸出手)* 击掌为证！
      choices: [], isEnd: true,
      effects: { motivation: 4, happiness: 8, intimacy: 3 }
    },

    interest_ask: {
      text: "感兴趣？嗯...算是吧。\n\n*(犹豫)* 其实我对心理学和行为经济学都很感兴趣。只是工作用不上而已。\n\n业余爱好吧算是。",
      choices: [
        { text: "爱好很宝贵 应该发展", next: 'value_hobby', hint: '💎' },
        { text: "可以把它变成事业", next: 'hobby_to_career', hint: '🏢' }
      ],
      effects: { intimacy: 3 }
    },

    value_hobby: {
      text: *(若有所思)*

\n...你说得对。爱好让生活有了色彩。

\n*(对你微笑)* 谢谢你提醒了我这一点。也许我真的应该花更多时间在自己喜欢的事情上。
      choices: [], isEnd: true,
      effects: { happiness: 6, life_balance: 2, intimacy: 3 }
    },

    hobby_to_career: {
      text: *(惊讶)*

\n变成事业？...我没想过。

\n*(认真思考)* 不过如果像你说的那样 结合财务知识和行为经济学 做一些有意义的事...

\n也许真的是个方向。
      choices: [{ text: '我会支持你的', next: 'support_again', hint: '🤝' }],
      effects: { ambition: 3, career_clarity: 2, intimacy: 4 }
    },

    support_again: {
      text: *(深深地看着你)*

\n你已经是第三次说要支持我了。

\n*(轻声)* 我开始相信你了。
      choices: [], isEnd: true,
      effects: { trust: 6, intimacy: 6, belief: 3, happiness: 10 }
    },

    invite: {
      text: *(正在看书的手停在半空)*

\n...邀请我？

\n*(合上书)* 去...哪里？
      choices: [
        { text: "去看电影", next: 'movie_date', hint: '🎬' },
        { text: "去散步", next: 'walk_date', hint: '🌙' },
        { text: "就在这里坐着", next: 'stay_here', hint: '🪑' }
      ],
      effects: {}
    },

    movie_date: {
      text: *电影？*(耳根红了)*

\n...好。我去换件衣服。

\n*(站起身又坐下)* 啊对了 看什么类型的？我有好多想看的但一直没机会...

\n*(意识到自己暴露了期待 清咳一声)* 我是说 都可以。你决定。
      choices: [], isEnd: true,
      triggerEvent: 'date_movie_lili',
      effects: { happiness: 12, intimacy: 4, like: 3 }
    },

    walk_date: {
      text: *散步？*(想了想)*

\n好。今晚月色不错。

\n*(自然地走到你身边)* 走吧。
      choices: [], isEnd: true,
      triggerEvent: 'walk_with_lili',
      effects: { peace: 8, happiness: 10, intimacy: 4, nature: 2 }
    },

    stay_here: {
      text: *...就在这里？*(心跳加速了一拍)*

\n...好。

\n*(重新打开书 但一个字都没看进去 时不时偷偷瞄你一眼)*

\n*(空气中有一种甜蜜的安静)*
      choices: [], isEnd: true,
      effects: { peace: 10, intimacy: 5, happiness: 8 }
    },

    end_grateful: { text: "不客气。好好理财。再见。", choices: [], isEnd: true, effects: { happiness: 3 } },
    end_secret_smile: { text: *(目送你离开)* ...", choices: [], isEnd: true, effects: { happiness: 5 } },
    end_shy_lili: { text: *(埋头工作)* ...", choices: [], isEnd: true, effects: { like: 3 } },
    end_flustered: { text: *(假装专注工作)* ...", choices: [], isEnd: true, effects: { like: 4, charm: 2 } },
    end_gentle: { text: "好的。慢走。(微微点头)", choices: [], isEnd: true, effects: { intimacy: 2 } },
    end_touched: { text: *(挥手)* ...路上小心。", choices: [], isEnd: true, effects: { happiness: 5, peace: 3 } },
    end_mysterious: { text: *(翻了个白眼但嘴角上扬)* 下次见。", choices: [], isEnd: true, effects: { charm: 2 } },
    end_appreciated: { text: "你也是个有趣的人。(合上书) 下次再来找我聊天。", choices: [], isEnd: true, effects: { happiness: 5, intimacy: 2 } },
    end_promise_next: { text: "好。我等你。(微笑)", choices: [], isEnd: true, effects: { happiness: 4, anticipation: 2 } },
    end: { text: "再见。(点头示意)", choices: [], isEnd: true }
  },

  // ════════════════════════════════════════
  // 阿飞 — 外卖骑手 / 乐天派
  // 性格：外向、幽默、乐观、接地气
  // 关系线：陌生人 → 混熟脸 → 兄弟
  // ════════════════════════════════════════
  afei: {
    root: {
      text: (ctx) => {
        if (!ctx.met) return "(骑车停下 摘头盔) 哟！你好啊！等外卖呢还是等人？"
        if (ctx.location === 'convenience') return "嘿！又来买东西？今天满30减5！"
        const lines = [
          "哟！又见面了！(竖大拇指)",
          "兄弟/姐妹！最近咋样！",
          "(擦汗) 今天单子太多了 累死爹了哈哈",
          "嘿嘿 你好啊！看我帅不帅？(摆pose)"
        ]
        return lines[Math.floor(Math.random() * lines.length)]
      },
      choices: [
        { text: "聊聊天", next: 'chat', hint: '💬' },
        { text: "听听他的奇葩故事", next: 'stories', hint: '📖' },
        { text: "问路/打听消息", next: 'info', hint: '🗺️' }
      ]
    },

    chat: {
      text: (ctx) => {
        const pool = {
          stranger: ["你是住这附近的吧？我天天在这片跑单！", "你看起来面善！咱们是不是在哪见过？", "外卖不好干啊 但自由！想歇就歇！"],
          acquaintance: ["哎你有没有发现那条街橘猫越来越胖了？", "昨天送餐遇到一件超搞笑的事！", "最近平台抽成越来越高了..."],
          friend: ["兄弟/姐妹 有啥心事跟我说！别憋着！", "这片儿没有我不认识的 有事找我！", "虽然累但每天都能遇到有趣的人。"],
          close: ["你是我在这城市最好的朋友之一。", "不管啥时候需要 我随叫随到。", "谢谢你一直把我当朋友看。(认真了一秒)"]
        }
        const level = ctx.relationLevel || 'stranger'
        return (pool[level] || pool.stranger)[Math.floor(Math.random() * (pool[level] || pool.stranger).length)]
      },
      choices: [
        { text: "深入聊聊", next: 'chat_deep', hint: '💭' },
        { text: "听他讲段子", next: 'jokes', hint: '😂' },
        { text: "说说自己的事", next: 'share_self', hint: '🗣️' }
      ],
      effects: { happiness: 3, intimacy: 1 }
    },

    chat_deep: {
      text: (ctx) => ctx.mood === 'stressed'
        ? "哎？脸色不太好啊！出什么事了？跟阿飞说说！(凑近)"
        : "聊深了？行啊！我最喜欢深度交流了！(盘腿坐地上)",
      choices: [
        { text: "说了最近的困难", next: 'share_problem', hint: '😔' },
        { text: "问问他的故事", next: 'afei_story', hint: '📖' }
      ],
      effects: { intimacy: 2, trust: 1 }
    },

    share_problem: {
      text: "(拍了拍你的肩膀)\n\n兄弟/姐妹 人生嘛 总有起起落落的。\n\n我以前也坐办公室的 现在不也跑上外卖了吗？没啥过不去的坎！",
      choices: [
        { text: "你以前坐办公室？", next: 'office_past', hint: '🏢' },
        { text: "谢谢安慰", next: 'thanks_afei', hint: '🙏' }
      ],
      effects: { stress: -8, intimacy: 4, trust: 3, happiness: 3 }
    },

    office_past: {
      text: "做了三年销售。业绩还不错 就是...太累了。\n\n每天应酬喝酒陪笑脸 回家倒头就睡 连自己是谁都快忘了。\n\n后来有一天照镜子 突然觉得这不是我想要的生活。就辞职买了辆电动车。",
      choices: [
        { text: "后悔吗？", next: 'regret_ask', hint: '❓' },
        { text: "佩服你的勇气", next: 'respect_choice', hint: '👍' }
      ],
      effects: { intimacy: 4, wisdom: 2 }
    },

    regret_ask: {
      text: "钱确实少了点 以前一两万现在好的话七八千。\n\n但是！(眼睛亮了) 我现在每天笑的次数比那三年加起来都多！\n\n能见到阳光 能感受到风 能认识各种有趣的人！钱可以再赚 快乐是无价的！",
      choices: [{ text: '(被他的乐观感染了)', next: 'end_optimistic', hint: '☀️' }],
      effects: { optimism: 4, happiness: 8, motivation: 5, life_perspective: 2 }
    },

    respect_choice: {
      text: "哎呀 别夸我了 怪不好意思的！\n\n其实每个人心里都有勇气 只是有些人还没找到触发它的契机罢了。\n\n我相信你也有 只是你还不知道而已。",
      choices: [{ text: "谢谢阿飞", next: 'end_warm', hint: '❤️' }],
      effects: { confidence: 4, intimacy: 4, trust: 3 }
    },

    thanks_afei: {
      text: "谢啥！朋友之间不说谢！\n\n(从箱子拿出一瓶水) 给！冰镇的！没喝过！拿着！",
      choices: [{ text: '(心里暖暖的)', next: 'end_care', hint: '🧊❤️' }],
      effects: { happiness: 6, intimacy: 4, trust: 3 }
    },

    afei_story: {
      text: "我的故事？农村出来的娃 → 大城市打工 → 卖保险做销售送快递 → 最后选了外卖。\n\n为啥选外卖？**自由！** 不用看老板脸色 不用应付同事关系 想跑就跑想歇就歇！\n\n虽然辛苦 但心里踏实！",
      choices: [
        { text: "以后有啥打算", next: 'future_plan', hint: '🔮' },
        { text: "家里还好吗", next: 'family_afei', hint: '👨‍👩‍👧' }
      ],
      effects: { intimacy: 3, trust: 2 }
    },

    family_afei: {
      text: "(笑容柔和下来)\n\n爸妈身体还行 弟弟在上大学！每月寄两千块他们总说够用让我自己留着。\n\n(眼眶微红) ...有时候觉得自己挺亏欠他们的。但他们说 只要我开心 他们就开心。",
      choices: [
        { text: "你是个好儿子", next: 'good_son', hint: '👨‍👦' },
        { text: "他们说得对", next: 'parents_right', hint: '💕' }
      ],
      effects: { intimacy: 5, trust: 4, family_values: 2 }
    },

    good_son: {
      text: "(抹了抹眼角) ...谢了哥们/姐们。\n\n行了行了 说这些煽情的干啥！\n\n走！请你吃个炒饭！我知道一家超好吃的！(拉你就走)",
      choices: [], isEnd: true,
      triggerEvent: 'street_food_with_afei',
      effects: { happiness: 12, hunger: -35, money: -25, intimacy: 4 }
    },

    parents_right: {
      text: "(点头) 是啊。他们总把最好的留给我 自己什么都不要。\n\n所以我要更努力 让他们过上好日子！等弟弟毕业了我回老家开个店让爸妈享福！",
      choices: [{ text: "一定可以的", next: 'end_encouraged', hint: '✨' }],
      effects: { ambition: 3, motivation: 5, intimacy: 3 }
    },

    future_plan: {
      text: "(眼睛放光) 攒够了本钱就回老家开小吃摊！把老陈叔的手艺学过来！\n\n然后找个好姑娘成个家安安稳稳过日子！(害羞挠头) 嘿嘿说远了！",
      choices: [
        { text: "这个梦想很美好", next: 'dream_nice', hint: '🌈' },
        { text: "我可以投资入股", next: 'invest_offer', hint: '💰' }
      ],
      effects: { intimacy: 3, ambition: 2 }
    },

    dream_nice: {
      text: "是吧！！人活着就得有个奔头嘛！不然浑浑噩噩的有啥意思！\n\n交个朋友吧！以后常联系！",
      choices: [], isEnd: true,
      effects: { friendship: 1, intimacy: 4, social: 2, happiness: 6 }
    },

    invest_offer: {
      text: "(瞪大眼睛) 入股？！真的假的？！\n\n(紧张得手抖) 但我现在连店面都没有...万一赔了...\n\n这个...让我好好想想...",
      choices: [
        { text: "不急 你先规划好", next: 'no_rush', hint: '🤝' },
        { text: "我是认真的 相信你", next: 'trust_afei', hint: '💙' }
      ],
      effects: { intimacy: 5, trust: 4, business_opportunity: 1 }
    },

    no_rush: {
      text: "(松了口气又有些失落) 嗯你说得对 不能冲动。\n\n我会好好规划的！有了具体方案再来找你！这份情我记下了！",
      choices: [], isEnd: true,
      effects: { trust: 5, gratitude: 3, responsibility: 2, intimacy: 4 }
    },

    trust_afei: {
      text: "(愣住 眼眶红了) ...\n\n兄弟/姐妹...我不知道该说什么。\n\n(擦眼角) 行！为了你这句话 我一定会拼尽全力的！绝不让你失望！",
      choices: [], isEnd: true,
      effects: { trust: 8, intimacy: 7, motivation: 10, determination: 5 },
      triggerEvent: 'afei_business_promise'
    },

    jokes: {
      text: "想听段子来来来！\n\n你知道外卖小哥最怕什么吗？差评 超时 电梯坏了 还是以上全是？\n\n答案是D哈哈哈！以上全中的时候才是最绝望的！！",
      choices: [
        { text: "哈哈哈 再来一个", next: 'more_jokes', hint: '😂' },
        { text: "太真实了吧", next: 'too_real', hint: '😅' }
      ],
      effects: { happiness: 6, stress: -5 }
    },

    more_jokes: {
      text: "有一次送餐到高档小区 门禁不让进 让客户下楼取。\n\n结果客户是个小哥哥 开门只穿了一条围裙！\n\n我问'您这是...' 他淡定地说'刚在做烘焙'\n\n我信你个鬼！！！(大笑)",
      choices: [(text: '(笑到肚子疼)', next: 'laughing_fit', hint: '😂')],
      effects: { happiness: 10, stress: -10, intimacy: 2 }
    },

    laughing_fit: {
      text: "哈哈哈哈 看你笑的！人生就是要多笑笑！\n\n笑一笑十年少！愁一愁白了头！",
      choices: [], isEnd: true,
      effects: { happiness: 5, longevity: 1, intimacy: 1 }
    },

    too_real: {
      text: "是吧！每一个都是血泪史！不过趣事也不少！\n\n每天遇到各种各样的人 见识人间百态！这也是一种财富嘛！",
      choices: [{ text: "你心态真好", next: 'good_mindset', hint: '☀️' }],
      effects: { optimism: 2, perspective: 1, intimacy: 2 }
    },

    good_mindset: {
      text: "(得意) 那是我最大的优点！天塌下来当被子盖！\n\n跟我做朋友保准你每天开心！",
      choices: [], isEnd: true,
      effects: { happiness: 6, optimism: 2, intimacy: 2 }
    },

    share_self: {
      text: "你想聊聊你自己？来吧 我洗耳恭听！\n\n(盘腿坐下 认真地看着你)",
      choices: [
        { text: "说说工作压力", next: 'share_work', hint: '💼' },
        { text: "说说感情问题", next: 'share_love', hint: '💕' }
      ],
      effects: { intimacy: 2, trust: 1 }
    },

    share_work: {
      text: "(听完叹气) 工作压力啊 我理解。\n\n但我有个秘诀——**做完一件事就忘掉它** 不管好坏都翻篇 不然心里装太多会崩溃。\n\n你可以试试每天睡前花五分钟想想今天的好事 坚持一个月试试！",
      choices: [
        { text: "好 我试试", next: 'try_gratitude', hint: '✅' },
        { text: "很难做到...", next: 'hard_to_do', hint: '😔' }
      ],
      effects: { wisdom: 2, mental_health: 1 }
    },

    try_gratitude: {
      text: "这就对了！(击掌)\n\n一周后来告诉我感受！如果没用的话我请你吃一个月的路边摊！(大笑)\n\n好了得跑了 单子来了！(戴头盔挥手)\n\n记得开心啊兄弟/姐妹！",
      choices: [], isEnd: true,
      effects: { motivation: 3, happiness: 6, gratitude: 1 }
    },

    hard_to_do: {
      text: "(蹲下来平视你) 难我知道难。\n\n但你可以从小事开始。如果没用的话...随时来找我聊天 我24小时在线(指耳朵)！",
      choices: [{ text: "谢谢", next: 'end_grateful', hint: '🙏' }],
      effects: { discipline: 1, mindfulness: 2, intimacy: 4, trust: 3 }
    },

    share_love: {
      text: "(眼睛亮了) 哦？？？感情问题？？快说！暗恋？失恋？暧昧中？？\n\n我虽然单身多年但理论知识丰富得很！！(拍胸脯)",
      choices: [
        { text: "不知道怎么追喜欢的人", next: 'crush_advice', hint: '💘' },
        { text: "刚分手很难受", next: 'breakup_support', hint: '💔' }
      ],
      effects: { intimacy: 3, romance_knowledge: 1 }
    },

    crush_advice: {
      text: "喜欢就要主动出击！！先制造偶遇 自然搭话 找共同话题 循序渐进！\n\n三个字：真诚！勇敢！坚持！还有——做你自己！不要装！",
      choices: [
        { text: "有道理！", next: 'advice_ok', hint: '💡' },
        { text: "怕被拒绝", next: 'fear_reject', hint: '😰' }
      ],
      effects: { charm: 1, courage: 2, romance: 2 }
    },

    advice_ok: {
      text: "那就行动起来！去吧追求幸福的人最帅最美！成功了请我吃饭！！(眨眼)",
      choices: [], isEnd: true,
      effects: { courage: 3, confidence: 2, motivation: 5 }
    },

    fear_reject: {
      text: "(收起笑容) 怕被拒绝很正常 每个人都怕。\n\n我也追过一个姑娘两年最后她选了别人 当时觉得天塌了但现在回想起来那段经历让我成长了很多。\n\n就算被拒绝也没关系 至少努力过了 不会后悔。",
      choices: [(text: "谢谢你分享", next: 'thanks_share', hint: '🙏')],
      effects: { maturity: 2, courage: 2, intimacy: 5, trust: 3 }
    },

    thanks_share: {
      text: "朋友之间不说谢！但你这么说我很开心！\n\n说明你是懂得珍惜的人！值得拥有美好的爱情！加油！我看好你！",
      choices: [], isEnd: true,
      effects: { confidence: 3, happiness: 6, motivation: 6, courage: 3 }
    },

    breakup_support: {
      text: "(表情温柔下来) 分手了啊...\n\n(坐到你身边) 想哭就哭吧 这里没人笑话你。\n\n(递过来一张皱巴巴的纸巾) 虽然有点脏但心意是真的...",
      choices: [
        { text: "(哭了出来)", next: 'cry_together', hint: '😢' },
        { text: "我能挺过去", next: 'strong_face', hint: '💪' }
      ],
      effects: { comfort: 3, intimacy: 5, trust: 4 }
    },

    cry_together: {
      text: "(安静陪着 然后递可乐) 喝口甜的心情会好一点。\n\n告诉你个秘密——我也被甩过 当时哭了三天三夜 第四天突然觉得：操他的损失！\n\n你这么好 是他不懂得珍惜！",
      choices: [(text: "(破涕为笑)", next: 'smile_again', hint: '😊')],
      effects: { stress: -15, happiness: 8, self_esteem: 3, intimacy: 6, peace: 3 }
    },

    smile_again: {
      text: "笑了笑了这就对了！旧的去了新的会来的！而且下一个绝对更好！这是宇宙法则！\n\n(逗你笑) 走！请你吃烧烤疗伤！",
      choices: [], isEnd: true,
      triggerEvent: 'bbq_with_afei',
      effects: { happiness: 12, optimism: 4, hunger: -45, money: -60, intimacy: 3 }
    },

    strong_face: {
      text: "(看着你强忍泪水) 坚强是好事但也别硬撑着。\n\n想哭的时候随时来找我 还有 你比你想象的要强大得多 这次挫折打不倒你的。",
      choices: [(text: "谢谢阿飞", next: 'end_grateful', hint: '🙏')],
      effects: { resilience: 3, inner_strength: 2, confidence: 3, trust: 4, intimacy: 4 }
    },

    stories: {
      text: "奇葩故事？那可太多了！(兴奋)\n\n有一次送餐到一栋楼 电梯坏了爬18层！送到的时候客人开门看到我瘫在地上问我是不是来讨债的...\n\n还有一次暴雨天 送到一个别墅 客人是只狗 主人留了张条子写着'放门口狗会自己吃'...",
      choices: [
        { text: "哈哈哈 还有吗", next: 'more_stories', hint: '😂' },
        { text: "你这工作太精彩了", next: 'colorful_life', hint: '🌈' }
      ],
      effects: { happiness: 7, stress: -6, intimacy: 2 }
    },

    more_stories: {
      text: "还有一次深夜送餐到网吧 一排人都在打游戏 我喊了一声'谁的外卖' 结果所有人同时回头...那个场面堪比僵尸片现场！！\n\n(笑得前仰后合) 吓死爹了！！",
      choices: [(text: '(一起狂笑)', next: 'laughing_together', hint: '😂😂')],
      effects: { happiness: 12, stress: -12, intimacy: 3, bonding: 2 }
    },

    laughing_together: {
      text: "哈哈哈哈 笑死了笑死了！！\n\n跟你聊天真开心！感觉一天的疲劳都没了！",
      choices: [], isEnd: true,
      effects: { happiness: 8, energy: 3, friendship: 1 }
    },

    colorful_life: {
      text: "是吧！我觉得我这份工作是世界上最有趣的工作之一！\n\n每天都在不同的地方见不同的人 听不同的故事！这就是生活啊！\n\n(张开双臂) 我爱我的工作！我爱这座城市！",
      choices: [{ text: "这种热情很有感染力", next: 'infectious', hint: '✨' }],
      effects: { passion: 2, joy_of_living: 2, enthusiasm: 2, happiness: 5 }
    },

    infectious: {
      text: "嘿嘿！能感染到你我很高兴！\n\n(拍你肩膀) 记住不管生活给你发什么牌 都要笑着打下去！\n\n走了！单子催了！下次再聊！保重啊兄弟/姐妹！",
      choices: [], isEnd: true,
      effects: { positivity: 2, resilience: 1, happiness: 5, motivation: 3 }
    },

    info: {
      text: "打听消息？这条街没有我不知道的！！(拍胸脯)\n\n问！啥都行！路线 店铺八卦 人物关系 我全能答！",
      choices: [
        { text: "怎么去某地", next: 'directions', hint: '🗺️' },
        { text: "附近有什么好吃的好玩的", next: 'recommendations', hint: '🍜' },
        { text: "最近有什么新闻", next: 'local_news', hint: '📰' }
      ]
    },

    directions: {
      text: "问路找我就对了！我可是活地图！(掏出手机)\n\n你要去哪？我帮你查最优路线！走路骑车公交地铁我都熟！",
      choices: [{ text: '(告诉目的地)', next: 'got_directions', hint: '📍' }],
      effects: { local_knowledge: 1 }
    },

    got_directions: {
      text: "OK！最快路线是这样的...(详细讲解)\n\n记住了吗？要我画个图给你不？(掏出纸笔准备画画)",
      choices: [(text: "太感谢了！", next: 'end_helpful', hint: '🙏' }],
      effects: { navigation: 1, trust: 1 }
    },

    recommendations: {
      text: "好吃的？那我可太专业了！天天到处跑 吃遍了这一片！\n\n推荐几家：老陈的面馆 绝对一绝！公园旁边的小吃街晚上超热闹！还有巷子里的奶茶店老板娘超漂亮( wink )！",
      choices: [
        { text: "详细介绍下", next: 'food_detail', hint: '🍽️' },
        { text: "改天一起去", next: 'go_together_food', hint: '🤝' }
      ],
      effects: { food_knowledge: 2, happiness: 3 }
    },

    food_detail: {
      text: "(滔滔不绝讲了十分钟各种美食)\n\n...总之跟着我吃绝对没错！我的舌头不会骗人！\n\n下次有空带你去探店！我请客！(豪迈)",
      choices: [], isEnd: true,
      triggerEvent: 'food_tour_with_afei',
      effects: { foodie: 1, happiness: 6, anticipation: 2 }
    },

    go_together_food: {
      text: "真的？！好耶！！什么时候？！我现在就可以！！\n\n(兴奋地原地蹦了两下) 啊不对还得跑单...那周末！周末一定去！！",
      choices: [], isEnd: true,
      effects: { excitement: 4, happiness: 8, anticipation: 3, intimacy: 2 }
    },

    local_news: {
      text: "本地新闻？(压低声音 四处张望)\n\n听说CBD那边在建新商场了！老街可能要拆迁改造！菜市场下个月搞美食节！\n\n还有——(神秘兮兮) 这条街上新开了家密室逃脱据说超刺激！",
      choices: [
        { text: "密室逃脱听起来不错", next: 'escape_room', hint: '🚪' },
        { text: "还有什么消息？", next: 'more_news', hint: '📰' }
      ],
      effects: { local_knowledge: 2 }
    },

    escape_room: {
      text: "是吧！我早就想去玩了！！\n\n要不组队？叫上几个人一起？你来不来？求你了求你了！！(双手合十)",
      choices: [(text: "好啊一起去", next: 'escape_plan', hint: '🎮')],
      effects: { adventure: 2, fun: 3, intimacy: 2, excitement: 3 }
    },

    escape_plan: {
      text: "YES！！太棒了！！(跳起来)\n\n★ 与阿飞约定去密室逃脱 ★\n\n这周末？还是下周？我来组织人！你放心交给我！(拍胸脯保证)",
      choices: [], isEnd: true,
      effects: { happiness: 12, anticipation: 5, social: 2, friendship: 1 },
      triggerEvent: 'escape_room_date'
    },

    more_news: {
      text: "还有还有——银行在推新产品 利率挺高的！健身房的年卡在打折！咖啡店出了新品桂花拿铁好评如潮！\n\n(掰手指头数) 还有什么来着...哦对了 公园周末有露天音乐会免费的那种！",
      choices: [(text: "消息真灵通", next: 'end_informed', hint: '📡')],
      effects: { local_knowledge: 3, social: 1 }
    },

    end_optimistic: { text: "(骑上车回头) 记住！没有什么过不去的坎！加油！走了！", choices: [], isEnd: true, effects: { motivation: 8, optimism: 3 } },
    end_warm: { text: "别客气！有事随时找我！", choices: [], isEnd: true, effects: { happiness: 4 } },
    end_care: { text: "(挥着手骑车离开) 保重啊兄弟/姐妹！", choices: [], isEnd: true, effects: { happiness: 5, health: 1 } },
    end_encouraged: { text: "借你吉言！(握拳) 走了！单子来了！", choices: [], isEnd: true, effects: { motivation: 5, happiness: 4 } },
    end_grateful: { text: "嘿！朋友之间不说谢！走了啊！", choices: [], isEnd: true, effects: { happiness: 3, trust: 2 } },
    end_helpful: { text: "小事一桩！有事儿再来找我！", choices: [], isEnd: true, effects: { trust: 1 } },
    end_informed: { text: "那必须的！我就是这条街的信息中心哈哈！", choices: [], isEnd: true, effects: { happiness: 3 } },
    end: { text: "走了走了！记得开心啊！拜拜~(骑车远去)", choices: [], isEnd: true, effects: { happiness: 3, energy: 1 } }
  }

}

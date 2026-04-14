/**
 * 「另一种人生」—— 地点系统
 * 城市中的各个地点，每个地点有不同的可用行动、开放时间、NPC
 */
class LocationEngine {
  constructor() {
    this.currentLocation = 'home';
    this.locations = {
      home: { id: 'home', name: '我的家', icon: '🏠', area: 'oldtown', color: '#6C5CE7',
        desc: '你温馨的小窝，虽然不大但很舒适。',
        openHours: [0, 24], // 全天
        actions: [
          { id: 'sleep', name: '睡觉', icon: '😴', duration: 480, timeReq: { after: 21 },
            effects: { 'body.fatigue': -80, 'body.energy': 60, 'mind.willpower': 40 }, desc: '好好睡一觉' },
          { id: 'nap', name: '午休', icon: '💤', duration: 60,
            effects: { 'body.fatigue': -20, 'body.energy': 15 }, desc: '眯一会儿' },
          { id: 'cook_simple', name: '做简餐', icon: '🍳', duration: 30, cost: 15,
            effects: { 'body.hunger': -40, 'mind.happiness': 3 }, skillGain: { cooking: 2 }, desc: '煮个面，炒个蛋' },
          { id: 'cook_nice', name: '做大餐', icon: '🥘', duration: 90, cost: 60, skillReq: { cooking: 3 },
            effects: { 'body.hunger': -80, 'mind.happiness': 10, 'mind.stress': -5 }, skillGain: { cooking: 5 }, desc: '露一手好厨艺' },
          { id: 'watch_tv', name: '看电视', icon: '📺', duration: 60,
            effects: { 'mind.happiness': 5, 'mind.stress': -3, 'body.fatigue': 3 }, desc: '放松一下追追剧' },
          { id: 'read_home', name: '在家看书', icon: '📖', duration: 60,
            effects: { 'mind.inspiration': 5, 'mind.stress': -2 }, desc: '安静地看会儿书' },
          { id: 'garden', name: '打理花园', icon: '🌱', duration: 60,
            effects: { 'mind.happiness': 5, 'mind.stress': -5, 'body.energy': -5 }, skillGain: { gardening: 3 }, desc: '浇水除草' },
          { id: 'play_game', name: '打游戏', icon: '🎮', duration: 120,
            effects: { 'mind.happiness': 10, 'mind.stress': -8, 'body.fatigue': 5, 'mind.loneliness': -3 }, desc: '开一把！' },
          { id: 'clean', name: '打扫卫生', icon: '🧹', duration: 45,
            effects: { 'mind.happiness': 2, 'body.energy': -8 }, desc: '保持家里整洁' }
        ]
      },
      office: { id: 'office', name: '写字楼', icon: '🏢', area: 'cbd', color: '#0984E3',
        desc: 'CBD核心区的甲级写字楼，人来人往。',
        openHours: [7, 22],
        actions: [
          { id: 'work_normal', name: '正常工作', icon: '💻', duration: 240, jobReq: true,
            effects: { 'body.energy': -20, 'body.fatigue': 15, 'mind.stress': 8 }, earn: 0, desc: '按部就班上班' },
          { id: 'work_hard', name: '努力加班', icon: '🔥', duration: 360, jobReq: true,
            effects: { 'body.energy': -40, 'body.fatigue': 30, 'mind.stress': 20, 'body.hunger': 20 }, earn: 0, desc: '拼一把！绩效+' },
          { id: 'work_slack', name: '摸鱼划水', icon: '🐟', duration: 240, jobReq: true,
            effects: { 'body.energy': -5, 'body.fatigue': 5, 'mind.happiness': 3 }, earn: 0, desc: '今天佛了' },
          { id: 'network', name: '职场社交', icon: '🤝', duration: 60, jobReq: true,
            effects: { 'social.reputation': 2, 'social.charm': 1, 'mind.stress': 3 }, skillGain: { social: 2, negotiate: 1 }, desc: '和同事搞好关系' },
          { id: 'find_job', name: '投简历', icon: '📄', duration: 60,
            effects: { 'mind.stress': 5 }, desc: '看看有什么好机会' }
        ]
      },
      cafe: { id: 'cafe', name: '街角咖啡', icon: '☕', area: 'artdistrict', color: '#E17055',
        desc: '文创区一家温馨的独立咖啡店，常有文艺青年出没。',
        openHours: [8, 22],
        actions: [
          { id: 'drink_coffee', name: '喝杯咖啡', icon: '☕', duration: 30, cost: 25,
            effects: { 'body.energy': 10, 'body.fatigue': -8, 'mind.happiness': 3, 'mind.inspiration': 5 }, desc: '一杯美式开启好心情' },
          { id: 'work_remote', name: '远程办公', icon: '💻', duration: 180, cost: 30,
            effects: { 'body.energy': -15, 'mind.inspiration': 5, 'mind.stress': 5 }, desc: '换个环境工作' },
          { id: 'people_watch', name: '观察路人', icon: '👀', duration: 60,
            effects: { 'mind.inspiration': 8, 'mind.happiness': 3, 'mind.loneliness': -5 }, desc: '看看来来往往的人，找找灵感' },
          { id: 'read_cafe', name: '看书', icon: '📚', duration: 90, cost: 25,
            effects: { 'mind.inspiration': 10, 'mind.stress': -5 }, desc: '在咖啡香中阅读' }
        ]
      },
      gym: { id: 'gym', name: '健身房', icon: '🏋️', area: 'downtown', color: '#E74C3C',
        desc: '设备齐全的连锁健身房。',
        openHours: [6, 23],
        actions: [
          { id: 'workout', name: '健身训练', icon: '💪', duration: 90, cost: 0,
            effects: { 'body.energy': -25, 'body.health': 2, 'body.appearance': 1, 'mind.happiness': 8, 'mind.stress': -10 }, skillGain: { fitness: 4 }, desc: '挥洒汗水！' },
          { id: 'yoga', name: '瑜伽', icon: '🧘', duration: 60, cost: 0,
            effects: { 'body.energy': -10, 'body.health': 1, 'mind.stress': -15, 'mind.happiness': 5 }, skillGain: { fitness: 2 }, desc: '身心放松' },
          { id: 'swim', name: '游泳', icon: '🏊', duration: 60, cost: 20,
            effects: { 'body.energy': -20, 'body.health': 3, 'mind.happiness': 8, 'mind.stress': -8 }, skillGain: { fitness: 3 }, desc: '畅游一番' }
        ]
      },
      park: { id: 'park', name: '城市公园', icon: '🌳', area: 'downtown', color: '#00B894',
        desc: '绿树成荫的城市公园，适合散步和放松。',
        openHours: [5, 22],
        actions: [
          { id: 'walk', name: '散步', icon: '🚶', duration: 45,
            effects: { 'mind.happiness': 5, 'mind.stress': -8, 'body.health': 1, 'mind.loneliness': -3 }, desc: '在绿荫下漫步' },
          { id: 'jog', name: '跑步', icon: '🏃', duration: 45,
            effects: { 'body.energy': -15, 'body.health': 2, 'mind.stress': -10, 'mind.happiness': 5 }, skillGain: { fitness: 2 }, desc: '晨跑/夜跑' },
          { id: 'fish', name: '钓鱼', icon: '🎣', duration: 120,
            effects: { 'mind.stress': -15, 'mind.happiness': 8, 'mind.inspiration': 5 }, skillGain: { fishing: 4 }, desc: '湖边钓鱼，享受宁静' },
          { id: 'sketch', name: '写生', icon: '🎨', duration: 90,
            effects: { 'mind.inspiration': 15, 'mind.happiness': 5 }, skillGain: { art: 4 }, desc: '画下眼前的美景' }
        ]
      },
      library: { id: 'library', name: '图书馆', icon: '📚', area: 'downtown', color: '#6C5CE7',
        desc: '安静的市立图书馆，藏书丰富。',
        openHours: [9, 21],
        actions: [
          { id: 'study_code', name: '学编程', icon: '💻', duration: 120,
            effects: { 'mind.inspiration': 5, 'body.energy': -10 }, skillGain: { coding: 5 }, desc: '系统学习编程知识' },
          { id: 'study_biz', name: '学商业', icon: '📊', duration: 120,
            effects: { 'mind.inspiration': 5, 'body.energy': -10 }, skillGain: { business: 5 }, desc: '研究商业案例' },
          { id: 'study_write', name: '练写作', icon: '✍️', duration: 90,
            effects: { 'mind.inspiration': 8, 'body.energy': -8 }, skillGain: { writing: 5 }, desc: '练习写作技巧' },
          { id: 'read_novel', name: '看小说', icon: '📖', duration: 90,
            effects: { 'mind.happiness': 8, 'mind.stress': -5, 'mind.inspiration': 5 }, desc: '沉浸在故事里' }
        ]
      },
      restaurant: { id: 'restaurant', name: '美食街', icon: '🍜', area: 'oldtown', color: '#FDCB6E',
        desc: '老城区热闹的美食街，各种小吃应有尽有。',
        openHours: [7, 23],
        actions: [
          { id: 'eat_cheap', name: '吃路边摊', icon: '🍜', duration: 30, cost: 20,
            effects: { 'body.hunger': -60, 'mind.happiness': 3 }, desc: '便宜实惠' },
          { id: 'eat_nice', name: '下馆子', icon: '🍽️', duration: 60, cost: 80,
            effects: { 'body.hunger': -80, 'mind.happiness': 8, 'mind.stress': -3 }, desc: '犒劳自己一顿' },
          { id: 'eat_fancy', name: '吃大餐', icon: '🥂', duration: 90, cost: 200,
            effects: { 'body.hunger': -100, 'mind.happiness': 15, 'mind.stress': -8, 'social.charm': 1 }, desc: '享受精致美食' }
        ]
      },
      mall: { id: 'mall', name: '购物中心', icon: '🛒', area: 'downtown', color: '#A29BFE',
        desc: '大型综合购物中心，吃喝玩乐一应俱全。',
        openHours: [10, 22],
        actions: [
          { id: 'buy_clothes', name: '买衣服', icon: '👔', duration: 60, cost: 200,
            effects: { 'body.appearance': 3, 'mind.happiness': 8 }, desc: '打扮一下自己' },
          { id: 'buy_gift', name: '买礼物', icon: '🎁', duration: 30, cost: 50,
            effects: { 'mind.happiness': 2 }, desc: '买个礼物送人' },
          { id: 'window_shop', name: '逛街', icon: '🚶', duration: 60,
            effects: { 'mind.happiness': 3, 'body.energy': -5 }, desc: '随便逛逛看看' },
          { id: 'movie', name: '看电影', icon: '🎬', duration: 120, cost: 50,
            effects: { 'mind.happiness': 12, 'mind.stress': -8, 'mind.loneliness': -5 }, desc: '看一场好电影' }
        ]
      },
      bar: { id: 'bar', name: '酒吧', icon: '🍺', area: 'downtown', color: '#2D3436',
        desc: '城里最热门的酒吧，夜生活的好去处。',
        openHours: [18, 26], // 18:00 ~ 次日2:00
        actions: [
          { id: 'drink', name: '喝一杯', icon: '🍺', duration: 60, cost: 40,
            effects: { 'mind.happiness': 8, 'mind.stress': -10, 'body.health': -1, 'mind.loneliness': -8 }, desc: '小酌一杯放松' },
          { id: 'drink_more', name: '喝多了', icon: '🍻', duration: 120, cost: 120,
            effects: { 'mind.happiness': 15, 'mind.stress': -20, 'body.health': -5, 'body.fatigue': 20 }, desc: '今晚不醉不归' },
          { id: 'bar_social', name: '搭讪聊天', icon: '💬', duration: 60, cost: 40,
            effects: { 'mind.loneliness': -15, 'social.charm': 1 }, skillGain: { social: 3 }, desc: '认识新朋友' }
        ]
      },
      market: { id: 'market', name: '人才市场', icon: '💼', area: 'cbd', color: '#636E72',
        desc: '找工作的好地方。',
        openHours: [9, 18],
        actions: [
          { id: 'job_search', name: '找工作', icon: '🔍', duration: 120,
            effects: { 'mind.stress': 8, 'body.energy': -10 }, desc: '浏览招聘信息' },
          { id: 'interview', name: '面试', icon: '👔', duration: 60,
            effects: { 'mind.stress': 15, 'body.energy': -10 }, skillGain: { social: 2, negotiate: 2 }, desc: '去面试试试' }
        ]
      },
      school: { id: 'school', name: '培训学校', icon: '🏫', area: 'downtown', color: '#00CEC9',
        desc: '各类职业技能培训。',
        openHours: [9, 21],
        actions: [
          { id: 'learn_code', name: '报编程班', icon: '💻', duration: 180, cost: 100,
            effects: { 'body.energy': -15 }, skillGain: { coding: 8 }, desc: '系统学编程' },
          { id: 'learn_cook', name: '报厨艺班', icon: '🍳', duration: 120, cost: 80,
            effects: { 'body.energy': -10 }, skillGain: { cooking: 8 }, desc: '跟大厨学做菜' },
          { id: 'learn_music', name: '学乐器', icon: '🎵', duration: 120, cost: 80,
            effects: { 'body.energy': -8, 'mind.happiness': 5 }, skillGain: { music: 8 }, desc: '学一门乐器' },
          { id: 'learn_drive', name: '学驾照', icon: '🚗', duration: 180, cost: 150,
            effects: { 'body.energy': -15, 'mind.stress': 5 }, skillGain: { driving: 8 }, desc: '考个驾照' }
        ]
      },
      hospital: { id: 'hospital', name: '医院', icon: '🏥', area: 'downtown', color: '#D63031',
        desc: '生病了就来这里。',
        openHours: [0, 24],
        actions: [
          { id: 'see_doctor', name: '看病', icon: '👨‍⚕️', duration: 120, cost: 200,
            effects: { 'body.health': 10 }, desc: '让医生看看' },
          { id: 'checkup', name: '体检', icon: '🩺', duration: 180, cost: 500,
            effects: { 'body.health': 5 }, desc: '全面体检' }
        ]
      },
      bank: { id: 'bank', name: '银行', icon: '🏦', area: 'cbd', color: '#2D3436',
        desc: '办理金融业务。',
        openHours: [9, 17],
        actions: [
          { id: 'deposit', name: '存款', icon: '💰', duration: 15, desc: '把现金存起来' },
          { id: 'withdraw', name: '取款', icon: '💵', duration: 15, desc: '取点现金' },
          { id: 'loan', name: '贷款', icon: '📋', duration: 60, desc: '申请贷款' },
          { id: 'invest', name: '了解理财', icon: '📈', duration: 60,
            effects: { 'mind.inspiration': 3 }, skillGain: { business: 2 }, desc: '看看理财产品' }
        ]
      },
      convenience: { id: 'convenience', name: '便利店', icon: '🏪', area: 'oldtown', color: '#00B894',
        desc: '24小时营业的便利店。',
        openHours: [0, 24],
        actions: [
          { id: 'buy_food', name: '买零食', icon: '🍙', duration: 10, cost: 15,
            effects: { 'body.hunger': -25, 'mind.happiness': 2 }, desc: '买点吃的垫垫肚子' },
          { id: 'buy_lottery', name: '买彩票', icon: '🎰', duration: 5, cost: 10,
            effects: {}, desc: '试试手气？' },
          { id: 'buy_supplies', name: '买日用品', icon: '🧴', duration: 15, cost: 30,
            effects: { 'mind.happiness': 1 }, desc: '补充家里的日用品' }
        ]
      }
    };
  }

  /** 获取当前可去的地点 */
  getAvailable(time) {
    return Object.values(this.locations).filter(loc => {
      const [open, close] = loc.openHours;
      if (close > 24) return time.hour >= open || time.hour < (close - 24);
      return time.hour >= open && time.hour < close;
    });
  }

  /** 获取地点可用的行动 */
  getActions(locationId, character, time) {
    const loc = this.locations[locationId];
    if (!loc) return [];
    return loc.actions.filter(a => {
      if (a.jobReq && !character.job.current) return false;
      if (a.skillReq) {
        for (const [sk, lv] of Object.entries(a.skillReq)) {
          if ((character.skills[sk]?.level || 0) < lv) return false;
        }
      }
      if (a.timeReq) {
        if (a.timeReq.after && time.hour < a.timeReq.after) return false;
        if (a.timeReq.before && time.hour >= a.timeReq.before) return false;
      }
      return true;
    });
  }

  /** 计算通勤时间（分钟）*/
  getTravelTime(from, to) {
    if (from === to) return 0;
    const areaDistance = {
      'oldtown-cbd': 30, 'oldtown-downtown': 20, 'oldtown-artdistrict': 25,
      'cbd-downtown': 15, 'cbd-artdistrict': 20, 'downtown-artdistrict': 15
    };
    const fromArea = this.locations[from]?.area || 'oldtown';
    const toArea = this.locations[to]?.area || 'oldtown';
    if (fromArea === toArea) return 10;
    const key1 = `${fromArea}-${toArea}`, key2 = `${toArea}-${fromArea}`;
    return areaDistance[key1] || areaDistance[key2] || 20;
  }

  serialize() { return { current: this.currentLocation }; }
  deserialize(d) { if (d?.current) this.currentLocation = d.current; }
}

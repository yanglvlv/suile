/**
 * LocationSystem v2 — 地点系统 (完整14个地点)
 * 每个地点有: Tiled地图数据、墙壁碰撞、家具/交互物、可用行动、开放时间
 */
export class LocationSystem {
  constructor() {
    this.currentLocation = 'home'
    this.locations = this._initLocations()
  }

  _initLocations() {
    return {

      // ════════════════════════════════════════
      // #1 我的家
      // ════════════════════════════════════════
      home: {
        id:'home', name:'我的家', icon:'🏠', area:'oldtown',
        desc:'你温馨的小窝，虽然不大但很舒适。这里是你恢复精力的港湾。',
        size:{ width:480, height:400 },
        bgColor: 0x1e1b4b,
        floorTile:'floor_wood',
        openHours:[0,24],
        entryPoint:{ x:240, y:340 },
        walls:[
          { x:0,y:0,w:480,h:16,tile:'wall' },
          { x:0,y:0,w:16,h:400,tile:'wall' },
          { x:464,y:0,w:16,h:400,tile:'wall' },
          { x:0,y:384,w:180,h:16,tile:'wall' },
          { x:260,y:384,w:220,h:16,tile:'wall' } // 门
        ],
        objects:[
          { x:40, y:300, sprite:'bed', interactive:true, actionId:'sleep', label:'💤 睡觉', depth:8 },
          { x:360, y:60, sprite:'desk', interactive:true, actionId:'work_remote', label:'💻 工作/学习', depth:8 },
          { x:380, y:56, sprite:'tv', interactive:false, depth:9 },
          { x:120, y:320, sprite:'fridge', interactive:true, actionId:'getFood', label:'🍔 吃东西', depth:8 },
          { x:80, y:200, sprite:'sofa', interactive:true, actionId:'relax', label:'😌 休息', depth:7 },
          { x:420, y:350, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → 街道', depth:6 },
          { x:30, y:140, sprite:'plant', interactive:true, actionId:'garden', label:'🌱 浇花', depth:10 }
        ],
        actions:[
          { id:'sleep', name:'睡觉', icon:'😴', duration:480, timeReq:{after:21},
            effects:{ 'body.fatigue':-80, 'body.energy':60, 'mind.motivation':40 }, desc:'好好睡一觉，迎接新的一天' },
          { id:'nap', name:'午休', icon:'💤', duration:60,
            effects:{ 'body.fatigue':-20, 'body.energy':15 }, desc:'眯一会儿' },
          { id:'cook_simple', name:'做简餐', icon:'🍳', duration:30, cost:15,
            effects:{ 'body.hunger':-40, 'mind.happiness':3 }, skillGain:{ cooking:2 }, desc:'煮个面炒个蛋' },
          { id:'cook_nice', name:'做大餐', icon:'🥘', duration:90, cost:60,
            skillReq:{ cooking:3 }, effects:{ 'body.hunger':-80, 'mind.happiness':10, 'mind.stress':-5 },
            skillGain:{ cooking:5 }, desc:'露一手好厨艺' },
          { id:'watch_tv', name:'看电视', icon:'📺', duration:60,
            effects:{ 'mind.happiness':5, 'mind.stress':-3, 'body.fatigue':3 }, desc:'放松一下追追剧' },
          { id:'play_game', name:'打游戏', icon:'🎮', duration:120,
            effects:{ 'mind.happiness':10, 'mind.stress':-8, 'body.fatigue':5, 'mind.motivation':-3 }, desc:'来一局！' },
          { id:'clean', name:'打扫卫生', icon:'🧹', duration:45,
            effects:{ 'mind.happiness':2, 'body.energy':-8 }, desc:'保持整洁' }
        ]
      },

      // ════════════════════════════════════════
      // #2 街角咖啡
      // ════════════════════════════════════════
      cafe: {
        id:'cafe', name:'街角咖啡', icon:'☕', area:'artdistrict',
        desc:'文创区一家温馨的独立咖啡店。空气中飘着烘焙豆香。',
        size:{ width:520, height:440 },
        bgColor: 0x292524,
        floorTile:'floor_tile',
        openHours:[7,23],
        entryPoint:{ x:260, y:400 },
        walls:[
          { x:0,y:0,w:520,h:16 }, { x:0,y:0,w:16,h:440 },
          { x:504,y:0,w:16,h:440 }, { x:0,y:424,w:220,h:16 },
          { x:300,y:424,w:220,h:16 }
        ],
        objects:[
          { x:260, y:180, sprite:'counter', interactive:true, actionId:'drink_coffee', label:'☕ 点单', depth:8 },
          { x:100, y:280, sprite:'table_round', interactive:true, actionId:'sit_cafe', label:'🪑 坐下', depth:7 },
          { x:380, y:260, sprite:'table_round', interactive:true, actionId:'sit_cafe', label:'🪑 坐下', depth:7 },
          { x:160, y:150, sprite:'shelf', interactive:false, depth:9 },
          { x:430, y:100, sprite:'plant', interactive:false, depth:10 },
          { x:256, y:412, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → 文创区', depth:6 }
        ],
        actions:[
          { id:'drink_coffee', name:'喝咖啡', icon:'☕', duration:30, cost:25,
            effects:{ 'body.energy':10, 'body.fatigue':-8, 'mind.happiness':3, 'mind.motivation':5 }, desc:'一杯美式开启好心情' },
          { id:'work_remote', name:'远程办公', icon:'💻', duration:180, cost:30,
            effects:{ 'body.energy':-15, 'mind.inspiration':5, 'mind.stress':5 }, desc:'换个环境工作' },
          { id:'people_watch', name:'观察路人', icon:'👀', duration:60,
            effects:{ 'mind.inspiration':8, 'mind.happiness':3, 'mind.motivation':2 }, desc:'看来来往往的人找灵感' },
          { id:'read_cafe', name:'看书', icon:'📚', duration:90, cost:25,
            effects:{ 'mind.inspiration':10, 'mind.stress':-5 }, desc:'在咖啡香中阅读' }
        ]
      },

      // ════════════════════════════════════════
      // #3 写字楼
      // ════════════════════════════════════════
      office: {
        id:'office', name:'CBD写字楼', icon:'🏢', area:'cbd',
        desc:'核心区甲级写字楼，玻璃幕墙映着城市天际线。你的工位在这里。',
        size:{ width:560, height:420 },
        bgColor: 0x1c1917,
        floorTile:'floor_concrete',
        openHours:[6,23],
        entryPoint:{ x:280, y:380 },
        walls:[
          { x:0,y:0,w:560,h:16 }, { x:0,y:0,w:16,h:420 },
          { x:544,y:0,w:16,h:420 }, { x:0,y:404,w:260,h:16 },
          { x:300,y:404,w:260,h:16 }
        ],
        objects:[
          { x:200, y:200, sprite:'desk', interactive:true, actionId:'work_normal', label:'💻 工位', depth:8 },
          { x:360, y:200, sprite:'desk', interactive:false, depth:8 },
          { x:80, y:100, sprite:'vending', interactive:true, actionId:'buy_snack', label:'🏪 自动售货机', depth:9 },
          { x:276, y:396, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → CBD广场', depth:6 }
        ],
        actions:[
          { id:'work_normal', name:'正常上班', icon:'💻', duration:240, jobReq:true,
            effects:{ 'body.energy':-20, 'body.fatigue':15, 'mind.stress':8 }, isWork:true, desc:'按部就班完成工作' },
          { id:'work_hard', name:'加班加点', icon:'🔥', duration:360, jobReq:true,
            effects:{ 'body.energy':-40, 'body.fatigue':30, 'mind.stress':20, 'body.hunger':20 }, isWork:true, desc:'拼一把！绩效+' },
          { id:'work_slack', name:'摸鱼划水', icon:'🐟', duration:240, jobReq:true,
            effects:{ 'body.energy':-5, 'body.fatigue':5, 'mind.happiness':3 }, isWork:true, desc:'今天佛了' },
          { id:'network', name:'职场社交', icon:'🤝', duration:60, jobReq:true,
            effects:{ 'social.reputation':2, 'social.charm':1, 'mind.stress':3 },
            skillGain:{ social:2, negotiate:1 }, desc:'和同事搞好关系' },
          { id:'buy_snack', name:'买零食', icon:'🍙', duration:5, cost:15,
            effects:{ 'body.hunger':-15, 'mind.happiness':1 }, desc:'垫垫肚子' }
        ]
      },

      // ════════════════════════════════════════
      // #4 城市公园
      // ════════════════════════════════════════
      park: {
        id:'park', name:'城市公园', icon:'🌳', area:'downtown',
        desc:'绿树成荫的中央公园，湖边有长椅和喷泉。城市的肺。',
        size:{ width:600, height:500 },
        bgColor: 0x14532d,
        floorTile:'grass',
        openHours:[5,22],
        entryPoint:{ x:300, y:460 },
        walls:[
          { x:0,y:0,w:600,h:12,noCollision:true }, { x:0,y:488,w:600,h:12,noCollision:true }
        ],
        objects:[
          { x:150, y:250, sprite:'bench', interactive:true, actionId:'rest_park', label:'🪑 长椅', depth:7 },
          { x:450, y:200, sprite:'bench', interactive:true, actionId:'rest_park', label:'🪑 长椅', depth:7 },
          { x:300, y:150, sprite:'fountain_splash', interactive:true, actionId:'look_fountain', label:'⛲ 喷泉', depth:8 },
          { x:80, y:80, sprite:'tree_big', interactive:false, depth:11 },
          { x:520, y:100, sprite:'tree_big', interactive:false, depth:11 },
          { x:50, y:350, sprite:'flower_bed', interactive:true, actionId:'smell_flowers', label:'🌸 花坛', depth:10 },
          { x:296, y:476, sprite:'exit_icon', isExit:true, toLocation:null, exitLabel:'离开公园', depth:6 }
        ],
        actions:[
          { id:'walk', name:'散步', icon:'🚶', duration:45,
            effects:{ 'mind.happiness':5, 'mind.stress':-8, 'body.health':1, 'motivation':3 }, desc:'在绿荫下漫步' },
          { id:'jog', name:'跑步', icon:'🏃', duration:45,
            effects:{ 'body.energy':-15, 'body.health':2, 'mind.stress':-10, 'mind.happiness':5 },
            skillGain:{ fitness:2 }, desc:'晨跑/夜跑' },
          { id:'fish', name:'钓鱼', icon:'🎣', duration:120,
            effects:{ 'mind.stress':-15, 'mind.happiness':8, 'mind.motivation':5 },
            skillGain:{ fishing:4 }, desc:'湖边钓鱼享受宁静' },
          { id:'sketch', name:'写生', icon:'🎨', duration:90,
            effects:{ 'mind.inspiration':15, 'mind.happiness':5 }, skillGain:{ art:4 }, desc:'画下眼前美景' },
          { id:'smell_flowers', name:'赏花', icon:'🌸', duration:20,
            effects:{ 'mind.happiness':6, 'mind.stress':-4 }, desc:'闻一闻花香' }
        ]
      },

      // ════════════════════════════════════════
      // #5 便利店
      // ════════════════════════════════════════
      convenience: {
        id:'convenience', name:'便利店', icon:'🏪', area:'oldtown',
        desc:'24小时营业的便利店。关东煮的热气永远冒着。',
        size:{ width:320, height:280 },
        bgColor: 0x1f2937,
        floorTile:'pavement',
        openHours:[0,24],
        entryPoint:{ x:160, y:250 },
        walls:[
          { x:0,y:0,w:320,h:14 }, { x:0,y:0,w:14,h:280 },
          { x:306,y:0,w:14,h:280 }, { x:0,y:266,w:140,h:14 },
          { x:180,y:266,w:140,h:14 }
        ],
        objects:[
          { x:80, y:140, sprite:'shelf', interactive:true, actionId:'buy_food', label:'🍙 食品区', depth:9 },
          { x:200, y:140, sprite:'shelf', interactive:true, actionId:'buy_supplies', label:'🧴 日用品', depth:9 },
          { x:156, y:248, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门', depth:6 }
        ],
        actions:[
          { id:'buy_food', name:'买食物', icon:'🍙', duration:10, cost:20,
            effects:{ 'body.hunger':-25, 'mind.happiness':2 }, desc:'买点吃的垫肚子' },
          { id:'buy_lottery', name:'买彩票', icon:'🎰', duration:5, cost:10,
            effects:{}, chance:{ win:{ p:0.02, reward:{ money: 5000 }, text:'中奖了！' }}, desc:'试试手气' },
          { id:'buy_supplies', name:'日用品', icon:'🧴', duration:15, cost:30,
            effects:{ 'mind.happiness':1 }, desc:'补充日常所需' }
        ]
      },

      // ════════════════════════════════════════
      // #6 餐厅
      // ════════════════════════════════════════
      restaurant: {
        id:'restaurant', name:'老街餐厅', icon:'🍽️', area:'oldtown',
        desc:'老城区口碑最好的家常菜馆，老板娘记得每个常客的口味。',
        size:{ width:540, height:460 },
        bgColor: 0x431407,
        floorTile:'floor_carpet',
        openHours:[10,22],
        entryPoint:{ x:270, y:420 },
        walls:[
          { x:0,y:0,w:540,h:16 }, { x:0,y:0,w:16,h:460 },
          { x:524,y:0,w:16,h:460 }, { x:0,y:444,w:230,h:16 },
          { x:310,y:444,w:230,h:16 }
        ],
        objects:[
          { x:270, y:160, sprite:'bar_counter', interactive:true, actionId:'order_meal', label:'🍽️ 点菜台', depth:8 },
          { x:100, y:320, sprite:'dining_table', interactive:true, actionId:'eat_restaurant', label:'🍽️ 用餐', depth:7 },
          { x:360, y:290, sprite:'dining_table', interactive:true, actionId:'eat_restaurant', label:'🍽️ 用餐', depth:7 },
          { x:420, y:340, sprite:'dining_table', interactive:true, actionId:'eat_restaurant', label:'🍽️ 用餐', depth:7 },
          { x:80, y:130, sprite:'kitchen_stove', interactive:false, depth:9 },
          { x:266, y:416, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → 老街', depth:6 }
        ],
        actions:[
          { id:'order_meal', name:'点菜吃饭', icon:'🍜', duration:60, cost:55,
            effects:{ 'body.hunger':-70, 'mind.happiness':12, 'mind.stress':-8 }, desc:'好好犒劳自己一顿' },
          { id:'order_luxury', name:'招牌大菜', icon:'🦞', duration:90, cost:150,
            effects:{ 'body.hunger':-95, 'mind.happiness':20, 'social.charm':2, 'mind.stress':-15 },
            desc:'老板娘特供！' },
          { id:'order_quick', name:'快餐套餐', icon:'🍱', duration:20, cost:28,
            effects:{ 'body.hunger':-35, 'mind.happiness':3 }, desc:'赶时间就吃这个' },
          { id:'chat_boss', name:'跟老板娘聊天', icon:'💬', duration:30,
            effects:{ 'social.charm':3, 'mind.happiness':5 }, desc:'她知道不少八卦' }
        ]
      },

      // ════════════════════════════════════════
      // #7 商场
      // ════════════════════════════════════════
      mall: {
        id:'mall', name:'中央商场', icon:'🛍️', area:'cbd',
        desc:'全城最大的购物中心。五层楼，吃喝玩乐一条龙。',
        size:{ width:640, height:520 },
        bgColor: 0xfafaf9,
        floorTile:'floor_marble',
        openHours:[10,22],
        entryPoint:{ x:320, y:480 },
        walls:[
          { x:0,y:0,w:640,h:16 }, { x:0,y:0,w:16,h:520 },
          { x:624,y:0,w:16,h:520 }, { x:0,y:504,w:280,h:16 },
          { x:360,y:504,w:280,h:16 }
        ],
        objects:[
          { x:120, y:200, sprite:'mall_kiosk', interactive:true, actionId:'shop_clothes', label:'👔 服装店', depth:9 },
          { x:280, y:200, sprite:'fitting_room', interactive:true, actionId:'try_on', label:'👗 试衣间', depth:9 },
          { x:450, y:180, sprite:'shelf', interactive:true, actionId:'shop_electronics', label:'📱 电器店', depth:9 },
          { x:550, y:180, sprite:'mannequin', interactive:false, depth:10 },
          { x:200, y:370, sprite:'table_big', interactive:true, actionId:'rest_mall', label:'☕ 中庭休息区', depth:7 },
          { x:450, y:370, sprite:'table_big', interactive:true, actionId:'rest_mall', label:'☕ 中庭休息区', depth:7 },
          { x:316, y:496, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → CBD大街', depth:6 }
        ],
        actions:[
          { id:'shop_clothes', name:'逛服装店', icon:'👔', duration:60, cost:200,
            effects:{ 'mind.happiness':15, 'social.charm':3, 'money': -200 },
            skillGain:{ fashion:2 }, desc:'挑一件新衣服提升形象' },
          { id:'try_on', name:'试穿衣服', icon:'👗', duration:30,
            effects:{ 'mind.happiness':8 }, desc:'照镜子看看效果' },
          { id:'shop_electronics', name:'看电子产品', icon:'📱', duration:45,
            effects:{ 'mind.inspiration':5, 'mind.happiness':5 }, desc:'看看新出的手机电脑' },
          { id:'window_shop', name:'只逛不买', icon:'👀', duration:90,
            effects:{ 'mind.happiness':6, 'body.fatigue':5 }, desc:'免费逛街也是一种乐趣' },
          { id:'rest_mall', name:'坐下来休息', icon:'☕', duration:30, cost:18,
            effects:{ 'body.fatigue':-10, 'mind.happiness':3 }, desc:'中庭吹空调歇会儿' }
        ]
      },

      // ════════════════════════════════════════
      // #8 酒吧
      // ════════════════════════════════════════
      bar: {
        id:'bar', name:'深夜酒吧', icon:'🍺', area:'artdistrict',
        desc:'藏在巷子深处的爵士酒吧。白天是安静的咖啡馆，晚上是另一个世界。',
        size:{ width:500, height:420 },
        bgColor: 0x18181b,
        floorTile:'floor_dark',
        openHours:[18,4], // 凌晨4点关门（跨天）
        entryPoint:{ x:250, y:380 },
        walls:[
          { x:0,y:0,w:500,h:16 }, { x:0,y:0,w:16,h:420 },
          { x:484,y:0,w:16,h:420 }, { x:0,y:404,w:210,h:16 },
          { x:290,y:404,w:210,h:16 }
        ],
        objects:[
          { x:250, y:170, sprite:'bar_counter', interactive:true, actionId:'order_drink', label:'🍸 吧台', depth:8 },
          { x:200, y:250, sprite:'bar_stool', interactive:true, actionId:'sit_bar', label:'🪑 吧台座', depth:7 },
          { x:280, y:250, sprite:'bar_stool', interactive:true, actionId:'sit_bar', label:'🪑 吧台座', depth:7 },
          { x:400, y:200, sprite:'pool_table', interactive:true, actionId:'play_pool', label:'🎱 台球桌', depth:8 },
          { x:430, y:100, sprite:'jukebox', interactive:true, actionId:'jukebox', label:'🎵 点唱机', depth:9 },
          { x:246, y:396, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门', depth:6 }
        ],
        actions:[
          { id:'order_drink', name:'点杯酒', icon:'🍺', duration:30, cost:45,
            effects:{ 'mind.stress':-12, 'mind.happiness':8, 'body.fatigue':5, 'mind.motivation':-2 },
            desc:'微醺的感觉也不错' },
          { id:'order_strong', name:'烈酒一杯', icon:'🥃', duration:20, cost:68,
            effects:{ 'mind.stress':-20, 'mind.happiness':12, 'body.fatigue':10, 'mind.motivation':-5, 'body.health':-1 },
            risk:{ drunk:{ threshold:3, effect:{ 'body.fatigue':30, 'social.charm':-5 }}},
            desc:'借酒浇愁？小心上头' },
          { id:'sit_bar', name:'独酌发呆', icon:'🤫', duration:60, cost:35,
            effects:{ 'mind.stress':-8, 'mind.happiness':3, 'mind.inspiration':5 }, desc:'一个人静静' },
          { id:'play_pool', name:'打台球', icon:'🎱', duration:45, cost:20,
            effects:{ 'mind.happiness':8, 'body.energy':-8, 'social.charm':1 },
            skillGain:{ pool:3 }, desc:'来一局？' },
          { id:'jukebox', name:'放首歌', icon:'🎵', duration:10, cost:5,
            effects:{ 'mind.happiness':5, 'mind.inspiration':3 }, desc:'选一首喜欢的歌' },
          { id:'flirt', name:'搭讪陌生人', icon:'😏', duration:40,
            effects:{ 'social.charm':2, 'mind.happiness':5, 'mind.stress':3 },
            skillGain:{ charm:2, social:1 }, desc:'今晚气氛不错……' }
        ]
      },

      // ════════════════════════════════════════
      // #9 图书馆
      // ════════════════════════════════════════
      library: {
        id:'library', name:'市图书馆', icon:'📖', area:'downtown',
        desc:'全市藏书最多的图书馆。安静得能听见翻书声。',
        size:{ width:580, height:460 },
        bgColor: 0x292524,
        floorTile:'floor_tile',
        openHours:[8,21],
        entryPoint:{ x:290, y:420 },
        walls:[
          { x:0,y:0,w:580,h:16 }, { x:0,y:0,w:16,h:460 },
          { x:564,y:0,w:16,h:460 }, { x:0,y:444,w:250,h:16 },
          { x:330,y:444,w:250,h:16 }
        ],
        objects:[
          { x:80, y:120, sprite:'bookshelf_tall', interactive:true, actionId:'read_book', label:'📚 书架区A', depth:9 },
          { x:140, y:120, sprite:'bookshelf_tall', interactive:true, actionId:'read_book', label:'📚 书架区B', depth:9 },
          { x:200, y:120, sprite:'bookshelf_tall', interactive:true, actionId:'read_book', label:'📚 书架区C', depth:9 },
          { x:400, y:120, sprite:'bookshelf', interactive:true, actionId:'research', label:'🔍 参考资料区', depth:9 },
          { x:280, y:280, sprite:'table_big', interactive:true, actionId:'study_lib', label:'📖 阅览桌', depth:7 },
          { x:420, y:300, sprite:'chair', interactive:true, actionId:'study_lib', label:'💺 座位', depth:7 },
          { x:286, y:416, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → 广场', depth:6 }
        ],
        actions:[
          { id:'read_book', name:'阅读', icon:'📖', duration:90,
            effects:{ 'mind.inspiration':12, 'mind.stress':-10, 'mind.motivation':3 },
            skillGain:{ reading:3 }, desc:'沉浸在书的世界里' },
          { id:'deep_read', name:'深度阅读', icon:'📚', duration:180,
            effects:{ 'mind.inspiration':25, 'mind.stress':-18, 'body.fatigue':8, 'mind.motivation':6 },
            skillGain:{ reading:6, intellect:2 }, desc:'认真读完一整本书' },
          { id:'research', name:'查资料', icon:'🔍', duration:60,
            effects:{ 'mind.inspiration':8, 'intellect':1 }, desc:'查阅专业资料' },
          { id:'study_lib', name:'自习', icon:'✍️', duration:120,
            effects:{ 'mind.motivation':8, 'body.energy':-10, 'intellect':2 }, desc:'专心学习' },
          { id:'borrow_book', name:'借书', icon:'📕', duration:10,
            effects:{ 'mind.motivation':5 }, needLibraryCard:true, desc:'带回家慢慢看' }
        ]
      },

      // ════════════════════════════════════════
      // #10 医院
      // ════════════════════════════════════════
      hospital: {
        id:'hospital', name:'中心医院', icon:'🏥', area:'cbd',
        desc:'市属三甲医院。消毒水的味道让人安心又紧张。',
        size:{ width:560, height:440 },
        bgColor: 0xf0f9ff,
        floorTile:'floor_hospital',
        openHours:[0,24],
        entryPoint:{ x:280, y:400 },
        walls:[
          { x:0,y:0,w:560,h:16 }, { x:0,y:0,w:16,h:440 },
          { x:544,y:0,w:16,h:440 }, { x:0,y:424,w:240,h:16 },
          { x:320,y:424,w:240,h:16 }
        ],
        objects:[
          { x:280, y:140, sprite:'reception_desk', interactive:true, actionId:'register', label:'📋 挂号处', depth:8 },
          { x:100, y:260, sprite:'medical_chair', interactive:true, actionId:'see_doctor', label:'🩺 诊室', depth:8 },
          { x:400, y:260, sprite:'hospital_bed', interactive:true, actionId:'stay_hospital', label:'🛏️ 病房', depth:8 },
          { x:480, y:140, sprite:'pharmacy', interactive:true, actionId:'buy_medicine', label:'💊 药房', depth:9 },
          { x:276, y:408, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门', depth:6 }
        ],
        actions:[
          { id:'register', name:'挂号排队', icon:'📋', duration:30, cost:20,
            effects:{ 'mind.stress':5, 'mind.motivation':-2 }, desc:'先挂号才能看病' },
          { id:'see_doctor', name:'看医生', icon:'🩺', duration:60, cost:100,
            effects:{ 'body.health':15, 'body.fatigue':-5, 'mind.stress':-5 },
            needRegister:true, desc:'医生给你做检查' },
          { id:'emergency', name:'急诊', icon:'🚑', duration:30, cost:300,
            effects:{ 'body.health':30, 'body.hunger':15, 'mind.stress':10 },
            desc:'紧急情况直接来这儿' },
          { id:'checkup', name:'体检', icon:'🩺', duration:90, cost:200,
            effects:{ 'body.health':5, 'mind.motivation':2, 'intellect':1 },
            skillGain:{ health_knowledge:2 }, desc:'定期体检很重要' },
          { id:'stay_hospital', name:'住院治疗', icon:'🛏️', duration:480, cost:800,
            effects:{ 'body.health':50, 'body.fatigue':-40, 'body.energy':30, 'body.hunger':20, 'money': -800 },
            condition:{ minHealth: 30 }, desc:'彻底休息恢复身体' },
          { id:'buy_medicine', name:'买药', icon:'💊', duration:10, cost:50,
            effects:{ 'body.health':8 }, desc:'日常用药' }
        ]
      },

      // ════════════════════════════════════════
      // #11 银行
      // ════════════════════════════════════════
      bank: {
        id:'bank', name:'商业银行', icon:'🏦', area:'cbd',
        desc:'市中心最大的银行分行。冷气开得很足。',
        size:{ width:480, height:380 },
        bgColor: 0x0f172a,
        floorTile:'floor_bank',
        openHours:[9,17],
        entryPoint:{ x:240, y:340 },
        walls:[
          { x:0,y:0,w:480,h:16 }, { x:0,y:0,w:16,h:380 },
          { x:464,y:0,w:16,h:380 }, { x:0,y:364,w:190,h:16 },
          { x:290,y:364,w:190,h:16 }
        ],
        objects:[
          { x:240, y:140, sprite:'bank_counter', interactive:true, actionId:'deposit', label:'💰 柜台', depth:8 },
          { x:80, y:260, sprite:'atm', interactive:true, actionId:'use_atm', label:'🏧 ATM机', depth:9 },
          { x:360, y:260, sprite:'safe_box', interactive:true, actionId:'open_safe', label:'🔒 保管箱', depth:9 },
          { x:236, y:344, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → 金融街', depth:6 }
        ],
        actions:[
          { id:'deposit', name:'存款', icon:'🏦', duration:15,
            effects:{}, bankingOp:'deposit', desc:'把闲钱存起来赚利息' },
          { id:'withdraw', name:'取款', icon:'💵', duration:10,
            effects:{}, bankingOp:'withdraw', desc:'取点现金用' },
          { id:'loan', name:'申请贷款', icon:'📋', duration:60,
            effects:{}, bankingOp:'loan', desc:'需要资金周转的话可以申请' },
          { id:'use_atm', name:'ATM操作', icon:'🏧', duration:5,
            effects:{}, bankingOp:'atm', desc:'快速存取款查询余额' },
          { id:'invest_consult', name:'理财咨询', icon:'📊', duration:45, cost:100,
            effects:{ 'intellect':2, 'social.charm':1 }, desc:'听听理财经理的建议' }
        ]
      },

      // ════════════════════════════════════════
      // #12 菜市场 / 农贸集市
      // ════════════════════════════════════════
      market: {
        id:'market', name:'农贸市场', icon:'🥬', area:'oldtown',
        desc:'清晨最热闹的地方。新鲜的蔬菜、活鱼、现杀的鸡，烟火气十足。',
        size:{ width:560, height:440 },
        bgColor: 0x365314,
        floorTile:'floor_market',
        openHours:[5,19],
        entryPoint:{ x:280, y:400 },
        walls:[
          { x:0,y:0,w:560,h:14 }, { x:0,y:0,w:14,h:440 },
          { x:546,y:0,w:14,h:440 }, { x:0,y:426,w:240,h:14 },
          { x:320,y:426,w:240,h:14 }
        ],
        objects:[
          { x:100, y:160, sprite:'produce_pile', interactive:true, actionId:'buy_veggie', label:'🥬 蔬菜摊', depth:9 },
          { x:180, y:160, sprite:'produce_pile', interactive:true, actionId:'buy_fruit', label:'🍎 水果摊', depth:9 },
          { x:300, y:160, sprite:'meat_display', interactive:true, actionId:'buy_meat', label:'🥩 肉摊', depth:9 },
          { x:400, y:160, sprite:'fish_ice', interactive:true, actionId:'buy_fish', label:'🐟 鱼摊', depth:9 },
          { x:200, y:300, sprite:'market_stall', interactive:true, actionId:'bargain', label:'🗣️ 杂货铺', depth:9 },
          { x:420, y:300, sprite:'market_stall', interactive:true, actionId:'buy_spices', label:'🌶️ 调料铺', depth:9 },
          { x:276, y:408, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → 老街', depth:6 }
        ],
        actions:[
          { id:'buy_veggie', name:'买菜', icon:'🥬', duration:20, cost:30,
            effects:{ 'body.hunger':-20, 'mind.happiness':2, 'cooking_materials': 1 },
            desc:'今天的菜很新鲜' },
          { id:'buy_fruit', name:'买水果', icon:'🍎', duration:15, cost:25,
            effects:{ 'body.health':2, 'body.hunger':-10, 'mind.happiness':3 }, desc:'补充维生素' },
          { id:'buy_meat', name:'买肉', icon:'🥩', duration:15, cost:50,
            effects:{ 'body.hunger':-15, 'body.energy':5, 'cooking_materials': 1 }, desc:'今天吃顿好的' },
          { id:'buy_fish', name:'买鱼', icon:'🐟', duration:20, cost:40,
            effects:{ 'body.hunger':-12, 'body.health':3, 'cooking_materials': 1 }, desc:'刚从水里捞出来的' },
          { id:'bargain', name:'砍价购物', icon:'🗣️', duration:30,
            effects:{ 'money': -20, 'mind.happiness':4 },
            skillGain:{ negotiate:2 }, desc:'跟老板磨磨嘴皮子' },
          { id:'buy_spices', name:'买调料', icon:'🌶️', duration:10, cost:15,
            effects:{ 'cooking_materials': 1 }, desc:'做饭少不了调料' },
          { id:'early_bird', name:'赶早市', icon:'🌅', duration:60, timeReq:{before:8},
            effects:{ 'body.hunger':-15, 'mind.happiness':5, 'money': -20 },
            desc:'早起的鸟儿有虫吃，早市的菜最新鲜最便宜' }
        ]
      },

      // ════════════════════════════════════════
      // #13 健身房
      // ════════════════════════════════════════
      gym: {
        id:'gym', name:'铁馆健身房', icon:'🏋️', area:'artdistrict',
        desc:'硬核健身房。没有花里胡哨的器械，只有铁片和汗水。',
        size:{ width:460, height:380 },
        bgColor: 0x27272a,
        floorTile:'floor_gym',
        openHours:[6,23],
        entryPoint:{ x:230, y:340 },
        walls:[
          { x:0,y:0,w:460,h:16 }, { x:0,y:0,w:16,h:380 },
          { x:444,y:0,w:16,h:380 }, { x:0,y:364,w:200,h:16 },
          { x:260,y:364,w:200,h:16 }
        ],
        objects:[
          { x:100, y:160, sprite:'treadmill', interactive:true, actionId:'cardio', label:'🏃 跑步机', depth:8 },
          { x:180, y:160, sprite:'treadmill', interactive:true, actionId:'cardio', label:'🏃 跑步机', depth:8 },
          { x:300, y:140, sprite:'weight_rack', interactive:true, actionId:'lift_weights', label:'🏋️ 自由重量区', depth:8 },
          { x:100, y:280, sprite:'gym_mat', interactive:true, actionId:'yoga', label:'🧘 瑜伽垫', depth:7 },
          { x:280, y:280, sprite:'gym_mat', interactive:true, actionId:'stretch', label:'🤸 拉伸区', depth:7 },
          { x:226, y:344, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门', depth:6 }
        ],
        actions:[
          { id:'cardio', name:'有氧运动', icon:'🏃', duration:45, cost:30,
            effects:{ 'body.energy':-20, 'body.fatigue':15, 'body.health':3, 'body.hunger':15, 'mind.stress':-8 },
            skillGain:{ fitness:3, cardio:2 }, desc:'跑步机半小时' },
          { id:'lift_weights', name:'力量训练', icon:'🏋️', duration:60, cost:30,
            effects:{ 'body.energy':-25, 'body.fatigue':20, 'body.health':2, 'body.hunger':18, 'mind.stress':-5 },
            skillGain:{ strength:3, fitness:2 }, desc:'推胸拉背练腿' },
          { id:'heavy_lift', name:'大重量冲击', icon:'💪', duration:75, cost:30,
            effects:{ 'body.energy':-35, 'body.fatigue':30, 'body.health':3, 'body.hunger':22, 'mind.stress':-3, 'mind.motivation':5 },
            risk:{ injury:{ p:0.08, effect:{ 'body.health': -10 }}},
            skillReq:{ strength:3 },
            skillGain:{ strength:5, fitness:3 }, desc:'突破自己的极限！有受伤风险' },
          { id:'yoga', name:'瑜伽', icon:'🧘', duration:60, cost:30,
            effects:{ 'body.fatigue':-15, 'body.energy':5, 'mind.stress':-12, 'mind.happiness':8, 'body.flexibility': 2 },
            skillGain:{ yoga:3 }, desc:'身心合一' },
          { id:'stretch', name:'拉伸放松', icon:'🤸', duration:30, cost:30,
            effects:{ 'body.fatigue':-8, 'body.flexibility':1, 'mind.stress':-5 }, desc:'练后拉伸很重要' },
          { id:'personal_trainer', name:'私教课', icon:'👨‍🏫', duration:90, cost:300,
            effects:{ 'body.health':5, 'fitness':3, 'strength':2 },
            desc:'专业指导效果更好' }
        ]
      },

      // ════════════════════════════════════════
      // #14 学校 / 培训中心
      // ════════════════════════════════════════
      school: {
        id:'school', name:'社区培训中心', icon:'🏫', area:'downtown',
        desc:'社区成人培训中心。晚上和周末开各种课程——外语、编程、绘画、音乐。',
        size:{ width:520, height:420 },
        bgColor: 0x1e1b4b,
        floorTile:'floor_classroom',
        openHours:[9,22],
        entryPoint:{ x:260, y:380 },
        walls:[
          { x:0,y:0,w:520,h:16 }, { x:0,y:0,w:16,h:420 },
          { x:504,y:0,w:16,h:420 }, { x:0,y:404,w:230,h:16 },
          { x:290,y:404,w:230,h:16 }
        ],
        objects:[
          { x:260, y:140, sprite:'blackboard', interactive:false, depth:9 },
          { x:260, y:110, sprite:'teacher_podium', interactive:true, actionId:'attend_class', label:'👨‍🏫 讲台', depth:8 },
          { x:100, y:280, sprite:'school_desk', interactive:true, actionId:'study_class', label:'📝 课桌A', depth:7 },
          { x:200, y:280, sprite:'school_desk', interactive:true, actionId:'study_class', label:'📝 课桌B', depth:7 },
          { x:320, y:280, sprite:'school_desk', interactive:true, actionId:'study_class', label:'📝 课桌C', depth:7 },
          { x:420, y:280, sprite:'school_desk', interactive:true, actionId:'study_class', label:'📝 课桌D', depth:7 },
          { x:256, y:388, sprite:'door', isExit:true, toLocation:null, exitLabel:'出门 → 社区广场', depth:6 }
        ],
        actions:[
          { id:'attend_class', name:'上课', icon:'📚', duration:120, cost:150,
            effects:{ 'intellect':4, 'mind.motivation':6, 'mind.stress':3, 'body.energy':-10 },
            skillGain:{ learning:3 }, desc:'系统学习一门新技能' },
          { id:'study_class', name:'自习', icon:'✍️', duration:90, cost:30,
            effects:{ 'intellect':2, 'mind.motivation':3, 'body.energy':-5 }, desc:'利用教室环境专心学习' },
          { id:'language_course', name:'语言课', icon:'🗣️', duration:120, cost:200,
            effects:{ 'intellect':3, 'social.charm':2, 'languages': 1 },
            skillGain:{ english:3 }, desc:'学一门外语' },
          { id:'coding_bootcamp', name:'编程集训', icon:'💻', duration:180, cost:300,
            effects:{ 'intellect':6, 'coding': 3, 'mind.motivation':5, 'body.energy':-20 },
            desc:'高强度编程训练营' },
          { id:'art_class', name:'艺术班', icon:'🎨', duration:120, cost:180,
            effects:{ 'mind.inspiration':10, 'art': 2, 'mind.happiness':6 },
            skillGain:{ art:3 }, desc:'画画/音乐/书法任选' },
          { id:'talk_teacher', name:'跟老师聊天', icon:'🗣️', duration:30,
            effects:{ 'intellect':1, 'mind.motivation':2 }, desc:'老师见多识广，聊聊有收获' }
        ]
      }

    } // end locations
  }

  getLocation(id) {
    return this.locations[id] || null
  }

  getAvailable(time) {
    return Object.values(this.locations).filter(loc => {
      const [open, close] = loc.openHours || [0, 24]
      if (close > 24) return time.hour >= open || time.hour < close - 24
      return time.hour >= open && time.hour < close
    })
  }

  /** 获取某地点的可用行动 */
  getActions(locationId, character, time) {
    const loc = this.locations[locationId]
    if (!loc) return []

    return (loc.actions||[]).filter(a => {
      if (a.jobReq && !character.job.current) return false
      if (a.skillReq) {
        for (const [sk, lv] of Object.entries(a.skillReq)) {
          if ((character.skills[sk]?.level||0) < lv) return false
        }
      }
      if (a.timeReq) {
        if (a.timeReq.after && time.hour < a.timeReq.after) return false
        if (a.timeReq.before && time.hour >= a.timeReq.before) return false
      }
      if (a.condition) {
        for (const [key, val] of Object.entries(a.condition)) {
          const path = key.split('.')
          let cur = character
          for (const p of path) cur = cur?.[p]
          if (cur !== undefined && cur < val) return false
        }
      }
      return true
    })
  }

  /** 计算通勤时间(分钟) */
  getTravelTime(from, to) {
    if (from === to) return 0
    const distMap = {
      'oldtown-cbd':30,'oldtown-downtown':20,'oldtown-artdistrict':25,
      'cbd-downtown':15,'cbd-artdistrict':20,'downtown-artdistrict':15
    }
    const fromA = this.locations[from]?.area||'oldtown'
    const toA = this.locations[to]?.area||'oldtown'
    if (fromA === toA) return 10
    return distMap[`${fromA}-${toA}`] || distMap[`${toA}-${fromA}`] || 20
  }

  /** 获取某区域的相邻区域列表（用于场景出口导航） */
  getConnectedAreas(areaId) {
    const connections = {
      oldtown: ['cbd', 'downtown', 'artdistrict'],
      cbd: ['oldtown', 'downtown', 'artdistrict'],
      downtown: ['oldtown', 'cbd', 'artdistrict'],
      artdistrict: ['oldtown', 'cbd', 'downtown']
    }
    return connections[areaId] || []
  }

  /** 根据当前地点推荐可去的其他地点 */
  getRecommendedDestinations(currentId) {
    const current = this.locations[currentId]
    if (!current) return []
    const connected = this.getConnectedAreas(current.area)
    return Object.values(this.locations).filter(loc =>
      loc.id !== currentId && connected.includes(loc.area)
    )
  }

  serialize() { return { current: this.currentLocation } }
  deserialize(d) { if (d?.current) this.currentLocation = d.current }
}

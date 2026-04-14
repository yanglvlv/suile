/**
 * World.js — 世界状态容器（单例）
 * 串联所有子系统，提供统一的事件接口
 */
import { TimeEngine } from './TimeEngine.js'
import { CharacterEngine } from './CharacterEngine.js'
import { NPCEngine } from './NPCEngine.js'
import { LocationSystem } from './LocationSystem.js'
import { EventSystem } from './EventSystem.js'
import { EconomySystem } from './EconomySystem.js'
import { AudioManager } from './AudioManager.js'

export class World {
  constructor() {
    // === 核心子系统 ===
    this.time = new TimeEngine()
    this.player = new CharacterEngine('你')
    this.npcs = new NPCEngine()
    this.locations = new LocationSystem()
    this.events = new EventSystem(this)
    this.economy = new EconomySystem()
    this.audio = new AudioManager()

    // === 状态 ===
    this.messages = []
    this.paused = false
    this.gameSpeed = 1  // 时间流速倍率

    // === 事件发射器 (Phaser-compatible) ===
    this._listeners = {}

    // 初始化玩家初始职业
    this.player.setJob({
      current: 'programmer',
      company: '星云科技',
      position: '初级程序员',
      salary: 4500,
      performance: 50,
      daysWorked: 0
    })

    // 绑定时间事件
    this.time.on('hourChange', () => this._onHourChange())
    this.time.on('dayChange', () => this._onDayChange())
  }

  /**
   * 游戏主循环更新
   * 由 WorldScene.update() 调用
   */
  update(delta) {
    if (this.paused) return

    // 每 real-world second 推进游戏时间
    // 1秒现实时间 = 游戏内15分钟（可调整）
    // delta 是毫秒
    const timeAdvanceRate = 0.25 // 每毫秒推进的游戏分钟数
    this._accumulatedDelta = (this._accumulatedDelta || 0) + delta

    if (this._accumulatedDelta >= 1000 / timeAdvanceRate) {
      // 每推进一次游戏小时触发
      // 实际上我们让行动来推进时间，这里只做被动的时间流逝检测
      this._accumulatedDelta = 0
      this.passiveTick()
    }
  }

  passiveTick() {
    // 角色被动属性变化
    this.player.hourlyUpdate(this.time)

    // 属性警告
    this.checkStatWarnings()

    // 天气音效切换
    if (this.audio.initialized) {
      this.audio.playWeatherSound(this.time.weather)
      // 夜间BGM
      if (this.time.hour >= 21 || this.time.hour < 6) {
        if (this._currentBGMScene !== 'night') { this._currentBGMScene = 'night'; this.audio.playBGM('night') }
      } else {
        if (this._currentBGMScene !== 'world') { this._currentBGMScene = 'world'; this.audio.playBGM('world') }
      }
    }

    // 同步UI
    this.emit('time:advanced', {
      timeStr: this.time.timeString,
      dateStr: this.time.dateString
    })
  }

  checkStatWarnings() {
    const p = this.player.body
    const m = this.player.mind

    if (p.energy < 15 && !this._warnedEnergy) {
      this.addMessage('⚠️ 体力快见底了...', 'warning')
      this._warnedEnergy = true
    }
    if (p.energy > 30) this._warnedEnergy = false

    if (p.hunger > 80 && !this._warnedHunger) {
      this.addMessage('🍔 肚子饿得咕咕叫', 'warning')
      this._warnedHunger = true
    }
    if (p.hunger < 40) this._warnedHunger = false

    if (m.stress > 85 && !this._warnedStress) {
      this.addMessage('😰 压力太大了...需要放松', 'warning')
      this._warnedStress = true
    }
    if (m.stress < 60) this._warnedStress = false
  }

  _onHourChange() {
    this.player.hourlyUpdate(this.time)
    this.checkStatWarnings()

    // NPC状态更新
    for (const npc of Object.values(this.npcs.npcs)) {
      // NPC心情波动等
    }
  }

  _onDayChange() {
    this.player.dailyUpdate(this.time)
    this.economy.dailyUpdate(this.time, this.events)

    // NPC主动行为
    const npcMsgs = this.npcs.dailyBehavior(this.player, this.time)
    for (const msg of npcMsgs) {
      this.addMessage(msg.text, msg.type)
    }

    // 绩效衰减
    if (this.player.job.current) {
      this.player.job.performance = Math.max(0, this.player.job.performance - 1)
    }

    // 回到家
    this.locations.currentLocation = 'home'

    // 检查成就/事件
    this.events.checkAchievements(this.player)
    this.addMessage(`\n☀️ ${this.time.dateString} ${this.time.weatherNames[this.time.weather]}`, 'newday')

    // 宠物互动
    if (this.player.pets?.length > 0) {
      const pet = this.player.pets[0]
      this.addMessage(`🐱 ${pet.name}蹭了蹭你`, 'info')
      this.player.mind.happiness = Math.min(100, this.player.mind.happiness + 3)
    }
  }

  /**
   * 执行行动
   */
  doAction(actionId, locationId) {
    const loc = this.locations.getLocation(locationId)
    if (!loc) return null
    const action = loc.actions.find(a => a.id === actionId)
    if (!action) return null

    // 检查条件
    if (action.cost && this.player.cash < action.cost) {
      this.addMessage(`💸 钱不够！需 $${action.cost}`, 'warning')
      return null
    }
    if (action.requirements) {
      for (const [key, minVal] of Object.entries(action.requirements)) {
        const val = this.getNestedValue(this.player, key)
        if (val !== undefined && val < minVal) {
          this.addMessage(`❌ 条件不满足: ${key} 需要 ${minVal}`, 'warning')
          return null
        }
      }
    }

    // 执行效果
    if (action.effects) {
      for (const [path, val] of Object.entries(action.effects)) {
        this.applyEffect(this.player, path, val)
      }
    }
    
    // 消耗/收益
    if (action.cost) { this.player.spendCash(action.cost); this.audio.playMoneyChange(false) }
    if (action.earn) this.player.earnCash(action.earn)
    if (action.skillGain) {
      for (const [sk, exp] of Object.entries(action.skillGain)) {
        const result = this.player.gainExp(sk, exp)
        if (result) this.addMessage(`🎉 ${result.name} 升到 Lv.${result.level}!`, 'achievement')
      }
    }

    // 工作绩效
    if (action.isWork && this.player.job.current) {
      this.handleWorkPerformance(actionId)
    }

    // 推进时间
    const duration = action.duration || 30
    this.time.advance(duration)

    // 触发事件
    const triggered = this.events.check(this.player, this.time, this.npcs)
    for (const evt of triggered) {
      this.addMessage(`${evt.icon} ${evt.text}`, evt.type || 'event')
    }

    // 记录日志
    const hrs = Math.floor(duration / 60)
    const mins = duration % 60
    const timeStr = hrs > 0 ? `${hrs}h${mins ? mins + 'm' : ''}` : `${mins}m`
    this.addMessage(`${action.icon} ${action.name} (${timeStr})`, 'action')

    // 成就检查
    this.events.checkAchievements(this.player)

    this.notify()
    return action
  }

  handleWorkPerformance(actionId) {
    const eff = this.player.workEfficiency
    switch (actionId) {
      case 'work_hard':
        const perfUp = Math.round(5 * eff)
        this.player.job.performance = Math.min(100, this.player.job.performance + perfUp)
        break
      case 'work_normal':
        this.player.job.performance = Math.min(100, this.player.job.performance + Math.round(2 * eff))
        break
      case 'work_slack':
        this.player.job.performance = Math.max(0, this.player.job.performance - 3)
        break
    }
    this.player.job.daysWorked++
  }

  /**
   * 移动到新地点
   */
  goTo(locationId) {
    const from = this.locations.currentLocation
    if (from === locationId) return false

    const travelTime = this.locations.getTravelTime(from, locationId)
    const toLoc = this.locations.getLocation(locationId)
    if (!toLoc) return false

    // 检查开放时间
    const [open, close] = toLoc.openHours || [0, 24]
    const arriveHour = this.time.hour + Math.floor(travelTime / 60)
    if (arriveHour < open || arriveHour >= close % 24) {
      this.addMessage(`🚫 ${toLoc.name} 还没开门 (${open}:00~${close > 24 ? close - 24 : close}:00)`, 'warning')
      return false
    }

    this.locations.currentLocation = locationId
    this.time.advance(travelTime)
    this.player.body.energy = Math.max(0, this.player.body.energy - 3)

    // 音效
    if (this.audio.initialized) { this.audio.playSceneTransition(); setTimeout(() => this.audio.playDoorOpen(), 300) }

    this.addMessage(`🚶 前往 ${toLoc.icon} ${toLoc.name}（${travelTime}分钟）`, 'travel')

    // 场景内的NPC
    const npcsHere = this.npcs.getNPCsAtLocation(locationId, this.time)
    if (npcsHere.length > 0) {
      this.addMessage(`👀 这里有：${npcsHere.map(n => n.avatar + n.name).join('、')}`, 'info')
    }

    // 到达事件
    const triggered = this.events.check(this.player, this.time, this.npcs)
    for (const evt of triggered) {
      this.addMessage(`${evt.icon} ${evt.text}`, 'event')
    }

    this.events.checkAchievements(this.player)
    this.notify()
    return true
  }

  interactNPC(npcId, type) {
    return this.npcs.interact(npcId, type, this.player, this.time, this)
  }

  addMessage(text, type = 'info') {
    this.messages.push({ text, type, time: this.time.timeString })
    if (this.messages.length > 100) this.messages.shift()
    this.emit('message', { text, type })
  }

  notify() {
    this.emit('update')
  }

  // ===== 工具方法 =====
  
  getNestedValue(obj, path) {
    const parts = path.split('.')
    let val = obj
    for (const p of parts) {
      if (val == null) return undefined
      val = val[p]
    }
    return val
  }

  applyEffect(obj, path, value) {
    const parts = path.split('.')
    let target = obj
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]]
    }
    const key = parts[parts.length - 1]
    target[key] = Math.max(0, Math.min(100, (target[key] || 0) + value))

    this.emit('player:statChanged', { stat: key, value: target[key], oldValue: target[key] - value })
  }

  // ===== EventEmitter 接口兼容 Phaser =====
  
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push(callback)
    return this
  }

  off(event, callback) {
    if (!this._listeners[event]) return this
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback)
    return this
  }

  emit(event, data) {
    ;(this._listeners[event] || []).forEach(cb => cb(data))
  }

  // ===== 存档 =====
  
  save(slot = 0) {
    const data = {
      time: this.time.serialize(),
      player: this.player.serialize(),
      npcs: this.npcs.serialize(),
      locations: this.locations.serialize(),
      economy: this.economy.serialize(),
      events: this.events.serialize(),
      messages: this.messages.slice(-30)
    }
    try {
      localStorage.setItem(`alife_v2_save_${slot}`, JSON.stringify(data))
      return true
    } catch (e) {
      console.error('Save failed:', e)
      return false
    }
  }

  load(slot = 0) {
    try {
      const raw = localStorage.getItem(`alife_v2_save_${slot}`)
      if (!raw) return false
      const data = JSON.parse(raw)
      this.time.deserialize(data.time)
      this.player.deserialize(data.player)
      this.npcs.deserialize(data.npcs)
      this.locations.deserialize(data.locations)
      this.economy.deserialize(data.economy)
      this.events.deserialize(data.events)
      this.messages = data.messages || []
      this.addMessage('📂 存档已读取', 'system')
      return true
    } catch (e) {
      console.error('Load failed:', e)
      return false
    }
  }

  hasSave(slot = 0) {
    return !!localStorage.getItem(`alife_v2_save_${slot}`)
  }
}

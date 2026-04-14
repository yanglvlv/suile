/**
 * AudioManager v2 — 程序化音频系统
 * 使用 Web Audio API 生成所有音效和BGM
 * 无需外部音频文件即可运行
 */
export class AudioManager {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.bgmGain = null
    this.sfxGain = null
    this.currentBGM = null
    this.bgmVolume = 0.3
    this.sfxVolume = 0.6
    this.muted = false
    this.initialized = false

    // 音符频率表 (Hz)
    this.notes = {
      C2: 65.81, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.26, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
      E6: 1318.51
    }
  }

  /**
   * 初始化音频系统（需要用户交互后调用）
   */
  init() {
    if (this.initialized) return true
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      
      // 主音量控制
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 1.0
      this.masterGain.connect(this.ctx.destination)
      
      // BGM 总线
      this.bgmGain = this.ctx.createGain()
      this.bgmGain.gain.value = this.bgmVolume
      this.bgmGain.connect(this.masterGain)
      
      // SFX 总线
      this.sfxGain = this.ctx.createGain()
      this.sfxGain.gain.value = this.sfxVolume
      this.sfxGain.connect(this.masterGain)
      
      this.initialized = true
      console.log('✅ Audio system initialized')
      return true
    } catch (e) {
      console.warn('⚠️ Web Audio API not available:', e)
      return false
    }
  }

  /**
   * 确保音频上下文已启动（需要在用户手势中调用）
   */
  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
    }
  }

  // ══════════════════════════════════════
  // 基础波形生成器
  // ══════════════════════════════════════

  /** 创建指定频率的振荡器 */
  _createOsc(freq, type = 'sine', duration = 0, gainNode = this.sfxGain) {
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    
    const gain = this.ctx.createGain()
    gain.gain.value = 0.0001 // 避免爆音
    
    osc.connect(gain)
    gain.connect(gainNode || this.masterGain)
    
    osc.start()
    
    if (duration > 0) {
      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
      osc.stop(this.ctx.currentTime + duration + 0.05)
    }
    
    return { osc, gain }
  }

  /** 创建噪声（用于打击乐） */
  _createNoise(duration, type = 'white', gainNode = this.sfxGain) {
    const bufferSize = this.ctx.sampleRate * duration
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    }
    
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    
    const gain = this.ctx.createGain()
    gain.gain.value = 0.15
    
    source.connect(gain)
    gain.connect(gainNode || this.masterGain)
    
    source.start(0)
    source.stop(this.ctx.currentTime + duration + 0.01)
    
    return { source, gain }
  }

  // ══════════════════════════════════════
  // UI / 交互音效
  // ══════════════════════════════════════

  playClick() { this._playTone(this.notes.C5, 'square', 0.06, 0.12) }
  
  playHover() {
    this._playTone(this.notes.E5, 'sine', 0.04, 0.06)
  }

  playBack() {
    this._playTone(this.notes.G4, 'sine', 0.08, 0.08)
    setTimeout(() => this._playTone(this.notes.E4, 'sine', 0.08, 0.06), 60)
  }

  playOpen() {
    this._playTone(this.notes.C5, 'sine', 0.1, 0.1)
    setTimeout(() => this._playTone(this.notes.E5, 'sine', 0.12, 0.1), 80)
    setTimeout(() => this._playTone(this.notes.G5, 'sine', 0.15, 0.12), 180)
  }

  playClose() {
    this._playTone(this.notes.G5, 'sine', 0.08, 0.08)
    setTimeout(() => this._playTone(this.notes.E5, 'sine', 0.1, 0.08), 70)
    setTimeout(() => this._playTone(this.notes.C5, 'sine', 0.12, 0.06), 150)
  }

  playSuccess() {
    // 成功音效 — 上升的琶音
    const notes = [this.notes.C4, this.notes.E4, this.notes.G4, this.notes.C5]
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 'sine', 0.18, 0.1), i * 80)
    })
  }

  playError() {
    // 错误音效 — 下降的不协和音
    this._playTone(this.notes.A4, 'square', 0.12, 0.1)
    setTimeout(() => this._playTone(this.notes.Gb4, 'square', 0.18, 0.12), 100)
  }

  playNotification() {
    this._playTone(this.notes.C5, 'sine', 0.08, 0.08)
    setTimeout(() => this._playTone(this.notes.E5, 'sine', 0.08, 0.06), 120)
  }

  playLevelUp() {
    const notes = [this.notes.C5, this.notes.D5, this.notes.E5, this.notes.G5, this.notes.C6]
    notes.forEach((f, i) => setTimeout(() => this._playTone(f, 'triangle', 0.2, 0.09), i * 100))
  }

  playUnlock() {
    // 解锁/成就音效
    this._createNoise(0.08, 'white')
    const notes = [this.notes.C5, this.notes.E5, this.notes.A5]
    notes.forEach((f, i) => setTimeout(() => this._playTone(f, 'sine', 0.25, 0.08), i * 90))
  }

  // ══════════════════════════════════════
  // 游戏世界音效
  // ══════════════════════════════════════

  playFootstep(surface = 'floor') {
    if (!this.initialized) return
    const freq = surface === 'grass' ? 200 + Math.random() * 80 : 350 + Math.random() * 100
    this._playTone(freq, surface === 'grass' ? 'sine' : 'triangle', 0.04, 0.04)
  }

  playDoorOpen() {
    this._createNoise(0.15, 'pink') // 摩擦声
    this._playTone(this.notes.C3, 'sawtooth', 0.2, 0.06) // 门轴声
    setTimeout(() => this._playTone(this.notes.E3, 'sawtooth', 0.15, 0.04), 150)
  }

  playPickup(type = 'coin') {
    switch (type) {
      case 'coin':
        this._playTone(this.notes.E5, 'sine', 0.08, 0.12)
        setTimeout(() => this._playTone(this.notes.G5, 'sine', 0.1, 0.1), 60)
        break
      case 'item':
        this._playTone(this.notes.C5, 'triangle', 0.1, 0.1)
        this._playTone(this.notes.E5, 'triangle', 0.12, 0.08)
        break
      case 'food':
        this._playTone(this.notes.G4, 'sine', 0.08, 0.08)
        break
    }
  }

  playInteraction() {
    this._playTone(this.notes.C4, 'sine', 0.03, 0.08)
    this._playTone(this.notes.E4, 'sine', 0.04, 0.06)
  }

  playDialogueOpen() {
    // 对话框弹出 — 轻柔的上升音
    this._playTone(this.notes.C4, 'sine', 0.06, 0.06)
    setTimeout(() => this._playTone(this.notes.E4, 'sine', 0.06, 0.05), 50)
    setTimeout(() => this._playTone(this.notes.G4, 'sine', 0.07, 0.04), 100)
  }

  playDialogueType(charDelay = 30) {
    // 打字机效果音
    if (!this.initialized || !this._typeTimer) return
    this._typeTimer = this._typeTimer || 0
    const now = Date.now()
    if (now - this._typeTimer > charDelay) {
      this._playTone(800 + Math.random() * 400, 'sine', 0.015, 0.02)
      this._typeTimer = now
    }
  }

  playDialogueChoice() {
    this._playTone(this.notes.C4, 'sine', 0.04, 0.06)
  }

  playSceneTransition() {
    // 场景过渡 — 渐变 sweep
    const startTime = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, startTime)
    osc.frequency.exponentialRampToValueAtTime(800, startTime + 0.3)
    osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.6)
    gain.gain.setValueAtTime(0.08, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.7)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(startTime)
    osc.stop(startTime + 0.75)
  }

  playEventTrigger(eventSeverity = 'normal') {
    switch (eventSeverity) {
      case 'good':
        this.playSuccess()
        break
      case 'bad':
        this.playError()
        break
      default:
        this.playNotification()
    }
  }

  playStatChange(statType, isPositive = true) {
    if (isPositive) {
      // 正向变化 — 清脆的叮声
      this._playTone(this.notes.C5, 'sine', 0.06, 0.08)
      this._playTone(this.notes.E5, 'sine', 0.06, 0.06)
    } else {
      // 负向变化 — 低沉的嗡声
      this._playTone(150, 'sine', 0.1, 0.05)
      this._playTone(130, 'sine', 0.12, 0.04)
    }
  }

  playMoneyChange(isEarned = true) {
    if (isEarned) {
      // 金钱获得音效 — 金币碰撞声
      this._createNoise(0.06, 'pink')
      this._playTone(this.notes.E5, 'sine', 0.08, 0.1)
      this._playTone(this.notes.A5, 'sine', 0.1, 0.08)
    } else {
      // 花费音效 — 低沉的"咻"
      this._playTone(300, 'sine', 0.15, 0.08)
      this._playTone(250, 'sine', 0.18, 0.06)
    }
  }

  playWeatherSound(weather) {
    switch (weather) {
      case 'rain':
        // 雨声 — 用噪声模拟
        if (!this._rainSource) {
          this._rainSource = this._createLoopingNoise('pink', 0.03, this.bgmGain)
          this._rainSource.gain.gain.value = this.muted ? 0 : 0.025
        }
        break
      case 'snow':
        // 风雪声
        if (!this._windSource) {
          this._windSource = this._createLoopingNoise('pink', 0.02, this.bgmGain)
          this._windSource.gain.gain.value = this.muted ? 0 : 0.015
        }
        break
      default:
        this.stopWeatherSound()
    }
  }

  stopWeatherSound() {
    if (this._rainSource) {
      try { this._rainSource.source.stop() } catch(e) {}
      this._rainSource = null
    }
    if (this._windSource) {
      try { this._windSource.source.stop() } catch(e) {}
      this._windSource = null
    }
  }

  // ══════════════════════════════════════
  // BGM 系统 — 程序化背景音乐
  // ══════════════════════════════════════

  playBGM(sceneId = 'world') {
    if (!this.initialized || this.currentBGM === sceneId) return
    
    this.stopBGM()
    this.currentBGM = sceneId
    
    switch (sceneId) {
      case 'title':
        this._playTitleTheme()
        break
      case 'world':
        this._playWorldBGM()
        break
      case 'dialogue':
        this._playDialogueBGM()
        break
      case 'bar':
        this._playBarBGM()
        break
      case 'night':
        this._playNightBGM()
        break
      default:
        this._playWorldBGM()
    }
  }

  stopBGM() {
    if (this._bgmOscillators) {
      this._bgmOscillators.forEach(o => { try { o.osc.stop() } catch(e) {} })
      this._bgmOscillators = null
    }
    if (this._bgmInterval) {
      clearInterval(this._bgmInterval)
      this._bgmInterval = null
    }
    this.currentBGM = null
  }

  setBGMVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol))
    if (this.bgmGain) this.bgmGain.gain.value = this.muted ? 0 : this.bgmVolume
  }

  setSFXVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol))
    if (this.sfxGain) this.sfxGain.gain.value = this.muted ? 0 : this.sfxVolume
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.bgmGain) this.bgmGain.gain.value = this.muted ? 0 : this.bgmVolume
    if (this.sfxGain) this.sfxGain.gain.value = this.muted ? 0 : this.sfxVolume
    return this.muted
  }

  // ══════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════

  _playTone(freq, type, duration, volume) {
    if (!this.initialized) return
    const { gain } = this._createOsc(freq, type, duration)
    if (gain && volume !== undefined) {
      gain.gain.setValueAtTime(volume * this.sfxVolume, this.ctx.currentTime)
    }
  }

  _createLoopingNoise(type, volume, output) {
    const bufferSize = 2 * this.ctx.sampleRate // 2秒循环
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3
    }
    
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    
    source.connect(gain)
    gain.connect(output || this.masterGain)
    source.start(0)
    
    return { source, gain }
  }

  // ─── BGM 曲目 ───

  _playTitleTheme() {
    // 温暖的标题画面音乐 — 简单的和弦进行
    const chords = [
      [this.notes.C3, this.notes.E3, this.notes.G3],     // C 大三
      [this.notes.A2, this.notes.C3, this.notes.E3],     // Am
      [this.notes.F2, this.notes.A2, this.notes.C3],     // F 大三
      [this.notes.G2, this.notes.B2, this.notes.D3]  // G
    ]
    
    let chordIdx = 0
    this._bgmOscillators = []
    
    const playChord = () => {
      const chord = chords[chordIdx % chords.length]
      chordIdx++
      
      const oscs = []
      chord.forEach((freq, i) => {
        const osc = this.ctx.createOscillator()
        osc.type = i === 0 ? 'triangle' : 'sine'
        osc.frequency.value = freq
        
        const gain = this.ctx.createGain()
        gain.gain.value = 0
        
        osc.connect(gain)
        gain.connect(this.bgmGain)
        
        osc.start()
        
        // ADSR 包络
        const now = this.ctx.currentTime
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.06, now + 0.15)
        gain.gain.setTargetAtTime(0.04, now + 0.8, 2)
        gain.gain.setTargetAtTime(0, now + 2.0, 0.5)
        
        osc.stop(now + 2.5)
        oscs.push({ osc, gain })
      })
      
      this._bgmOscillators.push(...oscs)
    }
    
    playChord()
    this._bgmInterval = setInterval(playChord, 2200) // 每2.2秒换一个和弦
  }

  _playWorldBGM() {
    // 世界探索BGM — 安静的氛围音乐
    this._bgmOscillators = []
    
    const bassNotes = [this.notes.C2, this.notes.C2, this.notes.F2, this.notes.F2,
                       this.notes.G2, this.notes.G2, this.notes.C3, this.notes.A2]
    let noteIdx = 0
    
    const playNote = () => {
      const freq = bassNotes[noteIdx % bassNotes.length]
      noteIdx++
      
      // 低音贝斯
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      
      const gain = this.ctx.createGain()
      gain.gain.value = 0
      
      osc.connect(gain)
      gain.connect(this.bgmGain)
      osc.start()
      
      const now = this.ctx.currentTime
      gain.gain.linearRampToValueAtTime(0.04, now + 0.02)
      gain.gain.setTargetAtTime(0.025, now + 1.5, 1.5)
      gain.gain.setTargetAtTime(0, now + 2.8, 0.5)
      osc.stop(now + 3)
      
      // 叠加一个高八度的泛音（很轻）
      const osc2 = this.ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = freq * 2
      
      const gain2 = this.ctx.createGain()
      gain2.gain.value = 0
      
      osc2.connect(gain2)
      gain2.connect(this.bgmGain)
      osc2.start()
      
      gain2.gain.linearRampToValueAtTime(0.008, now + 0.02)
      gain2.gain.setTargetAtTime(0.005, now + 1.5, 1.5)
      gain2.gain.setTargetAtTime(0, now + 2.8, 0.5)
      osc2.stop(now + 3)
      
      this._bgmOscillators.push({ osc, gain }, { osc: osc2, gain: gain2 })
    }
    
    playNote()
    this._bgmInterval = setInterval(playNote, 3200) // 缓慢的低音节奏
  }

  _playDialogueBGM() {
    // 对话场景BGM — 极简的单音符
    this._bgmOscillators = []
    
    const playPad = () => {
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = this.notes.A3
      
      const gain = this.ctx.createGain()
      gain.gain.value = 0
      
      osc.connect(gain)
      gain.connect(this.bgmGain)
      osc.start()
      
      const now = this.ctx.currentTime
      gain.gain.linearRampToValueAtTime(0.015, now + 0.5)
      gain.gain.setTargetAtTime(0.012, now + 3, 2)
      gain.gain.setTargetAtTime(0, now + 5, 1)
      osc.stop(now + 5.5)
      
      this._bgmOscillators.push({ osc, gain })
    }
    
    playPad()
    this._bgmInterval = setInterval(playPad, 5500)
  }

  _playBarBGM() {
    // 酒吧BGM — 有节奏感的低频律动
    this._bgmOscillators = []
    
    const kickPattern = () => {
      // 模拟底鼓
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 55
      
      const gain = this.ctx.createGain()
      gain.gain.value = 0
      osc.connect(gain)
      gain.connect(this.bgmGain)
      osc.start()
      
      const now = this.ctx.currentTime
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
      osc.stop(now + 0.25)
      
      // 贝斯
      setTimeout(() => {
        const osc2 = this.ctx.createOscillator()
        osc2.type = 'triangle'
        osc2.frequency.value = this.notes.C2
        
        const g2 = this.ctx.createGain()
        g2.gain.value = 0
        osc2.connect(g2)
        g2.connect(this.bgmGain)
        osc2.start()
        
        const n = this.ctx.currentTime
        g2.gain.linearRampToValueAtTime(0.05, n)
        g2.gain.setTargetAtTime(0.03, n + 0.35, 1)
        g2.gain.setTargetAtTime(0, n + 0.7, 0.3)
        osc2.stop(n + 0.8)
        this._bgmOscillators.push({ osc: osc2, gain: g2 })
      }, 140)
      
      this._bgmOscillators.push({ osc, gain })
    }
    
    kickPattern()
    this._bgmInterval = setInterval(kickPattern, 520)
  }

  _playNightBGM() {
    // 夜间BGM — 更安静 更空灵
    this._bgmOscillators = []
    
    const playAmbient = () => {
      // 空灵的高音 pad
      const freq = [this.notes.E4, this.notes.F4, this.notes.G4, this.notes.A4][Math.floor(Math.random() * 4)]
      
      const osc = this.ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      
      const gain = this.ctx.createGain()
      gain.gain.value = 0
      osc.connect(gain)
      gain.connect(this.bgmGain)
      osc.start()
      
      const now = this.ctx.currentTime
      gain.gain.linearRampToValueAtTime(0.02, now + 1)
      gain.gain.setTargetAtTime(0.015, now + 4, 3)
      gain.gain.setTargetAtTime(0, now + 7, 1)
      osc.stop(now + 8)
      
      this._bgmOscillators.push({ osc, gain })
    }
    
    playAmbient()
    this._bgmInterval = setInterval(playAmbient, 8500)
  }

  // ══════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════

  destroy() {
    this.stopBGM()
    this.stopWeatherSound()
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close()
    }
    this.initialized = false
  }

  getState() {
    return {
      initialized: this.initialized,
      muted: this.muted,
      bgmVolume: this.bgmVolume,
      sfxVolume: this.sfxVolume,
      currentBGM: this.currentBGM
    }
  }
}

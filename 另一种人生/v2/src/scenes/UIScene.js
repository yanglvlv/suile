/**
 * UIScene — HUD 覆盖层（独立于 WorldScene 的 UI 层）
 * 显示: 时间、属性条、位置信息、快捷菜单
 * 不参与物理世界，scrollFactor = 0 始终固定在屏幕上
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: false })
    this.hudElements = {}
  }

  create() {
    const { width, height } = this.cameras.main

    // 获取 WorldScene 引用
    this.worldScene = this.scene.get('WorldScene')

    // === 顶栏 HUD ===
    this.createTopBar(width)

    // === 底部导航栏 ===
    this.createBottomNav(width, height)

    // === 监听 WorldScene 事件 ===
    this.setupEventListeners()
  }

  createTopBar(width) {
    const padX = 12
    const topY = 8

    // 顶栏背景（半透明毛玻璃效果）
    const topBarBg = this.add.graphics()
    topBarBg.fillStyle(0x000000, 0.3)
    topBarBg.fillRoundedRect(0, 0, width, 60, 0)
    topBarBg.setScrollFactor(0).setDepth(100)

    // 左侧：时间+日期
    this.hudElements.dateText = this.add.text(padX, topY + 4, '第1年 3月1日 周一', {
      fontSize: '12px', fontWeight: '600', color: '#e2e8f0'
    }).setScrollFactor(0).setDepth(101).setOrigin(0, 0)

    this.hudElements.timeText = this.add.text(padX, topY + 22, '06:00', {
      fontSize: '16px', fontWeight: '700', color: '#ffffff'
    }).setScrollFactor(0).setDepth(101).setOrigin(0, 0)

    // 右侧：天气 + 金钱
    this.hudElements.weatherText = this.add.text(width - padX, topY + 4, '☀️ 晴 22°C', {
      fontSize: '11px', color: '#94a3b8'
    }).setScrollFactor(0).setDepth(101).setOrigin(1, 0)

    this.hudElements.moneyText = this.add.text(width - padX, topY + 20, '💰 $2,000', {
      fontSize: '14px', fontWeight: '700', color: '#fbbf24'
    }).setScrollFactor(0).setDepth(101).setOrigin(1, 0)

    // === 状态条区域（时间下方）===
    const barY = 52
    const barW = (width - padX * 2) / 5 - 4

    this.hudElements.statBars = {}
    const stats = [
      { key: 'energy', icon: '💪', label: '体力', color: 0xf59e0b },
      { key: 'health', icon: '❤️', label: '健康', color: 0xef4444 },
      { key: 'mood',   icon: '😊', label: '心情', color: 0x3b82f6 },
      { key: 'hunger', icon: '🍔', label: '饱腹', color: 0x22c55e, invert: true },
      { key: 'stress', icon: '😫', label: '压力', color: 0xa855f7, invert: true }
    ]

    stats.forEach((s, i) => {
      const x = padX + i * (barW + 4)

      // 图标+数值
      const label = this.add.text(x + barW / 2, barY, s.icon, {
        fontSize: '10px'
      }).setScrollFactor(0).setDepth(101).setOrigin(0.5, 0)

      // 背景条
      const barBg = this.add.graphics().setScrollFactor(0).setDepth(100)
      barBg.fillStyle(0x000000, 0.25)
      barBg.fillRoundedRect(x, barY + 12, barW, 6, 3)

      // 前景条
      const barFill = this.add.graphics().setScrollFactor(0).setDepth(100)
      barFill.fillStyle(s.color, 1)
      barFill.fillRoundedRect(x, barY + 12, barW, 6, 3)

      this.hudElements.statBars[s.key] = {
        bg: barBg, fill: barFill, label, width: barW,
        color: s.color, invert: !!s.invert, x, y: barY + 12
      }
    })

    // === 场景信息栏（底部导航上方）===
    this.locationInfo = this.add.container(0, 0).setAlpha(0).setScrollFactor(0).setDepth(99)

    const locBg = this.add.graphics()
    locBg.fillStyle(0xffffff, 0.95)
    locBg.fillRoundedRect(0, 0, 300, 44, 12)
    this.locationInfo.add(locBg)

    this.locIcon = this.add.text(16, 12, '🏠', { fontSize: '20px' }).setOrigin(0.5)
    this.locName = this.add.text(40, 10, '我的家', { fontSize: '14px', fontWeight: '700', color: '#1e293b' }).setOrigin(0, 0.5)
    this.locDesc = this.add.text(40, 26, '你温馨的小窝', { fontSize: '11px', color: '#64748b' }).setOrigin(0, 0.5)
    this.locExitHint = this.add.text(280, 22, '🚪', { fontSize: '16px' }).setOrigin(0.5)

    this.locationInfo.add([this.locIcon, this.locName, this.locDesc, this.locExitHint])
    this.locationInfo.setPosition(this.scale.width / 2 - 150, this.scale.height - 72)
  }

  createBottomNav(width, height) {
    const navHeight = 56
    const navY = height - navHeight

    // 导航栏背景
    const navBg = this.add.graphics()
    navBg.fillStyle(0xffffff, 0.95)
    navBg.fillRect(0, navY, width, navHeight)
    // 顶部线
    navBg.lineStyle(1, 0xe2e8f0, 1)
    navBg.lineBetween(0, navY, width, navY)
    navBg.setScrollFactor(0).setDepth(98)

    // 导航项
    const tabs = [
      { key: 'scene', icon: '🏠', label: '场景' },
      { key: 'map',   icon: '🗺️', label: '地图' },
      { key: 'social',icon: '👥', label: '社交' },
      { key: 'bag',   icon: '🎒', label: '背包' },
      { key: 'more',  icon: '⚙️',  label: '更多' }
    ]

    const tabWidth = width / tabs.length
    this.navItems = {}

    tabs.forEach((tab, i) => {
      const x = tabWidth * i + tabWidth / 2
      const y = navY + navHeight / 2

      const container = this.add.container(x, y).setSize(tabWidth, navHeight)
        .setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(99)

      const icon = this.add.text(0, -8, tab.icon, { fontSize: '18px' }).setOrigin(0.5)
      const label = this.add.text(0, 12, tab.label, {
        fontSize: '10px',
        color: i === 0 ? '#6366f1' : '#94a3b8',
        fontWeight: i === 0 ? '700' : '400'
      }).setOrigin(0.5)

      container.add([icon, label])

      // 选中指示器
      if (i === 0) {
        const indicator = this.add.graphics().setScrollFactor(0).setDepth(99)
        indicator.fillStyle(0x6366f1, 0.15)
        indicator.fillRoundedRect(x - tabWidth / 2, navY, tabWidth, navHeight, 0)
        container.setData('indicator', indicator)
        container.setData('active', true)
      }

      container.on('pointerdown', () => {
        this.switchTab(tab.key, container, tabs)
      })

      container.on('pointerover', () => {
        if (!container.getData('active')) {
          this.tweens.add({ targets: [icon], scale: 1.15, duration: 100 })
        }
      })
      container.on('pointerout', () => {
        if (!container.getData('active')) {
          this.tweens.add({ targets: [icon], scale: 1, duration: 100 })
        }
      })

      this.navItems[tab.key] = { container, icon, label }
    })
  }

  switchTab(key, activeContainer, allTabs) {
    // 清除所有选中状态
    for (const item of Object.values(this.navItems)) {
      if (item.container.getData('active')) {
        item.container.setData('active', false)
        const oldInd = item.container.getData('indicator')
        if (oldInd) oldInd.destroy()
        item.label.setColor('#94a3b8').setFontStyle('normal')
      }
    }

    // 设置新的选中状态
    activeContainer.setData('active', true)
    const newInd = this.add.graphics().setScrollFactor(0).setDepth(99)
    const tabW = this.scale.width / allTabs.length
    const navY = this.scale.height - 56
    newInd.fillStyle(0x6366f1, 0.15)
    newInd.fillRoundedRect(activeContainer.x - tabW / 2, navY, tabW, 56, 0)
    activeContainer.setData('indicator', newInd)
    activeContainer.label.setColor('#6366f1').setFontStyle('bold')

    // 触发对应功能
    switch (key) {
      case 'scene': break // 已在世界场景中
      case 'map': this.showMapPanel(); break
      case 'social': this.showSocialPanel(); break
      case 'bag': this.showBagPanel(); break
      case 'more': this.showMorePanel(); break
    }
  }

  setupEventListeners() {
    const worldScene = this.scene.get('WorldScene')

    // 时间更新
    worldScene.events.on('time:update', ({ timeStr, dateStr }) => {
      if (this.hudElements.timeText) this.hudElements.timeText.setText(timeStr)
      if (this.hudElements.dateText) this.hudElements.dateText.setText(dateStr)
    })

    // 属性变化
    worldScene.events.on('player:stat', ({ stat, value }) => {
      this.updateStatBar(stat, value)
    })

    // 地点切换
    worldScene.events.on('location:changed', ({ name, desc, locationId }) => {
      const icons = {
        home: '🏠', office: '🏢', cafe: '☕', gym: '🏋️',
        park: '🌳', library: '📚', restaurant: '🍜', mall: '🛒',
        bar: '🍺', market: '💼', school: '🏫', hospital: '🏥',
        bank: '🏦', convenience: '🏪'
      }
      this.locIcon.setText(icons[locationId] || '📍')
      this.locName.setText(name)
      this.locDesc.setText(desc)

      this.locationInfo.setAlpha(1)
      this.tweens.add({
        targets: this.locationInfo, alpha: 1, y: this.scale.height - 72,
        duration: 300, ease: 'Back.easeOut'
      })
      this.time.delayedCall(2500, () => {
        this.tweens.add({ targets: this.locationInfo, alpha: 0, duration: 300 })
      })
    })
  }

  updateStatBar(statKey, value) {
    const bar = this.hudElements.statBars[statKey]
    if (!bar) return

    let pct = Math.max(0, Math.min(100, value))
    if (bar.invert) pct = 100 - pct

    bar.fill.clear()
    bar.fill.fillStyle(bar.color, 1)
    bar.fill.fillRoundedRect(bar.x, bar.y, bar.width * pct / 100, 6, 3)

    // 低值闪烁警告
    if ((bar.invert ? value > 80 : value < 20)) {
      this.tweens.add({
        targets: bar.fill, alpha: 0.4,
        duration: 300, yoyo: true, repeat: 3
      })
    }
  }

  /**
   * 初始化时从引擎同步一次全部数据
   */
  syncFromEngine(world) {
    if (!world) return
    const t = world.time
    const p = world.player

    // 时间
    if (this.hudElements.timeText) this.hudElements.timeText.setText(t.timeString)
    if (this.hudElements.dateText) this.hudElements.dateText.setText(t.dateString)
    if (this.hudElements.weatherText) {
      this.hudElements.weatherText.setText(`${t.weatherNames[t.weather]} ${t.temperature}°C`)
    }
    if (this.hudElements.moneyText) {
      this.hudElements.moneyText.setText(`💰 $${p.body.cash.toLocaleString()}`)
    }

    // 属性条
    this.updateStatBar('energy', p.body.energy)
    this.updateStatBar('health', p.body.health)
    this.updateStatBar('mood', p.mind.moodValue || p.mind.happiness)
    this.updateStatBar('hunger', p.body.hunger)
    this.updateStatBar('stress', p.mind.stress)
  }

  showMapPanel() {
    if (this._panel) { this._panel.destroy(); this._panel = null; return }
    const worldScene = this.scene.get('WorldScene')
    const world = worldScene.world
    const { width, height } = this.cameras.main
    
    const container = this.add.container(width/2, height*0.45).setDepth(500).setScrollFactor(0)
    this._panel = container

    // 遮罩
    const mask = this.add.graphics()
    mask.fillStyle(0x000000, 0.5)
    mask.fillRect(-width/2, -height/2, width, height)
    mask.setInteractive(new Phaser.Geom.Rectangle(-width/2,-height/2,width,height), Phaser.Geom.Rectangle.Contains)
    mask.on('pointerdown', () => { container.destroy(); this._panel = null })
    container.add(mask)

    // 面板背景
    const panelW = Math.min(380, width - 32)
    const locs = Object.values(world.locations.locations)
    const panelH = 52 + locs.length * 44 + 16
    const bg = this.add.graphics()
    bg.fillStyle(0x18181b, 0.97)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 16)
    bg.fillStyle(0x6366f1, 1)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, 42, { tl:16, tr:16, bl:0, br:0 })
    container.add(bg)

    // 标题
    container.add(this.add.text(0, -panelH/2 + 21, '🗺️ 城市地图', {
      fontSize:'14px', fontWeight:'700', color:'#fff'
    }).setOrigin(0.5))

    // 地点列表
    const areas = { oldtown:'🏚️ 老城区', cbd:'🏢 CBD', downtown:'🏙️ 市中心', artdistrict:'🎨 文创区' }
    let yOff = -panelH/2 + 56
    for (const loc of locs) {
      const isCurrent = loc.id === world.locations.currentLocation
      const areaName = areas[loc.area] || ''
      const travelTime = world.locations.getTravelTime(world.locations.currentLocation, loc.id)

      const btn = this.add.graphics()
      btn.fillStyle(isCurrent ? 0x6366f1 : 0x27272a, isCurrent ? 0.2 : 1)
      btn.fillRoundedRect(-panelW/2 + 10, yOff, panelW - 20, 38, 8)
      container.add(btn)

      container.add(this.add.text(-panelW/2 + 24, yOff + 10, `${loc.icon} ${loc.name}`, {
        fontSize:'12px', fontWeight:'600', color: isCurrent ? '#a5b4fc' : '#e4e4e7'
      }))
      container.add(this.add.text(panelW/2 - 24, yOff + 12, isCurrent ? '📍在这里' : `${areaName} · ${travelTime}分钟`, {
        fontSize:'10px', color:'#71717a'
      }).setOrigin(1, 0))

      if (!isCurrent) {
        const hit = this.add.rectangle(0, yOff + 19, panelW - 20, 38, 0x000000, 0).setInteractive({useHandCursor:true})
        container.add(hit)
        hit.on('pointerdown', () => {
          container.destroy(); this._panel = null
          worldScene.transitionTo(loc.id)
        })
      }
      yOff += 44
    }

    container.setScale(0.9).setAlpha(0)
    this.tweens.add({ targets:container, scaleX:1, scaleY:1, alpha:1, duration:200, ease:'Back.easeOut' })
  }

  showSocialPanel() {
    if (this._panel) { this._panel.destroy(); this._panel = null; return }
    const worldScene = this.scene.get('WorldScene')
    const world = worldScene.world
    const { width, height } = this.cameras.main
    const npcs = Object.values(world.npcs.npcs)

    const container = this.add.container(width/2, height*0.45).setDepth(500).setScrollFactor(0)
    this._panel = container

    const mask = this.add.graphics()
    mask.fillStyle(0x000000, 0.5)
    mask.fillRect(-width/2, -height/2, width, height)
    mask.setInteractive(new Phaser.Geom.Rectangle(-width/2,-height/2,width,height), Phaser.Geom.Rectangle.Contains)
    mask.on('pointerdown', () => { container.destroy(); this._panel = null })
    container.add(mask)

    const panelW = Math.min(380, width - 32)
    const panelH = 52 + npcs.length * 52 + 16
    const bg = this.add.graphics()
    bg.fillStyle(0x18181b, 0.97)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 16)
    bg.fillStyle(0xec4899, 1)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, 42, { tl:16, tr:16, bl:0, br:0 })
    container.add(bg)

    container.add(this.add.text(0, -panelH/2 + 21, '👥 社交关系', {
      fontSize:'14px', fontWeight:'700', color:'#fff'
    }).setOrigin(0.5))

    let yOff = -panelH/2 + 56
    const relColors = { stranger:0x6b7280, acquaintance:0xf59e0b, friend:0x22c55e, closeFriend:0xec4899 }
    for (const npc of npcs) {
      const rel = world.npcs.getRelationLabel(npc.id)
      const total = (npc.relation.trust + npc.relation.like + npc.relation.intimacy)
      const relPct = Math.min(100, Math.round(total / 3))
      const locId = world.npcs.getNPCLocation(npc.id, world.time)
      const locName = world.locations.locations[locId]?.name || '未知'

      const btn = this.add.graphics()
      btn.fillStyle(0x27272a, 1)
      btn.fillRoundedRect(-panelW/2 + 10, yOff, panelW - 20, 46, 8)
      container.add(btn)

      // NPC头像
      try {
        container.add(this.add.image(-panelW/2 + 36, yOff + 23, `npc_${npc.id}`).setScale(1.2))
      } catch(e) {
        container.add(this.add.text(-panelW/2 + 36, yOff + 23, npc.avatar, { fontSize:'18px' }).setOrigin(0.5))
      }

      container.add(this.add.text(-panelW/2 + 58, yOff + 8, `${npc.name}`, {
        fontSize:'12px', fontWeight:'600', color:'#e4e4e7'
      }))
      container.add(this.add.text(-panelW/2 + 58, yOff + 26, `${rel} · 好感${total} · 📍${locName}`, {
        fontSize:'9px', color:'#71717a'
      }))

      // 好感度条
      const barW = 60
      const barBg = this.add.graphics()
      barBg.fillStyle(0x3f3f46, 1)
      barBg.fillRoundedRect(panelW/2 - 24 - barW, yOff + 18, barW, 6, 3)
      container.add(barBg)
      const barFill = this.add.graphics()
      barFill.fillStyle(relColors[npc.relationLevel] || 0x6b7280, 1)
      barFill.fillRoundedRect(panelW/2 - 24 - barW, yOff + 18, barW * relPct / 100, 6, 3)
      container.add(barFill)

      // 点击与NPC对话
      const hit = this.add.rectangle(0, yOff + 23, panelW - 20, 46, 0x000000, 0).setInteractive({useHandCursor:true})
      container.add(hit)
      hit.on('pointerdown', () => {
        container.destroy(); this._panel = null
        worldScene.startDialogue(npc.id)
      })

      yOff += 52
    }

    container.setScale(0.9).setAlpha(0)
    this.tweens.add({ targets:container, scaleX:1, scaleY:1, alpha:1, duration:200, ease:'Back.easeOut' })
  }

  showBagPanel() {
    if (this._panel) { this._panel.destroy(); this._panel = null; return }
    const worldScene = this.scene.get('WorldScene')
    const world = worldScene.world
    const p = world.player
    const { width, height } = this.cameras.main

    const container = this.add.container(width/2, height*0.42).setDepth(500).setScrollFactor(0)
    this._panel = container

    const mask = this.add.graphics()
    mask.fillStyle(0x000000, 0.5)
    mask.fillRect(-width/2, -height/2, width, height)
    mask.setInteractive(new Phaser.Geom.Rectangle(-width/2,-height/2,width,height), Phaser.Geom.Rectangle.Contains)
    mask.on('pointerdown', () => { container.destroy(); this._panel = null })
    container.add(mask)

    const panelW = Math.min(380, width - 32)
    const panelH = 480
    const bg = this.add.graphics()
    bg.fillStyle(0x18181b, 0.97)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 16)
    bg.fillStyle(0xf59e0b, 1)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, 42, { tl:16, tr:16, bl:0, br:0 })
    container.add(bg)

    container.add(this.add.text(0, -panelH/2 + 21, '📋 个人状态', {
      fontSize:'14px', fontWeight:'700', color:'#fff'
    }).setOrigin(0.5))

    const col = '#d4d4d8'
    const sub = '#71717a'
    let y = -panelH/2 + 60

    // 属性
    const barItem = (icon, name, val, max, inv, color) => {
      container.add(this.add.text(-panelW/2 + 20, y, `${icon} ${name}`, { fontSize:'11px', color:sub }))
      container.add(this.add.text(panelW/2 - 20, y, `${Math.round(val)}`, { fontSize:'11px', color:col, fontWeight:'600' }).setOrigin(1,0))
      const barBg = this.add.graphics()
      barBg.fillStyle(0x3f3f46, 1)
      barBg.fillRoundedRect(-panelW/2 + 20, y + 16, panelW - 40, 5, 2.5)
      container.add(barBg)
      const pct = inv ? (100 - val) / max : val / max
      const barFill = this.add.graphics()
      barFill.fillStyle(color, 1)
      barFill.fillRoundedRect(-panelW/2 + 20, y + 16, (panelW - 40) * Math.max(0, Math.min(1, pct)), 5, 2.5)
      container.add(barFill)
      y += 28
    }

    container.add(this.add.text(-panelW/2 + 20, y, '🧬 身体', { fontSize:'12px', color:col, fontWeight:'700' }))
    y += 20
    barItem('💪', '体力', p.body.energy, 100, false, 0xf59e0b)
    barItem('🍔', '饱腹', p.body.hunger, 100, true, 0x22c55e)
    barItem('❤️', '健康', p.body.health, 100, false, 0xef4444)
    barItem('💤', '疲劳', p.body.fatigue, 100, true, 0xa855f7)

    container.add(this.add.text(-panelW/2 + 20, y + 4, '🧠 精神', { fontSize:'12px', color:col, fontWeight:'700' }))
    y += 24
    barItem('😊', '心情', p.mind.happiness, 100, false, 0x3b82f6)
    barItem('😫', '压力', p.mind.stress, 100, true, 0xef4444)
    barItem('🔥', '动力', p.mind.motivation, 100, false, 0xf59e0b)

    // 职业
    container.add(this.add.text(-panelW/2 + 20, y + 4, '💼 职业', { fontSize:'12px', color:col, fontWeight:'700' }))
    y += 24
    container.add(this.add.text(-panelW/2 + 20, y, p.job.current ? `${p.job.position} @ ${p.job.company} · 月薪$${p.job.salary} · 绩效${p.job.performance}` : '目前无业', { fontSize:'10px', color:sub, wordWrap:{width:panelW-40} }))
    y += 28

    // 经济
    container.add(this.add.text(-panelW/2 + 20, y, '💰 经济', { fontSize:'12px', color:col, fontWeight:'700' }))
    y += 20
    container.add(this.add.text(-panelW/2 + 20, y, `现金 $${p.cash.toLocaleString()} · 存款 $${(p.savings||0).toLocaleString()} · 总资产 $${p.netWorth.toLocaleString()}`, { fontSize:'10px', color:sub }))
    y += 22

    // 技能
    container.add(this.add.text(-panelW/2 + 20, y, '📈 技能', { fontSize:'12px', color:col, fontWeight:'700' }))
    y += 20
    const skills = Object.entries(p.skills).filter(([k,s]) => s.level > 0)
    const skillText = skills.length > 0 ? skills.map(([k,s]) => `${s.icon}${s.name} Lv${s.level}`).join('  ') : '暂无技能'
    container.add(this.add.text(-panelW/2 + 20, y, skillText, { fontSize:'10px', color:sub, wordWrap:{width:panelW-40} }))
    y += 22

    // 统计
    container.add(this.add.text(-panelW/2 + 20, y, `📊 已度过${p.stats.totalDays}天 · 收入$${p.stats.moneyEarned.toLocaleString()} · 认识${p.stats.npcsMetCount}人`, { fontSize:'10px', color:sub }))

    container.setScale(0.9).setAlpha(0)
    this.tweens.add({ targets:container, scaleX:1, scaleY:1, alpha:1, duration:200, ease:'Back.easeOut' })
  }

  showMorePanel() {
    if (this._panel) { this._panel.destroy(); this._panel = null; return }
    const worldScene = this.scene.get('WorldScene')
    const world = worldScene.world
    const { width, height } = this.cameras.main

    const container = this.add.container(width/2, height*0.45).setDepth(500).setScrollFactor(0)
    this._panel = container

    const mask = this.add.graphics()
    mask.fillStyle(0x000000, 0.5)
    mask.fillRect(-width/2, -height/2, width, height)
    mask.setInteractive(new Phaser.Geom.Rectangle(-width/2,-height/2,width,height), Phaser.Geom.Rectangle.Contains)
    mask.on('pointerdown', () => { container.destroy(); this._panel = null })
    container.add(mask)

    const panelW = Math.min(300, width - 40)
    const items = [
      { icon:'💾', label:'保存游戏', action:() => {
        world.save(0)
        worldScene.showEventNotification({ text:'✅ 游戏已保存', icon:'💾' })
        container.destroy(); this._panel = null
      }},
      { icon:'📊', label:'投资理财', action:() => {
        container.destroy(); this._panel = null
        this.showStockPanel()
      }},
      { icon:'🏆', label:'成就', action:() => {
        container.destroy(); this._panel = null
        this.showAchievementPanel()
      }},
      { icon:'📜', label:'消息日志', action:() => {
        container.destroy(); this._panel = null
        this.showLogPanel()
      }},
      { icon:'🔇', label: world.audio?.muted ? '🔊 取消静音' : '🔇 静音', action:() => {
        if (world.audio) world.audio.toggleMute()
        container.destroy(); this._panel = null
      }},
      { icon:'🏠', label:'回到标题', action:() => {
        container.destroy(); this._panel = null
        worldScene.scene.stop('UIScene')
        worldScene.scene.stop('DialogueScene')
        worldScene.scene.start('TitleScene')
      }}
    ]
    const panelH = 52 + items.length * 48 + 16
    const bg = this.add.graphics()
    bg.fillStyle(0x18181b, 0.97)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 16)
    bg.fillStyle(0x6366f1, 1)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, 42, { tl:16, tr:16, bl:0, br:0 })
    container.add(bg)

    container.add(this.add.text(0, -panelH/2 + 21, '⚙️ 更多', {
      fontSize:'14px', fontWeight:'700', color:'#fff'
    }).setOrigin(0.5))

    let yOff = -panelH/2 + 56
    items.forEach(item => {
      const btn = this.add.graphics()
      btn.fillStyle(0x27272a, 1)
      btn.fillRoundedRect(-panelW/2 + 10, yOff, panelW - 20, 40, 8)
      container.add(btn)

      container.add(this.add.text(-panelW/2 + 26, yOff + 20, `${item.icon} ${item.label}`, {
        fontSize:'13px', color:'#d4d4d8'
      }).setOrigin(0, 0.5))

      const hit = this.add.rectangle(0, yOff + 20, panelW - 20, 40, 0x000000, 0).setInteractive({useHandCursor:true})
      container.add(hit)
      hit.on('pointerover', () => { btn.clear(); btn.fillStyle(0x3f3f46,1); btn.fillRoundedRect(-panelW/2+10,yOff,panelW-20,40,8) })
      hit.on('pointerout', () => { btn.clear(); btn.fillStyle(0x27272a,1); btn.fillRoundedRect(-panelW/2+10,yOff,panelW-20,40,8) })
      hit.on('pointerdown', item.action)
      yOff += 48
    })

    container.setScale(0.9).setAlpha(0)
    this.tweens.add({ targets:container, scaleX:1, scaleY:1, alpha:1, duration:200, ease:'Back.easeOut' })
  }

  showStockPanel() {
    if (this._panel) { this._panel.destroy(); this._panel = null; return }
    const worldScene = this.scene.get('WorldScene')
    const world = worldScene.world
    const eco = world.economy
    const { width, height } = this.cameras.main

    const container = this.add.container(width/2, height*0.42).setDepth(500).setScrollFactor(0)
    this._panel = container

    const mask = this.add.graphics()
    mask.fillStyle(0x000000, 0.5)
    mask.fillRect(-width/2, -height/2, width, height)
    mask.setInteractive(new Phaser.Geom.Rectangle(-width/2,-height/2,width,height), Phaser.Geom.Rectangle.Contains)
    mask.on('pointerdown', () => { container.destroy(); this._panel = null })
    container.add(mask)

    const panelW = Math.min(400, width - 24)
    const panelH = 52 + eco.stocks.length * 44 + 60
    const bg = this.add.graphics()
    bg.fillStyle(0x18181b, 0.97)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 16)
    bg.fillStyle(0x10b981, 1)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, 42, { tl:16, tr:16, bl:0, br:0 })
    container.add(bg)

    const cycles = { boom:'📈牛市', normal:'➡️震荡', recession:'📉熊市' }
    container.add(this.add.text(0, -panelH/2 + 21, `📊 股票市场 · ${cycles[eco.economyCycle]}`, {
      fontSize:'13px', fontWeight:'700', color:'#fff'
    }).setOrigin(0.5))

    // 资金概览
    container.add(this.add.text(-panelW/2 + 16, -panelH/2 + 52, `💰现金 $${world.player.cash.toLocaleString()} · 📈市值 $${eco.portfolioValue.toLocaleString()}`, {
      fontSize:'10px', color:'#71717a'
    }))

    let yOff = -panelH/2 + 72
    eco.stocks.forEach(s => {
      const hist = s.history || []
      const prev = hist.length > 1 ? hist[hist.length-2] : s.basePrice
      const chg = s.price - prev
      const pct = prev > 0 ? (chg/prev*100).toFixed(1) : '0.0'
      const held = eco.playerStocks[s.id]
      const isUp = chg >= 0

      const row = this.add.graphics()
      row.fillStyle(0x27272a, 1)
      row.fillRoundedRect(-panelW/2 + 10, yOff, panelW - 20, 38, 6)
      container.add(row)

      container.add(this.add.text(-panelW/2 + 22, yOff + 8, `${s.icon} ${s.name}`, { fontSize:'11px', color:'#e4e4e7' }))
      container.add(this.add.text(-panelW/2 + 22, yOff + 24, held ? `持${held.shares}股` : s.sector, { fontSize:'9px', color:'#52525b' }))
      container.add(this.add.text(panelW/2 - 22, yOff + 8, `$${s.price.toFixed(2)}`, { fontSize:'11px', color:'#e4e4e7', fontWeight:'600' }).setOrigin(1,0))
      container.add(this.add.text(panelW/2 - 22, yOff + 24, `${isUp?'+':''}${pct}%`, { fontSize:'9px', color:isUp?'#22c55e':'#ef4444' }).setOrigin(1,0))

      // 买卖按钮
      const buyBtn = this.add.text(panelW/2 - 100, yOff + 18, '买', {
        fontSize:'10px', color:'#22c55e', backgroundColor:'#052e16', padding:{x:6,y:2}
      }).setOrigin(0.5).setInteractive({useHandCursor:true})
      container.add(buyBtn)
      buyBtn.on('pointerdown', () => {
        const r = eco.buyStock(s.id, 1, world.player)
        worldScene.showEventNotification({ text: r.msg, icon: r.success ? '📈' : '❌' })
        container.destroy(); this._panel = null; this.showStockPanel()
      })

      if (held && held.shares > 0) {
        const sellBtn = this.add.text(panelW/2 - 72, yOff + 18, '卖', {
          fontSize:'10px', color:'#ef4444', backgroundColor:'#450a0a', padding:{x:6,y:2}
        }).setOrigin(0.5).setInteractive({useHandCursor:true})
        container.add(sellBtn)
        sellBtn.on('pointerdown', () => {
          const r = eco.sellStock(s.id, 1, world.player)
          worldScene.showEventNotification({ text: r.msg, icon: r.success ? '📉' : '❌' })
          container.destroy(); this._panel = null; this.showStockPanel()
        })
      }

      yOff += 44
    })

    container.setScale(0.9).setAlpha(0)
    this.tweens.add({ targets:container, scaleX:1, scaleY:1, alpha:1, duration:200, ease:'Back.easeOut' })
  }

  showAchievementPanel() {
    if (this._panel) { this._panel.destroy(); this._panel = null; return }
    const worldScene = this.scene.get('WorldScene')
    const world = worldScene.world
    const achDefs = world.events.achievementDefs
    const { width, height } = this.cameras.main

    const container = this.add.container(width/2, height*0.45).setDepth(500).setScrollFactor(0)
    this._panel = container

    const mask = this.add.graphics()
    mask.fillStyle(0x000000, 0.5)
    mask.fillRect(-width/2, -height/2, width, height)
    mask.setInteractive(new Phaser.Geom.Rectangle(-width/2,-height/2,width,height), Phaser.Geom.Rectangle.Contains)
    mask.on('pointerdown', () => { container.destroy(); this._panel = null })
    container.add(mask)

    const panelW = Math.min(340, width - 40)
    const panelH = 52 + achDefs.length * 44 + 16
    const bg = this.add.graphics()
    bg.fillStyle(0x18181b, 0.97)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 16)
    bg.fillStyle(0xfbbf24, 1)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, 42, { tl:16, tr:16, bl:0, br:0 })
    container.add(bg)

    const unlocked = achDefs.filter(a=>a.unlocked).length
    container.add(this.add.text(0, -panelH/2 + 21, `🏆 成就 (${unlocked}/${achDefs.length})`, {
      fontSize:'14px', fontWeight:'700', color:'#fff'
    }).setOrigin(0.5))

    let yOff = -panelH/2 + 56
    achDefs.forEach(ach => {
      const row = this.add.graphics()
      row.fillStyle(ach.unlocked ? 0x27272a : 0x1a1a1e, 1)
      row.fillRoundedRect(-panelW/2 + 10, yOff, panelW - 20, 38, 8)
      container.add(row)

      container.add(this.add.text(-panelW/2 + 24, yOff + 10, `${ach.icon} ${ach.name}`, {
        fontSize:'12px', color: ach.unlocked ? '#fbbf24' : '#52525b', fontWeight:'600'
      }))
      container.add(this.add.text(-panelW/2 + 24, yOff + 26, ach.desc, {
        fontSize:'9px', color: ach.unlocked ? '#a1a1aa' : '#3f3f46'
      }))
      if (!ach.unlocked) {
        container.add(this.add.text(panelW/2 - 24, yOff + 18, '🔒', { fontSize:'14px' }).setOrigin(1, 0.5))
      }
      yOff += 44
    })

    container.setScale(0.9).setAlpha(0)
    this.tweens.add({ targets:container, scaleX:1, scaleY:1, alpha:1, duration:200, ease:'Back.easeOut' })
  }

  showLogPanel() {
    if (this._panel) { this._panel.destroy(); this._panel = null; return }
    const worldScene = this.scene.get('WorldScene')
    const world = worldScene.world
    const msgs = world.messages.slice(-20).reverse()
    const { width, height } = this.cameras.main

    const container = this.add.container(width/2, height*0.42).setDepth(500).setScrollFactor(0)
    this._panel = container

    const mask = this.add.graphics()
    mask.fillStyle(0x000000, 0.5)
    mask.fillRect(-width/2, -height/2, width, height)
    mask.setInteractive(new Phaser.Geom.Rectangle(-width/2,-height/2,width,height), Phaser.Geom.Rectangle.Contains)
    mask.on('pointerdown', () => { container.destroy(); this._panel = null })
    container.add(mask)

    const panelW = Math.min(380, width - 32)
    const panelH = 52 + Math.min(msgs.length, 12) * 28 + 16
    const bg = this.add.graphics()
    bg.fillStyle(0x18181b, 0.97)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, panelH, 16)
    bg.fillStyle(0x6366f1, 1)
    bg.fillRoundedRect(-panelW/2, -panelH/2, panelW, 42, { tl:16, tr:16, bl:0, br:0 })
    container.add(bg)

    container.add(this.add.text(0, -panelH/2 + 21, '📜 消息日志', {
      fontSize:'14px', fontWeight:'700', color:'#fff'
    }).setOrigin(0.5))

    let yOff = -panelH/2 + 56
    const typeColors = { action:'#a5b4fc', event:'#fbbf24', social:'#f9a8d4', warning:'#fca5a5', economy:'#6ee7b7' }
    msgs.slice(0, 12).forEach(m => {
      container.add(this.add.text(-panelW/2 + 20, yOff, `${m.time || ''} ${m.text}`, {
        fontSize:'9px', color: typeColors[m.type] || '#71717a',
        wordWrap: { width: panelW - 40 }
      }))
      yOff += 28
    })

    container.setScale(0.9).setAlpha(0)
    this.tweens.add({ targets:container, scaleX:1, scaleY:1, alpha:1, duration:200, ease:'Back.easeOut' })
  }
}

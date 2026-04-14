/**
 * WorldScene — 主游戏场景
 * 渲染世界地图、角色移动、NPC、交互
 */
import { World } from '../engine/World.js'

export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene', active: false })
    this.world = null
    this.player = null
    this.npcSprites = {}
    this.interactables = []
    this.currentLocationId = 'home'
  }

  init(data) {
    // 初始化游戏世界（纯逻辑）
    this.world = new World()
    this._loadSave = data?.loadSave || false
  }

  create() {
    const { width, height } = this.cameras.main

    // 创建场景组
    this.bgLayer = this.add.container(0, 0)
    this.floorLayer = this.add.container(0, 0)
    this.wallLayer = this.add.container(0, 0)
    this.furnitureLayer = this.add.container(0, 0)
    this.entityLayer = this.add.container(0, 0)
    this.overlayLayer = this.add.container(0, 0)
    this.fxLayer = this.add.container(0, 0)

    // 加载当前场景地图
    this.loadLocation('home')

    // 创建玩家
    this.createPlayer()

    // 摄像机跟随玩家
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.cameras.main.setBounds(0, 0, width, height)

    // 输入控制
    this.setupControls()

    // 引擎事件监听
    this.setupWorldEvents()

    // 读取存档（如果有）
    if (this._loadSave) {
      const loaded = this.world.load(0)
      if (loaded) {
        this.loadLocation(this.world.locations.currentLocation || 'home')
        this.showEventNotification({ text: '📂 存档已读取！', icon: '💾' })
      }
    }

    // 场景切换过渡
    this.cameras.main.fadeIn(500)
  }

  /**
   * 加载地点 — 插画背景 + 热区交互
   */
  loadLocation(locationId) {
    this.currentLocationId = locationId
    const loc = this.world.locations.getLocation(locationId)
    if (!loc) return

    const { width: camW, height: camH } = this.cameras.main

    // 清理旧场景
    ;[this.bgLayer, this.floorLayer, this.wallLayer, this.furnitureLayer].forEach(layer => layer.removeAll(true))
    this.interactables.forEach(o => { if (o.sprite) o.sprite.destroy(); if (o.bubble) o.bubble.destroy() })
    this.interactables = []

    // === 插画背景 ===
    const bgMap = {
      home: 'bg_home', cafe: 'bg_cafe', office: 'bg_office', park: 'bg_park',
      gym: 'bg_gym', library: 'bg_library', restaurant: 'bg_cafe2', mall: 'bg_store',
      bar: 'bg_cafe2', market: 'bg_store', school: 'bg_library',
      hospital: 'bg_office', bank: 'bg_office', convenience: 'bg_store'
    }
    const bgKey = bgMap[locationId] || 'bg_home'

    if (this.textures.exists(bgKey)) {
      const bgImg = this.add.image(camW / 2, camH / 2, bgKey)
      // 缩放填满屏幕
      const scaleX = camW / bgImg.width
      const scaleY = camH / bgImg.height
      bgImg.setScale(Math.max(scaleX, scaleY))
      bgImg.setDepth(0)
      this.bgLayer.add(bgImg)
    } else {
      // 后备：纯色背景
      const bgGfx = this.add.graphics()
      bgGfx.fillStyle(loc.bgColor || 0x1e1b4b, 1)
      bgGfx.fillRect(0, 0, camW, camH)
      this.bgLayer.add(bgGfx)
    }

    // === 日夜色调叠加 ===
    const timeOverlay = this.add.graphics()
    const h = this.world.time.hour
    if (h >= 21 || h < 5) timeOverlay.fillStyle(0x0a0f1e, 0.5)
    else if (h >= 19) timeOverlay.fillStyle(0x28143c, 0.2)
    else if (h >= 17) timeOverlay.fillStyle(0x502814, 0.08)
    else if (h < 7) timeOverlay.fillStyle(0x141e3c, 0.25)
    else timeOverlay.fillStyle(0x000000, 0)
    timeOverlay.fillRect(0, 0, camW, camH)
    timeOverlay.setDepth(1)
    this.bgLayer.add(timeOverlay)

    // === 交互热区（可点击的区域）===
    if (loc.objects) {
      for (const obj of loc.objects) {
        if (obj.interactive) {
          // 热区高亮圈
          const hotspot = this.add.image(obj.x, obj.y, 'hotspot').setDepth(10).setAlpha(0.6)
          this.furnitureLayer.add(hotspot)

          // 浮动标签
          const label = this.add.text(obj.x, obj.y - 30, obj.label || '', {
            fontSize: '11px', color: '#ffffff', fontWeight: '600',
            backgroundColor: '#000000aa', padding: { x: 8, y: 4 }
          }).setOrigin(0.5).setDepth(12).setAlpha(0)
          this.overlayLayer.add(label)

          // 脉冲动画
          this.tweens.add({
            targets: hotspot, scaleX: 1.15, scaleY: 1.15,
            duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
          })

          hotspot.setInteractive({ useHandCursor: true })
          hotspot.on('pointerover', () => {
            this.tweens.add({ targets: label, alpha: 1, duration: 150 })
            hotspot.setAlpha(1)
          })
          hotspot.on('pointerout', () => {
            this.tweens.add({ targets: label, alpha: 0, duration: 150 })
            hotspot.setAlpha(0.6)
          })
          hotspot.on('pointerdown', () => {
            this.handleInteraction(obj)
          })

          this.interactables.push({ sprite: hotspot, bubble: label, data: obj })
        }

        // 出口
        if (obj.isExit) {
          const exitIcon = this.add.image(obj.x, obj.y, 'exit_icon')
            .setDepth(15).setAlpha(0.8).setInteractive({ useHandCursor: true })
          this.overlayLayer.add(exitIcon)

          // 出口呼吸动画
          this.tweens.add({
            targets: exitIcon, y: obj.y - 4,
            duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
          })

          exitIcon.on('pointerover', () => exitIcon.setAlpha(1).setScale(1.15))
          exitIcon.on('pointerout', () => exitIcon.setAlpha(0.8).setScale(1))
          exitIcon.on('pointerdown', () => this.showLocationPicker(obj))

          this.interactables.push({ sprite: exitIcon, data: obj, isExit: true })
        }
      }
    }

    // === NPC ===
    this.spawnNPCs(locationId)

    // 摄像机边界
    this.cameras.main.setBounds(0, 0, camW, camH)

    // 通知UI
    this.events.emit('location:changed', { locationId, name: loc.name, desc: loc.desc })
  }

  createPlayer() {
    const { width, height } = this.cameras.main
    const startX = width / 2, startY = height * 0.65

    this.player = this.physics.add.sprite(startX, startY, 'player_down')
    this.player.setCollideWorldBounds(true)
    this.player.body.setSize(24, 24)
    this.player.body.setOffset(8, 8)
    this.player.setDepth(50)
    this.player.setScale(1.2)
    this.entityLayer.add(this.player)

    this.playerState = {
      speed: 120,
      direction: 'down',
      isMoving: false,
      canInteract: true,
      interactCooldown: 0
    }

    // 呼吸动画
    this.tweens.add({
      targets: this.player,
      scaleY: 1.25,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  spawnNPCs(locationId) {
    // 清除旧NPC
    Object.values(this.npcSprites).forEach(s => { try { s.destroy() } catch(e){} })
    this.npcSprites = {}

    const { width, height } = this.cameras.main
    const npcsHere = this.world.npcs.getNPCsAtLocation(locationId, this.world.time)

    // 分散NPC位置
    const positions = [
      { x: width * 0.25, y: height * 0.4 },
      { x: width * 0.75, y: height * 0.35 },
      { x: width * 0.2, y: height * 0.6 },
      { x: width * 0.8, y: height * 0.55 },
      { x: width * 0.5, y: height * 0.3 },
      { x: width * 0.35, y: height * 0.5 },
    ]

    npcsHere.forEach((npc, i) => {
      const pos = positions[i % positions.length]
      const sprite = this.add.image(pos.x, pos.y, `npc_${npc.id}`)
        .setDepth(49).setScale(1.1)
        .setInteractive({ useHandCursor: true })
      this.entityLayer.add(sprite)
      this.npcSprites[npc.id] = sprite

      // NPC名字标签（更精致）
      const relColors = { stranger: '#94a3b8', acquaintance: '#fbbf24', friend: '#34d399', closeFriend: '#f472b6' }
      const relColor = relColors[npc.relationLevel] || '#94a3b8'
      const nameTag = this.add.text(pos.x, pos.y - 28, npc.name, {
        fontSize: '11px', color: '#ffffff', fontWeight: '600',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 2 }
      }).setOrigin(0.5).setDepth(101)
      this.overlayLayer.add(nameTag)

      // 关系色指示点
      const relDot = this.add.circle(pos.x + nameTag.width / 2 + 6, pos.y - 28, 3, Phaser.Display.Color.HexStringToColor(relColor).color, 1).setDepth(102)
      this.overlayLayer.add(relDot)

      sprite.on('pointerdown', () => this.startDialogue(npc.id))

      sprite.setData('npcData', npc)
      sprite.setData('nameTag', nameTag)
      sprite.setData('relDot', relDot)

      // idle浮动动画
      this.tweens.add({
        targets: sprite,
        y: pos.y - 4,
        duration: 1500 + Math.random() * 1000,
        yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 800
      })
    })
  }

  setupControls() {
    // 虚拟摇杆区域（左下角）
    this.joystickBase = null
    this.joystickThumb = null
    this.joystickRing = null
    this.joystickVector = { x: 0, y: 0 }
    this.joystickActive = false
    this.joystickPointerId = null

    // 键盘输入（PC调试用）
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    })

    // 触摸/鼠标虚拟摇杆 — 改进版：多点触控支持，更大的响应区
    this.input.on('pointerdown', (pointer) => {
      // 首次触摸初始化音频
      if (this.world?.audio && !this.world.audio.initialized) {
        this.world.audio.init()
        this.world.audio.resume()
        this.world.audio.playBGM('world')
      }

      // 只在左半屏触发摇杆（右半屏留给交互按钮）
      if (pointer.x < this.scale.width * 0.55) {
        // 如果已有摇杆且不是同一个手指，忽略（防止多指冲突）
        if (this.joystickActive && this.joystickPointerId !== pointer.id) return
        this.createJoystick(pointer.x, pointer.y, pointer.id)
      } else if (pointer.x >= this.scale.width * 0.55) {
        // 右半屏点击 → 尝试快速交互
        this.tryInteractWithNearby()
      }
    })

    this.input.on('pointermove', (pointer) => {
      if (this.joystickActive && this.joystickThumb && pointer.id === this.joystickPointerId) {
        this.updateJoystick(pointer.x, pointer.y)
      }
    })

    this.input.on('pointerup', (pointer) => {
      if (pointer.id === this.joystickPointerId) {
        this.destroyJoystick()
      }
    })

    // 交互按钮（右下角）— 更大更易点
    this.interactBtn = null
    this.createInteractButton()

    // 快捷菜单按钮（右上角）
    this.menuBtn = null
    this.createMenuButton()
  }

  createJoystick(x, y, pointerId) {
    const baseR = 56
    const thumbR = 24

    // 外圈指示器（半透明）
    this.joystickRing = this.add.circle(x, y, baseR + 8, 0x6366f1, 0.12).setDepth(199).setScrollFactor(0)
    
    // 底座
    this.joystickBase = this.add.circle(x, y, baseR, 0x000000, 0.25).setDepth(200).setScrollFactor(0)
    
    // 摇杆头 — 带渐变效果
    this.joystickThumb = this.add.ellipse(x, y, thumbR, thumbR * 1.15, 0x6366f1, 0.85).setDepth(201).setScrollFactor(0)
    
    // 内部高光点
    const highlight = this.add.ellipse(x, y - 4, thumbR * 0.4, thumbR * 0.3, 0xffffff, 0.5).setDepth(202).setScrollFactor(0)

    // 弹出动画
    this.joystickRing.setScale(0)
    this.joystickBase.setScale(0)
    this.joystickThumb.setScale(0)
    if (highlight) highlight.setScale(0)
    
    this.tweens.add({ targets: [this.joystickRing], scale: 1, duration: 150, ease: 'Back.easeOut' })
    this.tweens.add({ targets: [this.joystickBase], scale: 1, duration: 150, ease: 'Back.easeOut' })
    this.tweens.add({ targets: [this.joystickThumb, highlight || this.joystickThumb].length ? [this.joystickThumb] : [], scale: 1, duration: 200, ease: 'Elastic.easeOut' })
    
    this.joystickCenter = { x, y }
    this.joystickActive = true
    this.joystickPointerId = pointerId

    // 触觉反馈震动（如果设备支持）
    if (navigator.vibrate) navigator.vibrate(10)
  }

  updateJoystick(px, py) {
    if (!this.joystickThumb) return
    const dx = px - this.joystickCenter.x
    const dy = py - this.joystickCenter.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = 56 - 12 // baseR - thumbR/2

    let clampedX = dx
    let clampedY = dy
    if (dist > maxDist) {
      clampedX = (dx / dist) * maxDist
      clampedY = (dy / dist) * maxDist
      // 到达边界时让底座微微发光表示到底了
      if (!this._joystickAtEdge) { this._joystickAtEdge = true; this.joystickBase.setFillStyle(0x6366f1, 0.2) }
    } else {
      if (this._joystickAtEdge) { this._joystickAtEdge = false; this.joystickBase.setFillStyle(0x000000, 0.25) }
    }

    this.joystickThumb.setPosition(
      this.joystickCenter.x + clampedX,
      this.joystickCenter.y + clampedY
    )

    this.joystickVector = {
      x: clampedX / maxDist,
      y: clampedY / maxDist
    }
  }

  destroyJoystick() {
    if (this.joystickRing) { this.tweens.add({ targets: this.joystickRing, scale: 0, alpha: 0, duration: 100 }); setTimeout(() => { try { this.joystickRing?.destroy() } catch(e){} }, 120) }
    if (this.joystickBase) { this.tweens.add({ targets: this.joystickBase, scale: 0, alpha: 0, duration: 100 }); setTimeout(() => { try { this.joystickBase?.destroy() } catch(e){} }, 120) }
    if (this.joystickThumb) { this.tweens.add({ targets: this.joystickThumb, scale: 0, alpha: 0, duration: 120 }); setTimeout(() => { try { this.joystickThumb?.destroy() } catch(e){} }, 140) }
    this.joystickBase = null
    this.joystickThumb = null
    this.joystickRing = null
    this.joystickVector = { x: 0, y: 0 }
    this.joystickActive = false
    this.joystickPointerId = null
    this._joystickAtEdge = false
  }

  createInteractButton() {
    const btnSize = 58
    const pad = 18
    const x = this.scale.width - btnSize / 2 - pad
    const y = this.scale.height - btnSize / 2 - pad - 40 // 上移一点给菜单按钮留空间

    // 外发光
    const glow = this.add.circle(x, y, btnSize / 2 + 4, 0x6366f1, 0.15).setDepth(199).setScrollFactor(0)
    // 主体
    this.interactBtn = this.add.circle(x, y, btnSize / 2, 0x6366f1, 0.82)
      .setDepth(200).setScrollFactor(0).setInteractive({ useHandCursor: true })
    // 图标
    const label = this.add.text(x, y + 1, '💬', { fontSize: '26px' })
      .setOrigin(0.5).setDepth(201).setScrollFactor(0)

    // 触摸反馈区（比视觉更大，更容易点到）
    const hitArea = this.add.circle(x, y, btnSize / 2 + 10, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(198).setScrollFactor(0)

    // 动画
    this.interactBtn.on('pointerover', () => {
      this.tweens.add({ targets: [this.interactBtn, glow], scale: 1.12, alpha: 1, duration: 120, ease: 'Back.easeOut' })
    })
    this.interactBtn.on('pointerout', () => {
      this.tweens.add({ targets: [this.interactBtn, glow], scale: 1, alpha: 0.82, duration: 150 })
    })
    this.interactBtn.on('pointerdown', () => {
      this.tweens.add({ targets: this.interactBtn, scale: 0.92, duration: 60 })
      if (navigator.vibrate) navigator.vibrate(15)
      this.tryInteractWithNearby()
    })
    hitArea.on('pointerdown', () => {
      this.tryInteractWithNearby()
    })
  }

  createMenuButton() {
    const size = 44
    const pad = 14
    const x = this.scale.width - size / 2 - pad
    const y = size / 2 + pad + 20
    
    const glow = this.add.circle(x, y, size / 2 + 3, 0xffffff, 0.08).setDepth(199).setScrollFactor(0)
    this.menuBtn = this.add.circle(x, y, size / 2, 0x374151, 0.7)
      .setDepth(200).setScrollFactor(0).setInteractive({ useHandCursor: true })
    const icon = this.add.text(x, y, '☰', { fontSize: '20px' }).setOrigin(0.5).setDepth(201).setScrollFactor(0)
    const hit = this.add.circle(x, y, size / 2 + 8, 0x000000, 0).setInteractive({ useHandCursor: true }).setDepth(198).setScrollFactor(0)
    
    this.menuBtn.on('pointerover', () => {
      this.tweens.add({ targets: [this.menuBtn, glow], scale: 1.1, duration: 100 })
    })
    this.menuBtn.on('pointerout', () => {
      this.tweens.add({ targets: [this.menuBtn, glow], scale: 1, duration: 100 })
    })
    this.menuBtn.on('pointerdown', () => {
      this.showQuickMenu()
    })
    hit.on('pointerdown', () => { this.showQuickMenu() })
  }

  showQuickMenu() {
    if (this._quickMenu) { this._quickMenu.destroy(); this._quickMenu = null; return }
    
    const { width, height } = this.scale
    const menu = this.add.container(width - 10, 10).setDepth(500).setScrollFactor(0)
    this._quickMenu = menu
    
    // 菜单项
    const items = [
      { icon: '📋', label: '状态', action: () => this.events.emit('show_status') },
      { icon: '🗺️', label: '地图', action: () => this.showLocationPicker({ isExit: false }) },
      { icon: '⚙️', label: '设置', action: () => this.showSettings() },
      { icon: '💾', label: '存档', action: () => { this.world.save(); this.showEventNotification({ text: '✅ 游戏已保存', icon:'💾' }) } },
    ]
    
    const itemH = 44
    const menuH = items.length * itemH + 16
    const menuW = 130
    
    // 背景
    const bg = this.add.graphics()
    bg.fillStyle(0x18181b, 0.95)
    bg.fillRoundedRect(-menuW + 10, -10, menuW, menuH, 12)
    bg.lineStyle(1, 0x3f3f46, 0.5)
    bg.strokeRoundedRect(-menuW + 10, -10, menuW, menuH, 12)
    menu.add(bg)
    
    items.forEach((item, i) => {
      const iy = -6 + i * itemH
      const hit = this.add.rectangle(-menuW + 16, iy, menuW - 22, itemH - 4, 0x000000, 0)
        .setInteractive({ useHandCursor: true }).setScrollFactor(0)
      
      const txt = this.add.text(-menuW + 26, iy + itemH / 2 - 1, `${item.icon} ${item.label}`, {
        fontSize: '13px', color: '#d4d4d8'
      }).setOrigin(0, 0.5).setScrollFactor(0)
      
      menu.add(txt)
      menu.add(hit)
      
      hit.on('pointerover', () => {
        bg.clear()
        bg.fillStyle(0x27272a, 0.95)
        bg.fillRoundedRect(-menuW + 10, -10, menuW, menuH, 12)
        bg.lineStyle(1, 0x3f3f46, 0.5)
        bg.strokeRoundedRect(-menuW + 10, -10, menuW, menuH, 12)
        // 高亮当前行
        bg.fillStyle(0x3b3b42, 0.9)
        bg.fillRoundedRect(-menuW + 13, iy - 1, menuW - 16, itemH - 2, 6)
      })
      hit.on('pointerout', () => {
        bg.clear()
        bg.fillStyle(0x18181b, 0.95)
        bg.fillRoundedRect(-menuW + 10, -10, menuW, menuH, 12)
        bg.lineStyle(1, 0x3f3f46, 0.5)
        bg.strokeRoundedRect(-menuW + 10, -10, menuW, menuH, 12)
      })
      hit.on('pointerdown', () => {
        item.action()
        this._quickMenu.destroy()
        this._quickMenu = null
      })
    })
    
    // 点击外部关闭
    const overlay = this.add.rectangle(width * 2, height * 2, 0x000000, 0)
      .setInteractive().setDepth(498).setScrollFactor(0).setDepth(-1)
    overlay.on('pointerdown', () => {
      menu.destroy()
      this._quickMenu = null
      overlay.destroy()
    })
    menu.add(overlay)
    
    menu.setScale(0).setAlpha(0)
    this.tweens.add({ targets: menu, scaleX: 1, scaleY: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' })
  }

  createInteractButton() {
    const btnSize = 52
    const pad = 16
    const x = this.scale.width - btnSize / 2 - pad
    const y = this.scale.height - btnSize / 2 - pad

    this.interactBtn = this.add.circle(x, y, btnSize / 2, 0x6366f1, 0.8)
      .setDepth(200).setScrollFactor(0).setInteractive({ useHandCursor: true })

    const label = this.add.text(x, y, '💬', { fontSize: '24px' })
      .setOrigin(0.5).setDepth(201).setScrollFactor(0)

    this.interactBtn.on('pointerover', () => {
      this.tweens.add({ targets: this.interactBtn, scale: 1.1, alpha: 1, duration: 100 })
    })
    this.interactBtn.on('pointerout', () => {
      this.tweens.add({ targets: this.interactBtn, scale: 1, alpha: 0.8, duration: 100 })
    })
    this.interactBtn.on('pointerdown', () => {
      this.tryInteractWithNearby()
    })
  }

  update(time, delta) {
    if (!this.player || !this.player.body) return

    // === 移动处理 ===
    const speed = this.playerState.speed
    let vx = 0
    let vy = 0

    // 键盘输入
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1

    // 摇杆输入
    if (Math.abs(this.joystickVector.x) > 0.15 || Math.abs(this.joystickVector.y) > 0.15) {
      vx = this.joystickVector.x
      vy = this.joystickVector.y
    }

    // 归一化对角线速度
    if (vx !== 0 && vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy)
      vx /= len; vy /= len
    }

    // 应用速度
    this.player.setVelocity(vx * speed, vy * speed)

    // 更新朝向
    if (vx !== 0 || vy !== 0) {
      this.playerState.isMoving = true
      if (Math.abs(vx) > Math.abs(vy)) {
        const dir = vx > 0 ? 'right' : 'left'
        if (this.playerState.direction !== dir) {
          this.playerState.direction = dir
          this.player.setTexture(`player_${dir}`)
        }
      } else {
        const dir = vy > 0 ? 'down' : 'up'
        if (this.playerState.direction !== dir) {
          this.playerState.direction = dir
          this.player.setTexture(`player_${dir}`)
        }
      }
    } else {
      this.playerState.isMoving = false
    }

    // === NPC 名字标签跟随 ===
    for (const [id, sprite] of Object.entries(this.npcSprites)) {
      const tag = sprite.getData('nameTag')
      if (tag) tag.setPosition(sprite.x, sprite.y - 28)
      const dot = sprite.getData('relDot')
      if (dot && tag) dot.setPosition(sprite.x + tag.width / 2 + 6, sprite.y - 28)
    }

    // === 交互物跟随 ===
    for (const item of this.interactables) {
      if (!item.isExit && item.bubble && item.sprite) {
        item.bubble.setPosition(item.sprite.x, item.sprite.y - 24)
      }
    }

    // === 推进引擎时间 ===
    // 每 real-world second = game time advance
    // 由 World.update() 处理
  }

  setupWorldEvents() {
    // 监听引擎事件并渲染反馈
    this.world.on('time:advanced', ({ timeStr, dateStr }) => {
      this.events.emit('time:update', { timeStr, dateStr })
    })

    this.world.on('player:statChanged', ({ stat, value, oldValue }) => {
      this.events.emit('player:stat', { stat, value, oldValue })
    })

    this.world.on('event:triggered', (event) => {
      this.showEventNotification(event)
    })

    this.world.on('message', ({ text, type }) => {
      this.events.emit('game:message', { text, type })
    })
  }

  handleInteraction(obj) {
    console.log('Interaction:', obj)
    // 触发行动 — 通过事件传递给 UIScene 处理具体逻辑
    this.events.emit('action:request', {
      actionId: obj.actionId,
      actionName: obj.label,
      locationId: this.currentLocationId
    })
  }

  tryInteractWithNearby() {
    // 检测附近的可交互对象/NPC
    const range = 60
    const px = this.player.x
    const py = this.player.y

    // 检测NPC
    for (const [id, sprite] of Object.entries(this.npcSprites)) {
      const dist = Phaser.Math.Distance.Between(px, py, sprite.x, sprite.y)
      if (dist < range) {
        this.startDialogue(id)
        return
      }
    }

    // 检测交互物
    for (const item of this.interactables) {
      if (item.isExit) continue
      if (item.sprite) {
        const dist = Phaser.Math.Distance.Between(px, py, item.sprite.x, item.sprite.y)
        if (dist < range + 20) {
          this.handleInteraction(item.data)
          return
        }
      }
    }
  }

  startDialogue(npcId) {
    this.events.emit('dialogue:start', { npcId, locationId: this.currentLocationId })
  }

  transitionTo(locationId) {
    // 过渡动画
    this.cameras.main.fadeOut(300, 0, 15, 46)
    this.time.delayedCall(350, () => {
      // 重置玩家位置到入口点
      const loc = this.world.locations.getLocation(locationId)
      const entryPoint = loc?.entryPoint || { x: 240, y: 320 }
      this.player.setPosition(entryPoint.x, entryPoint.y)
      this.player.setTexture('player_down')

      // 加载新场景
      this.loadLocation(locationId)

      // 推进时间（通勤）
      const travelTime = 15 // 分钟
      this.world.time.advance(travelTime)

      // 触发到达事件
      const triggered = this.world.events.check(this.world.player, this.world.time, this.world.npcs)
      for (const evt of triggered) {
        this.showEventNotification(evt)
      }

      this.cameras.main.fadeIn(400)
    })
  }

  /**
   * 显示地点选择菜单 — 从当前出口选择要去哪里
   */
  showLocationPicker(exitObj) {
    const destinations = this.world.locations.getRecommendedDestinations(this.currentLocationId)
    if (destinations.length === 0) return

    // 关闭已有菜单
    if (this._locationMenu) {
      this._locationMenu.destroy()
      this._locationMenu = null
    }

    const { width, height } = this.scale
    const container = this.add.container(width / 2, height * 0.45)
      .setDepth(400).setScrollFactor(0)
    this._locationMenu = container

    // 半透明背景遮罩
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.5)
    overlay.fillRect(-width / 2, -height / 2, width, height)
    container.add(overlay)

    // 菜单面板背景
    const panelW = Math.min(320, width - 40)
    const panelH = 50 + destinations.length * 56 + 20
    const panelBg = this.add.graphics()
    panelBg.fillStyle(0x18181b, 0.97)
    panelBg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16)
    // 标题栏
    panelBg.fillStyle(0x6366f1, 1)
    panelBg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, 44, [16, 16, 0, 0])
    container.add(panelBg)

    // 标题
    const title = this.add.text(0, -panelH / 2 + 22, '🚪 去哪里？', {
      fontSize: '15px', color: '#ffffff', fontWeight: 'bold'
    }).setOrigin(0.5)
    container.add(title)

    // 地点按钮
    destinations.forEach((loc, i) => {
      const btnY = -panelH / 2 + 60 + i * 56

      // 按钮背景
      const btn = this.add.graphics()
      btn.fillStyle(0x27272a, 1)
      btn.fillRoundedRect(-panelW / 2 + 12, btnY, panelW - 24, 48, 10)
      container.add(btn)

      // 图标+名称
      const label = this.add.text(-panelW / 2 + 24, btnY + 24,
        `${loc.icon} ${loc.name}`, {
          fontSize: '14px', color: '#e4e4e7'
        }).setOrigin(0, 0.5)
      container.add(label)

      // 区域标签
      const areaNames = { oldtown: '老城区', cbd: 'CBD', downtown: '市中心', artdistrict: '文创区' }
      const areaTag = this.add.text(panelW / 2 - 24, btnY + 24,
        areaNames[loc.area] || '', {
          fontSize: '11px', color: '#a1a1aa'
        }).setOrigin(1, 0.5)
      container.add(areaTag)

      // 通勤时间
      const travelMin = this.world.locations.getTravelTime(this.currentLocationId, loc.id)
      const timeLabel = this.add.text(panelW / 2 - 24, btnY + 40,
        `⏱ ${travelMin}分钟`, {
          fontSize: '10px', color: '#71717a'
        }).setOrigin(1, 0.5)
      container.add(timeLabel)

      // 点击区域（透明可交互）
      const hitArea = this.add.rectangle(0, btnY + 24, panelW - 24, 48, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
      container.add(hitArea)

      hitArea.on('pointerover', () => {
        btn.clear()
        btn.fillStyle(0x3f3f46, 1)
        btn.fillRoundedRect(-panelW / 2 + 12, btnY, panelW - 24, 48, 10)
      })
      hitArea.on('pointerout', () => {
        btn.clear()
        btn.fillStyle(0x27272a, 1)
        btn.fillRoundedRect(-panelW / 2 + 12, btnY, panelW - 24, 48, 10)
      })
      hitArea.on('pointerdown', () => {
        container.destroy()
        this._locationMenu = null
        this.transitionTo(loc.id)
      })
    })

    // 取消按钮
    const cancelBtnY = panelH / 2 - 28
    const cancelHit = this.add.rectangle(0, cancelBtnY, 120, 36, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
    container.add(cancelHit)

    const cancelGfx = this.add.graphics()
    cancelGfx.fillStyle(0x3f3f46, 1)
    cancelGfx.fillRoundedRect(-60, cancelBtnY - 18, 120, 36, 8)
    container.add(cancelGfx)

    const cancelText = this.add.text(0, cancelBtnY, '取消', {
      fontSize: '13px', color: '#a1a1aa'
    }).setOrigin(0.5)
    container.add(cancelText)

    cancelHit.on('pointerover', () => {
      cancelGfx.clear()
      cancelGfx.fillStyle(0x52525b, 1)
      cancelGfx.fillRoundedRect(-60, cancelBtnY - 18, 120, 36, 8)
    })
    cancelHit.on('pointerout', () => {
      cancelGfx.clear()
      cancelGfx.fillStyle(0x3f3f46, 1)
      cancelGfx.fillRoundedRect(-60, cancelBtnY - 18, 120, 36, 8)
    })
    cancelHit.on('pointerdown', () => {
      container.destroy()
      this._locationMenu = null
    })

    // 弹出动画
    container.setScale(0.9).setAlpha(0)
    this.tweens.add({
      targets: container, scaleX: 1, scaleY: 1, alpha: 1,
      duration: 200, ease: 'Back.easeOut'
    })
  }

  showEventNotification(event) {
    const { width } = this.cameras.main
    const msg = event.text || event.name || '发生了一件事'

    // 浮动通知
    const container = this.add.container(width / 2, 80).setDepth(300).setScrollFactor(0)

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 0.75)
    bg.fillRoundedRect(-180, -20, 360, 40, 12)
    container.add(bg)

    const icon = this.add.text(-160, 0, event.icon || '📢', { fontSize: '18px' }).setOrigin(0, 0.5)
    const text = this.add.text(-130, 0, msg, {
      fontSize: '13px',
      color: '#ffffff',
      wordWrap: { width: 290 }
    }).setOrigin(0, 0.5)

    container.add(icon)
    container.add(text)

    // 动画
    container.setAlpha(0).setY(60)
    this.tweens.add({
      targets: container, alpha: 1, y: 80,
      duration: 300, ease: 'Back.easeOut'
    })
    this.tweens.add({
      targets: container, alpha: 0, y: 40,
      duration: 400, delay: 2500,
      onComplete: () => container.destroy()
    })
  }
}

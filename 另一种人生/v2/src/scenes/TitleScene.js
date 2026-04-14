/**
 * TitleScene — 标题画面 / 主菜单
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }

  create() {
    const { width, height } = this.cameras.main
    const cx = width / 2

    // 背景 — 渐变深蓝
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0f0c29, 0x0f0c29, 0x24243e, 0x24243e, 1)
    bg.fillRect(0, 0, width, height)
    // 粒子装饰（模拟星星）
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * width
      const y = Math.random() * height * 0.7
      const size = Math.random() * 2 + 0.5
      const alpha = Math.random() * 0.6 + 0.2
      const star = this.add.circle(x, y, size, 0xffffff, alpha)
      // 闪烁动画
      this.tweens.add({
        targets: star,
        alpha: alpha * 0.3,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000
      })
    }

    // 城市剪影（简单几何）
    this.drawCitySilhouette(width, height)

    // 标题
    const titleY = height * 0.25
    // 标题阴影
    this.add.text(cx + 2, titleY + 2, '另一种人生', {
      fontFamily: "'PingFang SC', sans-serif",
      fontSize: '42px', fontWeight: '800', color: '#00000044'
    }).setOrigin(0.5)

    // 标题主文字 — 渐变色模拟
    const titleText = this.add.text(cx, titleY, '另一种人生', {
      fontFamily: "'PingFang SC', sans-serif",
      fontSize: '42px', fontWeight: '800', color: '#ffffff'
    }).setOrigin(0.5)

    // 标题渐变动画效果
    this.tweens.add({
      targets: titleText,
      scaleX: 1.02, scaleY: 1.02,
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    })

    // 副标题
    this.add.text(cx, titleY + 48, '在别人的城市里，过自己的日子', {
      fontFamily: "'PingFang SC', sans-serif",
      fontSize: '15px', color: '#a5b4fc'
    }).setOrigin(0.5)

    // 版本号
    this.add.text(cx, titleY + 72, 'v2.0', {
      fontSize: '12px', color: '#6366f166'
    }).setOrigin(0.5)

    // 按钮
    const btnY = height * 0.58
    const btnGap = 56

    this.makeButton(cx, btnY, '🌅 开始新人生', () => this.startNewGame(), 'primary')
    this.makeButton(cx, btnY + btnGap, '📂 继续游戏', () => this.loadGame(), 'secondary')

    // 底部信息
    this.add.text(cx, height - 30, 'Phaser 3 Engine · Mobile First', {
      fontSize: '11px', color: '#4b556388'
    }).setOrigin(0.5)

    // 入场动画
    this.cameras.main.fadeIn(600, 0, 15, 46)
  }

  drawCitySilhouette(w, h) {
    const gfx = this.add.graphics()
    gfx.fillStyle(0x000000, 0.3)

    const baseY = h * 0.65
    // 随机建筑轮廓
    let x = 0
    while (x < w) {
      const bw = 20 + Math.random() * 40
      const bh = 40 + Math.random() * 100
      gfx.fillRect(x, baseY - bh, bw - 2, bh)
      // 窗户（随机亮灯）
      for (let wy = baseY - bh + 8; wy < baseY - 8; wy += 14) {
        for (let wx = x + 4; wx < x + bw - 6; wx += 10) {
          if (Math.random() > 0.4) {
            gfx.fillStyle(Math.random() > 0.5 ? 0xfbbf2466 : 0x00000000, 1)
            gfx.fillRect(wx, wy, 5, 7)
            gfx.fillStyle(0x000000, 0.3) // reset
          }
        }
      }
      x += bw
    }
    // 地面线
 gfx.fillStyle(0x000000, 0.2)
    gfx.fillRect(0, baseY, w, 4)
  }

  makeButton(x, y, label, callback, style = 'primary') {
    const colors = {
      primary: { fill: 0x6366f1, hover: 0x818cf8, text: '#ffffff' },
      secondary: { fill: 0x374151, hover: 0x4b5563, text: '#e5e7eb' }
    }
    const c = colors[style]

    const bg = this.add.graphics()
    bg.fillStyle(c.fill, 1)
    bg.fillRoundedRect(x - 120, y - 22, 240, 44, 14)

    const text = this.add.text(x, y, label, {
      fontFamily: "'PingFang SC', sans-serif",
      fontSize: '17px', fontWeight: '600', color: c.text
    }).setOrigin(0.5)

    // 交互区域（透明按钮用于接收输入）
    const hitArea = this.add.zone(x, y, 240, 44).setInteractive({ useHandCursor: true })
    hitArea.on('pointerover', () => {
      bg.clear()
      bg.fillStyle(c.hover, 1)
      bg.fillRoundedRect(x - 120, y - 22, 240, 44, 14)
      this.tweens.add({ targets: [bg], scale: 1.02, duration: 150 })
    })
    hitArea.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(c.fill, 1)
      bg.fillRoundedRect(x - 120, y - 22, 240, 44, 14)
      this.tweens.add({ targets: [bg], scale: 1, duration: 150 })
    })
    hitArea.on('pointerdown', () => {
      this.tweens.add({ targets: [bg], scaleX: 0.97, scaleY: 0.97, duration: 80, yoyo: true })
    })
    hitArea.on('pointerup', callback)

    return { bg, text, hitArea }
  }

  startNewGame() {
    this.cameras.main.fadeOut(400, 0, 15, 46)
    this.time.delayedCall(400, () => {
      this.scene.start('WorldScene', { loadSave: false })
      this.scene.launch('UIScene')
      this.scene.launch('DialogueScene')
    })
  }

  loadGame() {
    // 检查是否有存档
    const hasSave = !!localStorage.getItem('alife_v2_save_0')
    if (!hasSave) {
      this.showNotification('❌ 没有找到存档')
      return
    }
    this.cameras.main.fadeOut(400, 0, 15, 46)
    this.time.delayedCall(400, () => {
      this.scene.start('WorldScene', { loadSave: true })
      this.scene.launch('UIScene')
      this.scene.launch('DialogueScene')
    })
  }

  showNotification(text) {
    const { width, height } = this.cameras.main
    const msg = this.add.text(width / 2, height * 0.75, text, {
      fontSize: '14px', color: '#fca5a5',
      backgroundColor: '#00000088',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: msg, alpha: 1, duration: 200 })
    this.tweens.add({ targets: msg, alpha: 0, duration: 300, delay: 2000, onComplete: () => msg.destroy() })
  }
}

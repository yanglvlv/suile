/**
 * BootScene — 预加载资源 (插画版)
 * 加载AI生成的场景插画 + 程序化生成少量UI纹理
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const { width, height } = this.cameras.main

    // 背景
    const bgGrad = this.add.graphics()
    bgGrad.fillGradientStyle(0x0f0a1e, 0x0f0a1e, 0x1a1035, 0x1a1035, 1)
    bgGrad.fillRect(0, 0, width, height)

    // 进度条
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x1a1a2e, 0.9)
    progressBox.fillRoundedRect(width * 0.2, height * 0.48, width * 0.6, 24, 12)

    const title = this.add.text(width / 2, height * 0.38, '另一种人生', {
      fontSize: '28px', color: '#e2e8f0', fontFamily: 'sans-serif', fontStyle: 'bold'
    }).setOrigin(0.5)

    const subtitle = this.add.text(width / 2, height * 0.43, '加载中...', {
      fontSize: '13px', color: '#94a3b8'
    }).setOrigin(0.5)

    const progressBar = this.add.graphics()
    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillGradientStyle(0x6366f1, 0x8b5cf6, 0xa78bfa, 0xc4b5fd, 1)
      progressBar.fillRoundedRect(width * 0.22, height * 0.49, (width * 0.56) * value, 16, 8)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      title.destroy()
      subtitle.destroy()
      bgGrad.destroy()
    })

    // === 加载AI场景插画 ===
    this.load.image('bg_home', 'assets/home.png')
    this.load.image('bg_home2', 'assets/home2.png')
    this.load.image('bg_cafe', 'assets/cafe.png')
    this.load.image('bg_cafe2', 'assets/cafe2.png')
    this.load.image('bg_office', 'assets/office.png')
    this.load.image('bg_park', 'assets/park.png')
    this.load.image('bg_gym', 'assets/gym.png')
    this.load.image('bg_library', 'assets/library.png')
    this.load.image('bg_store', 'assets/store.png')
    this.load.image('bg_citymap', 'assets/citymap.png')

    // === 程序化生成必要纹理 ===
    this.createMinimalTextures()
  }

  createMinimalTextures() {
    const gfx = this.add.graphics()

    // === 玩家标记（简约圆形头像） ===
    gfx.clear()
    gfx.fillStyle(0x000000, 0.2)
    gfx.fillCircle(20, 22, 16) // 阴影
    gfx.fillStyle(0x6366f1, 1)
    gfx.fillCircle(20, 20, 16) // 主体
    gfx.fillStyle(0xffffff, 0.2)
    gfx.fillCircle(16, 16, 8)  // 高光
    gfx.fillStyle(0xffffff, 1)
    gfx.fillCircle(15, 17, 2)  // 左眼
    gfx.fillCircle(25, 17, 2)  // 右眼
    gfx.fillStyle(0xfca5a5, 1)
    gfx.fillRect(17, 23, 6, 2) // 嘴
    gfx.generateTexture('player_down', 40, 40)
    gfx.generateTexture('player_up', 40, 40)
    gfx.generateTexture('player_left', 40, 40)
    gfx.generateTexture('player_right', 40, 40)

    // === NPC标记（各色圆形头像）===
    const npcConfigs = {
      xiaowang: { color: 0x3b82f6, name: '王' },
      linxi:    { color: 0xec4899, name: '夕' },
      zhangge:  { color: 0x374151, name: '张' },
      laochen:  { color: 0xf59e0b, name: '陈' },
      meimei:   { color: 0xef4444, name: '美' },
      dawei:    { color: 0x22c55e, name: '卫' },
      lili:     { color: 0x8b5cf6, name: '莉' },
      afei:     { color: 0xf97316, name: '飞' }
    }
    for (const [id, cfg] of Object.entries(npcConfigs)) {
      gfx.clear()
      gfx.fillStyle(0x000000, 0.2)
      gfx.fillCircle(20, 22, 16)
      gfx.fillStyle(cfg.color, 1)
      gfx.fillCircle(20, 20, 16)
      gfx.fillStyle(0xffffff, 0.15)
      gfx.fillCircle(16, 16, 8)
      gfx.fillStyle(0xffffff, 1)
      gfx.fillCircle(15, 17, 2)
      gfx.fillCircle(25, 17, 2)
      gfx.fillStyle(0xfca5a5, 1)
      gfx.fillRect(17, 23, 6, 2)
      gfx.generateTexture(`npc_${id}`, 40, 40)
    }

    // === 交互气泡 ===
    gfx.clear()
    gfx.fillStyle(0xffffff, 0.95)
    gfx.fillCircle(16, 14, 12)
    gfx.fillTriangle(10, 22, 16, 18, 22, 22)
    gfx.fillStyle(0x6366f1, 1)
    gfx.fillCircle(11, 13, 2)
    gfx.fillCircle(16, 13, 2)
    gfx.fillCircle(21, 13, 2)
    gfx.generateTexture('interact_bubble', 32, 28)

    // === 出口图标 ===
    gfx.clear()
    gfx.fillStyle(0x22c55e, 0.9)
    gfx.fillRoundedRect(0, 0, 28, 28, 8)
    gfx.fillStyle(0xffffff, 1)
    gfx.fillTriangle(18, 14, 10, 8, 10, 20)
    gfx.fillRect(6, 11, 6, 6)
    gfx.generateTexture('exit_icon', 28, 28)

    // === 交互热区高亮 ===
    gfx.clear()
    gfx.fillStyle(0x6366f1, 0.15)
    gfx.fillCircle(24, 24, 24)
    gfx.lineStyle(2, 0x6366f1, 0.4)
    gfx.strokeCircle(24, 24, 22)
    gfx.generateTexture('hotspot', 48, 48)

    gfx.destroy()
    this.registry.set('assetsReady', true)
  }

  create() {
    this.scene.start('TitleScene')
  }
}

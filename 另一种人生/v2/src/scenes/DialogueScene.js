/**
 * DialogueScene — 对话覆盖层
 * 全屏半透明遮罩 + 对话框
 */
export class DialogueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogueScene' })
    this.isActive = false
  }

  create() {
    this.worldScene = this.scene.get('WorldScene')
    this.uiScene = this.scene.get('UIScene')

    // 监听对话事件
    this.worldScene.events.on('dialogue:start', ({ npcId, locationId }) => {
      this.openDialogue(npcId)
    })
  }

  openDialogue(npcId) {
    if (this.isActive) return
    this.isActive = true

    const { width, height } = this.cameras.main
    const world = this.worldScene.world
    const npc = world.npcs.getNPC(npcId)

    // === 半透明背景遮罩 ===
    this.maskBg = this.add.graphics()
    this.maskBg.fillStyle(0x000000, 0.5)
    this.maskBg.fillRect(0, 0, width, height)
    this.maskBg.setInteractive() // 点击遮罩关闭
    this.maskBg.setDepth(500).setScrollFactor(0)
    this.maskBg.on('pointerdown', () => this.closeDialogue())

    // === 对话框主体 ===
    const boxW = Math.min(width - 32, 420)
    const boxH = 300
    const boxX = (width - boxW) / 2
    const boxY = height - boxH - 20

    this.dialogBox = this.add.container(boxX, boxY).setDepth(501).setScrollFactor(0)

    // 对话框背景
    const bg = this.add.graphics()
    bg.fillStyle(0xffffff, 0.97)
    bg.fillRoundedRect(0, 0, boxW, boxH, 16)
    this.dialogBox.add(bg)

    // NPC 头像区域
    const avatarCircle = this.add.graphics()
    avatarCircle.fillStyle(0xf1f5f9, 1)
    avatarCircle.fillCircle(44, 40, 30)
    this.dialogBox.add(avatarCircle)

    // NPC 头像（使用 NPC 纹理）
    try {
      const avatar = this.add.image(44, 40, `npc_${npcId}`).setScale(1.8)
      this.dialogBox.add(avatar)
    } catch (e) {
      const avatarText = this.add.text(44, 40, npc?.avatar || '👤', { fontSize: '28px' }).setOrigin(0.5)
      this.dialogBox.add(avatarText)
    }

    // NPC 名字
    const nameText = this.add.text(84, 18, npc?.name || '???', {
      fontSize: '16px', fontWeight: '700', color: '#1e293b'
    }).setOrigin(0, 0)
    this.dialogBox.add(nameText)

    // 关系标签
    const rel = world.npcs.getRelationLabel(npcId)
    const relColors = { stranger: '#94a3b8', acquaintance: '#f59e0b', friend: '#22c55e', closeFriend: '#ec4899' }
    const relText = this.add.text(84, 38, rel, {
      fontSize: '11px', color: relColors[world.npcs.npcs[npcId]?.relationLevel] || '#94a3b8'
    }).setOrigin(0, 0)
    this.dialogBox.add(relText)

    // 分隔线
    const line = this.add.graphics()
    line.lineStyle(1, 0xe2e8f0, 1)
    line.lineBetween(16, 64, boxW - 16, 64)
    this.dialogBox.add(line)

    // 对话文本区域
    const textBg = this.add.graphics()
    textBg.fillStyle(0xf8fafc, 1)
    textBg.fillRoundedRect(12, 74, boxW - 24, 110, 10)
    this.dialogBox.add(textBg)

    this.dialogueText = this.add.text(boxW / 2, 130, '', {
      fontSize: '13px', color: '#334155',
      lineHeight: 22,
      wordWrap: { width: boxW - 48 },
      align: 'left'
    }).setOrigin(0.5)
    this.dialogBox.add(this.dialogueText)

    // 选择项容器
    this.choicesContainer = this.add.container(0, 196)
    this.dialogBox.add(this.choicesContainer)

    // 获取对话树内容并显示
    this.showDialogueContent(npcId, world)

    // 入场动画
    this.dialogBox.setY(height)
    this.tweens.add({
      targets: this.dialogBox,
      y: boxY,
      duration: 350,
      ease: 'Back.easeOut.config(1.2)'
    })
  }

  showDialogueContent(npcId, world) {
    const npc = world.npcs.getNPC(npcId)
    if (!npc) return

    // 获取动态开场白
    const greeting = world.npcs.getDynamicGreeting(npcId, world.player, world.time)
    
    // 打字机效果显示文本
    this.typewriterText(greeting, () => {
      // 文本显示完毕后，显示选择项
      this.showChoices(npcId, world)
    })
  }

  typewriterText(text, onComplete) {
    this.currentText = text
    this.charIndex = 0
    this.dialogueText.setText('')
    this.typewriterTimer = this.time.addEvent({
      delay: 30,
      callback: () => {
        this.charIndex++
        if (this.charIndex <= text.length) {
          this.dialogueText.setText(text.slice(0, this.charIndex))
        } else {
          this.typewriterTimer.remove(false)
          if (onComplete) onComplete()
        }
      },
      repeat: text.length
    })

    // 点击跳过打字机效果
    const skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    const skipOnce = () => {
      if (this.typewriterTimer) {
        this.typewriterTimer.remove(false)
        this.dialogueText.setText(text)
        if (onComplete) onComplete()
      }
    }

    this.dialogueText.setInteractive()
    this.dialogueText.once('pointerdown', skipOnce)
    this.input.keyboard.once('keydown-SPACE', skipOnce)
  }

  showChoices(npcId, world) {
    this.choicesContainer.removeAll(true)

    // 基础互动选项
    const choices = [
      { id: 'chat', label: '💬 聊聊天', desc: '闲聊最近的事' },
      { id: 'deepTalk', label: '🗣️ 深入交流', desc: '聊聊更深层的话题' },
      { id: 'treat', label: '🍽️ 请客吃饭', desc: '$80 · 加深关系', cost: 80 },
      { id: 'gift', label: '🎁 送礼物', desc: '$50 · 表达心意', cost: 50 },
      { id: 'hangout', label: '🎮 一起玩', desc: '出去逛逛' },
      { id: 'leave', label: '👋 先这样', desc: '告辞离开' }
    ]

    choices.forEach((choice, i) => {
      const choiceY = i * 46
      const boxW = this.dialogBox.first.width - 24

      const btnGfx = this.add.graphics().setInteractive({ useHandCursor: true })
      btnGfx.fillStyle(0xf1f5f9, 1)
      btnGfx.fillRoundedRect(0, choiceY, boxW, 40, 10)
      this.choicesContainer.add(btnGfx)

      const labelText = this.add.text(14, choiceY + 8, choice.label, {
        fontSize: '13px', fontWeight: '600', color: '#1e293b'
      })
      const descText = this.add.text(14, choiceY + 25, choice.desc, {
        fontSize: '10px', color: '#94a3b8'
      })
      
      if (choice.cost) {
        const costText = this.add.text(boxW - 14, choiceY + 17, `$${choice.cost}`, {
          fontSize: '11px', color: '#ef4444', fontWeight: '600'
        }).setOrigin(1, 0.5)
        this.choicesContainer.add(costText)
      }

      this.choicesContainer.add([labelText, descText])

      // hover 效果
      btnGfx.on('pointerover', () => {
        btnGfx.clear()
        btnGfx.fillStyle(0x6366f1, 0.08)
        btnGfx.fillRoundedRect(0, choiceY, boxW, 40, 10)
      })
      btnGfx.on('pointerout', () => {
        btnGfx.clear()
        btnGfx.fillStyle(0xf1f5f9, 1)
        btnGfx.fillRoundedRect(0, choiceY, boxW, 40, 10)
      })
      btnGfx.on('pointerdown', () => {
        if (choice.id === 'leave') {
          this.closeDialogue()
        } else {
          this.executeChoice(npcId, choice.id, world)
        }
      })
    })
  }

  executeChoice(npcId, choiceType, world) {
    // 执行互动
    world.interactNPC(npcId, choiceType)
    const npc = world.npcs.getNPC(npcId)

    // 更新关系标签
    const newRel = world.npcs.getRelationLabel(npcId)

    // 显示结果文本
    const resultMsgs = world.messages.slice(-3).map(m => m.text).join('\n') || '...'
    
    this.choicesContainer.removeAll(true)
    this.typewriterText(resultMsgs, () => {
      // 显示后续选项：继续 / 离开
      this.choicesContainer.removeAll(true)
      const boxW = this.dialogBox.first.width - 24
      
      const contBtn = this.add.graphics().setInteractive({ useHandCursor: true })
      contBtn.fillStyle(0x6366f1, 0.1)
      contBtn.fillRoundedRect(0, 0, boxW, 40, 10)
      this.choicesContainer.add(contBtn)
      
      const contText = this.add.text(boxW / 2, 20, '💬 继续聊', {
        fontSize: '13px', fontWeight: '600', color: '#6366f1'
      }).setOrigin(0.5)
      this.choicesContainer.add(contText)
      
      const leaveBtn = this.add.graphics().setInteractive({ useHandCursor: true })
      leaveBtn.fillStyle(0xf1f5f9, 1)
      leaveBtn.fillRoundedRect(0, 48, boxW, 40, 10)
      this.choicesContainer.add(leaveBtn)
      
      const leaveText = this.add.text(boxW / 2, 68, '👋 离开', {
        fontSize: '13px', color: '#64748b'
      }).setOrigin(0.5)
      this.choicesContainer.add(leaveText)

      contBtn.on('pointerdown', () => this.showDialogueContent(npcId, world))
      leaveBtn.on('pointerdown', () => this.closeDialogue())
    })
  }

  closeDialogue() {
    if (!this.isActive) return
    this.isActive = false

    // 出场动画
    this.tweens.add({
      targets: this.dialogBox,
      y: this.cameras.main.height + 50,
      duration: 250,
      ease: 'Back.easeIn'
    })
    this.tweens.add({
      targets: this.maskBg,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.cleanup()
      }
    })
  }

  cleanup() {
    // 清理所有动态创建的对象
    if (this.maskBg) this.maskBg.destroy()
    if (this.dialogBox) this.dialogBox.destroy(true)
    if (this.typewriterTimer) this.typewriterTimer.remove(false)
    this.maskBg = null
    this.dialogBox = null
  }
}

/**
 * 「另一种人生」v2 — 游戏入口
 */
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { TitleScene } from './scenes/TitleScene.js'
import { WorldScene } from './scenes/WorldScene.js'
import { UIScene } from './scenes/UIScene.js'
import { DialogueScene } from './scenes/DialogueScene.js'

const dbg = document.getElementById('debug-log')
function log(msg) {
  if (dbg) { dbg.style.display = 'block'; dbg.innerHTML += msg + '<br>'; dbg.scrollTop = dbg.scrollHeight }
  console.log(msg)
}

log('✅ All modules loaded')
log('Phaser ' + Phaser.VERSION)

try {
  const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 450,
    height: 800,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      min: { width: 320, height: 568 },
      max: { width: 600, height: 1000 }
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: false
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 0 }, debug: false }
    },
    input: {
      activePointers: 3,
      touch: { capture: true, target: null }
    },
    scene: [BootScene, TitleScene, WorldScene, UIScene, DialogueScene]
  }

  const game = new Phaser.Game(config)
  window.game = game
  log('🎮 Game created!')
} catch(e) {
  log('❌ ' + e.message)
  console.error(e)
}

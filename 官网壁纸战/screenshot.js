const puppeteer = require('puppeteer');
const path = require('path');

const BASE = 'file://' + path.resolve(__dirname);
const OUT = path.join(__dirname, 'screenshots');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // ==================== 前台页面截图 ====================

  // 1. 整体首屏（导航 + Banner + Tab）
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/01-首屏全貌.png`, fullPage: false });

  // 2. 顶部导航栏（裁剪顶部区域）
  await page.screenshot({
    path: `${OUT}/02-顶部导航栏.png`,
    clip: { x: 0, y: 0, width: 1440, height: 80 }
  });

  // 3. Hero Banner 轮播区
  await page.screenshot({
    path: `${OUT}/03-Banner轮播区.png`,
    clip: { x: 0, y: 60, width: 1440, height: 400 }
  });

  // 4. 二级分类Tab + 投稿入口横幅
  await page.screenshot({
    path: `${OUT}/04-分类Tab与投稿入口.png`,
    clip: { x: 0, y: 455, width: 1440, height: 140 }
  });

  // 5. 壁纸卡片网格（桌面端3列）
  await page.screenshot({
    path: `${OUT}/05-壁纸卡片网格.png`,
    clip: { x: 0, y: 590, width: 1440, height: 520 }
  });

  // 6. 同人画廊卡片（带作者头像） - 切换到同人分类再截图
  await page.click('#mainNav .main-nav-item:nth-child(2)'); // 点击"同人画廊"
  await page.waitForTimeout(800);
  await page.screenshot({
    path: `${OUT}/06-同人画廊卡片.png`,
    clip: { x: 0, y: 510, width: 1440, height: 480 }
  });

  // 7. 预览弹窗 - 打开第一张壁纸的预览
  await page.evaluate(() => {
    currentList = DATA.wallpapers.filter(w => w.catId === 2 && w.status).sort((a,b) => a.sort - b.sort);
    openPreview(0); // 打开同人画廊第1张
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/07-预览弹窗-全景.png`, fullPage: false });

  // 8. 预览弹窗 - 侧栏下载面板特写
  await page.screenshot({
    path: `${OUT}/08-预览弹窗-下载面板.png`,
    clip: { x: 1050, y: 120, width: 360, height: 700 }
  });

  // 9. 预览弹窗 - 缩放控件 + 显示原图按钮
  await page.screenshot({
    path: `${OUT}/09-预览弹窗-缩放控件.png`,
    clip: { x: 40, y: 120, width: 1000, height: 620 }
  });

  // 10. 分页器
  await page.evaluate(() => closePreview()); // 关闭弹窗
  await page.screenshot({
    path: `${OUT}/10-分页器.png`,
    clip: { x: 500, y: 970, width: 440, height: 60 }
  });

  // 11. 投稿规则弹窗 - 切回官方壁纸，打开投稿弹窗
  await page.click('#mainNav .main-nav-item:nth-child(1)'); // 回到官方壁纸
  await page.waitForTimeout(500);
  // 先切到同人画廊显示投稿入口
  await page.click('#mainNav .main-nav-item:nth-child(2)');
  await page.waitForTimeout(500);
  await page.evaluate(() => openSubmitModal());
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/11-投稿规则弹窗.png`, fullPage: false });
  await page.evaluate(() => closeSubmitModal());

  // 12. 移动端响应式 (768px)
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/12-移动端适配.png`, fullPage: false });


  // ==================== 后台管理截图 ====================
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto(`${BASE}/admin.html`, { waitUntil: 'networkidle0', timeout: 15000 });
  await page.waitForTimeout(1000);

  // 13. 后台整体布局
  await page.screenshot({ path: `${OUT}/13-后台整体布局.png`, fullPage: false });

  // 14. Banner 管理列表
  await page.screenshot({
    path: `${OUT}/14-Banner管理列表.png`,
    clip: { x: 220, y: 60, width: 1220, height: 560 }
  });

  // 15. 分类管理
  await page.evaluate(() => switchTab('category'));
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${OUT}/15-分类管理.png`,
    clip: { x: 220, y: 60, width: 1220, height: 560 }
  });

  // 16. 壁纸管理列表
  await page.evaluate(() => switchTab('wallpaper'));
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${OUT}/16-壁纸管理列表.png`,
    clip: { x: 220, y: 60, width: 1220, height: 560 }
  });

  // 17. 壁纸编辑弹窗 - 点击新增
  await page.evaluate(() => handleAdd());
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/17-壁纸编辑弹窗.png`, fullPage: false });

  // 18. 投稿配置
  await page.evaluate(() => closeAdminModal());
  await page.evaluate(() => switchTab('submit'));
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${OUT}/18-投稿配置.png`,
    clip: { x: 220, y: 60, width: 1220, height: 620 }
  });


  console.log('\n✅ All screenshots saved to:', OUT);
  console.log('Total: 18 images\n');

  await browser.close();
})();

# 后台管理系统表格数据导出工具

## 使用说明

提供两个脚本，用于从后台管理系统页面导出表格数据为 CSV 文件。

### 脚本 1：`export_table.js` — 单页导出

适用于只需要导出当前页数据的场景。

**使用步骤：**
1. 在浏览器中打开目标后台页面
2. 按 `F12`（Mac 上 `Cmd + Option + I`）打开开发者工具
3. 切换到 **Console（控制台）** 标签
4. 复制 `export_table.js` 中的全部代码
5. 粘贴到控制台中，按 **回车** 执行
6. 浏览器会自动下载一个 CSV 文件

### 脚本 2：`export_table_all_pages.js` — 自动翻页全量导出

适用于数据有多页，需要自动翻页采集所有数据的场景。

**使用步骤：**
同上，只需将 `export_table_all_pages.js` 的代码粘贴到控制台执行即可。
脚本会自动点击"下一页"按钮，逐页采集数据，最后合并导出。

## 兼容性

脚本兼容以下常见后台 UI 框架：
- Element UI / Element Plus
- Ant Design / Ant Design Vue
- iView / View Design
- Arco Design
- 原生 HTML `<table>`

## 注意事项

- 如果表格列数与预设不一致，脚本会自动检测表头
- 导出的 CSV 文件默认使用 UTF-8 编码（带 BOM），Excel 可直接打开中文不乱码
- 如果需要 Excel 格式（.xlsx），可以用 Excel 打开 CSV 后另存为 xlsx
- 翻页脚本默认每页等待 1.5 秒，如果网络较慢可以调整 `CONFIG.pageLoadWait` 的值

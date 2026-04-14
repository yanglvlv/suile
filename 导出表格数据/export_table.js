/**
 * 后台管理系统表格数据导出脚本
 * 
 * 使用方法：
 * 1. 在浏览器中打开目标页面
 * 2. 按 F12 打开开发者工具 -> Console（控制台）
 * 3. 将此脚本粘贴到控制台中，按回车执行
 * 4. 自动下载 CSV 文件
 * 
 * 如果表格有多页，需要翻页后重复执行（或使用下方的自动翻页版本）
 */

(function exportTableToCSV() {
  'use strict';

  // ========== 配置区域 ==========
  const CONFIG = {
    // 表格选择器（按优先级尝试，兼容常见后台框架）
    tableSelectors: [
      'table',                          // 通用 table
      '.el-table__body',                // Element UI
      '.ant-table-tbody',               // Ant Design
      '.ivu-table-body table',          // iView
      '.arco-table-body table',         // Arco Design
    ],
    // 表头选择器
    headerSelectors: [
      'thead tr th',
      '.el-table__header th',
      '.ant-table-thead th',
      '.ivu-table-header th',
      '.arco-table-header th',
    ],
    // 行选择器
    rowSelectors: [
      'tbody tr',
      '.el-table__body tbody tr',
      '.ant-table-tbody tr',
      '.ivu-table-body tbody tr',
      '.arco-table-body tbody tr',
    ],
    // 导出文件名
    fileName: `表格数据导出_${new Date().toISOString().slice(0, 10)}.csv`,
    // CSV 分隔符
    separator: ',',
  };

  // ========== 工具函数 ==========
  
  // 获取元素文本（去除多余空白）
  function getText(el) {
    if (!el) return '';
    // 优先取 innerText，更接近视觉呈现
    let text = (el.innerText || el.textContent || '').trim();
    // 去除换行和多余空格
    text = text.replace(/\s+/g, ' ');
    return text;
  }

  // CSV 转义
  function escapeCSV(str) {
    if (!str) return '';
    str = String(str);
    // 如果包含逗号、双引号、换行，需要用双引号包裹
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // 尝试多个选择器
  function queryAll(selectors, context) {
    context = context || document;
    for (const selector of selectors) {
      const elements = context.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        return Array.from(elements);
      }
    }
    return [];
  }

  // ========== 主逻辑 ==========

  // 1. 获取表头
  let headers = queryAll(CONFIG.headerSelectors);
  let headerTexts = headers
    .map(th => getText(th))
    .filter(t => t && t !== '操作'); // 可选：过滤掉"操作"列

  console.log(`📋 找到 ${headerTexts.length} 个表头列:`, headerTexts);

  if (headerTexts.length === 0) {
    // 尝试从截图中的已知列名手动设置
    headerTexts = [
      '活动ID', '活动状态', '活动概要', '合计服务商数', '供应商数据数',
      '合同状态', '结算状态', '发票总数', '上游订单号', '上游下单金额',
      '上游锁定金额', '付款金额', '活动标签', '活动创建人'
    ];
    console.log('⚠️ 未自动检测到表头，使用预设表头');
  }

  // 2. 获取数据行
  let rows = queryAll(CONFIG.rowSelectors);
  console.log(`📊 找到 ${rows.length} 行数据`);

  if (rows.length === 0) {
    console.error('❌ 未找到表格数据行！请检查页面是否加载完成，或尝试调整选择器。');
    
    // 最后尝试：直接找所有 table
    const allTables = document.querySelectorAll('table');
    if (allTables.length > 0) {
      console.log(`🔍 页面共有 ${allTables.length} 个 table 元素，尝试最大的那个...`);
      let maxTable = allTables[0];
      let maxRows = 0;
      allTables.forEach(t => {
        const r = t.querySelectorAll('tbody tr').length;
        if (r > maxRows) { maxRows = r; maxTable = t; }
      });
      rows = Array.from(maxTable.querySelectorAll('tbody tr'));
      if (headerTexts.length === 0) {
        headers = Array.from(maxTable.querySelectorAll('thead th'));
        headerTexts = headers.map(th => getText(th));
      }
      console.log(`✅ 使用最大表格，找到 ${rows.length} 行`);
    }
    
    if (rows.length === 0) {
      alert('未找到表格数据，请确认页面已加载完成后重试');
      return;
    }
  }

  // 3. 提取数据
  const data = [];
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 0) return; // 跳过空行
    
    const rowData = [];
    cells.forEach((cell, cellIndex) => {
      // 跳过最后一列（操作列）
      // 如果需要保留，删掉这个判断
      const text = getText(cell);
      rowData.push(text);
    });
    
    if (rowData.some(d => d)) { // 至少有一个非空值
      data.push(rowData);
    }
  });

  console.log(`✅ 成功提取 ${data.length} 行数据`);

  // 4. 生成 CSV
  let csvContent = '';
  
  // 添加 BOM 头（确保 Excel 正确识别 UTF-8 中文）
  const BOM = '\uFEFF';
  
  // 表头行
  csvContent += headerTexts.map(h => escapeCSV(h)).join(CONFIG.separator) + '\n';
  
  // 数据行
  data.forEach(row => {
    csvContent += row.map(cell => escapeCSV(cell)).join(CONFIG.separator) + '\n';
  });

  // 5. 下载文件
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = CONFIG.fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);

  console.log(`🎉 导出完成！文件名: ${CONFIG.fileName}`);
  console.log(`📊 共导出 ${headerTexts.length} 列 × ${data.length} 行`);
})();

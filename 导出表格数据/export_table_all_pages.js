/**
 * 自动翻页版 - 表格数据导出脚本
 * 
 * 适用于数据有多页的情况，会自动点击"下一页"并收集所有数据
 * 
 * 使用方法：同 export_table.js，粘贴到控制台执行即可
 */

(async function exportAllPagesToCSV() {
  'use strict';

  // ========== 配置区域 ==========
  const CONFIG = {
    fileName: `表格数据全量导出_${new Date().toISOString().slice(0, 10)}.csv`,
    separator: ',',
    // 翻页按钮选择器（兼容常见 UI 框架）
    nextPageSelectors: [
      '.el-pagination .btn-next:not(.disabled):not([disabled])',    // Element UI
      '.ant-pagination-next:not(.ant-pagination-disabled) button',  // Ant Design
      '.ivu-page-next:not(.ivu-page-disabled)',                     // iView
      '.arco-pagination-item-next:not(.arco-pagination-item-disabled)', // Arco
      'button.next-page:not(:disabled)',                             // 通用
      'a.next:not(.disabled)',                                       // 通用链接式
    ],
    // 每页加载等待时间（毫秒）
    pageLoadWait: 1500,
    // 最大页数限制（防止死循环）
    maxPages: 100,
  };

  // ========== 工具函数 ==========
  function getText(el) {
    if (!el) return '';
    return (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  }

  function escapeCSV(str) {
    if (!str) return '';
    str = String(str);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function findNextPageButton() {
    for (const selector of CONFIG.nextPageSelectors) {
      const btn = document.querySelector(selector);
      if (btn) return btn;
    }
    return null;
  }

  // 获取当前页表格数据
  function getCurrentPageData() {
    // 找表格
    const table = document.querySelector('table') || 
                  document.querySelector('.el-table__body') ||
                  document.querySelector('.ant-table-tbody');
    
    if (!table) return [];
    
    const rows = table.querySelectorAll('tbody tr');
    const pageData = [];
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 0) return;
      const rowData = Array.from(cells).map(cell => getText(cell));
      if (rowData.some(d => d)) {
        pageData.push(rowData);
      }
    });
    
    return pageData;
  }

  // 获取表头
  function getHeaders() {
    const selectors = [
      'thead tr th', '.el-table__header th', '.ant-table-thead th'
    ];
    for (const sel of selectors) {
      const ths = document.querySelectorAll(sel);
      if (ths.length > 0) {
        return Array.from(ths).map(th => getText(th)).filter(Boolean);
      }
    }
    // 默认表头
    return [
      '活动ID', '活动状态', '活动概要', '合计服务商数', '供应商数据数',
      '合同状态', '结算状态', '发票总数', '上游订单号', '上游下单金额',
      '上游锁定金额', '付款金额', '活动标签', '活动创建人', '操作'
    ];
  }

  // ========== 主逻辑 ==========
  console.log('🚀 开始导出所有页面数据...');
  
  const allData = [];
  const headers = getHeaders();
  let pageNum = 1;

  while (pageNum <= CONFIG.maxPages) {
    console.log(`📄 正在读取第 ${pageNum} 页...`);
    
    const pageData = getCurrentPageData();
    console.log(`   第 ${pageNum} 页有 ${pageData.length} 行数据`);
    allData.push(...pageData);

    // 查找下一页按钮
    const nextBtn = findNextPageButton();
    if (!nextBtn) {
      console.log('📍 没有更多页了（未找到下一页按钮）');
      break;
    }

    // 点击下一页
    nextBtn.click();
    await sleep(CONFIG.pageLoadWait);
    pageNum++;
  }

  console.log(`✅ 共读取 ${pageNum} 页，合计 ${allData.length} 行数据`);

  // 生成 CSV
  const BOM = '\uFEFF';
  let csvContent = headers.map(h => escapeCSV(h)).join(CONFIG.separator) + '\n';
  allData.forEach(row => {
    csvContent += row.map(cell => escapeCSV(cell)).join(CONFIG.separator) + '\n';
  });

  // 下载
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = CONFIG.fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);

  console.log(`🎉 全量导出完成！文件名: ${CONFIG.fileName}`);
  console.log(`📊 共导出 ${headers.length} 列 × ${allData.length} 行`);
})();

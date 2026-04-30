# COLG 监控脚本

每 5 分钟巡检 colg 主站和 colg app，并扫描热榜是否存在政治敏感或离谱言论。

## 功能

1. **站点可用性**：访问 `https://bbs.colg.cn/`（colg 主站）和 `https://www.colg.cn/`（colg app），检查 HTTP 状态、响应时间、正文是否包含错误关键词。
2. **热榜内容扫描**：抓取热榜标题，按内置敏感词库（政治敏感词、离谱/低俗/黑灰产词）匹配，命中即告警。
3. **告警通道**：默认打印日志；配置钉钉 / 企微 webhook 后可推送消息。
4. **报告持久化**：每次巡检生成一份 JSON 报告，保存到 `reports/` 目录。

## 使用

### 依赖

```bash
pip install requests
```

### 直接运行（常驻，5 分钟一次）

```bash
python3 colg_monitor.py
```

### 只跑一次（调试 / crontab）

```bash
python3 colg_monitor.py --once
```

### 通过 crontab 调度（推荐）

```bash
crontab -e
# 每 5 分钟执行一次
*/5 * * * * /usr/bin/python3 /Users/yanglvlv/Documents/work/colg_monitor/colg_monitor.py --once >> /Users/yanglvlv/Documents/work/colg_monitor/cron.log 2>&1
```

## 告警配置

通过环境变量注入 webhook，避免把 token 硬编码到代码里：

```bash
export COLG_DINGTALK_WEBHOOK="https://oapi.dingtalk.com/robot/send?access_token=xxx"
export COLG_WECOM_WEBHOOK="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
```

## 扩展

- **敏感词库**：在 `colg_monitor.py` 顶部的 `POLITICAL_KEYWORDS` / `ABSURD_KEYWORDS` 列表中追加，也可以改成从外部 `.txt` 文件加载。
- **热榜来源**：`HOT_LIST_ENDPOINTS` 可以换成 colg 真实的热榜接口（抓包 app 得到），命中后会优先用 JSON 解析。
- **监控维度**：`check_site()` 函数里可以增加 SSL 证书检查、首字节时间、关键 DOM 元素是否存在等。

## 输出

- 日志文件：`colg_monitor.log`
- 巡检报告：`reports/report_YYYYMMDD_HHMMSS.json`

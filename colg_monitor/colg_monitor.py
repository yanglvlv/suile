#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
COLG 网站监控脚本
功能:
1. 每 5 分钟访问 colg 主站 和 colg app, 检查是否可访问、是否有异常
2. 抓取热榜, 用关键词库扫描政治敏感 / 离谱言论, 有问题就告警
"""

import os
import re
import sys
import json
import time
import logging
import traceback
from datetime import datetime
from typing import List, Dict, Any, Optional

import requests

# ========== 配置区 ==========

# 监控间隔, 单位: 秒 (5 分钟)
CHECK_INTERVAL = 300

# 请求超时时间 (秒)
REQUEST_TIMEOUT = 15

# 目标站点 (站点名 -> URL)
TARGETS = {
    "colg_web":  "https://bbs.colg.cn/",   # colg 主站 (PC 网页)
    "colg_app":  "https://www.colg.cn/",   # colg 官网 / APP 落地页
}

# 热榜抓取入口 (接口优先, 取不到再回退到 HTML 正则)
HOT_LIST_ENDPOINTS = [
    # Discuz 的热榜 / 最新帖接口, 不同版本可能不同, 这里都试一下
    "https://bbs.colg.cn/api/forum/hot",
    "https://bbs.colg.cn/portal.php",
    "https://bbs.colg.cn/",
]

# 脚本输出目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE_DIR, "colg_monitor.log")
REPORT_DIR = os.path.join(BASE_DIR, "reports")
os.makedirs(REPORT_DIR, exist_ok=True)

# ========== 告警配置 (按需填充) ==========

# 钉钉 / 企微 webhook, 留空就只打印日志
DINGTALK_WEBHOOK = os.environ.get("COLG_DINGTALK_WEBHOOK", "")
WECOM_WEBHOOK    = os.environ.get("COLG_WECOM_WEBHOOK", "")

# ========== 敏感词库 ==========
# 说明:
#   - 政治敏感词: 涉政 / 涉稳 / 分裂类, 命中即告警
#   - 离谱言论词: 辱骂、低俗、博彩、诈骗、外挂代充等, 命中即告警
#   - 这里只给出基础词库, 线上可扩展为外部文件管理

POLITICAL_KEYWORDS: List[str] = [
    "台独", "港独", "藏独", "疆独", "蒙独",
    "分裂国家", "颠覆国家", "反华", "辱华",
    "法轮", "六四", "天安门事件",
    "习近平", "李克强", "毛泽东",   # 不允许非正式语境提及
    "共产党倒台", "打倒中国", "中国滚出",
]

ABSURD_KEYWORDS: List[str] = [
    # 辱骂低俗
    "傻逼", "操你", "日你", "草你妈", "妈的智障", "nmsl",
    # 色情低俗
    "裸聊", "援交", "包养", "一夜情",
    # 黑灰产 / 诈骗 / 博彩
    "代充值", "代练", "外挂", "开挂", "私服", "破解版",
    "博彩", "赌博", "菠菜", "刷单", "兼职日结",
    "出售账号", "收购账号", "解封",
    # 极端言论
    "杀光", "弄死他", "自杀方法",
]

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36")

# ========== 日志 ==========

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("colg_monitor")


# ========== 工具函数 ==========

def http_get(url: str) -> Optional[requests.Response]:
    """带异常捕获的 GET"""
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": UA, "Accept": "text/html,application/json"},
            timeout=REQUEST_TIMEOUT,
        )
        return resp
    except Exception as e:
        log.warning(f"请求失败 {url}: {e}")
        return None


def send_alert(title: str, content: str) -> None:
    """发送告警: 钉钉 / 企微, 没配置就只写日志"""
    log.error(f"[ALERT] {title}\n{content}")

    payload = {
        "msgtype": "text",
        "text": {"content": f"[COLG 监控告警] {title}\n{content}"},
    }

    if DINGTALK_WEBHOOK:
        try:
            requests.post(DINGTALK_WEBHOOK, json=payload, timeout=10)
        except Exception as e:
            log.warning(f"钉钉告警失败: {e}")

    if WECOM_WEBHOOK:
        try:
            requests.post(WECOM_WEBHOOK, json=payload, timeout=10)
        except Exception as e:
            log.warning(f"企微告警失败: {e}")


# ========== 站点可用性检查 ==========

def check_site(name: str, url: str) -> Dict[str, Any]:
    """检查单个站点是否异常, 返回结果字典"""
    start = time.time()
    resp = http_get(url)
    elapsed = round(time.time() - start, 3)

    result: Dict[str, Any] = {
        "name": name,
        "url": url,
        "ok": False,
        "status_code": None,
        "elapsed_sec": elapsed,
        "reason": "",
    }

    if resp is None:
        result["reason"] = "网络请求异常 / 超时"
        return result

    result["status_code"] = resp.status_code

    # 判异常的几个维度:
    # 1. HTTP 状态码不是 2xx
    # 2. 响应过慢 (> 10 秒)
    # 3. 正文过小 (< 500 字节, 基本是出错页)
    # 4. 正文包含典型错误关键词
    body = resp.text or ""
    body_len = len(body)

    error_markers = [
        "502 Bad Gateway", "503 Service", "504 Gateway",
        "Nginx error", "系统繁忙", "服务器维护", "访问被拒绝",
        "database error", "数据库连接失败",
    ]

    if resp.status_code >= 400:
        result["reason"] = f"HTTP 状态异常: {resp.status_code}"
    elif elapsed > 10:
        result["reason"] = f"响应过慢: {elapsed}s"
    elif body_len < 500:
        result["reason"] = f"响应内容过短: {body_len} 字节"
    else:
        hit = [m for m in error_markers if m in body]
        if hit:
            result["reason"] = f"正文命中错误关键词: {hit}"
        else:
            result["ok"] = True

    return result


# ========== 热榜抓取 ==========

def fetch_hot_titles() -> List[str]:
    """
    抓取 COLG 热榜标题列表.
    策略:
      1. 先尝试 API 接口 (JSON)
      2. 失败则回退到首页 HTML 用正则提取 <a> 标题
    """
    titles: List[str] = []

    # 1) 尝试 JSON 接口
    for api in HOT_LIST_ENDPOINTS:
        if not api.endswith(("hot", "json")):
            continue
        resp = http_get(api)
        if resp is None or resp.status_code != 200:
            continue
        try:
            data = resp.json()
            # 兼容常见字段
            items = (data.get("data")
                     or data.get("list")
                     or data.get("threads")
                     or [])
            for it in items:
                t = it.get("subject") or it.get("title") or it.get("name")
                if t:
                    titles.append(t.strip())
            if titles:
                return titles
        except Exception:
            pass

    # 2) 回退到 HTML
    resp = http_get("https://bbs.colg.cn/")
    if resp is None:
        return titles

    html = resp.text
    # 抓取所有 <a> 内的主题文本, 足够覆盖热榜 / 最新帖
    raw = re.findall(r"<a[^>]+>([^<]{6,80})</a>", html)
    # 简单去重 + 过滤无意义文本
    seen = set()
    for t in raw:
        t = t.strip()
        if not t or t in seen:
            continue
        # 过滤导航 / 版块名之类的短链接
        if re.match(r"^(首页|登录|注册|发帖|版块|更多|下载|帮助|搜索)$", t):
            continue
        seen.add(t)
        titles.append(t)

    return titles


# ========== 敏感内容扫描 ==========

def scan_titles(titles: List[str]) -> List[Dict[str, Any]]:
    """扫描标题列表, 返回命中记录"""
    hits: List[Dict[str, Any]] = []

    for t in titles:
        political = [k for k in POLITICAL_KEYWORDS if k in t]
        absurd    = [k for k in ABSURD_KEYWORDS    if k in t]
        if political or absurd:
            hits.append({
                "title": t,
                "political": political,
                "absurd": absurd,
            })

    return hits


# ========== 主流程 ==========

def run_once() -> Dict[str, Any]:
    """执行一次完整的巡检"""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log.info(f"===== 开始巡检 {now} =====")

    report: Dict[str, Any] = {
        "time": now,
        "sites": [],
        "hot_titles_count": 0,
        "sensitive_hits": [],
        "errors": [],
    }

    # 1. 站点可用性
    for name, url in TARGETS.items():
        r = check_site(name, url)
        report["sites"].append(r)

        if r["ok"]:
            log.info(f"[OK]   {name} {url} {r['status_code']} {r['elapsed_sec']}s")
        else:
            msg = f"{name} ({url}) 异常: {r['reason']} (status={r['status_code']}, elapsed={r['elapsed_sec']}s)"
            report["errors"].append(msg)
            send_alert(f"{name} 访问异常", msg)

    # 2. 热榜扫描
    try:
        titles = fetch_hot_titles()
        report["hot_titles_count"] = len(titles)
        log.info(f"抓取到热榜候选标题 {len(titles)} 条")

        hits = scan_titles(titles)
        report["sensitive_hits"] = hits

        if hits:
            lines = []
            for h in hits:
                tag = []
                if h["political"]:
                    tag.append(f"政治敏感{h['political']}")
                if h["absurd"]:
                    tag.append(f"离谱言论{h['absurd']}")
                lines.append(f"- [{'/'.join(tag)}] {h['title']}")
            send_alert(
                f"热榜疑似违规 {len(hits)} 条",
                "\n".join(lines),
            )
        else:
            log.info("热榜扫描通过, 未发现敏感内容")
    except Exception as e:
        err = f"热榜扫描异常: {e}\n{traceback.format_exc()}"
        log.error(err)
        report["errors"].append(err)
        send_alert("热榜扫描异常", err)

    # 3. 持久化报告
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = os.path.join(REPORT_DIR, f"report_{ts}.json")
    try:
        with open(out, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
    except Exception as e:
        log.warning(f"报告写入失败: {e}")

    log.info(f"===== 本次巡检结束, 报告: {out} =====")
    return report


def main() -> None:
    log.info("COLG 监控脚本启动, 每 %d 秒巡检一次", CHECK_INTERVAL)
    while True:
        try:
            run_once()
        except Exception as e:
            log.error(f"巡检主循环异常: {e}\n{traceback.format_exc()}")
            send_alert("监控脚本异常", str(e))

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    # 支持 --once 参数, 只跑一次 (方便调试 / 接入 crontab)
    if "--once" in sys.argv:
        run_once()
    else:
        main()

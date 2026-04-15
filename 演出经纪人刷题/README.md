# 🎭 2026 演出经纪人刷题宝

## 服务器部署指南

### 环境要求
- Node.js 16+
- 无需安装数据库（使用 SQLite，自动创建）

### 部署步骤

```bash
# 1. 把整个项目上传到服务器，进入 server 目录
cd server

# 2. 安装依赖
npm install

# 3. 启动服务（默认端口 3000）
npm start

# 或指定端口和密钥
PORT=8080 JWT_SECRET=你的自定义密钥 npm start
```

### 后台运行（推荐用 pm2）

```bash
# 安装 pm2
npm install -g pm2

# 启动
PORT=8080 JWT_SECRET=你的密钥 pm2 start app.js --name ycjjr-quiz

# 查看状态
pm2 status

# 查看日志
pm2 logs ycjjr-quiz
```

### Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name quiz.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### API 说明

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/register` | POST | 注册，参数: `{username, password}` |
| `/api/login` | POST | 登录，参数: `{username, password}` |
| `/api/me` | GET | 验证 token（需 Authorization header） |
| `/api/data` | GET | 获取用户刷题数据 |
| `/api/data` | POST | 保存用户刷题数据 |

### 安全说明
- 密码使用 **bcrypt** 加密存储（10轮salt）
- 登录凭证使用 **JWT**，有效期30天
- 前端不存储任何密码，只存 token
- 数据库文件: `server/data.db`（记得备份）

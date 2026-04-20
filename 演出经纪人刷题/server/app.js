const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ycjjr_quiz_secret_' + Date.now();

// ========== 数据库初始化 ==========
const db = new Database(path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_data (
    user_id INTEGER PRIMARY KEY,
    favorites TEXT DEFAULT '[]',
    wrong_ids TEXT DEFAULT '[]',
    stats TEXT DEFAULT '{"correct":0,"wrong":0}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ========== 中间件 ==========
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));  // 托管前端静态文件

// JWT 验证中间件
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '请先登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// ========== 注册 ==========
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (username.length < 2 || username.length > 20) return res.status(400).json({ error: '用户名2-20个字符' });
  if (password.length < 4) return res.status(400).json({ error: '密码至少4位' });

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(400).json({ error: '用户名已存在' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hash);
  db.prepare('INSERT INTO user_data (user_id) VALUES (?)').run(result.lastInsertRowid);

  const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username, message: '注册成功' });
});

// ========== 登录 ==========
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(400).json({ error: '用户名不存在' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: '密码错误' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: user.username });
});

// ========== 获取用户数据 ==========
app.get('/api/data', auth, (req, res) => {
  const data = db.prepare('SELECT favorites, wrong_ids, stats FROM user_data WHERE user_id = ?').get(req.user.id);
  if (!data) return res.status(404).json({ error: '数据不存在' });
  res.json({
    favorites: JSON.parse(data.favorites),
    wrongIds: JSON.parse(data.wrong_ids),
    stats: JSON.parse(data.stats)
  });
});

// ========== 保存用户数据 ==========
app.post('/api/data', auth, (req, res) => {
  const { favorites, wrongIds, stats } = req.body;
  db.prepare(`
    UPDATE user_data SET favorites = ?, wrong_ids = ?, stats = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    JSON.stringify(favorites || []),
    JSON.stringify(wrongIds || []),
    JSON.stringify(stats || { correct: 0, wrong: 0 }),
    req.user.id
  );
  res.json({ ok: true });
});

// ========== 验证 token ==========
app.get('/api/me', auth, (req, res) => {
  res.json({ username: req.user.username });
});

// ========== 所有其他路由返回前端页面 ==========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.listen(PORT, () => {
  console.log(`🎭 演出经纪人刷题宝服务已启动: http://localhost:${PORT}`);
});

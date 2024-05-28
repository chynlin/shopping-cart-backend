const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// 引入 sqlite3
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'db', 'database.db');
const db = new sqlite3.Database(dbPath);

// 引入验证中间件
const auth = require('../middleware/auth');

// 注册
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Name, email, and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (user) {
      return res.status(400).json({ email: 'Email already exists' });
    } else {
      const newUser = { name, email, password };
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return res.status(500).json({ error: 'Error generating salt' });
        }

        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) {
            return res.status(500).json({ error: 'Error hashing password' });
          }

          newUser.password = hash;
          db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [newUser.name, newUser.email, newUser.password],
            function (err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ id: this.lastID });
            }
          );
        });
      });
    }
  });
});

// 登录
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (!user) {
      return res.status(404).json({ email: 'Email not found' });
    }
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        const payload = { id: user.id, name: user.name };
        jwt.sign(
          payload,
          'yourSecretKey', // 要改成你的密鑰
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: 'Bearer ' + token,
            });
          }
        );
      } else {
        return res.status(400).json({ password: 'Password incorrect' });
      }
    });
  });
});

// 取得用户资料
router.get('/info', auth, (req, res) => {
  const userId = req.user.id;
  db.get(
    'SELECT id, name, email FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    }
  );
});

module.exports = router;

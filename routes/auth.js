const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { User } = require('../models'); // 使用 Sequelize 模型
const auth = require('../middleware/auth'); // 引入验证中间件
const createResponse = require('../utils/responseHelper'); // 引入响应助手函数

// 注册
router.post('/register', async (req, res) => {
  const { name, email, password, mobile, country } = req.body;

  if (!name || !email || !password || !mobile || !country) {
    return res
      .status(400)
      .json({ message: 'Name, email, and password are required' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    const existingMobile = await User.findOne({ where: { mobile } });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    } else if (existingMobile) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    } else {
      const hash = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name,
        email,
        password: hash,
        mobile,
        country,
      });
      res.json({ id: newUser.id });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    if (!+user.state) {
      return res.json(
        createResponse({ state: false }, null, true, 'User has been frozen')
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const payload = { id: user.id, name: user.name };
      const token = jwt.sign(
        payload,
        '58538bf828047b9a9a23249e54bfc0d0072dce4408dbcefd87460eb97587de7d009a127aa784404591a16c1d4465d84f74058c77b51da63c5c0af4416c16be0e',
        { expiresIn: 3600 }
      ); // 要改成你的密鑰
      res.json({ success: true, token: 'Bearer ' + token });
    } else {
      return res.status(400).json({ message: 'Password incorrect' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 取得用户资料
router.post('/info', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'mobile', 'country'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

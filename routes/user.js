const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { Admin, User, Role } = require('../models');
const auth = require('../middleware/admin');
const createResponse = require('../utils/responseHelper'); // 引入响应助手函数

// 获取用户列表并添加分页功能
router.post('/users', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  try {
    const { count, rows: users } = await User.findAndCountAll({
      limit: pageSize,
      offset: offset,
      attributes: [
        'id',
        'name',
        'email',
        'mobile',
        'country',
        'created',
        'state',
      ],
    });
    const usersWithTimestamp = users
      .map((user) => {
        return {
          ...user.toJSON(),
          created: new Date(user.created).getTime(),
        };
      })
      .sort((a, b) => b.created - a.created);
    res.json(
      createResponse(usersWithTimestamp, {
        page: page,
        pageSize: pageSize,
        total: count,
      })
    );
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 获取用户資訊
router.post('/user-item', auth, async (req, res) => {
  const userId = req.body.id;

  if (!userId) {
    return res.json(
      createResponse({ state: false }, null, true, 'Id cannot be blank')
    );
  }

  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'mobile', 'country', 'state'],
    });

    if (!user) {
      return res.json(
        createResponse({ state: false }, null, true, 'User not found')
      );
    }
    user.created = new Date(user.created).getTime();
    res.json(createResponse(user));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 编辑用户资料
router.post('/user-edit', auth, async (req, res) => {
  const { id, name, email, password, mobile, country } = req.body;

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.json(
        createResponse({ state: false }, null, true, 'User not found')
      );
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.country = country || user.country;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      user.password = hash;
    }
    await user.save();

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 新增用户
router.post('/add-user', auth, async (req, res) => {
  const { name, email, password, mobile, country } = req.body;

  if (!name || !email || !password || !mobile || !country) {
    return res.json(
      createResponse(
        { state: false },
        null,
        true,
        'Name, email, password, mobile, and country are required'
      )
    );
  }

  try {
    // 检查邮箱是否已存在
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.json(
        createResponse({ state: false }, null, true, 'Email already exists')
      );
    }

    // 检查手机号是否已存在
    const existingUserByMobile = await User.findOne({ where: { mobile } });
    if (existingUserByMobile) {
      return res.json(
        createResponse(
          { state: false },
          null,
          true,
          'Mobile number already exists'
        )
      );
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      country,
    });

    res.json(createResponse({ state: true, user: newUser }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 刪除用户资料
router.post('/user-delete', auth, async (req, res) => {
  const userId = req.body.id;
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json(
        createResponse({ state: false }, null, true, 'User not found')
      );
    }

    await user.destroy();

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 凍結用户
router.post('/user-freeze', auth, async (req, res) => {
  const { id, state } = req.body;

  if (!id) {
    return res.json(
      createResponse({ state: false }, null, true, 'Id cannot be blank')
    );
  }
  if (!state) {
    return res.json(
      createResponse({ state: false }, null, true, 'State cannot be blank')
    );
  }

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.json(
        createResponse({ state: false }, null, true, 'User not found')
      );
    }

    user.state = state || user.state;
    await user.save();

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

module.exports = router;

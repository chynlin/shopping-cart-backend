const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { Admin, Role } = require('../models');
const auth = require('../middleware/admin');
const createResponse = require('../utils/responseHelper'); // 引入响应助手函数

// 注册
router.post('/register', async (req, res) => {
  const { name, account, password, level } = req.body;

  if (!name || !account || !password || !level) {
    return res.json(
      createResponse(
        { state: false },
        null,
        true,
        'Name, account, level, and password are required'
      )
    );
  }

  try {
    const existingAdmin = await Admin.findOne({ where: { account } });
    if (existingAdmin) {
      return res.json(
        createResponse({ state: false }, null, true, 'Account already exists')
      );
    }

    const role = await Role.findByPk(parseInt(level));
    if (!role) {
      return res.json(
        createResponse({ state: false }, null, true, 'Role does not exist')
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      name,
      account,
      password: hashedPassword,
      level: parseInt(level),
    });

    res.json(createResponse({ state: true, id: newAdmin.id }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

router.post('/login', async (req, res) => {
  const { account, password } = req.body;

  try {
    const admin = await Admin.findOne({ where: { account } });
    if (!admin) {
      return res.json(
        createResponse(
          { state: false },
          null,
          true,
          'Account or Password incorrect'
        )
      );
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.json(
        createResponse(
          { state: false },
          null,
          true,
          'Account or Password incorrect'
        )
      );
    }

    const payload = { id: admin.id, name: admin.name };
    const token = jwt.sign(
      payload,
      '4ff8f0e441e5f989f318bcd7b37ce40d1bf3d0daf106fb844f1729ef6c6f8db5cdf3d108dea498327d65435e53e9339b5c182f93c497cad8c1fb5ad5aa2d6a0c',
      { expiresIn: 3600 }
    );

    res.json(createResponse({ state: true, token: 'Bearer ' + token }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 编辑管理员资料
router.post('/admin-edit', auth, async (req, res) => {
  const { id, name, password, level } = req.body;

  try {
    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.json(
        createResponse({ state: false }, null, true, 'Admin not found')
      );
    }

    admin.name = name || admin.name;
    admin.level = level || admin.level;

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      admin.password = hash;
    }
    await admin.save();

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 获取管理员列表并添加分页功能
router.post('/admins', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  try {
    const { count, rows: admins } = await Admin.findAndCountAll({
      limit: pageSize,
      offset: offset,
      attributes: ['id', 'name', 'account', 'level', 'created'],
      include: [
        {
          model: Role,
          attributes: ['id', 'title'],
          as: 'role',
        },
      ],
    });

    // 将 created 字段转换为时间戳
    const adminWithTimestamp = admins.map((admin) => {
      return {
        ...admin.toJSON(),
        created: new Date(admin.created).getTime(),
      };
    });
    res.json(
      createResponse(adminWithTimestamp, {
        page: page,
        pageSize: pageSize,
        total: count,
      })
    );
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});
// 获取管理员資訊
router.post('/admin-item', auth, async (req, res) => {
  const adminId = req.body.id;

  if (!adminId) {
    return res.json(
      createResponse({ state: false }, null, true, 'Id cannot be blank')
    );
  }

  try {
    const admin = await Admin.findByPk(adminId, {
      attributes: ['id', 'name', 'account', 'level', 'created'],
      include: [
        {
          model: Role,
          attributes: ['id', 'title'],
          as: 'role',
        },
      ],
    });

    if (!admin) {
      return res.json(
        createResponse({ state: false }, null, true, 'Admin not found')
      );
    }
    admin.level = Number(admin.level);
    admin.created = new Date(admin.created).getTime();
    res.json(createResponse(admin));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 刪除管理員资料
router.post('/admin-delete', auth, async (req, res) => {
  const adminId = req.body.id;
  try {
    const user = await Admin.findByPk(adminId);

    if (!user) {
      return res.json(
        createResponse({ state: false }, null, true, 'Admin not found')
      );
    }

    await user.destroy();

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

module.exports = router;

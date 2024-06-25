const express = require('express');
const router = express.Router();
const { Role, Admin } = require('../models');
const auth = require('../middleware/admin');
const createResponse = require('../utils/responseHelper'); // 引入响应助手函数

// 获取所有角色
router.post('/list', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  try {
    const { count, rows: roles } = await Role.findAndCountAll({
      limit: pageSize,
      offset: offset,
      attributes: ['id', 'title', 'created'],
    });
    const dataWithTimestamp = roles.map((role) => {
      return {
        ...role.toJSON(),
        created: new Date(role.created).getTime(),
      };
    });
    res.json(
      createResponse(dataWithTimestamp, {
        page: page,
        pageSize: pageSize,
        total: count,
      })
    );
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 获取单个角色
router.post('/item', auth, async (req, res) => {
  const { id } = req.body;
  try {
    const role = await Role.findByPk(id);
    if (role) {
      res.json(createResponse(role));
    } else {
      res.json(createResponse({ state: false }, null, true, 'Role not found'));
    }
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 创建新角色
router.post('/create', async (req, res) => {
  const { title } = req.body;
  try {
    const newRole = await Role.create({ title });
    res.json(createResponse({ state: true, data: newRole }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 更新角色
router.post('/update', auth, async (req, res) => {
  const { id, title } = req.body;
  try {
    const role = await Role.findByPk(id);
    if (role) {
      role.title = title;
      await role.save();
      res.json(createResponse({ state: true, data: role }));
    } else {
      res.json(createResponse({ state: false }, null, true, 'Role not found'));
    }
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 删除角色
router.post('/delete', auth, async (req, res) => {
  const { id } = req.body;
  try {
    const role = await Role.findByPk(id);
    if (!role) {
      return res.json(createResponse({ state: false }, null, true, '查無角色'));
    }
    const adminCount = await Admin.count({ where: { level: id } });

    if (adminCount > 0) {
      return res.json(
        createResponse(
          { state: false },
          null,
          true,
          '角色階級仍有成員無法刪除，請確認已無管理員隸屬於該階級後刪除'
        )
      );
    }
    await role.destroy();
    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

module.exports = router;

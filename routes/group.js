const express = require('express');
const router = express.Router();
const { Group, Product } = require('../models');
const auth = require('../middleware/admin');
const createResponse = require('../utils/responseHelper'); // 引入响应助手函数

// 获取所有角色
router.post('/list', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  try {
    const { count, rows: categories } = await Group.findAndCountAll({
      limit: pageSize,
      offset: offset,
      attributes: ['id', 'title', 'created'],
    });
    const dataWithTimestamp = categories.map((category) => {
      return {
        ...category.toJSON(),
        created: new Date(category.created).getTime(),
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
    const category = await Group.findByPk(id);
    if (category) {
      res.json(createResponse(category));
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
    const newCategory = await Group.create({ title });
    res.json(createResponse({ state: true, data: newCategory }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 更新角色
router.post('/update', auth, async (req, res) => {
  const { id, title } = req.body;
  try {
    const category = await Group.findByPk(id);
    if (category) {
      category.title = title;
      await category.save();
      res.json(createResponse({ state: true, data: category }));
    } else {
      res.json(
        createResponse({ state: false }, null, true, 'Category not found')
      );
    }
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

// 删除角色
router.post('/delete', auth, async (req, res) => {
  const { id } = req.body;
  try {
    const category = await Group.findByPk(id);
    if (!category) {
      return res.json(createResponse({ state: false }, null, true, '查無角色'));
    }
    const productCount = await Product.count({ where: { group_id: id } });

    if (productCount > 0) {
      return res.json(
        createResponse(
          { state: false },
          null,
          true,
          '角色階級仍有成員無法刪除，請確認已無管理員隸屬於該階級後刪除'
        )
      );
    }
    await category.destroy();
    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

module.exports = router;

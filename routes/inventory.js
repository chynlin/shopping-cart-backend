const express = require('express');
const router = express.Router();
const auth = require('../middleware/admin');
const createResponse = require('../utils/responseHelper'); // 引入响应助手函数
const { Inventory, InventoryHistory, Product, Config } = require('../models');

// 获取库存列表
router.post('/list', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  const { product_id } = req.body;

  const whereConditions = {};
  if (product_id) {
    whereConditions.product_id = product_id;
  }

  try {
    const { count, rows: inventories } = await Inventory.findAndCountAll({
      where: whereConditions,
      limit: pageSize,
      offset: offset,
      include: [
        {
          model: Product,
          attributes: ['id', 'name', 'group_id', 'brand_id'],
        },
      ],
    });
    const dataWithTimestamp = inventories.map((inventory) => ({
      ...inventory.toJSON(),
      last_updated: new Date(inventory.last_updated).getTime(),
    }));
    res.json(
      createResponse(dataWithTimestamp, {
        page: page,
        pageSize: pageSize,
        total: count,
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 获取库存变动历史
router.post('/history', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const { product_id } = req.body;

  const whereConditions = {};
  if (product_id) {
    whereConditions.product_id = product_id;
  }

  try {
    const { count, rows: histories } = await InventoryHistory.findAndCountAll({
      where: whereConditions,
      limit: pageSize,
      offset: offset,
      order: [['date', 'DESC']], // 按日期降序排序
      include: [
        {
          model: Product,
          attributes: ['id', 'name'],
        },
      ],
    });

    const dataWithTimestamp = histories.map((history) => ({
      ...history.toJSON(),
      date: new Date(history.date).getTime(),
    }));

    res.json(
      createResponse(dataWithTimestamp, {
        page: page,
        pageSize: pageSize,
        total: count,
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 产品入库
router.post('/in', auth, async (req, res) => {
  const { product_id, quantity, remark } = req.body;

  if (!product_id || !quantity) {
    return res.json(
      createResponse(null, null, true, 'Product ID and quantity are required')
    );
  }

  try {
    const inventory = await Inventory.findOne({ where: { product_id } });
    if (inventory) {
      inventory.quantity += Number(quantity);
      inventory.last_updated = Math.floor(Date.now() / 1000);
      await inventory.save();
    } else {
      await Inventory.create({
        product_id,
        quantity: Number(quantity),
        last_updated: Math.floor(Date.now() / 1000),
      });
    }

    await InventoryHistory.create({
      product_id,
      change_type: 1,
      quantity: Number(quantity),
      remark,
    });

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 产品出库
router.post('/out', auth, async (req, res) => {
  const { product_id, quantity, remark } = req.body;

  if (!product_id || !quantity) {
    return res.json(
      createResponse(null, null, true, 'Product ID and quantity are required')
    );
  }

  try {
    const inventory = await Inventory.findOne({ where: { product_id } });
    if (!inventory || inventory.quantity < quantity) {
      return res.json(
        createResponse(null, null, true, 'Insufficient inventory')
      );
    }

    inventory.quantity -= quantity;
    inventory.last_updated = Math.floor(Date.now() / 1000);
    await inventory.save();
    await InventoryHistory.create({
      product_id,
      change_type: 2,
      quantity: -quantity,
      date: Math.floor(Date.now() / 1000),
      remark,
    });

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 获取当前阈值
router.post('/thresholds', auth, async (req, res) => {
  try {
    const lowStockThreshold = await Config.findOne({
      where: { key: 'lowStockThreshold' },
    });
    const highStockThreshold = await Config.findOne({
      where: { key: 'highStockThreshold' },
    });

    res.json(
      createResponse({
        lowStockThreshold: lowStockThreshold
          ? parseInt(lowStockThreshold.value)
          : 10,
        highStockThreshold: highStockThreshold
          ? parseInt(highStockThreshold.value)
          : 100,
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 设置库存阈值
router.post('/set-stock-threshold', auth, async (req, res) => {
  const { lowThreshold, highThreshold } = req.body;

  try {
    if (lowThreshold !== undefined) {
      await Config.upsert({
        key: 'lowStockThreshold',
        value: lowThreshold.toString(),
      });
    }

    if (highThreshold !== undefined) {
      await Config.upsert({
        key: 'highStockThreshold',
        value: highThreshold.toString(),
      });
    }

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

module.exports = router;

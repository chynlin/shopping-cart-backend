const express = require('express');
const router = express.Router();
const auth = require('../middleware/admin');
const createResponse = require('../utils/responseHelper'); // 引入响应助手函数
const multer = require('multer');
const { Brand } = require('../models');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'db', 'database.db');
const db = new sqlite3.Database(dbPath);
// 配置 multer 存储选项
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 上传文件存储目录
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// 获取品牌列表
router.post('/list', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  try {
    const { count, rows: brands } = await Brand.findAndCountAll({
      limit: pageSize,
      offset: offset,
      attributes: ['id', 'name', 'description', 'logo', 'created'],
    });
    const dataWithTimestamp = brands.map((brand) => ({
      ...brand.toJSON(),
      logo: brand.logo ? `/uploads/${brand.logo}` : null,
      created: new Date(brand.created).getTime(),
    }));

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

// 添加品牌
router.post('/create', auth, upload.single('logo'), async (req, res) => {
  const { name, description } = req.body;
  const logo = req.file ? req.file.filename : null;

  try {
    const newBrand = await Brand.create({
      name,
      description,
      logo,
    });

    res.json(
      createResponse({
        ...newBrand.toJSON(),
        created: new Date(newBrand.created).getTime(),
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 编辑品牌
router.post('/update', auth, upload.single('logo'), async (req, res) => {
  const { id, name, description } = req.body;
  const logo = req.file ? req.file.filename : null;

  try {
    const brand = await Brand.findByPk(id);

    if (!brand) {
      return res.json(createResponse(null, null, true, 'Brand not found'));
    }

    brand.name = name || brand.name;
    brand.description = description || brand.description;
    if (logo) {
      brand.logo = logo;
    }

    await brand.save();

    res.json(
      createResponse({
        ...brand.toJSON(),
        created: new Date(brand.created).getTime(),
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 删除品牌
router.post('/delete', auth, async (req, res) => {
  const { id } = req.body;

  try {
    const brand = await Brand.findByPk(id);

    if (!brand) {
      return res.json(createResponse(null, null, true, 'Brand not found'));
    }

    await brand.destroy();

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 查看品牌详情
router.post('/info', auth, async (req, res) => {
  const { id } = req.body;

  try {
    const brand = await Brand.findByPk(id, {
      attributes: ['id', 'name', 'description', 'logo', 'created'],
    });

    if (!brand) {
      return res.json(createResponse(null, null, true, 'Brand not found'));
    }

    res.json(
      createResponse({
        ...brand.toJSON(),
        logo: brand.logo ? `/uploads/${brand.logo}` : null,
        created: new Date(brand.created).getTime(),
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

module.exports = router;

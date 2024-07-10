const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { Product, Group, Brand, Inventory } = require('../models');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs'); // 引入 fs 模块
const path = require('path'); // 引入 path 模块
const dbPath = path.join(__dirname, '..', 'db', 'database.db');
const db = new sqlite3.Database(dbPath);
const auth = require('../middleware/admin');
const createResponse = require('../utils/responseHelper'); // 引入响应助手函数
const { Sequelize } = require('sequelize'); // 导入Sequelize
const { log } = require('console');

const { Op } = Sequelize; // 引入 Op

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

// 获取产品列表
router.post('/list', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 50;
  const offset = (page - 1) * pageSize;
  const { id, name, group, brand } = req.body;

  const whereConditions = {};

  if (id) {
    whereConditions.id = id;
  }
  if (name) {
    whereConditions.name = {
      [Op.like]: `%${name}%`,
    };
  }
  if (group) {
    whereConditions.group_id = group;
  }
  if (brand) {
    whereConditions.brand_id = brand;
  }

  try {
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      limit: pageSize,
      offset: offset,
      attributes: [
        'id',
        'name',
        'price',
        'description',
        'image',
        'status',
        'created',
      ],
      include: [
        {
          model: Group,
          attributes: ['id', 'title'],
          as: 'group',
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          as: 'brand',
        },
      ],
    });

    const dataWithTimestamp = products.map((product) => {
      const images = product.image
        ? JSON.parse(product.image).map((img) => ({
            ...img,
            path: `/uploads/${img.path}`,
          }))
        : [];

      return {
        ...product.toJSON(),
        created: new Date(product.created).getTime(),
        image: images,
        brand: product.brand
          ? { id: product.brand.id, name: product.brand.name }
          : null,
        group: product.group
          ? { id: product.group.id, title: product.group.title }
          : null,
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

// 查看产品详情
router.post('/info', auth, async (req, res) => {
  const { id } = req.body;

  try {
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Group,
          attributes: ['id', 'title'],
          as: 'group',
        },
        {
          model: Brand,
          attributes: ['id', 'name'],
          as: 'brand',
        },
      ],
    });

    if (!product) {
      return res.json(createResponse(null, null, true, 'Product not found'));
    }

    const images = product.image
      ? JSON.parse(product.image).map((img) => ({
          ...img,
          path: `/uploads/${img.path}`,
        }))
      : [];

    res.json(
      createResponse({
        ...product.toJSON(),
        created: new Date(product.created).getTime(),
        brand: product.brand
          ? { id: product.brand.id, name: product.brand.name }
          : null,
        image: images,
        group: product.group
          ? { id: product.group.id, title: product.group.title }
          : null,
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 新增產品
router.post('/create', auth, upload.array('images', 30), async (req, res) => {
  const { name, price, brand_id, description, status, group_id } = req.body;
  const images = req.files
    ? req.files.map((file, index) => ({
        id: index + 1,
        path: file.filename,
      }))
    : [];

  try {
    // 创建产品
    const newProduct = await Product.create({
      name,
      price,
      brand_id,
      description,
      image: JSON.stringify(images),
      status,
      group_id,
    });

    console.log('Product created with ID:', newProduct.id);

    // 使用创建后的新产品的 id 创建库存记录
    await Inventory.create({
      product_id: newProduct.id,
      quantity: 0,
    });

    console.log('Inventory created for product ID:', newProduct.id);

    res.json(
      createResponse({
        ...newProduct.toJSON(),
        created: new Date(newProduct.created).getTime(),
      })
    );
  } catch (err) {
    console.error('Error creating product or inventory:', err.message);
    res.json(createResponse(null, null, true, err.message));
  }
});

// 编辑产品
router.post('/edit', auth, upload.array('images', 30), async (req, res) => {
  const { id, name, price, brand_id, group_id, description, status } = req.body;
  const images = req.files;
  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.json(createResponse(null, null, true, 'Product not found'));
    }

    product.name = name || product.name;
    product.price = price || product.price;
    product.brand_id = brand_id || product.brand_id;
    product.group_id = group_id || product.group_id;
    product.description = description || product.description;
    if (images && images.length > 0) {
      const existingImages = product.image ? JSON.parse(product.image) : [];
      const newImages = images.map((file) => ({
        id: Date.now(),
        path: file.filename,
      }));
      product.image = JSON.stringify([...existingImages, ...newImages]);
    }
    product.status = status || product.status;

    await product.save();

    res.json(
      createResponse({
        ...product.toJSON(),
        created: new Date(product.created).getTime(),
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 删除产品
router.post('/delete', auth, async (req, res) => {
  const { id } = req.body;

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.json(createResponse(null, null, true, 'Product not found'));
    }

    await product.destroy();

    res.json(createResponse(null, null, false, 'Product deleted successfully'));
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 上架/下架产品
router.post('/toggle-status', auth, async (req, res) => {
  const { id, status } = req.body;

  try {
    const product = await Product.findByPk(id);

    if (!product) {
      return res.json(createResponse(null, null, true, 'Product not found'));
    }

    product.status = status;
    await product.save();

    res.json(
      createResponse({
        ...product.toJSON(),
        created: new Date(product.created).getTime(),
      })
    );
  } catch (err) {
    res.json(createResponse(null, null, true, err.message));
  }
});

// 删除商品图片
router.post('/delete-image', auth, async (req, res) => {
  const { product_id, image_id } = req.body;

  if (!product_id || !image_id) {
    return res.json(
      createResponse(
        { state: false },
        null,
        true,
        'Product ID and Image ID are required'
      )
    );
  }

  try {
    const product = await Product.findByPk(product_id);

    if (!product) {
      return res.json(createResponse(null, null, true, 'Product not found'));
    }

    const images = product.image ? JSON.parse(product.image) : [];
    const imageIndex = images.findIndex((img) => img.id == image_id);

    if (imageIndex === -1) {
      return res.json(createResponse(null, null, true, 'Image not found'));
    }

    // 获取要删除的图片路径
    const imagePath = path.join(
      __dirname,
      '..',
      'uploads',
      images[imageIndex].path
    );

    // 删除图片文件
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error('Error deleting image file:', err);
      }
    });

    // 从数组中删除图片
    images.splice(imageIndex, 1);

    // 更新产品的图片字段
    product.image = JSON.stringify(images);
    await product.save();

    res.json(createResponse({ state: true }));
  } catch (err) {
    res.json(createResponse({ state: false }, null, true, err.message));
  }
});

module.exports = router;

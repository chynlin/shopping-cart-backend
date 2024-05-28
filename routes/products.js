const express = require('express');
const router = express.Router();
const multer = require('multer');
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
// 商品列表
router.get('/product-list', (req, res) => {
  const query =
    'SELECT id, name, price, description, strftime("%s", date) AS created FROM products';
  db.all(query, [], (err, products) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(products);
  });
});

router.post('/create-product', upload.single('image'), (req, res) => {
  const { name, price, description } = req.body;
  const image = req.file ? req.file.path : '';

  // 檢查必填欄位是否存在
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const query =
    'INSERT INTO products (name, price, image, description) VALUES (?, ?, ?, ?)';
  db.run(query, [name, price, image, description], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res
      .status(201)
      .json({ message: 'Product added successfully', id: this.lastID });
  });
});

module.exports = router;

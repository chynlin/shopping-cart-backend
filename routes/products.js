const express = require('express');
const router = express.Router();

// 引入 sqlite3
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'db', 'database.db');
const db = new sqlite3.Database(dbPath);

// 商品列表
router.get('/product-list', (req, res) => {
  const query = 'SELECT id, name, price, description, strftime("%s", date) AS created FROM products';
  db.all(query, [], (err, products) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(products);
  });
});

router.post('/create-product', (req, res) => {
  console.log(req.body);
  const { name, price, description } = req.body;

  // 檢查必填欄位是否存在
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const query = 'INSERT INTO products (name, price, description) VALUES (?, ?, ?)';
  db.run(query, [name, price, description], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({ message: 'Product added successfully', id: this.lastID });
  });
});


module.exports = router;

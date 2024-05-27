const express = require('express');
const router = express.Router();
const db = require('../index'); 

// 获取所有产品
router.get('/', (req, res) => {
  db.all('SELECT * FROM products', (err, products) => {
    if (err) return res.status(404).json({ noproductsfound: 'No products found' });
    res.json(products);
  });
});

// 添加新产品
router.post('/', (req, res) => {
  const { name, price, description } = req.body;
  db.run('INSERT INTO products (name, price, description) VALUES (?, ?, ?)', [name, price, description], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../index'); 

// 简单的购物车示例，假设前端会管理购物车的状态
router.post('/add', (req, res) => {
  const { productId, quantity } = req.body;
  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (!product) {
      return res.status(404).json({ noproductfound: 'No product found' });
    }
    res.json({
      product,
      quantity
    });
  });
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const dbPath = path.join(__dirname, '..', 'db', 'database.db');
const db = new sqlite3.Database(dbPath);

// 设置上传目录
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });

// 获取 main/info
router.get('/info', (req, res) => {
  const query = 'SELECT notice, banner FROM main_info WHERE id = 1';
  db.get(query, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const result = {
      notice: row.notice,
      banner: JSON.parse(row.banner),
    };
    res.json(result);
  });
});

// 上传 banner 并新增到 main/info 的 banner 数组中
router.post('/banner-create', upload.single('image'), (req, res) => {
  const image = req.file ? '/' + req.file.path : '';

  if (!image) {
    return res.status(400).json({ error: 'Image is required' });
  }

  const querySelect = 'SELECT banner FROM main_info WHERE id = 1';
  db.get(querySelect, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const banners = JSON.parse(row.banner);
    const newBanner = { id: Date.now(), url: image };
    banners.push(newBanner);

    const queryUpdate = 'UPDATE main_info SET banner = ? WHERE id = 1';
    db.run(queryUpdate, [JSON.stringify(banners)], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res
        .status(201)
        .json({ message: 'Banner added successfully', banner: newBanner });
    });
  });
});

// 删除 banner 根据传递的 id 从 main/info 的 banner 数组中删除
router.delete('/banner-delete/:id', (req, res) => {
  const bannerId = parseInt(req.params.id, 10);

  const querySelect = 'SELECT banner FROM main_info WHERE id = 1';
  db.get(querySelect, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let banners = JSON.parse(row.banner);
    banners = banners.filter((banner) => banner.id !== bannerId);

    const queryUpdate = 'UPDATE main_info SET banner = ? WHERE id = 1';
    db.run(queryUpdate, [JSON.stringify(banners)], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Banner deleted successfully' });
    });
  });
});

module.exports = router;

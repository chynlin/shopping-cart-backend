const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const passport = require('passport');
const path = require('path');

const users = require('./routes/auth');
const products = require('./routes/products');
const cart = require('./routes/cart');
const main = require('./routes/main'); // 新增的 main 路由
const app = express();
// SQLite Database setup
const dbPath = path.join(__dirname, 'db', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const initDatabase = async () => {
  await new Promise((resolve, reject) => {
    db.serialize(async () => {
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          date TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          image TEXT,
          description TEXT,
          date DATE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.run(`
        CREATE TABLE IF NOT EXISTS main_info (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          notice TEXT,
          banner TEXT
        )
      `);
      // 插入初始数据
      const initData = {
        notice: 'Welcome to our site!',
        banner: JSON.stringify([]),
      };
      await db.run('INSERT INTO main_info (notice, banner) VALUES (?, ?)', [
        initData.notice,
        initData.banner,
      ]);
      resolve();
    });
  });
};

initDatabase().then(() => {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  // Bodyparser middleware
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  // Passport middleware
  app.use(passport.initialize());

  // Routes
  app.use('/api/user', users);
  app.use('/api/products', products);
  app.use('/api/cart', cart);
  app.use('/api/main', main); // 新增的 main 路由

  const port = process.env.PORT || 3001;

  app.listen(port, () =>
    console.log(`Server up and running on port ${port} !`)
  );
});

module.exports = db; // 导出数据库实例

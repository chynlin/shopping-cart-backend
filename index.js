const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const path = require('path');
const { sequelize, MainInfo } = require('./models');

const auth = require('./routes/auth');
const user = require('./routes/user');
const products = require('./routes/products');
const cart = require('./routes/cart');
const main = require('./routes/main'); // 新增的 main 路由
const admin = require('./routes/admin');
const roles = require('./routes/roles');
const groups = require('./routes/group');
const brands = require('./routes/brand');
const inventory = require('./routes/inventory');
const order = require('./routes/order');

const app = express();

// 初始化数据库并同步模型
const initDatabase = async () => {
  try {
    await sequelize.sync(); // 同步所有模型到数据库
    console.log('Database synchronized successfully.');

    // 检查并插入初始数据
    const initData = {
      notice: 'Welcome to our site!',
      banner: JSON.stringify([]),
    };

    // 查询是否已有数据，如果没有则插入初始数据
    const mainInfo = await MainInfo.findOne();
    if (!mainInfo) {
      await MainInfo.create(initData);
      console.log('Initial MainInfo data inserted.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDatabase().then(() => {
  // 设置静态文件目录
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  // 使用 body-parser 中间件
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  // 使用 Passport 中间件
  app.use(passport.initialize());

  // 设置路由
  app.use('/api/auth', auth);
  app.use('/api/user', user);
  app.use('/api/products', products);
  app.use('/api/cart', cart);
  app.use('/api/main', main);
  app.use('/api/admin', admin);
  app.use('/api/roles', roles);
  app.use('/api/group', groups);
  app.use('/api/brand', brands);
  app.use('/api/inventory', inventory);
  app.use('/api/order', order);

  const port = process.env.PORT || 3001;

  app.listen(port, () => console.log(`Server up and running on port ${port}!`));
});

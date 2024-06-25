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

const app = express();

const initDatabase = async () => {
  try {
    await sequelize.sync();
    console.log('Database synchronized successfully.');

    // 插入初始数据
    const initData = {
      notice: 'Welcome to our site!',
      banner: JSON.stringify([]),
    };

    // 检查是否存在初始数据，如果不存在则插入
    const mainInfo = await MainInfo.findOne();
    if (!mainInfo) {
      await MainInfo.create(initData);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initDatabase().then(() => {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  // Bodyparser middleware
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  // Passport middleware
  app.use(passport.initialize());

  // Routes
  app.use('/api/auth', auth);
  app.use('/api/user', user);
  app.use('/api/products', products);
  app.use('/api/cart', cart);
  app.use('/api/main', main);
  app.use('/api/admin', admin);
  app.use('/api/roles', roles);
  app.use('/api/group', groups);
  app.use('/api/brand', brands);

  const port = process.env.PORT || 3001;

  app.listen(port, () =>
    console.log(`Server up and running on port ${port} !`)
  );
});
const checkConstraints = async () => {
  const constraints = await sequelize.query(
    "PRAGMA foreign_key_list('Admins')"
  );
  console.log('Admins Constraints:', constraints);
};

checkConstraints();
module.exports = sequelize; // 导出 Sequelize 实例

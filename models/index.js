const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../db/database.sqlite'),
  logging: console.log, // 添加日志记录以查看实际执行的 SQL 语句
});

const generateNumericId = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = '';
    id += Math.floor(Math.random() * 9) + 1;
    for (let i = 1; i < 8; i++) {
      id += Math.floor(Math.random() * 10);
    }
    const user = await User.findOne({ where: { id } });
    exists = user !== null;
  }
  return id;
};

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.STRING(8),
      allowNull: true,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    mobile: DataTypes.STRING,
    country: DataTypes.STRING,
    password: DataTypes.STRING,
    state: {
      type: DataTypes.STRING,
      defaultValue: '1',
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
  }
);

User.beforeCreate(async (user) => {
  user.id = await generateNumericId();
});

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
  }
);

const Admin = sequelize.define(
  'Admin',
  {
    id: {
      type: DataTypes.STRING(8),
      allowNull: true,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    account: DataTypes.STRING,
    password: DataTypes.STRING,
    level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Role,
        key: 'id',
      },
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
  }
);

Admin.beforeCreate(async (admin) => {
  admin.id = await generateNumericId();
});

Role.hasMany(Admin, { foreignKey: 'level' });
Admin.belongsTo(Role, { foreignKey: 'level', as: 'role' });

const Group = sequelize.define(
  'Group',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
  }
);
const Brand = sequelize.define(
  'Brand',
  {
    name: DataTypes.STRING,
    logo: {
      type: DataTypes.STRING, // 使用字符串存储图片路径或URL
      allowNull: true,
    },
    description: DataTypes.TEXT,
    created: {
      type: DataTypes.DATE,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
  }
);
const Product = sequelize.define(
  'Product',
  {
    name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('image');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('image', JSON.stringify(value));
      },
    },
    brand_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Brand,
        key: 'id',
      },
    },
    description: DataTypes.TEXT,
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Group,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: '0',
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
  }
);

Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
Product.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });

const MainInfo = sequelize.define(
  'MainInfo',
  {
    notice: DataTypes.TEXT,
    banner: DataTypes.TEXT,
  },
  {
    timestamps: false,
  }
);
const Inventory = sequelize.define(
  'Inventory',
  {
    product_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Product,
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    timestamps: false,
  }
);
Product.hasMany(Inventory, { foreignKey: 'product_id' });
Inventory.belongsTo(Product, { foreignKey: 'product_id' });

const InventoryHistory = sequelize.define(
  'InventoryHistory',
  {
    product_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Product,
        key: 'id',
      },
    },
    change_type: {
      type: DataTypes.STRING,
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
    date: {
      type: DataTypes.DATE,
      defaultValue: () => Math.floor(Date.now() / 1000),
    },
    remark: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

Product.hasMany(InventoryHistory, { foreignKey: 'product_id' });
InventoryHistory.belongsTo(Product, { foreignKey: 'product_id' });

const Config = sequelize.define(
  'Config',
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);
// 定义 Order 模型
const Order = sequelize.define('Order', {
  orderNumber: {
    type: DataTypes.STRING(8),
    allowNull: true,
    primaryKey: true,
  },
  customer_id: {
    type: DataTypes.STRING(8), // 假设你的用户ID是字符串类型，如果是整数类型请修改为 INTEGER
    references: {
      model: User, // 修改为正确的表名
      key: 'id',
    },
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  logisticsCompany: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: () => Math.floor(Date.now() / 1000),
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: () => Math.floor(Date.now() / 1000),
  },
});

Order.beforeCreate(async (order) => {
  order.orderNumber = await generateNumericId();
});

// 定义 OrderItem 模型
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.STRING(8),
    references: {
      model: Order, // 关联到 Orders 表
      key: 'orderNumber',
    },
    allowNull: false,
  },
  product_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Product, // 关联到 Products 表
      key: 'id',
    },
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: () => Math.floor(Date.now() / 1000),
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: () => Math.floor(Date.now() / 1000),
  },
});

// 模型关联
User.hasMany(Order, { foreignKey: 'customer_id', as: 'order' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

sequelize.sync();

module.exports = {
  sequelize,
  Admin,
  User,
  Product,
  Group,
  MainInfo,
  Role,
  Brand,
  Inventory,
  InventoryHistory,
  Config,
  Order,
  OrderItem,
};

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../db/database.sqlite'),
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
    brand: DataTypes.STRING,
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
};

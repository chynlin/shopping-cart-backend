const { sequelize } = require('./models'); // 导入 Sequelize 实例

const clearTable = async () => {
  try {
    await sequelize.query('DELETE FROM Orders'); // 执行 SQL 语句清空表
    await sequelize.query('DELETE FROM OrderItems'); // 执行 SQL 语句清空表
    console.log('Table has been cleared.');
  } catch (error) {
    console.error('Error clearing Product table:', error);
  }
};

clearTable();

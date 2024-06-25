const { Admin, Role } = require('./models/index');
const bcrypt = require('bcryptjs'); // 确保 bcrypt 被正确引入
const addTestData = async () => {
  try {
    const newRole = await Role.create({
      title: 'Admin',
    });

    console.log('New Role:', newRole.toJSON());

    const hashedPassword = await bcrypt.hash('112233', 10);
    const newAdmin = await Admin.create({
      name: 'Test Admin',
      account: 'admin',
      password: hashedPassword,
      level: newRole.id,
    });

    console.log('New Admin:', newAdmin.toJSON());
  } catch (error) {
    console.error('Error adding test data:', error);
  }
};

addTestData();

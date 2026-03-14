const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config();

async function createTestUser() {
  try {
    // 加密密码
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 插入测试用户
    const [result] = await db.query(
      `INSERT INTO users (username, password, nickname, email, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['测试', hashedPassword, '测试用户', 'test@example.com', 1]
    );

    console.log('✅ 测试用户创建成功');
    console.log('用户名: 测试');
    console.log('密码: 123456');
    console.log('ID:', result.insertId || '已存在，已更新密码');

    process.exit(0);
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    process.exit(1);
  }
}

createTestUser();

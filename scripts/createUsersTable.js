const db = require('../config/db');

async function createUsersTable() {
  try {
    console.log('开始创建用户表...\n');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\`          INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '用户ID',
        \`username\`    VARCHAR(50)     DEFAULT NULL COMMENT '用户名（可选）',
        \`password\`    VARCHAR(255)    DEFAULT NULL COMMENT 'bcrypt 加密密码（可选）',
        \`email\`       VARCHAR(100)    DEFAULT NULL COMMENT '邮箱（可选）',
        \`phone\`       VARCHAR(20)     DEFAULT NULL COMMENT '手机号（可选）',
        \`nickname\`    VARCHAR(100)    DEFAULT NULL COMMENT '昵称',
        \`avatar\`      VARCHAR(500)    DEFAULT NULL COMMENT '头像URL',
        \`points\`      INT             NOT NULL DEFAULT 1000 COMMENT '积分',
        \`status\`      TINYINT         NOT NULL DEFAULT 1 COMMENT '状态 1=正常 0=禁用',
        \`created_at\`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_username\` (\`username\`),
        UNIQUE KEY \`uk_email\` (\`email\`),
        UNIQUE KEY \`uk_phone\` (\`phone\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
    `;

    await db.query(createTableSQL);
    console.log('用户表创建成功');

    const insertSQL = `
      INSERT INTO \`users\` (\`username\`, \`password\`, \`nickname\`, \`email\`, \`phone\`, \`avatar\`, \`points\`, \`status\`)
      VALUES (
        '测试',
        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        '测试用户',
        'test@example.com',
        '13800138000',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
        1000,
        1
      )
      ON DUPLICATE KEY UPDATE \`id\` = \`id\`;
    `;

    await db.query(insertSQL);
    console.log('测试用户创建成功');
    console.log('用户名: 测试');
    console.log('密码: 123456');
    console.log('邮箱: test@example.com');
    console.log('手机: 13800138000');

    console.log('\n用户表创建完成');
    process.exit(0);
  } catch (error) {
    console.error('创建失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createUsersTable();

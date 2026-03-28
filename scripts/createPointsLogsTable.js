const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createPointsLogsTable() {
  let connection;

  try {
    console.log('开始创建 points_logs 表...\n');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4',
    });

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`points_logs\` (
        \`id\`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
        \`user_id\`       INT UNSIGNED NOT NULL COMMENT '用户ID',
        \`change_type\`   VARCHAR(32) NOT NULL COMMENT '积分变更类型',
        \`change_amount\` INT NOT NULL COMMENT '积分变更值',
        \`balance_after\` INT NOT NULL COMMENT '变更后积分余额',
        \`order_id\`      INT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
        \`remark\`        VARCHAR(255) DEFAULT NULL COMMENT '备注',
        \`created_at\`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_order_id\` (\`order_id\`),
        KEY \`idx_change_type\` (\`change_type\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水表';
    `);

    console.log('points_logs 表创建成功');
  } catch (error) {
    console.error('创建失败:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

createPointsLogsTable();

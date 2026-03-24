/**
 * =====================================================
 * 数据库连接配置 - MySQL2 连接池
 * =====================================================
 */

import mysql from 'mysql2';

// 创建数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 转换为 Promise 形式
const promisePool = pool.promise();

// 测试数据库连接
promisePool.getConnection()
  .then(connection => {
    console.log('✅ 成功连接到 MySQL 数据库!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
  });

export default promisePool;

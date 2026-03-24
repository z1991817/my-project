import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('✅ 成功连接到 MySQL 数据库!');
    console.log(`📍 连接信息: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
    console.error('📍 检查项:');
    console.error(`   - MySQL 服务是否启动`);
    console.error(`   - 连接信息: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);
    console.error(`   - .env 文件是否存在且配置正确`);
  });

export default pool;
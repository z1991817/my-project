const mysql = require('mysql2');
require('dotenv').config(); // 加载 .env 环境变量

// 创建数据库连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // 最大连接数
    queueLimit: 0
});

// 将连接池转换为基于 Promise 的形式，方便后续使用 async/await
const promisePool = pool.promise();

// 测试数据库连接
promisePool.getConnection()
    .then(connection => {
        console.log('✅ 成功连接到 MySQL 数据库!');
        // console.log('✅ connection', connection);
        connection.release(); // 释放连接回连接池
    })
    .catch(err => {
        console.error('❌ 数据库连接失败:', err.message);
    });

module.exports = promisePool;
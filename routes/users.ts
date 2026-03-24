// routes/index.js
const express = require('express');
const router = express.Router();
// 引入我们之前写好的数据库连接池
const db = require('../config/db'); 

// 测试接口 (保留之前的)
router.get('/ping', (req, res) => {
    res.json({
        code: 200,
        message: 'pong! AI Avatar API is running successfully.',
        data: null
    });
});

// 新增：数据库连通性与表查询测试接口
router.get('/db-test', async (req, res) => {
    try {
        // 1. 查询当前正在使用的数据库名称
        const [dbResult] = await db.query('SELECT DATABASE() AS current_db');
        const currentDbName = dbResult[0].current_db;

        // 2. 查询当前数据库下的所有表
        const [tablesResult] = await db.query('SHOW TABLES');
        console.log("当前数据库下的所有表:", tablesResult);
        // 提取表名数组
        const tableNames = tablesResult.map(row => Object.values(row)[0]);

        // 3. 顺便查询一下 user 表里的数据 (验证是否能查到张三、李四)
        let usersData = [];
        if (tableNames.includes('user')) {
            const [users] = await db.query('SELECT * FROM user');
            usersData = users;
        }

        // 返回结果给前端
        res.json({
            code: 200,
            message: '数据库连接测试成功！',
            data: {
                connectedDatabase: currentDbName, // 应该显示 myDb
                tables: tableNames,               // 应该包含 'user'
                users: usersData                  // 应该能看到张三和李四的数据
            }
        });

    } catch (error) {
        console.error('数据库查询测试失败:', error);
        res.status(500).json({ 
            code: 500, 
            message: '数据库查询失败，请检查配置', 
            error: error.message 
        });
    }
});

module.exports = router;
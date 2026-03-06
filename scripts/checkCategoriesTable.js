const db = require('../config/db');

async function checkTable() {
  try {
    // 查看表结构
    console.log('=== 表结构 ===');
    const [columns] = await db.query('SHOW FULL COLUMNS FROM categories');
    console.table(columns.map(col => ({
      字段: col.Field,
      类型: col.Type,
      允许NULL: col.Null,
      默认值: col.Default,
      备注: col.Comment
    })));

    // 查看数据
    console.log('\n=== 表数据 ===');
    const [rows] = await db.query('SELECT * FROM categories');
    console.table(rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

checkTable();

const db = require('../config/db');

async function showAllTables() {
  try {
    console.log('=== 数据库所有表 ===\n');

    const [tables] = await db.query('SHOW TABLES');

    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`📋 表名: ${tableName}`);

      // 显示表结构
      const [columns] = await db.query(`SHOW FULL COLUMNS FROM \`${tableName}\``);
      console.table(columns.map(col => ({
        字段: col.Field,
        类型: col.Type,
        备注: col.Comment || '-'
      })));
      console.log('\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

showAllTables();

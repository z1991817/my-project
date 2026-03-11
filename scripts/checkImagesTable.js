const db = require('../config/db');

async function checkImagesTable() {
  try {
    // 查看表结构
    console.log('=== 图片表结构 ===');
    const [columns] = await db.query('SHOW FULL COLUMNS FROM images');
    console.table(columns.map(col => ({
      字段: col.Field,
      类型: col.Type,
      允许NULL: col.Null,
      默认值: col.Default,
      备注: col.Comment
    })));

    // 查看数据
    console.log('\n=== 图片数据 ===');
    const [rows] = await db.query(`
      SELECT i.id, i.url, i.source_url, CHAR_LENGTH(i.thumbnail) AS thumbnail_len,
             i.upload_task_id, i.upload_status, i.upload_error, i.description, i.prompt,
             i.category_id, c.name AS category_name,
             DATE_FORMAT(i.uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at
      FROM images i
      LEFT JOIN categories c ON i.category_id = c.id
    `);
    console.table(rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

checkImagesTable();

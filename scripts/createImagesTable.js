const db = require('../config/db');

async function createImagesTable() {
  try {
    console.log('开始创建图片表...\n');

    // 创建表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`images\` (
        \`id\`          INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '图片ID',
        \`url\`         VARCHAR(500)    NOT NULL COMMENT '图片URL',
        \`description\` VARCHAR(500)    DEFAULT NULL COMMENT '图片描述',
        \`prompt\`      TEXT            DEFAULT NULL COMMENT '提示词',
        \`category_id\` INT UNSIGNED    DEFAULT NULL COMMENT '分类ID',
        \`uploaded_at\` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
        \`created_at\`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_category_id\` (\`category_id\`),
        INDEX \`idx_uploaded_at\` (\`uploaded_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图片库表'
    `;

    await db.query(createTableSQL);
    console.log('✅ 图片表创建成功');

    // 插入示例数据
    const insertSQL = `
      INSERT INTO \`images\` (\`url\`, \`description\`, \`prompt\`, \`category_id\`) VALUES
      ('https://example.com/image1.jpg', '示例图片1', 'a beautiful landscape', 1),
      ('https://example.com/image2.jpg', '示例图片2', 'a cute cat', 2),
      ('https://example.com/image3.jpg', '示例图片3', 'modern architecture', 1)
    `;

    await db.query(insertSQL);
    console.log('✅ 示例数据插入成功');

    console.log('\n✅ 图片表创建完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createImagesTable();

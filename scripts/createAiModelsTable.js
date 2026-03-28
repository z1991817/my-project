const db = require('../src/config/db').default || require('../src/config/db');

async function createAiModelsTable() {
  try {
    console.log('Creating ai_models table...\n');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`ai_models\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(100) NOT NULL COMMENT 'model name',
        \`model_key\` VARCHAR(100) DEFAULT NULL COMMENT 'model key',
        \`manufacturer\` VARCHAR(100) DEFAULT NULL COMMENT 'model manufacturer',
        \`description\` VARCHAR(500) DEFAULT NULL COMMENT 'model description',
        \`aspect_ratio\` VARCHAR(255) DEFAULT NULL COMMENT 'comma separated aspect ratios',
        \`status\` TINYINT NOT NULL DEFAULT 1 COMMENT '1 visible, 0 hidden',
        \`consume_points\` INT NOT NULL DEFAULT 0 COMMENT 'points cost',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_name\` (\`name\`),
        KEY \`idx_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ai model config'
    `;

    await db.query(createTableSQL);
    await db.query("ALTER TABLE `ai_models` MODIFY COLUMN `aspect_ratio` VARCHAR(255) DEFAULT NULL COMMENT 'comma separated aspect ratios'");

    const [modelKeyColumns] = await db.query("SHOW COLUMNS FROM `ai_models` LIKE 'model_key'");
    if (!Array.isArray(modelKeyColumns) || modelKeyColumns.length === 0) {
      await db.query("ALTER TABLE `ai_models` ADD COLUMN `model_key` VARCHAR(100) DEFAULT NULL COMMENT 'model key' AFTER `name`");
    }

    const [manufacturerColumns] = await db.query("SHOW COLUMNS FROM `ai_models` LIKE 'manufacturer'");
    if (!Array.isArray(manufacturerColumns) || manufacturerColumns.length === 0) {
      await db.query("ALTER TABLE `ai_models` ADD COLUMN `manufacturer` VARCHAR(100) DEFAULT NULL COMMENT 'model manufacturer' AFTER `name`");
    }

    const [columns] = await db.query("SHOW COLUMNS FROM `ai_models` LIKE 'status'");
    if (!Array.isArray(columns) || columns.length === 0) {
      await db.query("ALTER TABLE `ai_models` ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1 visible, 0 hidden' AFTER `aspect_ratio`");
    }

    const [indexes] = await db.query("SHOW INDEX FROM `ai_models` WHERE Key_name = 'idx_status'");
    if (!Array.isArray(indexes) || indexes.length === 0) {
      await db.query('ALTER TABLE `ai_models` ADD KEY `idx_status` (`status`)');
    }

    console.log('ai_models table is ready');
    process.exit(0);
  } catch (error) {
    console.error('Create table failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAiModelsTable();

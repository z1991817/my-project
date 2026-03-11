const db = require('../config/db');

async function migrateThumbnailColumn() {
  try {
    const tableName = process.env.DB_NAME;
    const [rows] = await db.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ?
         AND TABLE_NAME = 'images'
         AND COLUMN_NAME IN ('thumbnail_base64', 'thumbnail')`,
      [tableName]
    );

    const names = new Set(rows.map((r) => r.COLUMN_NAME));
    const hasOld = names.has('thumbnail_base64');
    const hasNew = names.has('thumbnail');

    if (hasNew && !hasOld) {
      console.log('thumbnail column already migrated.');
      process.exit(0);
    }

    if (hasOld && !hasNew) {
      await db.query(
        "ALTER TABLE `images` CHANGE COLUMN `thumbnail_base64` `thumbnail` MEDIUMTEXT DEFAULT NULL COMMENT '缩略图base64(268x358)'"
      );
      console.log('thumbnail column renamed: thumbnail_base64 -> thumbnail');
      process.exit(0);
    }

    if (!hasOld && !hasNew) {
      await db.query(
        "ALTER TABLE `images` ADD COLUMN `thumbnail` MEDIUMTEXT DEFAULT NULL COMMENT '缩略图base64(268x358)' AFTER `source_url`"
      );
      console.log('thumbnail column added: thumbnail');
      process.exit(0);
    }

    console.log('Both thumbnail and thumbnail_base64 exist. Manual cleanup recommended.');
    process.exit(0);
  } catch (error) {
    console.error('migrate thumbnail column failed:', error.message);
    process.exit(1);
  }
}

migrateThumbnailColumn();

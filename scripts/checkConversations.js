/**
 * 检查对话记录
 */
const Conversation = require('../models/conversation');

async function checkConversations() {
  try {
    const db = require('../config/db');

    // 查询最近的对话记录
    const [rows] = await db.query(`
      SELECT id, session_id, role,
             CHAR_LENGTH(content) as content_length,
             LEFT(content, 100) as content_preview,
             created_at
      FROM conversations
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('最近10条对话记录：');
    console.log('='.repeat(100));
    rows.forEach((row, index) => {
      console.log(`\n[${index + 1}] ID: ${row.id}`);
      console.log(`    Session: ${row.session_id}`);
      console.log(`    Role: ${row.role}`);
      console.log(`    Content Length: ${row.content_length}`);
      console.log(`    Preview: ${row.content_preview}`);
      console.log(`    Created: ${row.created_at}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkConversations();

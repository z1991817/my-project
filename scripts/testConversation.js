/**
 * =====================================================
 * 对话功能测试脚本
 * =====================================================
 * 用途：测试多轮对话功能是否正常工作
 * 使用方法：node scripts/testConversation.js
 * =====================================================
 */

const Conversation = require('../models/conversation');
const { randomUUID } = require('crypto');

/**
 * 测试对话模型的基本功能
 */
async function testConversationModel() {
  console.log('========================================');
  console.log('开始测试对话模型');
  console.log('========================================\n');

  const sessionId = randomUUID();
  console.log(`生成测试会话ID: ${sessionId}\n`);

  try {
    // 测试1：创建用户消息
    console.log('测试1：创建用户消息');
    const userId1 = await Conversation.create(sessionId, 'user', '小猫飞翔，比例9:16', null);
    console.log(`✅ 创建成功，记录ID: ${userId1}\n`);

    // 测试2：创建 AI 回复消息（模拟完整返回内容）
    console.log('测试2：创建 AI 回复消息');
    const aiContent = `\`\`\`json
{
  "prompt": "小猫飞翔，比例9:16",
  "ratio": "9:16",
  "n": 1
}
\`\`\`

> ID: \`${randomUUID()}\`
> 🕐 排队中.
> ⚡ 生成中.....
> 🏃‍ 进度 72..100
> ✅ 生成完成

![image](https://example.com/image.png)

[点击下载](https://example.com/download.png)`;

    const assistantId1 = await Conversation.create(sessionId, 'assistant', aiContent, null);
    console.log(`✅ 创建成功，记录ID: ${assistantId1}\n`);

    // 测试3：追加第二轮对话
    console.log('测试3：追加第二轮对话');
    const userId2 = await Conversation.create(sessionId, 'user', '把背景改成夜空', null);
    console.log(`✅ 创建成功，记录ID: ${userId2}\n`);

    // 测试4：查询会话历史
    console.log('测试4：查询会话历史');
    const history = await Conversation.getBySessionId(sessionId, 10);
    console.log(`✅ 查询成功，共 ${history.length} 条记录`);
    history.forEach((record, index) => {
      console.log(`  [${index + 1}] ${record.role}: ${record.content.substring(0, 50)}...`);
    });
    console.log('');

    // 测试5：检查会话是否存在
    console.log('测试5：检查会话是否存在');
    const exists = await Conversation.exists(sessionId);
    console.log(`✅ 会话存在: ${exists}\n`);

    // 测试6：统计会话消息数量
    console.log('测试6：统计会话消息数量');
    const count = await Conversation.countBySessionId(sessionId);
    console.log(`✅ 消息数量: ${count}\n`);

    // 测试7：获取统计信息
    console.log('测试7：获取统计信息');
    const stats = await Conversation.getStats();
    console.log(`✅ 统计信息:`, stats);
    console.log('');

    // 测试8：清理测试数据
    console.log('测试8：清理测试数据');
    const deleted = await Conversation.deleteBySessionId(sessionId);
    console.log(`✅ 删除成功，共删除 ${deleted} 条记录\n`);

    console.log('========================================');
    console.log('✅ 所有测试通过！');
    console.log('========================================');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// 运行测试
testConversationModel();

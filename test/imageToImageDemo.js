const axios = require('axios');
require('dotenv').config();

/**
 * 图生图接口 Demo 测试
 * 测试 /chat/completions 端点的图生图功能
 */

async function testImageToImage() {
  console.log('=== 开始测试图生图接口 ===\n');

  // 1. 检查环境变量
  if (!process.env.TEST_BASE_URL) {
    console.error('❌ 缺少环境变量: TEST_BASE_URL');
    return;
  }
  if (!process.env.TEST_API_KEY) {
    console.error('❌ 缺少环境变量: TEST_API_KEY');
    return;
  }

  console.log('✅ 环境变量检查通过');
  console.log('API地址:', process.env.TEST_BASE_URL);
  console.log('');

  // 2. 模拟前端传入的参数
  const frontendParams = {
    prompt: '美化一下这张图片,加上 我爱中国 四个字',
    size: '4:3',
    imageUrl: [
      'https://picsum.photos/400/300',
      'https://picsum.photos/500/400'
    ]
  };

  console.log('前端入参:', JSON.stringify(frontendParams, null, 2));
  console.log('');

  // 3. 将size拼接到prompt中
  const finalPrompt = `${frontendParams.prompt} 尺寸[${frontendParams.size}]`;
  console.log('最终提示词:', finalPrompt);
  console.log('');

  // 4. 构建content数组（文本 + 多张图片）
  const content = [
    {
      type: 'text',
      text: finalPrompt
    }
  ];

  // 添加所有图片URL
  frontendParams.imageUrl.forEach(url => {
    content.push({
      type: 'image_url',
      image_url: {
        url: url
      }
    });
  });

  // 5. 构建完整的请求参数
  const requestData = {
    model: 'gpt-image-1.5-all',
    stream: false,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    messages: [
      {
        role: 'user',
        content: content
      }
    ]
  };

  console.log('第三方API请求参数:');
  console.log(JSON.stringify(requestData, null, 2));
  console.log('');

  // 6. 发送请求
  try {
    console.log('正在调用API...');
    const startTime = Date.now();

    const response = await axios.post(
      `${process.env.TEST_BASE_URL}/chat/completions`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_API_KEY}`
        },
        timeout: 0
      }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ API调用成功 (耗时: ${duration}ms)`);
    console.log('');

    // 5. 打印响应
    console.log('=== 完整响应 ===');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    // 6. 分析响应结构
    console.log('=== 响应分析 ===');
    console.log('响应状态:', response.status);
    console.log('响应数据类型:', typeof response.data);

    if (response.data.choices && response.data.choices.length > 0) {
      console.log('✅ 找到 choices 数组');
      const firstChoice = response.data.choices[0];
      console.log('第一个choice:', JSON.stringify(firstChoice, null, 2));

      if (firstChoice.message) {
        console.log('✅ 找到 message 对象');
        console.log('message.content:', firstChoice.message.content);

        // 尝试提取图片URL
        const content = firstChoice.message.content;
        if (typeof content === 'string') {
          // 如果content是字符串,可能直接是URL
          console.log('');
          console.log('🎯 提取到的内容(字符串):', content);

          // 检查是否是URL
          if (content.startsWith('http')) {
            console.log('✅ 这是一个URL,可以直接使用');
          }
        } else if (Array.isArray(content)) {
          // 如果content是数组,查找image_url类型
          console.log('');
          console.log('🎯 content是数组,包含', content.length, '个元素');
          content.forEach((item, index) => {
            console.log(`元素${index}:`, JSON.stringify(item, null, 2));
            if (item.type === 'image_url' && item.image_url) {
              console.log('✅ 找到图片URL:', item.image_url.url);
            }
          });
        }
      }
    }

    if (response.data.data) {
      console.log('✅ 找到 data 字段');
      console.log('data:', JSON.stringify(response.data.data, null, 2));
    }

  } catch (error) {
    console.error('❌ API调用失败');
    console.error('错误信息:', error.message);

    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n=== 测试结束 ===');
}

// 运行测试
testImageToImage().catch(console.error);

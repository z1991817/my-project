const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const BASE_URL = 'http://localhost:3000';

// 生成测试 Token
const testUser = { id: 1, username: '测试', email: 'test@example.com' };
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

async function testImageToImage() {
  console.log('=== 测试 image-to-image 接口 ===\n');

  const testData = {
    prompt: '把小猫换成小狗',
    size: '1024x1792',
    imageUrl: ['https://pro.filesystem.site/cdn/20260314/b72e49b1303aa473e9dbdb45996f4d.png'],
    uploadToCos: true,
    useStream: true,
    compressBeforeUpload: true,
    compressQuality: 72
  };

  console.log('请求参数:', JSON.stringify(testData, null, 2));
  console.log('\n发送请求...\n');

  try {
    const response = await axios.post(
      `${BASE_URL}/app/image-to-image`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ 请求成功!');
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ 请求失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误:', error.message);
    }
  }
}

testImageToImage();

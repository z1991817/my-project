const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

// 测试用户信息
const testUser = {
  id: 1,
  username: '测试',
  nickname: '测试用户',
  email: 'test@example.com',
};

// 生成 Token（7天有效期）
const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });

console.log('=== 测试用户 Token ===\n');
console.log('用户信息:');
console.log('  ID:', testUser.id);
console.log('  用户名:', testUser.username);
console.log('  昵称:', testUser.nickname);
console.log('  邮箱:', testUser.email);
console.log('\nJWT Token (7天有效):');
console.log(token);
console.log('\n使用方式:');
console.log('  Header: Authorization: Bearer ' + token);
console.log('\n验证 Token:');
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('  ✅ Token 有效');
  console.log('  解码后:', decoded);
} catch (error) {
  console.log('  ❌ Token 无效:', error.message);
}

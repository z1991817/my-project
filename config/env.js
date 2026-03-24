const required = ['JWT_SECRET', 'DB_PASSWORD', 'DB_NAME', 'DB_HOST', 'DB_USER'];

required.forEach(key => {
  if (!process.env[key] || process.env[key].includes('change_this')) {
    throw new Error(`❌ 环境变量 ${key} 未设置或使用默认值`);
  }
});

console.log('✅ 环境变量检查通过');

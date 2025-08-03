require('dotenv').config({ path: './.env' });
const doubaoService = require('./services/doubaoService');

async function testConnection() {
  try {
    console.log('测试豆包API连接...');
    const result = await doubaoService.testConnection();
    console.log('测试结果:', result);
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testConnection();
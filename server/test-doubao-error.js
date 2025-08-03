require('dotenv').config({ path: './.env' });
const doubaoService = require('./services/doubaoService');

async function testErrorHandling() {
  try {
    console.log('测试豆包API错误处理...');
    const result = await doubaoService.extractExerciseAndFoodInfo('测试403错误');
    console.log('API响应:', result);
  } catch (error) {
    console.error('捕获到错误:', error.message);
    if (error.response) {
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', error.response.data);
    }
  }
}

testErrorHandling();
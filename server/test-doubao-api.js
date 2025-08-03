require('dotenv').config();
const doubaoService = require('./services/doubaoService');

async function testDoubaoAPI() {
  try {
    console.log('开始测试豆包API连接...');
    const testMessage = '我今天跑了30分钟，消耗了300卡路里';
    console.log(`测试消息: ${testMessage}`);

    const result = await doubaoService.extractExerciseAndFoodInfo(testMessage);
    console.log('API调用成功，结果:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('API调用失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
  }
}

testDoubaoAPI();
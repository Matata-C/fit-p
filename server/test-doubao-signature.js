require('dotenv').config({ path: './.env' });
const DoubaoService = require('./services/doubaoService');

async function testSignature() {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = DoubaoService.signRequest(timestamp);
    console.log('生成的签名:', signature);
    const result = await DoubaoService.extractExerciseAndFoodInfo('我今天早上吃了2个鸡蛋和一杯牛奶');
    console.log('API响应结果:', JSON.stringify(result, null, 2));
    
    return { success: true, message: '签名生成和API调用测试成功' };
  } catch (error) {
    console.error('测试失败:', error.message);
    return { success: false, message: error.message };
  }
}

testSignature();
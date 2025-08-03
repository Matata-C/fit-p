require('dotenv').config();
const doubaoService = require('./services/doubaoService');

async function testAIChat() {
  console.log('🚀 开始测试AI对话功能...');
  const testCases = [
    '我今天跑了5公里，消耗了300卡路里',
    '早餐吃了两个鸡蛋和一杯牛奶',
    '今天游泳了1小时，感觉很累',
    '午餐吃了150克鸡胸肉和一碗米饭',
    '做了30分钟瑜伽，放松身心'
  ];

  for (const [index, message] of testCases.entries()) {
    console.log(`\n--- 测试用例 ${index + 1}: ${message} ---`);

    try {
      const result = await doubaoService.extractExerciseAndFoodInfo(message);
      console.log('✅ 提取结果:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ 提取失败:', error.message);
    }
  }

  console.log('\n🏁 AI对话功能测试完成');
}

testAIChat();
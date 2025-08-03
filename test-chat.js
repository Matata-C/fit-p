const axios = require('axios');

async function testChat() {
  try {
    const response = await axios.post('http://localhost:3000/api/chat/process', {
      userId: 'test-user',
      message: '我今天跑步5公里，消耗了300卡路里，还吃了150克米饭和一个苹果'
    });
    
    console.log('聊天接口测试结果:', JSON.stringify(response.data, null, 2));
    console.log('响应头信息:', JSON.stringify(response.headers, null, 2));
    console.log('提取的数据:', JSON.stringify(response.data.extractedData, null, 2));
    if (response.data.healthAdvice && response.data.healthAdvice.length > 0) {
      console.log('健康建议:');
      response.data.healthAdvice.forEach(advice => console.log(`- ${advice}`));
    } else {
      console.log('未生成健康建议');
    }
  } catch (error) {
    console.error('聊天接口测试失败:', error.response?.data || error.message);
  }
}

testChat();
const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:3000';
  
  try {
    console.log('测试健康检查接口...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('健康检查响应:', healthResponse.data);
    console.log('\n测试豆包API连接...');
    const doubaoResponse = await axios.get(`${baseURL}/api/test-doubao`);
    console.log('豆包API测试响应:', doubaoResponse.data);
    console.log('\n测试聊天处理接口...');
    const chatResponse = await axios.post(`${baseURL}/api/chat/process`, {
      userId: 'test_user',
      message: '我今天早上跑了5公里，消耗了300卡路里'
    });
    console.log('聊天处理响应:', chatResponse.data);
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testAPI();
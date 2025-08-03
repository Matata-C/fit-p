const axios = require('axios');

async function testApiCall() {
  try {
    const response = await axios.post('http://localhost:3000/api/chat/process', {
      userId: 'test-user',
      message: '今天早餐吃了2个鸡蛋和一杯牛奶'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API调用成功:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('API调用失败:');
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

testApiCall();
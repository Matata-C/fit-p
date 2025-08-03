const axios = require('axios');

async function testChatAPI() {
  try {
    const response = await axios.post('http://localhost:3000/api/chat/process', {
      userId: 'test-user',
      message: '我今天跑了30分钟'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testChatAPI();
const axios = require('axios');

async function testAPI() {
  try {
    const response = await axios.post('http://localhost:3000/api/chat/process', {
      userId: 'test-user',
      message: '晚上去健身房做了45分钟力量训练，感觉很棒'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testAPI();
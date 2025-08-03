require('dotenv').config({ path: './.env' });
const axios = require('axios');
const DoubaoService = require('./services/doubaoService');

async function test403Error() {
  try {
    const response = await axios.post(
      'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      {},
      {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
          'X-Volc-AccessKey': 'invalid-key',
          'X-Volc-Signature': 'invalid-signature',
          'X-Volc-Timestamp': Math.floor(Date.now() / 1000)
        }
      }
    );
    console.log('意外成功:', response.data);
  } catch (error) {
    console.log('捕获到错误:', error.response?.data || error.message);
    console.log('错误状态码:', error.response?.status);
    if (error.response?.status === 403) {
      console.log('正确处理了403错误');
    } else {
      console.log('未正确处理403错误');
    }
  }
}

test403Error();
require('dotenv').config();

try {
  const service = require('./services/doubaoService');

  console.log('DoubaoService实例化成功');
  console.log('API Key:', service.apiKey);
  console.log('Secret Key:', service.secretKey);
  console.log('Endpoint:', service.endpoint);
} catch (error) {
  console.error('DoubaoService实例化失败:', error.message);
}
require('dotenv').config({ path: './.env' });

try {
  const DoubaoService = require('./services/doubaoService');
  
  console.log('豆包服务初始化成功');
  console.log('API Key:', DoubaoService.apiKey);
  console.log('Secret Key:', DoubaoService.secretKey);
  console.log('Endpoint:', DoubaoService.endpoint);
  console.log('Base URL:', DoubaoService.baseURL);
  if (!DoubaoService.apiKey) {
    console.error('API Key未正确初始化');
    process.exit(1);
  }
  
  if (!DoubaoService.endpoint) {
    console.error('Endpoint未正确初始化');
    process.exit(1);
  }
  
  console.log('豆包服务配置正确');
} catch (error) {
  console.error('豆包服务初始化失败:', error.message);
  process.exit(1);
}
require('dotenv').config({ path: './.env' });
const axios = require('axios');
const crypto = require('crypto');
const apiKey = process.env.DOUBAO_API_KEY;
const secretKey = process.env.DOUBAO_SECRET_KEY;
const endpoint = process.env.DOUBAO_ENDPOINT;
const baseURL = 'https://ark.cn-beijing.volces.com/api/v3';
if (!apiKey || !secretKey || !endpoint) {
  console.error('缺少必要的环境变量配置');
  process.exit(1);
}
function signRequest(timestamp) {
  const method = 'POST';
  const url = '/api/v3/chat/completions';
  const contentType = 'application/json';
  const date = new Date(timestamp * 1000).toISOString().replace(/[-:]/g, '').slice(0, 8);
  const xDate = new Date(timestamp * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const canonicalRequest = `${method}\n${url}\n\ncontent-type:${contentType}\nhost:ark.cn-beijing.volces.com\nx-volc-accesskey:${apiKey}\nx-volc-timestamp:${timestamp}`;
  const kDate = crypto.createHmac('sha256', 'AWS4' + secretKey).update(date).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update('cn-beijing').digest();
  const kService = crypto.createHmac('sha256', kRegion).update('ark').digest();
  const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
  const hashCanonical = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const credentialScope = `${date}/cn-beijing/ark/request`;
  const stringToSign = `HMAC-SHA256\n${xDate}\n${credentialScope}\n${hashCanonical}`;
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return signature;
}
function buildRequestBody() {
  return {
    model: endpoint,
    messages: [
      {
        role: 'system',
        content: `你是一个专业的健康数据提取助手。请从用户输入中提取锻炼和饮食信息。
        
请严格按照以下JSON格式返回：
{
  "exercise": {
    "type": "运动类型",
    "duration": 分钟数,
    "calories_burned": 消耗卡路里,
    "intensity": "低/中/高"
  },
  "food": {
    "name": "食物名称",
    "weight": 重量(克),
    "calories": 卡路里,
    "protein": 蛋白质(克),
    "carbs": 碳水化合物(克),
    "fat": 脂肪(克),
    "meal_time": "早餐/午餐/晚餐/加餐"
  },
  "confidence": 0.95,
  "message": "提取结果的描述"
}

如果没有相关信息，对应字段设为null。`
      },
      {
        role: 'user',
        content: 'I had 2 eggs and a glass of milk for breakfast today.'
      }
    ],
    max_tokens: 500,
    temperature: 0.3
  };
}

// 执行API调用
async function callAPI() {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signRequest(timestamp);
    const requestBody = buildRequestBody();
    
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Volc-AccessKey': apiKey,
      'X-Volc-Signature': signature,
      'X-Volc-Timestamp': timestamp
    };
    
    console.log('请求URL:', `${baseURL}/chat/completions`);
    console.log('请求头:', JSON.stringify(headers, null, 2));
    console.log('请求体:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      requestBody,
      { headers }
    );
    
    console.log('API响应状态码:', response.status);
    console.log('API响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('API调用失败:');
    console.error('错误状态码:', error.response?.status);
    console.error('错误数据:', JSON.stringify(error.response?.data, null, 2));
    console.error('错误消息:', error.message);
    
    if (error.response?.status === 403) {
      console.log('检测到403错误');
    }
    
    throw error;
  }
}

callAPI();
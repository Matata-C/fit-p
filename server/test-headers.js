require('dotenv').config();
const crypto = require('crypto');
const apiKey = process.env.DOUBAO_API_KEY;
const secretKey = process.env.DOUBAO_SECRET_KEY;

if (!apiKey || !secretKey) {
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
const timestamp = Math.floor(Date.now() / 1000);
const signature = signRequest(timestamp);
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'X-Volc-AccessKey': apiKey,
  'X-Volc-Signature': signature,
  'X-Volc-Timestamp': timestamp
};

console.log('请求头:');
console.log(JSON.stringify(headers, null, 2));
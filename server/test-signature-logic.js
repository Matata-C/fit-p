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
  
  console.log('时间戳:', timestamp);
  console.log('日期:', date);
  console.log('xDate:', xDate);
  
  const canonicalRequest = `${method}\n${url}\n\ncontent-type:${contentType}\nhost:ark.cn-beijing.volces.com\nx-volc-accesskey:${apiKey}\nx-volc-timestamp:${timestamp}`;
  console.log('规范请求:', canonicalRequest);
  
  const kDate = crypto.createHmac('sha256', 'AWS4' + secretKey).update(date).digest();
  console.log('kDate:', kDate.toString('hex'));
  
  const kRegion = crypto.createHmac('sha256', kDate).update('cn-beijing').digest();
  console.log('kRegion:', kRegion.toString('hex'));
  
  const kService = crypto.createHmac('sha256', kRegion).update('ark').digest();
  console.log('kService:', kService.toString('hex'));
  
  const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
  console.log('kSigning:', kSigning.toString('hex'));
  
  const hashCanonical = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  console.log('hashCanonical:', hashCanonical);
  
  const credentialScope = `${date}/cn-beijing/ark/request`;
  console.log('credentialScope:', credentialScope);
  
  const stringToSign = `HMAC-SHA256\n${xDate}\n${credentialScope}\n${hashCanonical}`;
  console.log('待签字符串:', stringToSign);
  
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  console.log('签名:', signature);

  return signature;
}

const timestamp = Math.floor(Date.now() / 1000);
signRequest(timestamp);
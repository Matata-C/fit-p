require('dotenv').config({ path: './.env' });

console.log('DOUBAO_API_KEY:', process.env.DOUBAO_API_KEY);
console.log('DOUBAO_SECRET_KEY:', process.env.DOUBAO_SECRET_KEY);
console.log('DOUBAO_ENDPOINT:', process.env.DOUBAO_ENDPOINT);

if (!process.env.DOUBAO_API_KEY) {
  console.error('缺少DOUBAO_API_KEY配置');
  process.exit(1);
}

if (!process.env.DOUBAO_SECRET_KEY) {
  console.error('缺少DOUBAO_SECRET_KEY配置');
  process.exit(1);
}

if (!process.env.DOUBAO_ENDPOINT) {
  console.error('缺少DOUBAO_ENDPOINT配置');
  process.exit(1);
}

console.log('所有配置都已正确加载');
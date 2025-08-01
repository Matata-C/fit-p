// 阿里云配置
module.exports = {
  // 阿里云访问密钥（请替换为你的实际密钥）
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || 'your_access_key_id',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || 'your_access_key_secret',
  
  // 图像识别服务配置
  endpoint: 'imagerecog.cn-shanghai.aliyuncs.com',
  regionId: 'cn-shanghai',
  
  // 支持的图像格式
  supportedFormats: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
  
  // 最大图片大小（字节）
  maxImageSize: 10 * 1024 * 1024, // 10MB
  
  // 识别超时时间（毫秒）
  timeout: 10000
} 
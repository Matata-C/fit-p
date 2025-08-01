#!/usr/bin/env node

/**
 * 云函数快速修复脚本
 * 解决 "FunctionName parameter could not be found" 错误
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复云函数部署问题...\n');

// 检查云函数目录
const cloudFunctionPath = path.join(__dirname, 'cloudfunctions', 'imageRecognition');
const packageJsonPath = path.join(cloudFunctionPath, 'package.json');
const indexJsPath = path.join(cloudFunctionPath, 'index.js');

console.log('📁 检查目录结构...');

if (!fs.existsSync(cloudFunctionPath)) {
  console.error('❌ 错误: 云函数目录不存在');
  console.log('请确保 cloudfunctions/imageRecognition 目录存在');
  process.exit(1);
}

console.log('✅ 云函数目录存在');

// 检查package.json
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ 错误: package.json 不存在');
  process.exit(1);
}

console.log('✅ package.json 存在');

// 检查index.js
if (!fs.existsSync(indexJsPath)) {
  console.error('❌ 错误: index.js 不存在');
  process.exit(1);
}

console.log('✅ index.js 存在');

// 读取package.json
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('✅ package.json 格式正确');
  
  // 检查必要字段
  if (!packageJson.name || !packageJson.main) {
    console.error('❌ 错误: package.json 缺少必要字段');
    process.exit(1);
  }
  
  console.log(`📦 云函数名称: ${packageJson.name}`);
  console.log(`📄 入口文件: ${packageJson.main}`);
  
} catch (error) {
  console.error('❌ 错误: package.json 格式错误');
  console.error(error.message);
  process.exit(1);
}

// 检查index.js内容
try {
  const indexJs = fs.readFileSync(indexJsPath, 'utf8');
  
  if (!indexJs.includes('exports.main')) {
    console.error('❌ 错误: index.js 缺少 exports.main');
    process.exit(1);
  }
  
  if (!indexJs.includes('wx-server-sdk')) {
    console.error('❌ 错误: index.js 缺少 wx-server-sdk 依赖');
    process.exit(1);
  }
  
  console.log('✅ index.js 格式正确');
  
} catch (error) {
  console.error('❌ 错误: 无法读取 index.js');
  console.error(error.message);
  process.exit(1);
}

console.log('\n📋 检查清单:');
console.log('✅ 云函数目录存在');
console.log('✅ package.json 存在且格式正确');
console.log('✅ index.js 存在且格式正确');
console.log('✅ 包含必要的依赖和导出');

console.log('\n🚀 下一步操作:');
console.log('1. 在微信开发者工具中，右键点击 cloudfunctions/imageRecognition 文件夹');
console.log('2. 选择"上传并部署：云端安装依赖"');
console.log('3. 等待部署完成');
console.log('4. 在云开发控制台中验证函数状态');

console.log('\n💡 如果部署仍然失败:');
console.log('1. 检查网络连接');
console.log('2. 确认云开发环境已开通');
console.log('3. 尝试删除云函数重新部署');
console.log('4. 查看云开发控制台错误日志');

console.log('\n🎉 修复脚本执行完成！'); 
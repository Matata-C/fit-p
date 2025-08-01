#!/bin/bash

# 阿里云图像识别云函数部署脚本

echo "🚀 开始部署阿里云图像识别云函数..."

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

echo "📦 安装依赖包..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "🔧 检查配置文件..."
if [ ! -f "config.js" ]; then
    echo "⚠️  警告: 未找到config.js配置文件"
    echo "请确保已正确配置阿里云访问密钥"
fi

echo "📋 部署检查清单:"
echo "1. ✅ Node.js环境检查"
echo "2. ✅ 依赖包安装"
echo "3. ⚠️  配置文件检查"
echo ""
echo "📝 下一步操作:"
echo "1. 在微信开发者工具中配置环境变量:"
echo "   ALIYUN_ACCESS_KEY_ID=你的AccessKey ID"
echo "   ALIYUN_ACCESS_KEY_SECRET=你的AccessKey Secret"
echo ""
echo "2. 在微信开发者工具中上传并部署云函数"
echo ""
echo "3. 测试云函数是否正常工作"
echo ""
echo "🎉 部署脚本执行完成!" 
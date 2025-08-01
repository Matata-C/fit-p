# 云函数部署指南

## 🚨 重要：解决云函数调用失败问题

### 问题原因
错误 `FunctionName parameter could not be found` 表示云函数未正确部署。

### 解决步骤

#### 1. 检查云开发环境
1. 打开微信开发者工具
2. 确保已开通云开发服务
3. 检查云开发环境ID是否正确

#### 2. 安装依赖
在云函数目录下执行：
```bash
cd cloudfunctions/imageRecognition
npm install
```

#### 3. 部署云函数
1. 在微信开发者工具中，右键点击 `cloudfunctions/imageRecognition` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成

#### 4. 验证部署
1. 打开云开发控制台
2. 进入"云函数"页面
3. 确认 `imageRecognition` 函数已部署
4. 检查函数状态为"正常"

#### 5. 配置环境变量（可选）
如果需要使用阿里云AI功能：
1. 在云开发控制台中，进入云函数详情
2. 添加环境变量：
   - `ALIYUN_ACCESS_KEY_ID`: 你的阿里云AccessKey ID
   - `ALIYUN_ACCESS_KEY_SECRET`: 你的阿里云AccessKey Secret

#### 6. 测试云函数
1. 在云开发控制台中测试函数
2. 使用以下测试数据：
```json
{
  "action": "getFoodList"
}
```

### 常见问题

#### Q: 部署失败怎么办？
A: 
1. 检查网络连接
2. 确认云开发环境正常
3. 删除云函数重新部署

#### Q: 依赖安装失败？
A:
1. 检查Node.js版本（建议14+）
2. 清除npm缓存：`npm cache clean --force`
3. 删除node_modules重新安装

#### Q: 函数调用超时？
A:
1. 检查云函数超时设置
2. 优化代码逻辑
3. 使用备用识别逻辑

### 调试方法

#### 1. 查看云函数日志
1. 在云开发控制台中查看函数日志
2. 检查错误信息和执行时间

#### 2. 本地测试
```javascript
// 在云函数中测试
exports.main = async (event, context) => {
  console.log('测试函数被调用');
  return {
    success: true,
    message: '云函数部署成功'
  };
};
```

#### 3. 前端调试
```javascript
// 在前端测试云函数调用
wx.cloud.callFunction({
  name: 'imageRecognition',
  data: { action: 'getFoodList' },
  success: (res) => {
    console.log('调用成功:', res);
  },
  fail: (err) => {
    console.error('调用失败:', err);
  }
});
```

### 部署检查清单
- [ ] 云开发环境已开通
- [ ] 云函数目录结构正确
- [ ] package.json配置正确
- [ ] 依赖已安装
- [ ] 云函数已部署
- [ ] 环境变量已配置（可选）
- [ ] 函数测试通过

### 联系支持
如果问题仍然存在，请：
1. 查看云开发控制台错误日志
2. 检查网络连接
3. 联系微信开发者支持 
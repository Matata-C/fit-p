# 🚀 快速启动指南

## 豆包API已配置完成！

### ✅ 配置状态
- **API密钥**: api-key-20250731224945 ✅
- **推理接入点**: ep-20250731225431-gtq5q ✅
- **服务地址**: https://ark.cn-beijing.volces.com/api/v3 ✅

### 🛠️ 立即启动

**步骤1：安装依赖**
```bash
cd d:\GitHub\fit-p\server
npm install
```

**步骤2：启动服务**
```bash
# 开发模式
npm run dev

# 或生产模式
npm start
```

**步骤3：测试API**
```bash
# 测试豆包API连接
node test-doubao.js

# 测试健康检查
curl http://localhost:3000/health
```

### 📡 API接口

**AI对话处理**
```
POST http://localhost:3000/api/chat/process
Content-Type: application/json

{
  "userId": "user123",
  "message": "我今天跑了30分钟"
}
```

**获取锻炼记录**
```
GET http://localhost:3000/api/exercise/records/user123
```

**获取饮食记录**
```
GET http://localhost:food/records/user123
```

### 🔗 微信小程序集成

在小程序中使用：
```javascript
const api = require('./wechat-integration.js');

const result = await api.sendChatMessage('user123', '我今天跑了30分钟');

if (result.data.hasExercise) {
  console.log('锻炼记录已自动保存');
}
```

### 🐳 Docker部署

```bash
docker-compose up -d
docker-compose logs -f app
```

### 📊 测试示例

**AI理解示例：**
- ✅ "我今天早上跑了30分钟，消耗了300卡路里" → 自动识别为锻炼记录
- ✅ "午餐吃了200克鸡胸肉，大概400卡路里" → 自动识别为饮食记录
- ✅ "晚上去健身房做了45分钟力量训练" → 自动识别运动类型和时长

**服务已就绪，立即启动体验AI对话功能！**
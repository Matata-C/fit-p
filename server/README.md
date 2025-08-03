基于豆包API的AI对话后端服务，自动提取用户对话中的锻炼和饮食信息并记录到数据库。

- 🤖 **AI信息提取**：使用豆包API自动识别锻炼和饮食信息
- 🏃‍♂️ **锻炼记录**：记录运动类型、时长、强度、消耗卡路里
- 🍎 **饮食记录**：记录食物名称、重量、营养成分、卡路里
- 📊 **数据查询**：支持按用户和时间查询记录
- 🗑️ **记录管理**：支持删除记录

- **后端框架**：Node.js + Express
- **数据库**：MySQL
- **AI服务**：豆包API（火山引擎）
- **HTTP客户端**：Axios
- **环境管理**：dotenv

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fitness_app
DOUBAO_API_KEY=your_doubao_api_key
```

### 3. 初始化数据库

```bash
# 方法1：使用SQL脚本
mysql -u root -p < init-db.sql

# 方法2：自动初始化（首次启动时）
npm start
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API接口文档

### 处理AI对话
```http
POST /api/chat/process
Content-Type: application/json

{
  "userId": "user123",
  "message": "我今天早上跑了30分钟，消耗了300卡路里"
}
```

### 获取锻炼记录
```http
GET /api/exercise-records/:userId?date=2024-01-15&limit=10
```

### 获取饮食记录
```http
GET /api/food-records/:userId?date=2024-01-15&limit=10
```

### 删除记录
```http
DELETE /api/records/:type/:id
Content-Type: application/json

{
  "userId": "user123"
}
```

## 豆包API配置

1. 注册火山引擎账号：https://console.volcengine.com
2. 开通ARK服务
3. 获取API密钥：https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey
4. 在 `.env` 中配置 `DOUBAO_API_KEY`

## 数据库结构

### exercise_records 表
- `id`：主键
- `user_id`：用户ID
- `exercise_type`：运动类型
- `duration`：持续时间（分钟）
- `calories_burned`：消耗卡路里
- `intensity`：强度（低/中/高）
- `exercise_date`：运动时间

### food_records 表
- `id`：主键
- `user_id`：用户ID
- `food_name`：食物名称
- `weight`：重量（克）
- `calories`：卡路里
- `protein`：蛋白质（克）
- `carbs`：碳水化合物（克）
- `fat`：脂肪（克）
- `meal_time`：用餐时间

## 错误处理

所有API返回统一格式：
```json
{
  "success": true/false,
  "message": "提示信息",
  "data": {...}
}
```

## 微信小程序集成

在微信小程序中使用：

```javascript
// 发送AI对话
wx.request({
  url: 'http://localhost:3000/api/chat/process',
  method: 'POST',
  data: {
    userId: wx.getStorageSync('userId'),
    message: '我今天吃了两个苹果'
  },
  success: (res) => {
    console.log('AI处理结果:', res.data);
  }
});
```

### 微信小程序域名配置注意事项

1. 在部署到生产环境后，请确保将代码中的服务器地址从 `http://localhost:3000` 修改为您的实际服务器地址。
   - 对于微信小程序集成，修改 `server/wechat-integration.js` 文件中的默认 URL。
   
2. 在微信小程序后台，您需要将服务器域名添加到合法域名列表中：
   - 登录微信公众平台
   - 进入"开发管理" -> "开发设置" -> "服务器域名"
   - 添加 `request合法域名`，格式为 `https://your-domain.com`
   - 注意：域名必须使用 HTTPS 协议，并且需要经过 ICP 备案

3. 如果使用本地开发环境测试，可以在微信开发者工具中关闭"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"选项。

## 部署说明

### 使用PM2部署
```bash
npm install -g pm2
pm2 start app.js --name "fitness-ai-server"
pm2 save
pm2 startup
```

### Docker部署
```bash
docker build -t fitness-ai-server .
docker run -d -p 3000:3000 --env-file .env fitness-ai-server
```
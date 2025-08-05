const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const chatRoutes = require('./routes/chat');
const exerciseRoutes = require('./routes/exercise');
const foodRoutes = require('./routes/food');
const ttsRoutes = require('./routes/tts');
const doubaoService = require('./services/doubaoService');
const { pool } = require('./db');

const app = express();
if (!global.PORT) {
  global.PORT = process.env.PORT || 3001;
}
const PORT = global.PORT;


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 设置字符编码为UTF-8
app.use((req, res, next) => {
  req.setEncoding('utf8');
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

async function initDatabase() {
  try {
    const connection = await pool.getConnection();

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exercise_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        exercise_type VARCHAR(100) NOT NULL,
        duration INT NOT NULL,
        calories_burned INT NOT NULL,
        intensity ENUM('低', '中', '高') DEFAULT '中',
        exercise_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_date (user_id, exercise_date)
      )
    `);
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS food_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        food_name VARCHAR(255) NOT NULL,
        weight INT NOT NULL,
        calories INT NOT NULL,
        protein DECIMAL(5,2) DEFAULT 0,
        carbs DECIMAL(5,2) DEFAULT 0,
        fat DECIMAL(5,2) DEFAULT 0,
        meal_time ENUM('早餐', '午餐', '晚餐', '加餐') DEFAULT '午餐',
        meal_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_date (user_id, meal_date)
      )
    `);

    console.log('数据库初始化成功');
    connection.release();
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-doubao', async (req, res) => {
  try {
    const result = await doubaoService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.use('/api/chat', chatRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/tts', ttsRoutes);

app.use((error, req, res, next) => {
  console.error('错误:', error);
  res.status(500).json({
    success: false,
    message: error.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 服务器启动成功！`);
    console.log(`📍 端口: ${PORT}`);
    console.log(`🔗 本地访问: http://localhost:${PORT}`);
    console.log(`📚 API文档: http://localhost:${PORT}/health`);
  });
}

module.exports = { app, pool, startServer };

if (require.main === module) {
  startServer();
}
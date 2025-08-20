const mysql = require('mysql2/promise');
const console = require('console');

// 数据库连接配置
const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
let pool = mysql.createPool(config);
let isConnected = false;

// 测试数据库连接
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功！');
    connection.release();
    isConnected = true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.warn('⚠️ 应用将以无数据库模式运行，某些功能可能不可用');
    isConnected = false;
  }
}

// 尝试重新连接数据库
async function reconnectDatabase() {
  if (isConnected) return true;

  try {
    console.log('🔄 尝试重新连接数据库...');
    pool = mysql.createPool(config);
    await testDatabaseConnection();
    return isConnected;
  } catch (error) {
    console.error('❌ 数据库重新连接失败:', error.message);
    return false;
  }
}

// 获取数据库连接（带自动重连）
async function getConnection() {
  if (!isConnected) {
    await reconnectDatabase();
  }

  if (isConnected) {
    try {
      return await pool.getConnection();
    } catch (error) {
      console.error('❌ 获取数据库连接失败:', error.message);
      isConnected = false;
      throw error;
    }
  }

  // 如果仍然没有连接，返回null
  return null;
}

// 初始化数据库连接
testDatabaseConnection();

module.exports = {
  pool,
  getConnection,
  isConnected: () => isConnected
};
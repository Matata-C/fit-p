const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fitness_app',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    
    const [rows] = await connection.execute('SHOW DATABASES');
    console.log('数据库列表:', rows);
    
    connection.release();
    await pool.end();
  } catch (error) {
    console.error('数据库连接失败:', error.message);
  }
}

testConnection();
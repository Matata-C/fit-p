const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDBConnection() {
  try {
    console.log('正在测试数据库连接...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
    console.log('DB_NAME:', process.env.DB_NAME);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fitness_app'
    });

    console.log('✅ 数据库连接成功!');
    const [rows] = await connection.execute('SELECT 1 as connected');
    console.log('✅ 数据库查询测试成功:', rows[0]);

    await connection.end();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误详情:', error);
  }
}

testDBConnection();
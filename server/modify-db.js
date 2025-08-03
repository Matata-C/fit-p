const mysql = require('mysql2/promise');
require('dotenv').config();

async function modifyDB() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root123',
      database: process.env.DB_NAME || 'fitness_app',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('正在修改food_records表结构...');
    await pool.execute("ALTER TABLE food_records MODIFY weight DECIMAL(10,2) NULL;");
    console.log('表结构修改成功');
    
    await pool.end();
  } catch (error) {
    console.error('修改表结构失败:', error.message);
    process.exit(1);
  }
}

modifyDB();
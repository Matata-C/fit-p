const mysql = require('mysql2/promise');

async function queryDB() {
  try {
    // 创建数据库连接
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root123',
      database: 'fitness_app'
    });

    // 查询最新的5条运动记录
    const [exerciseRows] = await connection.execute(
      'SELECT * FROM exercise_records WHERE user_id=? ORDER BY exercise_date DESC LIMIT 5',
      ['test-user']
    );
    
    console.log('最新运动记录:');
    console.table(exerciseRows);

    // 查询最新的5条饮食记录
    const [foodRows] = await connection.execute(
      'SELECT * FROM food_records WHERE user_id=? ORDER BY meal_time DESC LIMIT 5',
      ['test-user']
    );
    
    console.log('最新饮食记录:');
    console.table(foodRows);

    // 关闭连接
    await connection.end();
  } catch (error) {
    console.error('数据库查询失败:', error.message);
  }
}

queryDB();
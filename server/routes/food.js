const express = require('express');
const router = express.Router();

router.get('/records/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, limit = 10, page = 1 } = req.query;

    const pool = require('../app').pool;

    let query = 'SELECT * FROM food_records WHERE user_id = ?';
    let params = [userId];

    if (date) {
      query += ' AND DATE(meal_date) = ?';
      params.push(date);
    }

    query += ' ORDER BY meal_date DESC LIMIT ? OFFSET ?';
    const offset = (page - 1) * limit;
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: rows.length
      }
    });

  } catch (error) {
    console.error('获取饮食记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取饮食记录失败'
    });
  }
});

router.post('/records', async (req, res) => {
  try {
    const { userId, food_name, weight, calories, protein = 0, carbs = 0, fat = 0, meal_time } = req.body;

    if (!userId || !food_name || !weight || !calories) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const pool = require('../app').pool;

    const [result] = await pool.execute(
      `INSERT INTO food_records 
       (user_id, food_name, weight, calories, protein, carbs, fat, meal_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, food_name, weight, calories, protein, carbs, fat, meal_time || '午餐']
    );

    const [record] = await pool.execute(
      'SELECT * FROM food_records WHERE id = ?',
      [result.insertId]
    );

    res.json({
      success: true,
      message: '饮食记录添加成功',
      data: record[0]
    });

  } catch (error) {
    console.error('添加饮食记录失败:', error);
    res.status(500).json({
      success: false,
      message: '添加饮食记录失败'
    });
  }
});

router.delete('/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少用户ID'
      });
    }

    const pool = require('../app').pool;

    const [result] = await pool.execute(
      'DELETE FROM food_records WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '记录不存在或无权删除'
      });
    }

    res.json({
      success: true,
      message: '饮食记录删除成功'
    });

  } catch (error) {
    console.error('删除饮食记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除饮食记录失败'
    });
  }
});

router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const pool = require('../app').pool;

    let query = `
      SELECT 
        COUNT(*) as total_records,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fat) as total_fat,
        meal_time,
        COUNT(*) as meal_count
      FROM food_records 
      WHERE user_id = ?
    `;

    let params = [userId];

    if (startDate && endDate) {
      query += ' AND DATE(meal_date) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' GROUP BY meal_time ORDER BY meal_count DESC';

    const [rows] = await pool.execute(query, params);

    const totalStats = await pool.execute(
      `SELECT 
        COUNT(*) as total_records,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fat) as total_fat
       FROM food_records 
       WHERE user_id = ? ${startDate && endDate ? 'AND DATE(meal_date) BETWEEN ? AND ?' : ''}`,
      startDate && endDate ? [userId, startDate, endDate] : [userId]
    );

    res.json({
      success: true,
      data: {
        total: totalStats[0][0],
        by_meal_time: rows
      }
    });

  } catch (error) {
    console.error('获取饮食统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取饮食统计失败'
    });
  }
});

router.get('/today-nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const pool = require('../app').pool;

    const [rows] = await pool.execute(
      `SELECT 
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fat) as total_fat
       FROM food_records 
       WHERE user_id = ? AND DATE(meal_date) = ?`,
      [userId, today]
    );

    res.json({
      success: true,
      data: rows[0] || {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0
      }
    });

  } catch (error) {
    console.error('获取今日营养失败:', error);
    res.status(500).json({
      success: false,
      message: '获取今日营养失败'
    });
  }
});

module.exports = router;
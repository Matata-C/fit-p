const express = require('express');
const router = express.Router();

router.get('/records/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, limit = 10, page = 1 } = req.query;

    const { pool } = require('../db');

    let query = 'SELECT * FROM exercise_records WHERE user_id = ?';
    let params = [userId];

    if (date) {
      query += ' AND DATE(exercise_date) = ?';
      params.push(date);
    }

    query += ' ORDER BY exercise_date DESC LIMIT ? OFFSET ?';
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
    console.error('获取锻炼记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取锻炼记录失败'
    });
  }
});

router.post('/records', async (req, res) => {
  try {
    const { userId, exercise_type, duration, calories_burned, intensity } = req.body;

    if (!userId || !exercise_type || !duration || !calories_burned) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const { pool } = require('../db');

    const [result] = await pool.execute(
      `INSERT INTO exercise_records 
       (user_id, exercise_type, duration, calories_burned, intensity) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, exercise_type, duration, calories_burned, intensity || '中']
    );

    const [record] = await pool.execute(
      'SELECT * FROM exercise_records WHERE id = ?',
      [result.insertId]
    );

    res.json({
      success: true,
      message: '锻炼记录添加成功',
      data: record[0]
    });

  } catch (error) {
    console.error('添加锻炼记录失败:', error);
    res.status(500).json({
      success: false,
      message: '添加锻炼记录失败'
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

    const { pool } = require('../db');

    const [result] = await pool.execute(
      'DELETE FROM exercise_records WHERE id = ? AND user_id = ?',
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
      message: '锻炼记录删除成功'
    });

  } catch (error) {
    console.error('删除锻炼记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除锻炼记录失败'
    });
  }
});

router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const { pool } = require('../db');

    let query = `
      SELECT 
        COUNT(*) as total_records,
        SUM(duration) as total_duration,
        SUM(calories_burned) as total_calories,
        exercise_type,
        COUNT(*) as type_count
      FROM exercise_records 
      WHERE user_id = ?
    `;

    let params = [userId];

    if (startDate && endDate) {
      query += ' AND DATE(exercise_date) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' GROUP BY exercise_type ORDER BY type_count DESC';

    const [rows] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        total_records: rows.reduce((sum, row) => sum + row.type_count, 0),
        total_duration: rows.reduce((sum, row) => sum + row.total_duration, 0),
        total_calories: rows.reduce((sum, row) => sum + row.total_calories, 0),
        by_type: rows
      }
    });

  } catch (error) {
    console.error('获取锻炼统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取锻炼统计失败'
    });
  }
});

module.exports = router;
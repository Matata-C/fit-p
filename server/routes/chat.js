const express = require('express');
const router = express.Router();
const doubaoService = require('../services/doubaoService');

router.post('/process', async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: userId 和 message'
      });
    }

    console.log(`处理用户 ${userId} 的消息: ${message}`);

    const extractedInfo = await doubaoService.extractExerciseAndFoodInfo(message);

    const result = {
      success: true,
      message: '信息提取成功',
      originalMessage: message,
      extractedData: extractedInfo,
      records: []
    };

    if (extractedInfo.exercise) {
      const exerciseRecord = await saveExerciseRecord(userId, extractedInfo.exercise);
      result.records.push({
        type: 'exercise',
        data: exerciseRecord
      });
    }

    if (extractedInfo.food) {
      const foodRecord = await saveFoodRecord(userId, extractedInfo.food);
      result.records.push({
        type: 'food',
        data: foodRecord
      });
    }

    if (result.records.length === 0) {
      result.message = '未检测到锻炼或饮食信息';
    }

    res.json(result);

  } catch (error) {
    console.error('处理AI对话失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '处理失败'
    });
  }
});

async function saveExerciseRecord(userId, exerciseData) {
  const pool = require('../app').pool;

  const [result] = await pool.execute(
    `INSERT INTO exercise_records 
     (user_id, exercise_type, duration, calories_burned, intensity) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      exerciseData.type,
      exerciseData.duration,
      exerciseData.calories_burned,
      exerciseData.intensity
    ]
  );

  return {
    id: result.insertId,
    ...exerciseData,
    exercise_date: new Date().toISOString()
  };
}

async function saveFoodRecord(userId, foodData) {
  const pool = require('../app').pool;

  const [result] = await pool.execute(
    `INSERT INTO food_records 
     (user_id, food_name, weight, calories, protein, carbs, fat, meal_time) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      foodData.name,
      foodData.weight,
      foodData.calories,
      foodData.protein,
      foodData.carbs,
      foodData.fat,
      foodData.meal_time
    ]
  );

  return {
    id: result.insertId,
    ...foodData,
    meal_date: new Date().toISOString()
  };
}

module.exports = router;
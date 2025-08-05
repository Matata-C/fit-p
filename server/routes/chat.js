const express = require('express');
const router = express.Router();
const doubaoService = require('../services/doubaoService');
const { pool } = require('../db');

// 解析 JSON 请求体（1MB 限制）
router.use(express.json({ limit: '1mb' }));

// 处理聊天信息请求
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

    // 调用外部服务提取运动和饮食信息
    const extractedInfo = await doubaoService.extractExerciseAndFoodInfo(message);

    const result = {
      success: true,
      message: '信息提取成功',
      originalMessage: message,
      extractedData: extractedInfo,
      records: []
    };

    // 保存运动记录（如有）
    if (extractedInfo.exercise?.type && extractedInfo.exercise.duration != null) {
      try {
        const exerciseRecord = await saveExerciseRecord(userId, extractedInfo.exercise);
        result.records.push({ type: 'exercise', data: exerciseRecord });
      } catch (saveError) {
        console.error('保存运动记录失败:', saveError);
        result.message += '，运动记录保存失败';
      }
    }

    // 保存饮食记录（如有）
    if (extractedInfo.food && (extractedInfo.food.name || extractedInfo.food.weight != null)) {
      try {
        const foodRecord = await saveFoodRecord(userId, extractedInfo.food);
        result.records.push({ type: 'food', data: foodRecord });
      } catch (saveError) {
        console.error('保存饮食记录失败:', saveError);
        result.message += '，饮食记录保存失败';
      }
    }

    // 根据保存情况调整返回消息
    result.message = result.records.length
      ? '信息提取并保存成功'
      : extractedInfo.exercise === null && extractedInfo.food === null
        ? '未检测到锻炼或饮食信息'
        : '信息提取成功';

    // 生成健康建议
    result.healthAdvice = generateHealthAdvice(extractedInfo);

    return res.json(result);
  } catch (error) {
    console.error('处理AI对话失败:', error);
    return res.status(500).json({
      success: false,
      message: error.message?.includes('API')
        ? 'AI服务暂时不可用，请稍后重试'
        : error.message || '处理失败'
    });
  }
});

// 保存运动记录
async function saveExerciseRecord(userId, exerciseData) {
  if (!exerciseData.type || exerciseData.duration == null) {
    throw new Error('运动记录缺少必要字段');
  }

  const caloriesBurned = exerciseData.calories_burned ?? 0;
  const intensity = exerciseData.intensity ?? null;

  const [result] = await pool.execute(
    `INSERT INTO exercise_records (user_id, exercise_type, duration, calories_burned, intensity)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, exerciseData.type, exerciseData.duration, caloriesBurned, intensity]
  );

  return {
    id: result.insertId,
    ...exerciseData,
    exercise_date: new Date().toISOString()
  };
}

// 保存饮食记录
async function saveFoodRecord(userId, foodData) {
  if (!foodData || (!foodData.name && foodData.weight == null)) {
    return null;
  }

  const [result] = await pool.execute(
    `INSERT INTO food_records (user_id, food_name, weight, calories, protein, carbs, fat, meal_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      foodData.name || null,
      foodData.weight != null ? foodData.weight : 100, // 默认100克避免null错误
      foodData.calories ?? null,
      foodData.protein ?? null,
      foodData.carbs ?? null,
      foodData.fat ?? null,
      foodData.meal_time || null
    ]
  );

  return {
    id: result.insertId,
    ...foodData,
    meal_date: new Date().toISOString()
  };
}

// 生成健康建议
function generateHealthAdvice(extractedInfo) {
  const advice = [];
  const exercise = extractedInfo.exercise;
  const food = extractedInfo.food;

  if (exercise) {
    const { type, duration, calories_burned } = exercise;
    if (type) {
      advice.push(`您今天进行了${duration ?? ''}分钟的${type}运动`);
      if (calories_burned) {
        advice.push(`消耗了约${calories_burned}卡路里`);
      }
      if (type.includes('跑步') || type.includes('快走')) {
        advice.push('跑步是很好的有氧运动，建议每周进行3-5次，每次30-60分钟');
      } else if (type.includes('游泳')) {
        advice.push('游泳对关节压力小，适合长期坚持');
      }
    }
  }

  if (food) {
    const { name, weight, calories } = food;
    if (name) {
      advice.push(`您今天摄入了${weight ?? ''}克${name}`);
      if (calories) {
        advice.push(`约含${calories}卡路里`);
      }
      if (name.includes('米饭') || name.includes('面食')) {
        advice.push('碳水化合物是能量的主要来源，但要注意适量摄入');
      } else if (name.includes('蔬菜')) {
        advice.push('蔬菜富含维生素和膳食纤维，建议每天摄入300-500克');
      }
    }
  }

  if (exercise && food) {
    advice.push('运动后适当补充蛋白质和碳水化合物有助于恢复');
  } else if (exercise && !food) {
    advice.push('运动后记得及时补充水分和营养');
  } else if (!exercise && food) {
    advice.push('建议每天保持30分钟以上的中等强度运动');
  }

  return advice;
}

module.exports = router;

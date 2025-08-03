const express = require('express');
const router = express.Router();
const doubaoService = require('../services/doubaoService');

// 添加字符编码中间件
router.use((req, res, next) => {
  req.setEncoding('utf8');
  next();
});

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
  if (extractedInfo.exercise && extractedInfo.exercise.type && extractedInfo.exercise.duration != null) {
    try {
      const exerciseRecord = await saveExerciseRecord(userId, extractedInfo.exercise);
      if (exerciseRecord) {
        result.records.push({
          type: 'exercise',
          data: exerciseRecord
        });
      }
    } catch (saveError) {
      console.error('保存运动记录失败:', saveError);
      result.message += '，运动记录保存失败';
    }
  }
  if (extractedInfo.food && (extractedInfo.food.name != null || extractedInfo.food.weight != null)) {
    try {
      const foodRecord = await saveFoodRecord(userId, extractedInfo.food);
      if (foodRecord) {
        result.records.push({
          type: 'food',
          data: foodRecord
        });
      }
    } catch (saveError) {
      console.error('保存饮食记录失败:', saveError);
      result.message += '，饮食记录保存失败';
    }
  }
    if (result.records.length === 0) {
      if (extractedInfo.exercise === null && extractedInfo.food === null) {
        result.message = '未检测到锻炼或饮食信息';
      } else {
        result.message = '信息提取成功';
      }
    } else {
      result.message = '信息提取并保存成功';
    }
    console.log('生成健康建议的输入:', JSON.stringify(extractedInfo, null, 2));
    result.healthAdvice = generateHealthAdvice(extractedInfo);
    console.log('生成的健康建议:', JSON.stringify(result.healthAdvice, null, 2));

    res.json(result);

  } catch (error) {
    console.error('处理AI对话失败:', error);
    if (error.message.includes('API')) {
      return res.status(500).json({
        success: false,
        message: 'AI服务暂时不可用，请稍后重试'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || '处理失败'
    });
  }
});

async function saveExerciseRecord(userId, exerciseData) {
  const pool = require('../app').pool;
  if (!exerciseData.type || exerciseData.duration == null) {
    throw new Error('运动记录缺少必要字段');
  }
  const caloriesBurned = exerciseData.calories_burned != null ? exerciseData.calories_burned : 0;
  const intensity = exerciseData.intensity || null;

  const [result] = await pool.execute(
    `INSERT INTO exercise_records 
     (user_id, exercise_type, duration, calories_burned, intensity) 
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      exerciseData.type || null,
      exerciseData.duration || 0,
      caloriesBurned,
      intensity
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
  if (!foodData || (foodData.name == null && foodData.weight == null)) {
    return null;
  }
  const calories = foodData.calories != null ? foodData.calories : null;
  const protein = foodData.protein != null ? foodData.protein : null;
  const carbs = foodData.carbs != null ? foodData.carbs : null;
  const fat = foodData.fat != null ? foodData.fat : null;
  const mealTime = foodData.meal_time || null;

  const [result] = await pool.execute(
    `INSERT INTO food_records 
     (user_id, food_name, weight, calories, protein, carbs, fat, meal_time) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ,
    [
      userId,
      foodData.name || null,
      foodData.weight || null,
      calories,
      protein,
      carbs,
      fat,
      mealTime
    ]
  );

  return {
    id: result.insertId,
    ...foodData,
    meal_date: new Date().toISOString()
  };
}

function generateHealthAdvice(extractedInfo) {
  console.log('开始生成健康建议，输入数据:', JSON.stringify(extractedInfo, null, 2));
  const advice = [];
  
  if (extractedInfo.exercise) {
    console.log('处理运动信息');
    const { type, duration, calories_burned } = extractedInfo.exercise;
    
    if (type) {
      if (duration) {
        advice.push(`您今天进行了${duration}分钟的${type}运动`);
      } else {
        advice.push(`您今天进行了${type}运动`);
      }
      
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
  
  if (extractedInfo.food) {
    console.log('处理饮食信息');
    const { name, weight, calories } = extractedInfo.food;
    
    if (name) {
      if (weight) {
        advice.push(`您今天摄入了${weight}克${name}`);
      } else {
        advice.push(`您今天摄入了${name}`);
      }
      
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
  if (extractedInfo.exercise && extractedInfo.food) {
    advice.push('运动后适当补充蛋白质和碳水化合物有助于恢复');
  } else if (extractedInfo.exercise && !extractedInfo.food) {
    advice.push('运动后记得及时补充水分和营养');
  } else if (!extractedInfo.exercise && extractedInfo.food) {
    advice.push('建议每天保持30分钟以上的中等强度运动');
  }
  
  console.log('生成的健康建议:', JSON.stringify(advice, null, 2));
  return advice;
}

module.exports = router;
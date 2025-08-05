const express = require('express');
const router = express.Router();
const doubaoService = require('../services/doubaoService');
const { pool } = require('../db');

router.use(express.json({ limit: '1mb' }));

router.post('/process', async (req, res) => {
  try {
    const { userId, message, userRecords } = req.body;

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
      ? ''
      : extractedInfo.exercise === null && extractedInfo.food === null
        ? '未检测到锻炼或饮食信息'
        : '';

    // 生成健康建议
    result.healthAdvice = generateHealthAdvice(extractedInfo, userRecords);

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
function generateHealthAdvice(extractedInfo, userRecords) {
  const advice = [];
  const exercise = extractedInfo.exercise;
  const food = extractedInfo.food;

  advice.push('太棒了！感谢您分享您的健康信息。');

  if (userRecords) {
    const { steps, duration, calories, weight } = userRecords;

    if (steps != null) {
      if (steps >= 10000) {
        advice.push(`您今天已经走了${steps}步，超过了每日推荐的10000步目标，做得非常好！`);
      } else if (steps >= 5000) {
        advice.push(`您今天已经走了${steps}步，已经完成了一半的目标，继续加油！`);
      } else {
        advice.push(`您今天走了${steps}步，建议再走${10000 - steps}步以达到每日推荐目标。`);
      }
    }

    if (duration != null) {
      if (duration >= 60) {
        advice.push(`您今天运动了${duration}分钟，达到了每日推荐的60分钟运动时间，很棒！`);
      } else {
        advice.push(`您今天运动了${duration}分钟，建议再运动${60 - duration}分钟以达到每日推荐目标。`);
      }
    }

    if (calories != null) {
      if (calories >= 400) {
        advice.push(`您今天消耗了${calories}卡路里，达到了每日推荐的400卡路里消耗目标，非常不错！`);
      } else {
        advice.push(`您今天消耗了${calories}卡路里，建议通过运动再消耗${400 - calories}卡路里以达到每日推荐目标。`);
      }
    }

    if (weight != null && weight > 0) {
      advice.push(`您当前的体重是${weight}公斤，保持健康的体重对整体健康非常重要。`);
    }
  }

  if (exercise) {
    const { type, duration, calories_burned } = exercise;
    if (type) {
      advice.push(`您今天进行了${duration ?? ''}分钟的${type}运动，真是非常棒的选择！`);
      if (calories_burned) {
        advice.push(`您消耗了约${calories_burned}卡路里，这对您的健康非常有益。`);
      }

      if (type.includes('跑步') || type.includes('快走')) {
        advice.push('跑步是很好的有氧运动，建议每周进行3-5次，每次30-60分钟。坚持下去，您会看到更好的效果！');
      } else if (type.includes('游泳')) {
        advice.push('游泳对关节压力小，适合长期坚持。这是一个全身性的运动，对心肺功能很有帮助！');
      } else if (type.includes('瑜伽')) {
        advice.push('瑜伽有助于提高身体柔韧性和心理放松，建议搭配有氧运动效果更佳。');
      } else if (type.includes('骑行')) {
        advice.push('骑行是很好的户外运动，既能锻炼身体又能放松心情。注意安全哦！');
      } else {
        advice.push('任何形式的运动都是对健康的投资，继续保持！');
      }
    }
  }

  if (food) {
    const { name, weight, calories } = food;
    if (name) {
      advice.push(`您今天摄入了${weight ?? ''}克${name}，感谢您关注自己的饮食。`);
      if (calories) {
        advice.push(`约含${calories}卡路里，合理的饮食搭配对健康非常重要。`);
      }
      if (name.includes('米饭') || name.includes('面食')) {
        advice.push('碳水化合物是能量的主要来源，但要注意适量摄入。建议搭配蔬菜和蛋白质食物一起食用。');
      } else if (name.includes('蔬菜')) {
        advice.push('蔬菜富含维生素和膳食纤维，建议每天摄入300-500克。您的选择很棒！');
      } else if (name.includes('水果')) {
        advice.push('水果富含维生素和天然糖分，是健康的零食选择。但也要注意适量哦。');
      } else if (name.includes('肉类') || name.includes('鸡胸肉') || name.includes('鱼')) {
        advice.push('优质蛋白质对肌肉修复和增长非常重要。您的饮食搭配很均衡！');
      } else {
        advice.push('多样化的饮食有助于获得全面的营养，继续保持！');
      }
    }
  }

  if (exercise && food) {
    advice.push('运动后适当补充蛋白质和碳水化合物有助于恢复，您的健康管理做得很好！');
    advice.push('您在运动和饮食方面都做得不错，继续保持这种积极的生活方式！');
  } else if (exercise && !food) {
    advice.push('运动后记得及时补充水分和营养，这样能让您的锻炼效果更佳。');
    advice.push('您已经开始行动了，这是非常好的开始！');
  } else if (!exercise && food) {
    advice.push('建议每天保持30分钟以上的中等强度运动，这样能让您的健康状况更上一层楼。');
    advice.push('关注饮食是健康生活的重要部分，您已经迈出了重要的一步！');
  } else {
    advice.push('健康是一个长期的过程，每一个小的改变都是进步。让我们一起努力！');
  }

  advice.push('继续保持，您正在朝着更健康的生活方式迈进！');

  return advice;
}

module.exports = router;

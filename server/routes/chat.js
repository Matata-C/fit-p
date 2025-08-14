const express = require('express');
const router = express.Router();
const doubaoService = require('../services/doubaoService');
const { pool } = require('../db');

router.use(express.json({ limit: '1mb' }));

router.post('/process', async (req, res) => {
  try {
    const { userId, message, userRecords, aiRole } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: userId 和 message'
      });
    }

    const selectedRole = aiRole || 'professional';
    console.log(`处理用户 ${userId} 的消息: "${message}"，使用 ${selectedRole} 风格`);

    const conversationalResult = await doubaoService.generateConversationalResponse(message, selectedRole, userRecords);
    
    const extractedInfo = conversationalResult.extractedData || {
      exercise: null,
      food: null,
      confidence: 0.0,
      message: '未检测到有效的运动或饮食信息'
    };

    const result = {
      success: true,
      message: '处理成功',
      originalMessage: message,
      extractedData: extractedInfo,
      conversationalResponse: conversationalResult.response,
      aiRole: selectedRole,
      records: []
    };

    if (extractedInfo.exercise?.type && extractedInfo.exercise.duration != null) {
      try {
        const exerciseRecord = await saveExerciseRecord(userId, extractedInfo.exercise);
        result.records.push({ type: 'exercise', data: exerciseRecord });
      } catch (saveError) {
        console.error('保存运动记录失败:', saveError);
        result.message += '，运动记录保存失败';
      }
    }

    if (extractedInfo.food && (extractedInfo.food.name || extractedInfo.food.weight != null)) {
      try {
        const foodRecord = await saveFoodRecord(userId, extractedInfo.food);
        result.records.push({ type: 'food', data: foodRecord });
      } catch (saveError) {
        console.error('保存饮食记录失败:', saveError);
        result.message += '，饮食记录保存失败';
      }
    }

    if (result.records.length > 0) {
      result.healthAdvice = generatePersonalizedHealthAdvice(extractedInfo, userRecords, selectedRole);
    } else {
      result.healthAdvice = '';
    }

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

function generatePersonalizedHealthAdvice(extractedInfo, userRecords, aiRole) {
  const advice = [];
  const exercise = extractedInfo.exercise;
  const food = extractedInfo.food;

  const roleGreetings = {
    'professional': '根据您的情况，我为您提供以下专业建议：',
    'energetic': '哇！太棒了！让我来给您一些超赞的建议：',
    'gentle': '亲爱的，根据您的情况，我温柔地为您提供以下建议：',
    'strict': '听好了！这是您必须遵循的建议：'
  };
  
  advice.push(roleGreetings[aiRole] || '根据您的情况，我为您提供以下建议：');

  if (userRecords) {
    const { steps, duration, calories, weight } = userRecords;

    if (steps != null) {
      if (steps >= 10000) {
        if (aiRole === 'professional') {
          advice.push(`您今日步数已达${steps}步，超过了每日推荐的10000步目标，表现优秀。`);
        } else if (aiRole === 'energetic') {
          advice.push(`您今天走了${steps}步，太厉害啦！您已经超过每日10000步目标，继续保持哦！`);
        } else if (aiRole === 'gentle') {
          advice.push(`您今天已经走了${steps}步，真是令人欣慰。您已经超过了每日10000步的目标，做得非常好。`);
        } else if (aiRole === 'strict') {
          advice.push(`您今日步数${steps}步，达到了基本要求。但要成为真正的健身达人，还需继续努力。`);
        } else {
          advice.push(`您今天已经走了${steps}步，超过了每日推荐的10000步目标，做得非常好！`);
        }
      } else if (steps >= 5000) {
        if (aiRole === 'professional') {
          advice.push(`您今日步数${steps}步，已完成目标的一半，建议再走${10000 - steps}步以达到推荐目标。`);
        } else if (aiRole === 'energetic') {
          advice.push(`您今天走了${steps}步，已经完成一半目标啦！再走${10000 - steps}步就能达到10000步目标，加油！`);
        } else if (aiRole === 'gentle') {
          advice.push(`您今天走了${steps}步，很不错呢。如果能再走${10000 - steps}步就更好了，慢慢来就好。`);
        } else if (aiRole === 'strict') {
          advice.push(`您今日步数仅${steps}步，仅为目标的一半。必须再走${10000 - steps}步才能达到最低要求。`);
        } else {
          advice.push(`您今天已经走了${steps}步，已经完成了一半的目标，继续加油！`);
        }
      } else {
        if (aiRole === 'professional') {
          advice.push(`您今日步数${steps}步，建议再走${10000 - steps}步以达到每日推荐目标。`);
        } else if (aiRole === 'energetic') {
          advice.push(`您今天走了${steps}步，再走${10000 - steps}步就能达到10000步目标啦，相信您一定可以的！`);
        } else if (aiRole === 'gentle') {
          advice.push(`您今天走了${steps}步，如果能再走${10000 - steps}步就更好了，不过也不要太勉强自己哦。`);
        } else if (aiRole === 'strict') {
          advice.push(`您今日步数仅${steps}步，远远未达到目标。必须再走${10000 - steps}步，这是最低要求。`);
        } else {
          advice.push(`您今天走了${steps}步，建议再走${10000 - steps}步以达到每日推荐目标。`);
        }
      }
    }

    if (duration != null) {
      if (duration >= 60) {
        if (aiRole === 'professional') {
          advice.push(`您今日运动时长${duration}分钟，已达到每日推荐的60分钟运动时间，值得肯定。`);
        } else if (aiRole === 'energetic') {
          advice.push(`您今天运动了${duration}分钟，太棒啦！已经达到了每日60分钟的推荐时间，给您点个赞！`);
        } else if (aiRole === 'gentle') {
          advice.push(`您今天运动了${duration}分钟，真是不错呢。您已经达到了每日60分钟的推荐时间，为您感到高兴。`);
        } else if (aiRole === 'strict') {
          advice.push(`您今日运动时长${duration}分钟，勉强达到基本要求。要成为真正的健身达人，还需增加运动强度。`);
        } else {
          advice.push(`您今天运动了${duration}分钟，达到了每日推荐的60分钟运动时间，很棒！`);
        }
      } else {
        if (aiRole === 'professional') {
          advice.push(`您今日运动时长${duration}分钟，建议再运动${60 - duration}分钟以达到每日推荐目标。`);
        } else if (aiRole === 'energetic') {
          advice.push(`您今天运动了${duration}分钟，再运动${60 - duration}分钟就能达到60分钟目标啦，相信您一定可以的！`);
        } else if (aiRole === 'gentle') {
          advice.push(`您今天运动了${duration}分钟，如果能再运动${60 - duration}分钟就更好了，不过也不要太勉强自己哦。`);
        } else if (aiRole === 'strict') {
          advice.push(`您今日运动时长仅${duration}分钟，远远未达到要求。必须再运动${60 - duration}分钟，这是最低标准。`);
        } else {
          advice.push(`您今天运动了${duration}分钟，建议再运动${60 - duration}分钟以达到每日推荐目标。`);
        }
      }
    }

    if (calories != null) {
      if (calories >= 400) {
        if (aiRole === 'professional') {
          advice.push(`您今日消耗${calories}卡路里，已达到每日推荐的400卡路里消耗目标，效果显著。`);
        } else if (aiRole === 'energetic') {
          advice.push(`您今天消耗了${calories}卡路里，太厉害啦！已经达到了每日400卡路里的推荐消耗，给您点个赞！`);
        } else if (aiRole === 'gentle') {
          advice.push(`您今天消耗了${calories}卡路里，真是不错呢。您已经达到了每日400卡路里的推荐消耗，为您感到高兴。`);
        } else if (aiRole === 'strict') {
          advice.push(`您今日消耗${calories}卡路里，勉强达到基本要求。要实现真正的减脂效果，还需进一步增加消耗。`);
        } else {
          advice.push(`您今天消耗了${calories}卡路里，达到了每日推荐的400卡路里消耗目标，非常不错！`);
        }
      } else {
        if (aiRole === 'professional') {
          advice.push(`您今日消耗${calories}卡路里，建议通过运动再消耗${400 - calories}卡路里以达到每日推荐目标。`);
        } else if (aiRole === 'energetic') {
          advice.push(`您今天消耗了${calories}卡路里，再消耗${400 - calories}卡路里就能达到400卡路里目标啦，相信您一定可以的！`);
        } else if (aiRole === 'gentle') {
          advice.push(`您今天消耗了${calories}卡路里，如果能再消耗${400 - calories}卡路里就更好了，不过也不要太勉强自己哦。`);
        } else if (aiRole === 'strict') {
          advice.push(`您今日消耗仅${calories}卡路里，远远未达到要求。必须再消耗${400 - calories}卡路里，这是最低标准。`);
        } else {
          advice.push(`您今天消耗了${calories}卡路里，建议通过运动再消耗${400 - calories}卡路里以达到每日推荐目标。`);
        }
      }
    }

    if (weight != null && weight > 0) {
      if (aiRole === 'professional') {
        advice.push(`您当前体重${weight}公斤，保持健康的体重对整体健康非常重要。`);
      } else if (aiRole === 'energetic') {
        advice.push(`您当前的体重是${weight}公斤，保持健康的体重能让您更有活力哦！`);
      } else if (aiRole === 'gentle') {
        advice.push(`您当前的体重是${weight}公斤，保持健康的体重对整体健康非常重要，不过也不要给自己太大压力哦。`);
      } else if (aiRole === 'strict') {
        advice.push(`您当前体重${weight}公斤，必须严格按照计划执行才能达到理想体重。`);
      } else {
        advice.push(`您当前的体重是${weight}公斤，保持健康的体重对整体健康非常重要。`);
      }
    }
  }

  if (exercise) {
    const { type, duration, calories_burned } = exercise;
    if (type) {
      if (aiRole === 'professional') {
        advice.push(`您今日进行了${duration ?? ''}分钟的${type}运动，这是科学有效的锻炼方式。`);
        if (calories_burned) {
          advice.push(`本次运动消耗约${calories_burned}卡路里，对您的健康目标有积极贡献。`);
        }
      } else if (aiRole === 'energetic') {
        advice.push(`您今天进行了${duration ?? ''}分钟的${type}运动，真是太棒啦！`);
        if (calories_burned) {
          advice.push(`哇！这次运动消耗了约${calories_burned}卡路里，效果超赞！`);
        }
      } else if (aiRole === 'gentle') {
        advice.push(`您今天进行了${duration ?? ''}分钟的${type}运动，真是不错呢。`);
        if (calories_burned) {
          advice.push(`本次运动消耗约${calories_burned}卡路里，对您的健康很有帮助哦。`);
        }
      } else if (aiRole === 'strict') {
        advice.push(`您今日进行了${duration ?? ''}分钟的${type}运动，这是基本要求。`);
        if (calories_burned) {
          advice.push(`本次运动消耗${calories_burned}卡路里，效率一般，需进一步提高强度。`);
        }
      } else {
        advice.push(`您今天进行了${duration ?? ''}分钟的${type}运动，真是非常棒的选择！`);
        if (calories_burned) {
          advice.push(`您消耗了约${calories_burned}卡路里，这对您的健康非常有益。`);
        }
      }

      if (type.includes('跑步') || type.includes('快走')) {
        if (aiRole === 'professional') {
          advice.push('跑步是优秀的有氧运动，建议每周进行3-5次，每次30-60分钟，以获得最佳效果。');
        } else if (aiRole === 'energetic') {
          advice.push('跑步是很好的有氧运动，每周跑3-5次，每次30-60分钟，让身体更健康更有活力！');
        } else if (aiRole === 'gentle') {
          advice.push('跑步对身体很好，但要注意适量。建议每周3-5次，每次30-60分钟，累了就休息一下哦。');
        } else if (aiRole === 'strict') {
          advice.push('跑步是基础有氧运动，每周必须进行5次，每次不少于45分钟，否则难以达到减脂效果。');
        } else {
          advice.push('跑步是很好的有氧运动，建议每周进行3-5次，每次30-60分钟。坚持下去，您会看到更好的效果！');
        }
      } else if (type.includes('游泳')) {
        if (aiRole === 'professional') {
          advice.push('游泳对关节压力小，适合长期坚持。这是一个全身性的运动，对心肺功能很有帮助。');
        } else if (aiRole === 'energetic') {
          advice.push('游泳对身体很棒！全身都能得到锻炼，而且对关节也没有压力，太适合您啦！');
        } else if (aiRole === 'gentle') {
          advice.push('游泳是很温和的运动，对身体很好。您可以放心坚持下去，但也不要太累哦。');
        } else if (aiRole === 'strict') {
          advice.push('游泳虽好但强度偏低，建议每次至少游1000米，以达到有效训练效果。');
        } else {
          advice.push('游泳对关节压力小，适合长期坚持。这是一个全身性的运动，对心肺功能很有帮助！');
        }
      } else if (type.includes('瑜伽')) {
        if (aiRole === 'professional') {
          advice.push('瑜伽有助于提高身体柔韧性和心理放松，建议搭配有氧运动效果更佳。');
        } else if (aiRole === 'energetic') {
          advice.push('瑜伽能让身体更柔软，心情会更放松！搭配有氧运动效果会更好哦！');
        } else if (aiRole === 'gentle') {
          advice.push('瑜伽是很温和的运动，有助于放松身心。您可以每天做一点，但不要勉强自己哦。');
        } else if (aiRole === 'strict') {
          advice.push('瑜伽作为辅助运动尚可，但必须搭配高强度有氧运动才能达到减脂目的。');
        } else {
          advice.push('瑜伽有助于提高身体柔韧性和心理放松，建议搭配有氧运动效果更佳。');
        }
      } else if (type.includes('骑行')) {
        if (aiRole === 'professional') {
          advice.push('骑行是很好的户外有氧运动，既能锻炼身体又能放松心情。注意安全，佩戴护具。');
        } else if (aiRole === 'energetic') {
          advice.push('骑行太棒啦！既能锻炼身体又能欣赏风景，真是两全其美！注意安全哦！');
        } else if (aiRole === 'gentle') {
          advice.push('骑行是很温和的运动，对身体很好。您可以放心骑行，但也不要骑太远哦。');
        } else if (aiRole === 'strict') {
          advice.push('骑行强度偏低，建议每次至少骑行20公里，以达到有效训练效果。');
        } else {
          advice.push('骑行是很好的户外运动，既能锻炼身体又能放松心情。注意安全哦！');
        }
      } else {
        if (aiRole === 'professional') {
          advice.push('您选择的运动类型对健康有益，建议保持规律性以获得持续效果。');
        } else if (aiRole === 'energetic') {
          advice.push('任何形式的运动都是对健康的投资，您做得太棒啦！继续保持哦！');
        } else if (aiRole === 'gentle') {
          advice.push('您选择了运动，这很好呢。任何运动都对身体有帮助，但不要太过勉强自己哦。');
        } else if (aiRole === 'strict') {
          advice.push('运动是基本要求，但要达到理想效果，必须增加运动强度和时间。');
        } else {
          advice.push('任何形式的运动都是对健康的投资，继续保持！');
        }
      }
    }
  }

  if (food) {
    const { name, weight, calories } = food;
    if (name) {
      if (aiRole === 'professional') {
        advice.push(`您今日摄入了${weight ?? ''}克${name}，营养搭配合理。`);
        if (calories) {
          advice.push(`约含${calories}卡路里，符合健康饮食原则。`);
        }
      } else if (aiRole === 'energetic') {
        advice.push(`您今天摄入了${weight ?? ''}克${name}，真是太棒啦！`);
        if (calories) {
          advice.push(`约含${calories}卡路里，营养搭配很均衡哦！`);
        }
      } else if (aiRole === 'gentle') {
        advice.push(`您今天摄入了${weight ?? ''}克${name}，很不错呢。`);
        if (calories) {
          advice.push(`约含${calories}卡路里，营养搭配挺好的哦。`);
        }
      } else if (aiRole === 'strict') {
        advice.push(`您今日摄入了${weight ?? ''}克${name}，这是基本要求。`);
        if (calories) {
          advice.push(`含${calories}卡路里，热量控制一般，需进一步优化。`);
        }
      } else {
        advice.push(`您今天摄入了${weight ?? ''}克${name}，感谢您关注自己的饮食。`);
        if (calories) {
          advice.push(`约含${calories}卡路里，合理的饮食搭配对健康非常重要。`);
        }
      }
      
      if (name.includes('米饭') || name.includes('面食')) {
        if (aiRole === 'professional') {
          advice.push('碳水化合物是能量的主要来源，建议搭配蔬菜和蛋白质食物一起食用，以保证营养均衡。');
        } else if (aiRole === 'energetic') {
          advice.push('碳水化合物是能量的主要来源，搭配蔬菜和蛋白质一起吃会更营养哦！');
        } else if (aiRole === 'gentle') {
          advice.push('碳水化合物是能量的主要来源，但要注意适量。您可以搭配蔬菜和蛋白质一起吃哦。');
        } else if (aiRole === 'strict') {
          advice.push('碳水化合物摄入过多易导致脂肪堆积，必须严格控制分量，建议每餐不超过100克。');
        } else {
          advice.push('碳水化合物是能量的主要来源，但要注意适量摄入。建议搭配蔬菜和蛋白质食物一起食用。');
        }
      } else if (name.includes('蔬菜')) {
        if (aiRole === 'professional') {
          advice.push('蔬菜富含维生素和膳食纤维，建议每天摄入300-500克，以维持身体健康。');
        } else if (aiRole === 'energetic') {
          advice.push('蔬菜富含维生素和膳食纤维，每天吃300-500克能让您更有活力哦！');
        } else if (aiRole === 'gentle') {
          advice.push('蔬菜富含维生素和膳食纤维，每天吃一些对身体很好呢。建议每天300-500克就好啦。');
        } else if (aiRole === 'strict') {
          advice.push('蔬菜摄入量必须达到每日500克以上，这是基本营养要求。');
        } else {
          advice.push('蔬菜富含维生素和膳食纤维，建议每天摄入300-500克。您的选择很棒！');
        }
      } else if (name.includes('水果')) {
        if (aiRole === 'professional') {
          advice.push('水果富含维生素和天然糖分，建议适量摄入，每天200-350克为宜。');
        } else if (aiRole === 'energetic') {
          advice.push('水果富含维生素和天然糖分，每天吃200-350克能让您更有活力哦！');
        } else if (aiRole === 'gentle') {
          advice.push('水果富含维生素和天然糖分，每天吃一些对身体很好呢。建议每天200-350克就好啦。');
        } else if (aiRole === 'strict') {
          advice.push('水果含糖量较高，必须严格控制摄入量，每天不得超过200克。');
        } else {
          advice.push('水果富含维生素和天然糖分，是健康的零食选择。但也要注意适量哦。');
        }
      } else if (name.includes('肉类') || name.includes('鸡胸肉') || name.includes('鱼')) {
        if (aiRole === 'professional') {
          advice.push('优质蛋白质对肌肉修复和增长非常重要，建议每餐摄入100-150克。');
        } else if (aiRole === 'energetic') {
          advice.push('优质蛋白质对肌肉修复和增长非常重要，每餐吃100-150克能让您更有力量哦！');
        } else if (aiRole === 'gentle') {
          advice.push('优质蛋白质对身体很好呢，每餐吃一些就好啦，建议100-150克。');
        } else if (aiRole === 'strict') {
          advice.push('蛋白质摄入必须达到每餐150克以上，这是肌肉增长的基本要求。');
        } else {
          advice.push('优质蛋白质对肌肉修复和增长非常重要。您的饮食搭配很均衡！');
        }
      } else {
        if (aiRole === 'professional') {
          advice.push('您选择的食物营养搭配合理，建议保持多样性以获得全面营养。');
        } else if (aiRole === 'energetic') {
          advice.push('您选择的食物很棒！多样化的饮食能让您获得全面的营养哦！');
        } else if (aiRole === 'gentle') {
          advice.push('您选择的食物很不错呢，多样化的饮食对身体有帮助。');
        } else if (aiRole === 'strict') {
          advice.push('饮食结构需进一步优化，必须增加蛋白质和蔬菜摄入量。');
        } else {
          advice.push('多样化的饮食有助于获得全面的营养，继续保持！');
        }
      }
    }
  }

  if (exercise && food) {
    if (aiRole === 'professional') {
      advice.push('运动后适当补充蛋白质和碳水化合物有助于恢复，您的健康管理做得很好。');
      advice.push('您在运动和饮食方面都做得不错，继续保持这种科学的生活方式。');
    } else if (aiRole === 'energetic') {
      advice.push('运动后适当补充蛋白质和碳水化合物有助于恢复，您真是太棒啦！');
      advice.push('您在运动和饮食方面都做得超赞，继续保持这种活力四射的生活方式！');
    } else if (aiRole === 'gentle') {
      advice.push('运动后适当补充蛋白质和碳水化合物有助于恢复，您做得很好呢。');
      advice.push('您在运动和饮食方面都做得不错，继续保持这种健康的生活方式就好啦。');
    } else if (aiRole === 'strict') {
      advice.push('运动后营养补充基本达标，但配比需进一步优化。');
      advice.push('虽然您在运动和饮食方面有所行动，但要达到理想效果还需更加严格。');
    } else {
      advice.push('运动后适当补充蛋白质和碳水化合物有助于恢复，您的健康管理做得很好！');
      advice.push('您在运动和饮食方面都做得不错，继续保持这种积极的生活方式！');
    }
  } else if (exercise && !food) {
    if (aiRole === 'professional') {
      advice.push('运动后记得及时补充水分和营养，这样能让您的锻炼效果更佳。');
      advice.push('您已经开始行动了，这是非常好的开始，建议进一步关注饮食搭配。');
    } else if (aiRole === 'energetic') {
      advice.push('运动后记得及时补充水分和营养，这样能让您的锻炼效果更棒！');
      advice.push('您已经开始行动啦，这是超棒的开始，再关注一下饮食搭配就更完美啦！');
    } else if (aiRole === 'gentle') {
      advice.push('运动后记得及时补充水分和营养，这样对身体更好哦。');
      advice.push('您已经开始行动了，这很好呢，如果再关注一下饮食搭配就更好啦。');
    } else if (aiRole === 'strict') {
      advice.push('仅有运动没有合理饮食无法达到减脂增肌效果，必须同时优化饮食结构。');
      advice.push('运动只是基础，要实现目标必须严格执行全面的饮食计划。');
    } else {
      advice.push('运动后记得及时补充水分和营养，这样能让您的锻炼效果更佳。');
      advice.push('您已经开始行动了，这是非常好的开始！');
    }
  } else if (!exercise && food) {
    if (aiRole === 'professional') {
      advice.push('建议每天保持30分钟以上的中等强度运动，这样能让您的健康状况更上一层楼。');
      advice.push('关注饮食是健康生活的重要部分，您已经迈出了重要的一步，建议结合运动效果更佳。');
    } else if (aiRole === 'energetic') {
      advice.push('建议每天保持30分钟以上的中等强度运动，让身体更健康更有活力！');
      advice.push('关注饮食是健康生活的重要部分，您已经迈出重要的一步啦，再结合运动就更完美啦！');
    } else if (aiRole === 'gentle') {
      advice.push('建议每天保持一些运动，对身体很好呢。');
      advice.push('关注饮食是健康生活的重要部分，您已经迈出重要的一步，再结合一些运动就更好啦。');
    } else if (aiRole === 'strict') {
      advice.push('仅有饮食控制无法实现理想体型，必须严格执行每日60分钟以上的运动计划。');
      advice.push('饮食只是基础，要实现目标必须增加高强度运动。');
    } else {
      advice.push('建议每天保持30分钟以上的中等强度运动，这样能让您的健康状况更上一层楼。');
      advice.push('关注饮食是健康生活的重要部分，您已经迈出了重要的一步！');
    }
  } else {
    if (aiRole === 'professional') {
      advice.push('健康是一个长期的过程，每一个科学的小改变都是进步。让我们一起努力。');
    } else if (aiRole === 'energetic') {
      advice.push('健康是一个长期的过程，每一个小的改变都是进步。让我们一起加油，变得更健康更有活力！');
    } else if (aiRole === 'gentle') {
      advice.push('健康是一个长期的过程，每一个小的改变都是进步。慢慢来就好，我们一起努力。');
    } else if (aiRole === 'strict') {
      advice.push('健康需要严格的自律，每一个细节都不能忽视。必须制定并严格执行完整的健康计划。');
    } else {
      advice.push('健康是一个长期的过程，每一个小的改变都是进步。让我们一起努力！');
    }
  }

  const roleClosings = {
    'professional': '请继续坚持，科学的方法会带来理想的效果。',
    'energetic': '继续加油，相信您一定可以达成目标的！',
    'gentle': '慢慢来就好，我们一步一步地朝着目标前进。',
    'strict': '这是基本要求，必须严格执行才能看到效果。'
  };
  
  advice.push(roleClosings[aiRole] || '继续保持，您正在朝着更健康的生活方式迈进！');

  return advice;
}

module.exports = router;

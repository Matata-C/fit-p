// dataSync.js - 统一数据同步工具
// 确保首页和分析页面使用相同的数据源

/**
 * 获取当前日期字符串
 * @returns {string} 格式：YYYY-MM-DD
 */
function getCurrentDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取今日步数数据（统一入口，确保数据一致性）
 * @returns {number} 今日步数
 */
function getTodaySteps() {
  const today = getCurrentDateString();
  let steps = 0;
  
  // 优先从微信运动获取步数
  try {
    const weRunData = wx.getStorageSync('weRunData') || {};
    if (weRunData[today] && weRunData[today].stepInfoList && weRunData[today].stepInfoList.length > 0) {
      steps = weRunData[today].stepInfoList[0].step || 0;
      console.log('从微信运动获取步数:', steps);
    }
  } catch (e) {
    console.log('获取微信运动数据失败:', e);
  }
  
  // 如果微信运动数据为空，则从运动记录获取
  if (steps === 0) {
    try {
      let exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
      let todayRecords = exerciseRecords[today] || [];
      todayRecords.forEach(record => {
        steps += record.steps ? Number(record.steps) : 0;
      });
      console.log('从运动记录获取步数:', steps);
    } catch (e) {
      console.log('获取运动记录数据失败:', e);
    }
  }
  
  // 如果都没有数据，尝试从本地存储获取
  if (steps === 0) {
    try {
      const localSteps = wx.getStorageSync('stepCount');
      if (localSteps && localSteps > 0) {
        steps = Number(localSteps);
        console.log('从本地存储获取步数:', steps);
      }
    } catch (e) {
      console.log('获取本地存储步数失败:', e);
    }
  }
  
  console.log('最终获取的今日步数:', steps);
  return steps;
}

/**
 * 获取今日运动数据（步数、时长、卡路里）
 * @returns {object} {steps, duration, calories}
 */
function getTodayExerciseData() {
  const today = getCurrentDateString();
  const steps = getTodaySteps(); // 使用统一的步数获取函数
  let duration = 0;
  let calories = 0;
  
  // 从运动记录获取时长和卡路里
  try {
    let exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
    let todayRecords = exerciseRecords[today] || [];
    todayRecords.forEach(record => {
      // 处理时长：现在duration字段已经是分钟数
      let recordDuration = 0;
      if (record.minutes) {
        recordDuration = Number(record.minutes);
      } else if (record.duration) {
        recordDuration = Number(record.duration);
      }
      duration += recordDuration;
      // 同时支持两种键名格式以确保兼容性
      calories += record.calories_burned ? Number(record.calories_burned) : 
                 (record.caloriesBurned ? Number(record.caloriesBurned) : 0);
    });
  } catch (e) {
    console.log('获取运动记录时长和卡路里失败:', e);
  }
  
  // 如果运动记录中没有卡路里数据，根据步数估算
  if (calories === 0 && steps > 0) {
    calories = Math.round(steps * 0.04); // 每步约消耗0.04卡路里
  }
  
  return {
    steps,
    duration,
    calories,
    date: today
  };
}

/**
 * 获取今日体重数据
 * @returns {number} 体重值，如果没有则返回0
 */
function getTodayWeight() {
  const today = getCurrentDateString();
  let weight = 0;
  
  // 优先获取今日体重记录
  const todayWeightRecord = wx.getStorageSync('todayWeight');
  if (todayWeightRecord && todayWeightRecord.date === today) {
    weight = parseFloat(todayWeightRecord.weight) || 0;
  } else {
    // 如果没有今日体重记录，获取最新体重记录
    let weightRecords = wx.getStorageSync('weightRecords') || {};
    if (weightRecords[today]) {
      weight = parseFloat(weightRecords[today]) || 0;
    } else {
      // 从数组格式获取最新体重
      let weightRecordsArray = wx.getStorageSync('weightRecordsArray') || [];
      if (weightRecordsArray.length > 0) {
        weightRecordsArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        weight = parseFloat(weightRecordsArray[0].weight) || 0;
      }
    }
  }
  
  return weight;
}

/**
 * 获取今日完整数据（步数、时长、卡路里、体重）
 * @returns {object} 包含所有今日数据的对象
 */
function getTodayCompleteData() {
  const exerciseData = getTodayExerciseData();
  const weight = getTodayWeight();
  
  return {
    ...exerciseData,
    weight
  };
}

/**
 * 运动类型分类配置
 */
const exerciseCategories = {
  '有氧运动': {
    keywords: ['快走', '慢跑', '跑步', '骑自行车', '游泳', '跳绳', '健身操', '有氧', '跑步机', '椭圆机'],
    icon: '🏃‍♂️',
    color: '#FFD600'
  },
  '力量训练': {
    keywords: ['力量训练', '举重', '哑铃', '杠铃', '深蹲', '卧推', '硬拉', '无氧'],
    icon: '💪',
    color: '#FFB6B9'
  },
  '身体塑形': {
    keywords: ['瑜伽', '普拉提', '拉伸', '身体塑形', '柔韧性', '平衡'],
    icon: '🧘',
    color: '#A0E7E5'
  },
  '竞技运动': {
    keywords: ['篮球', '足球', '网球', '羽毛球', '乒乓球', '排球', '竞技'],
    icon: '🏀',
    color: '#B4F8C8'
  },
  '其他运动': {
    keywords: ['其他', '未知'],
    icon: '🎯',
    color: '#FFDAC1'
  }
};

/**
 * 根据运动名称分类运动类型
 * @param {string} exerciseName 运动名称
 * @returns {string} 运动类型
 */
function categorizeExercise(exerciseName) {
  if (!exerciseName) return '其他运动';
  
  const name = exerciseName.toLowerCase();
  
  for (const [category, config] of Object.entries(exerciseCategories)) {
    for (const keyword of config.keywords) {
      if (name.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return '其他运动';
}

/**
 * 测试运动分类功能
 * @param {Array} testExercises 测试运动数组
 */
function testExerciseCategorization(testExercises = []) {
  console.log('=== 运动分类测试 ===');
  
  const testData = testExercises.length > 0 ? testExercises : [
    '快走',
    '慢跑',
    '力量训练',
    '瑜伽',
    '篮球',
    '游泳',
    '跳绳',
    '健身操',
    '举重',
    '拉伸',
    '足球',
    '网球',
    '普拉提',
    '深蹲',
    '卧推',
    '硬拉',
    '跑步机',
    '椭圆机',
    '其他运动'
  ];
  
  testData.forEach(exercise => {
    const category = categorizeExercise(exercise);
    console.log(`${exercise} -> ${category}`);
  });
  
  console.log('=== 测试完成 ===');
}

/**
 * 测试百分比计算功能
 */
function testPercentageCalculation() {
  console.log('=== 百分比计算测试 ===');
  
  // 模拟运动记录数据
  const mockExerciseRecords = {
    '2025-01-20': [
      { name: '快走', caloriesBurned: 150 },
      { name: '慢跑', caloriesBurned: 200 },
      { name: '力量训练', caloriesBurned: 100 },
      { name: '瑜伽', caloriesBurned: 50 }
    ]
  };
  
  // 临时设置测试数据
  const originalRecords = wx.getStorageSync('exerciseRecords');
  wx.setStorageSync('exerciseRecords', mockExerciseRecords);
  
  // 获取分类数据
  const categories = getTodayExerciseCategories();
  
  console.log('测试结果:', categories);
  
  // 验证百分比总和是否为100%
  const totalPercentage = categories.reduce((sum, item) => sum + item.percentage, 0);
  console.log('百分比总和:', totalPercentage + '%');
  
  // 显示详细计算过程
  console.log('详细计算过程:');
  categories.forEach(item => {
    console.log(`${item.name}: ${item.originalValue}kcal -> ${item.percentage}%`);
  });
  
  // 恢复原始数据
  wx.setStorageSync('exerciseRecords', originalRecords);
  
  console.log('=== 百分比测试完成 ===');
}

/**
 * 计算进度百分比
 * @param {number} current 当前值
 * @param {number} goal 目标值
 * @returns {number} 百分比（0-100）
 */
function calculateProgress(current, goal) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

/**
 * 获取今日运动分类数据（用于饼图）
 * @returns {Array} 运动分类数据数组
 */
function getTodayExerciseCategories() {
  const today = getCurrentDateString();
  const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
  const todayRecords = exerciseRecords[today] || [];
  
  console.log('获取今日运动分类数据:', {
    today,
    exerciseRecords: Object.keys(exerciseRecords),
    todayRecords,
    allRecords: exerciseRecords
  });
  
  // 按分类统计卡路里
  const categoryStats = {};
  
  todayRecords.forEach(record => {
    const category = categorizeExercise(record.name);
    const calories = Number(record.caloriesBurned) || 0;
    
    console.log('处理运动记录:', {
      name: record.name,
      category,
      calories
    });
    
    if (!categoryStats[category]) {
      categoryStats[category] = {
        name: category,
        value: 0,
        icon: exerciseCategories[category]?.icon || '🎯',
        color: exerciseCategories[category]?.color || '#FFDAC1'
      };
    }
    
    categoryStats[category].value += calories;
  });
  
  // 转换为数组并排序
  const result = Object.values(categoryStats)
    .filter(item => item.value > 0) // 只显示有数据的分类
    .sort((a, b) => b.value - a.value); // 按卡路里降序排列
  
  console.log('分类统计结果:', result);
  
  // 如果没有数据，返回默认数据
  if (result.length === 0) {
    console.log('没有运动数据，返回默认数据');
    return [
      { name: '暂无运动数据', value: 100, percentage: 100, icon: '😴', color: '#F0F0F0' }
    ];
  }
  
  // 计算总卡路里
  const totalCalories = result.reduce((sum, item) => sum + item.value, 0);
  
  // 转换为百分比
  const resultWithPercentage = result.map(item => ({
    ...item,
    percentage: Math.round((item.value / totalCalories) * 100),
    originalValue: item.value // 保留原始卡路里值用于调试
  }));
  
  // 添加调试信息
  console.log('运动分类统计:', {
    today,
    recordsCount: todayRecords.length,
    categoryStats,
    totalCalories,
    resultWithPercentage
  });
  
  return resultWithPercentage;
}

/**
 * 获取带进度的今日数据
 * @returns {object} 包含数据和进度的对象
 */
function getTodayDataWithProgress() {
  const data = getTodayCompleteData();
  
  // 目标值
  const stepsGoal = 10000;
  const durationGoal = 60;
  const caloriesGoal = 400;
  const weightGoal = 50;
  
  return {
    ...data,
    stepsPercent: calculateProgress(data.steps, stepsGoal),
    durationPercent: calculateProgress(data.duration, durationGoal),
    caloriesPercent: calculateProgress(data.calories, caloriesGoal),
    weightPercent: calculateProgress(weightGoal, data.weight) // 体重是反向计算
  };
}

/**
 * 获取数据同步状态（用于调试）
 * @returns {object} 数据同步状态信息
 */
function getDataSyncStatus() {
  const today = getCurrentDateString();
  const weRunData = wx.getStorageSync('weRunData') || {};
  const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
  const localSteps = wx.getStorageSync('stepCount') || 0;
  
  const weRunSteps = weRunData[today]?.stepInfoList?.[0]?.step || 0;
  const exerciseSteps = (exerciseRecords[today] || []).reduce((sum, record) => {
    return sum + (record.steps ? Number(record.steps) : 0);
  }, 0);
  
  return {
    date: today,
    weRunSteps,
    exerciseSteps,
    localSteps,
    finalSteps: getTodaySteps(),
    dataSources: {
      weRun: weRunData[today] ? 'available' : 'unavailable',
      exercise: exerciseRecords[today] ? 'available' : 'unavailable',
      local: localSteps > 0 ? 'available' : 'unavailable'
    },
    lastUpdate: wx.getStorageSync('dataUpdated') || 'never'
  };
}

module.exports = {
  getCurrentDateString,
  getTodaySteps,
  getTodayExerciseData,
  getTodayWeight,
  getTodayCompleteData,
  getTodayDataWithProgress,
  getTodayExerciseCategories,
  categorizeExercise,
  testExerciseCategorization,
  testPercentageCalculation,
  calculateProgress,
  getDataSyncStatus
};
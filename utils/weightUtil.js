// weightUtil.js

/**
 * 保存体重记录
 * @param {number} weight 体重值
 * @param {string} date 日期，格式：YYYY-MM-DD
 * @param {string} time 时间，格式：HH:mm
 * @returns {boolean} 是否保存成功
 */
const saveWeightRecord = (weight, date, time) => {
  if (!weight || weight <= 0) {
    return false;
  }
  
  const record = {
    weight: parseFloat(weight),
    date: date,
    time: time,
    timestamp: new Date().getTime()
  };
  
  let records = wx.getStorageSync('weightRecords') || [];
  
  // 检查是否已有当天记录
  let existingIndex = -1;
  for (let i = 0; i < records.length; i++) {
    if (records[i].date === date) {
      existingIndex = i;
      break;
    }
  }
  
  if (existingIndex >= 0) {
    // 更新已有记录
    records[existingIndex] = record;
  } else {
    // 添加新记录
    records.unshift(record);
  }
  
  // 保存记录
  try {
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    wx.setStorageSync('weightRecords', records);
    
    // 更新当前体重
    const userData = wx.getStorageSync('userData') || {};
    userData.currentWeight = weight;
    wx.setStorageSync('userData', userData);

    return true;
  } catch (e) {
    console.error('保存体重记录失败', e);
    return false;
  }
};

/**
 * 获取指定日期范围的体重记录
 * @param {number} days 天数
 * @returns {Array} 体重记录数组
 */
const getWeightRecords = (days = null) => {
  try {
    let records = wx.getStorageSync('weightRecords') || [];
    records = records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (days) {
      // 如果指定了天数，只返回最近n天的记录
      return records.slice(0, days);
    }
    return records;
  } catch (e) {
    console.error('获取体重记录失败', e);
    return [];
  }
};

/**
 * 计算BMI指数
 * @param {number} weight 体重(kg)
 * @param {number} height 身高(cm)
 * @returns {number} BMI值
 */
const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  const heightInMeter = height / 100;
  return (weight / (heightInMeter * heightInMeter)).toFixed(1);
};

/**
 * 获取BMI等级
 * @param {number} bmi BMI值
 * @returns {string} BMI等级描述
 */
const getBMILevel = (bmi) => {
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '偏胖';
  return '肥胖';
};

/**
 * 计算体重进度
 * @returns {Object} 进度信息
 */
function calculateProgress() {
  try {
    const userData = wx.getStorageSync('userData') || {};
    const records = wx.getStorageSync('weightRecords') || [];
    
    // 如果没有初始体重或目标体重，返回默认值
    if (!userData.initialWeight || !userData.targetWeight) {
      return {
        percentage: 0,
        totalToLose: 0,
        alreadyLost: 0,
        remainingToLose: 0
      };
    }

    const initialWeight = parseFloat(userData.initialWeight);
    const targetWeight = parseFloat(userData.targetWeight);
    const currentWeight = records.length > 0 ? parseFloat(records[0].weight) : initialWeight;

    // 计算总需减重
    const totalToLose = Math.max(0, initialWeight - targetWeight);
    
    // 计算已减重
    const alreadyLost = Math.max(0, initialWeight - currentWeight);
    
    // 计算剩余需减重
    const remainingToLose = Math.max(0, currentWeight - targetWeight);
    
    // 计算完成百分比
    let percentage = 0;
    if (totalToLose > 0) {
      percentage = Math.min(100, Math.round((alreadyLost / totalToLose) * 100));
    } else if (currentWeight <= targetWeight) {
      percentage = 100;
    }

    return {
      percentage,
      totalToLose: parseFloat(totalToLose.toFixed(1)),
      alreadyLost: parseFloat(alreadyLost.toFixed(1)),
      remainingToLose: parseFloat(remainingToLose.toFixed(1))
    };
  } catch (e) {
    console.error('计算进度失败', e);
    return {
      percentage: 0,
      totalToLose: 0,
      alreadyLost: 0,
      remainingToLose: 0
    };
  }
}

/**
 * 获取最新体重
 */
function getCurrentWeight() {
  const records = wx.getStorageSync('weightRecords') || [];
  
  if (records.length === 0) {
    const userData = wx.getStorageSync('userData') || {};
    return userData.initialWeight || 0;
  }
  
  return parseFloat(records[0].weight);
}

/**
 * 计算平均减重速度
 * @param {Array} records 体重记录数组
 * @returns {number} 每天平均减重公斤数
 */
const calculateAverageSpeed = (records) => {
  if (!records || records.length < 2) return 0;
  
  const firstRecord = records[0];
  const lastRecord = records[records.length - 1];
  const daysDiff = (new Date(lastRecord.date) - new Date(firstRecord.date)) / (24 * 60 * 60 * 1000);
  
  if (daysDiff === 0) return 0;
  
  return parseFloat(((firstRecord.weight - lastRecord.weight) / daysDiff).toFixed(2));
};

/**
 * 预估达到目标所需天数
 * @param {number} currentWeight 当前体重
 * @param {number} targetWeight 目标体重
 * @param {number} avgSpeed 平均减重速度
 * @returns {number} 预计所需天数
 */
const estimateDaysToGoal = (currentWeight, targetWeight, avgSpeed) => {
  if (!avgSpeed || avgSpeed <= 0 || currentWeight <= targetWeight) return 0;
  return Math.ceil((currentWeight - targetWeight) / avgSpeed);
};

/**
 * 计算今日实际消耗的体重
 * @returns {number} 今日实际消耗的体重（kg）
 */
const calculateTodayActualLoss = () => {
  try {
    const records = wx.getStorageSync('weightRecords') || [];
    if (records.length < 2) return 0;

    // 获取今天和昨天的记录
    const todayWeight = parseFloat(records[0].weight);
    const yesterdayWeight = parseFloat(records[1].weight);

    // 计算实际减重（可能为负，表示体重增加）
    return parseFloat((yesterdayWeight - todayWeight).toFixed(2));
  } catch (e) {
    console.error('计算今日实际消耗失败', e);
    return 0;
  }
};

/**
 * 计算理论和实际消耗进度
 * @returns {Object} 消耗进度信息
 */
const calculateConsumptionProgress = () => {
  try {
    const userData = wx.getStorageSync('userData') || {};
    const dailyTargetLoss = parseFloat(userData.dailyTargetLoss) || 0;
    const actualLoss = calculateTodayActualLoss();

    return {
      targetLoss: dailyTargetLoss,
      actualLoss: actualLoss,
      // 转换为0-1之间的比例
      theoreticalProgress: dailyTargetLoss > 0 ? Math.min(1, Math.max(0, dailyTargetLoss / 0.5)) : 0,
      actualProgress: actualLoss > 0 ? Math.min(1, Math.max(0, actualLoss / 0.5)) : 0
    };
  } catch (e) {
    console.error('计算消耗进度失败', e);
    return {
      targetLoss: 0,
      actualLoss: 0,
      theoreticalProgress: 0,
      actualProgress: 0
    };
  }
};

module.exports = {
  getWeightRecords,
  saveWeightRecord,
  calculateBMI,
  getBMILevel,
  calculateProgress,
  getCurrentWeight,
  calculateAverageSpeed,
  estimateDaysToGoal,
  calculateTodayActualLoss,
  calculateConsumptionProgress
}; 
// 测试数据修复脚本
// 在微信开发者工具的控制台中运行此脚本

console.log('=== 开始测试数据修复 ===');

// 1. 检查当前日期
const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
console.log('当前日期:', todayStr);

// 2. 检查运动记录数据
const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
console.log('所有运动记录:', exerciseRecords);
console.log('今日运动记录:', exerciseRecords[todayStr]);

// 3. 模拟修复今日运动记录数据（如果存在）
if (exerciseRecords[todayStr] && exerciseRecords[todayStr].length > 0) {
  console.log('发现今日运动记录，开始修复数据格式...');
  
  const fixedRecords = exerciseRecords[todayStr].map(record => {
    // 修复时长格式
    let durationInMinutes = 0;
    if (record.duration) {
      if (typeof record.duration === 'string') {
        if (record.duration.includes('小时')) {
          const hours = parseFloat(record.duration.replace('小时', ''));
          durationInMinutes = Math.round(hours * 60);
        } else if (record.duration.includes('分钟')) {
          const minutes = parseFloat(record.duration.replace('分钟', ''));
          durationInMinutes = Math.round(minutes);
        } else {
          const hours = parseFloat(record.duration);
          durationInMinutes = Math.round(hours * 60);
        }
      } else {
        durationInMinutes = Number(record.duration);
      }
    }
    
    return {
      ...record,
      duration: durationInMinutes,
      durationText: record.durationText || record.duration
    };
  });
  
  exerciseRecords[todayStr] = fixedRecords;
  wx.setStorageSync('exerciseRecords', exerciseRecords);
  
  console.log('修复后的运动记录:', fixedRecords);
}

// 4. 测试数据同步功能
const dataSync = require('./utils/dataSync');

// 测试获取今日数据
const todayData = dataSync.getTodayCompleteData();
console.log('今日完整数据:', todayData);

// 测试获取运动分类
const exerciseCategories = dataSync.getTodayExerciseCategories();
console.log('今日运动分类:', exerciseCategories);

// 5. 如果没有数据，添加测试数据
if (!exerciseRecords[todayStr] || exerciseRecords[todayStr].length === 0) {
  console.log('没有今日运动记录，添加测试数据...');
  
  const testRecords = [
    {
      id: Date.now().toString(),
      name: '快走',
      duration: 60, // 1小时 = 60分钟
      durationText: '1小时',
      caloriesBurned: 300,
      time: new Date().toLocaleTimeString()
    },
    {
      id: (Date.now() + 1).toString(),
      name: '瑜伽',
      duration: 120, // 2小时 = 120分钟
      durationText: '2小时',
      caloriesBurned: 500,
      time: new Date().toLocaleTimeString()
    },
    {
      id: (Date.now() + 2).toString(),
      name: '慢跑',
      duration: 120, // 2小时 = 120分钟
      durationText: '2小时',
      caloriesBurned: 1000,
      time: new Date().toLocaleTimeString()
    },
    {
      id: (Date.now() + 3).toString(),
      name: '游泳',
      duration: 60, // 1小时 = 60分钟
      durationText: '1小时',
      caloriesBurned: 600,
      time: new Date().toLocaleTimeString()
    }
  ];
  
  exerciseRecords[todayStr] = testRecords;
  wx.setStorageSync('exerciseRecords', exerciseRecords);
  
  console.log('测试数据已添加:', testRecords);
  
  // 重新测试数据同步
  const newTodayData = dataSync.getTodayCompleteData();
  console.log('添加测试数据后的今日数据:', newTodayData);
  
  const newExerciseCategories = dataSync.getTodayExerciseCategories();
  console.log('添加测试数据后的运动分类:', newExerciseCategories);
}

console.log('=== 测试完成 ===');
console.log('请刷新分析页面查看饼图是否正常显示'); 
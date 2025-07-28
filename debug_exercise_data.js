// 调试运动记录数据格式
// 在微信开发者工具控制台运行

console.log('=== 调试运动记录数据 ===');

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
const todayRecords = exerciseRecords[todayStr] || [];

console.log('今日日期:', todayStr);
console.log('今日运动记录:', todayRecords);

// 检查每条记录的格式
todayRecords.forEach((record, index) => {
  console.log(`记录 ${index + 1}:`, {
    name: record.name,
    duration: record.duration,
    durationType: typeof record.duration,
    durationText: record.durationText,
    caloriesBurned: record.caloriesBurned,
    time: record.time
  });
});

// 测试格式化函数
function formatDuration(duration) {
  duration = Number(duration) || 0;
  if (duration < 60) {
    return duration + '分钟';
  } else if (duration % 60 === 0) {
    return (duration / 60) + '小时';
  } else {
    const hour = Math.floor(duration / 60);
    const min = duration % 60;
    return hour + '小时' + min + '分钟';
  }
}

console.log('=== 格式化测试 ===');
todayRecords.forEach((record, index) => {
  console.log(`${record.name}: ${formatDuration(record.duration)}`);
}); 
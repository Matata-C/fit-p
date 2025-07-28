// analysis.js
const weightUtil = require('../../utils/weightUtil');
const dateUtil = require('../../utils/dateUtil');
const tabBarManager = require('../../utils/tabBarManager');
const dataRepair = require('../../utils/dataRepair');
const dataSync = require('../../utils/dataSync');
const app = getApp()

Page({
  data: {
    period: 'week', 
    hasData: false,
    weightData: [], 
    weightRecords: [],
    statistics: {
      totalLost: 0,
      avgSpeed: 0,
      daysToGoal: 0
    },
    chartOptions: {
      dateLabels: [],
      weightData: [],
      height: 200
    },
    isLoading: true, 
    isRepairing: false, 
    needRefresh: false,
    coreData: {
      date: '',
      steps: 0,
      stepsPercent: 0,
      duration: 0,
      durationPercent: 0,
      calories: 0,
      caloriesPercent: 0,
      weight: 0,
      weightPercent: 0
    },
    exerciseChart: {
      dateLabels: [],
      stepsData: [],
      durationData: [],
      caloriesData: []
    },
    monthData: {},
    pieData: [
      { name: '有氧运动', value: 40, icon: '🏃‍♂️' },
      { name: '无氧运动', value: 25, icon: '💪' },
      { name: '身体塑形', value: 20, icon: '🧘' },
      { name: '竞技运动', value: 15, icon: '🏀' }
    ]
  },

  onLoad() {
    console.log('分析页面加载');
    
    tabBarManager.initTabBarForPage(1);
    
    // 测试运动分类功能
    dataSync.testExerciseCategorization();
    // 测试百分比计算功能
    dataSync.testPercentageCalculation();
    
    // 添加一些测试运动数据用于演示
    this.addTestExerciseData();
    
    this.repairDataIfNeeded();
    
    try {
      this.preloadWeightRecords();
    } catch (e) {
      console.error('预加载体重记录失败:', e);
    }
  },

  repairDataIfNeeded() {
    this.setData({ isRepairing: true });
    
    try {
      const records = wx.getStorageSync('weightRecords');
      if (!Array.isArray(records)) {
        console.log('数据格式不正确，开始修复');
        wx.showLoading({
          title: '修复数据中...',
          mask: true
        });
        
        setTimeout(() => {
          try {
            const result = dataRepair.repairWeightRecords();
            
            if (result) {
              console.log('数据修复成功');
            } else {
              console.log('数据修复失败');
            }
            
            wx.hideLoading();
            this.setData({ isRepairing: false });
            this.loadWeightRecords();
          } catch (e) {
            console.error('修复过程出错:', e);
            wx.hideLoading();
            this.setData({ isRepairing: false });
          }
        }, 100);
      } else {
        console.log('数据格式正确，无需修复');
        this.setData({ isRepairing: false });
      }
    } catch (e) {
      console.error('检查数据格式出错:', e);
      this.setData({ isRepairing: false });
      try {
        dataRepair.repairWeightRecords();
      } catch (error) {
        console.error('强制修复失败:', error);
      }
    }
  },

  onShow() {
    console.log('分析页面显示');
    tabBarManager.setSelectedTab(1);
    try {
      const dataUpdated = wx.getStorageSync('dataUpdated');
      const lastUpdate = wx.getStorageSync('lastAnalysisUpdate') || 0;
      if ((dataUpdated && dataUpdated > lastUpdate) || this.data.needRefresh) {
        console.log('检测到数据更新，刷新分析页面数据');
        wx.setStorageSync('lastAnalysisUpdate', new Date().getTime());
        this.setData({ needRefresh: false, isLoading: true });
        this._weightRecords = null;
        setTimeout(() => {
          this.loadWeightRecords();
          setTimeout(() => {
            this.syncStatisticsWithUserStats();
            this.updateCoreData(); // 确保核心数据也更新
            this.updatePieChart(); // 确保饼图数据也更新
          }, 100);
          
          console.log('数据已重新加载');
        }, 50);
        
        return; 
      }
    } catch (e) {
      console.error('检查数据更新失败:', e);
    }
    if (!this.data.isRepairing) {
      if (this.data.weightRecords && this.data.weightRecords.length > 0) {
        this.setData({ isLoading: false });
        this.syncStatisticsWithUserStats();
      } else {
        setTimeout(() => {
          this.loadWeightRecords();
          setTimeout(() => {
            this.syncStatisticsWithUserStats();
          }, 100);
        }, 50);
      }
    }
    // 若无本地运动数据，自动生成模拟数据
    let exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let hasData = false;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      if (exerciseRecords[key] && exerciseRecords[key].length > 0) {
        hasData = true;
        break;
      }
    }
    if (!hasData) {
      // 生成本月每天的模拟数据
      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        // 随机生成步数、时长、卡路里
        const steps = Math.floor(Math.random() * 8000 + 2000); // 2000~10000
        const duration = Math.floor(Math.random() * 60 + 20); // 20~80分钟
        const calories = Math.floor(Math.random() * 300 + 100); // 100~400千卡
        exerciseRecords[key] = [{ steps, minutes: duration, caloriesBurned: calories }];
      }
      wx.setStorageSync('exerciseRecords', exerciseRecords);
    }
    this.updateCoreData();
    this.updateExerciseChart();
    this.updateExerciseCalendar();
    this.updatePieChart();
  },
  preloadWeightRecords() {
    try {
      let records = wx.getStorageSync('weightRecordsArray');
      if (!Array.isArray(records) || records.length === 0) {
        console.log('数组格式记录不存在，尝试读取对象格式记录');
        let objectRecords = wx.getStorageSync('weightRecords');
        if (typeof objectRecords === 'object' && objectRecords !== null) {
          const recordsArray = [];
          for (const key in objectRecords) {
            if (objectRecords.hasOwnProperty(key)) {
              recordsArray.push({
                date: key,
                weight: objectRecords[key]
              });
            }
          }
          records = recordsArray;
          console.log('已将对象格式转换为数组，长度:', records.length);
          if (records.length > 0) {
            wx.setStorageSync('weightRecordsArray', records);
          }
        } else {
          records = [];
          console.log('创建了空数组');
        }
      }
      records = records.filter(item => item && item.date && (item.weight !== undefined));
      if (Array.isArray(records) && records.length > 0) {
        try {
          records.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
          });
        } catch (sortError) {
          console.error('排序失败:', sortError);
        }
      }
      this._weightRecords = records;
      
      console.log('预加载完成，记录数量:', records.length);
    } catch (e) {
      console.error('预加载体重记录失败:', e);
      this._weightRecords = [];
    }
  },
  loadWeightRecords() {
    try {
      console.log('开始加载体重记录');
      this.setData({ isLoading: true });
      let records = wx.getStorageSync('weightRecordsArray');
      if (!Array.isArray(records) || records.length === 0) {
        console.log('数组格式记录不存在，尝试读取对象格式记录');
        let objectRecords = wx.getStorageSync('weightRecords');
        if (typeof objectRecords === 'object' && objectRecords !== null) {
          const recordsArray = [];
          for (const key in objectRecords) {
            if (objectRecords.hasOwnProperty(key)) {
              recordsArray.push({
                date: key,
                weight: objectRecords[key]
              });
            }
          }
          records = recordsArray;
          console.log('已将对象格式转换为数组，长度:', records.length);
          if (records.length > 0) {
            wx.setStorageSync('weightRecordsArray', records);
          }
        } else {
          records = [];
          console.log('创建了空数组');
        }
      }
      if (Array.isArray(records)) {
        if (records.length > 0) {
          this._weightRecords = records;
          this.setData({ 
            weightRecords: records,
            hasData: true,
            isLoading: false
          });
          const stats = this.calculateStatistics();
          
          if (stats) {
            this.setData({
              statistics: {
                totalLost: stats.totalLost,
                avgSpeed: (stats.avgSpeedPerWeek / 7).toFixed(2),
                daysToGoal: stats.daysToGo
              }
            });
          }
          this.updateChartData(this.data.period);
        } else {
          console.log('没有体重记录');
          this.setData({ 
            hasData: false,
            isLoading: false
          });
        }
      } else {
        console.log('无法获取有效的体重记录');
        this.setData({ 
          hasData: false,
          isLoading: false
        });
      }
    } catch (e) {
      console.error('加载体重记录失败:', e);
      this.setData({ 
        hasData: false,
        isLoading: false
      });
    }
  },
  updateChartData(period) {
    const records = this.data.weightRecords;
    if (!records || records.length === 0) {
      this.setData({ hasData: false });
      return;
    }
    
    try {
      const filteredRecords = this.filterRecordsByPeriod(records, period);
      
      if (filteredRecords.length === 0) {
        console.log('过滤后没有记录');
        this.setData({ hasData: false });
        return;
      }
      filteredRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
      const dateLabels = [];
      const weightData = [];
      
      for (const record of filteredRecords) {
        if (record.date && record.weight !== undefined) {
          const formattedDate = dateUtil.formatDate ? 
            dateUtil.formatDate(record.date) : 
            record.date.substring(5);
          
          dateLabels.push(formattedDate);
          weightData.push(parseFloat(record.weight));
        }
      }
      
      if (weightData.length === 0) {
        console.log('没有有效的体重数据');
        this.setData({ hasData: false });
        return;
      }

      let minWeight = Math.min(...weightData);
      let maxWeight = Math.max(...weightData);

      minWeight = Math.max(0, minWeight - 0.5);
      maxWeight = maxWeight + 0.5;

      const normalizedWeights = weightData.map(weight => {
        if (maxWeight === minWeight) return 50; 
        return (100 - ((weight - minWeight) / (maxWeight - minWeight) * 100));
      });

      const statistics = this.calculateStatistics() || {
        totalLost: 0,
        avgSpeed: 0,
        daysToGo: 0
      };

      this.setData({
        chartOptions: {
          dateLabels: dateLabels,
          weightData: normalizedWeights,
          height: 200
        },
        weightData: weightData,
        hasData: true,
        statistics: {
          totalLost: statistics.totalLost || 0,
          avgSpeed: (statistics.avgSpeedPerWeek / 7).toFixed(2) || 0, 
          daysToGo: statistics.daysToGo || 0
        }
      });
      
      console.log('图表数据已更新，记录数:', dateLabels.length);
    } catch (e) {
      console.error('更新图表数据失败:', e);
      this.setData({ hasData: false });
    }
  },
  filterRecordsByPeriod(records, period) {
    if (!Array.isArray(records) || records.length === 0) return [];
    if (period === 'all') return records;
    
    try {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (period === 'week') {
        cutoffDate.setDate(now.getDate() - 7); 
      } else if (period === 'month') {
        cutoffDate.setMonth(now.getMonth() - 1); 
      }
      
      return records.filter(item => {
        if (!item || !item.date) return false;
        
        const recordDate = new Date(item.date);
        if (isNaN(recordDate)) return false;
        
        return recordDate >= cutoffDate;
      });
    } catch (e) {
      console.error('筛选记录失败:', e);
      return [];
    }
  },
  calculateStatistics() {
    const records = this.data.weightRecords;
    if (!records || records.length === 0) {
      console.log('没有记录，无法计算统计数据');
      return null;
    }

    try {
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (records.length === 1) {
        const singleRecord = records[0];
        console.log('只有单条记录，创建初始统计数据');
        
        const statistics = {
          totalRecords: 1,
          firstDate: singleRecord.date,
          latestDate: singleRecord.date,
          firstWeight: singleRecord.weight,
          latestWeight: singleRecord.weight,
          totalLost: 0,
          avgSpeedPerWeek: 0,
          daysElapsed: 0,
          daysToGo: 0
        };
        wx.setStorageSync('analysisStatistics', statistics);
        this.syncStatisticsWithUserStats(statistics, singleRecord.weight);
        
        return statistics;
      }
      const firstRecord = records[0];
      const latestRecord = records[records.length - 1];
      const totalLost = (parseFloat(firstRecord.weight) - parseFloat(latestRecord.weight)).toFixed(1);
      const daysDiff = Math.round((new Date(latestRecord.date) - new Date(firstRecord.date)) / (24 * 60 * 60 * 1000));

      const avgSpeedPerWeek = daysDiff > 0 ? ((totalLost / daysDiff) * 7).toFixed(2) : 0;

      let daysToGo = 0;
      const goalData = wx.getStorageSync('goalData');
      if (goalData && goalData.goalWeight) {
        const weightToGo = parseFloat(latestRecord.weight) - parseFloat(goalData.goalWeight);
        if (weightToGo > 0 && avgSpeedPerWeek > 0) {
          daysToGo = Math.ceil((weightToGo / avgSpeedPerWeek) * 7);
        }
      }

      const statistics = {
        totalRecords: records.length,
        firstDate: firstRecord.date,
        latestDate: latestRecord.date,
        firstWeight: firstRecord.weight,
        latestWeight: latestRecord.weight,
        totalLost: totalLost,
        avgSpeedPerWeek: avgSpeedPerWeek,
        daysElapsed: daysDiff,
        daysToGo: daysToGo
      };

      wx.setStorageSync('analysisStatistics', statistics);

      this.syncStatisticsWithUserStats(statistics, latestRecord.weight);
      
      console.log('统计数据计算完成:', statistics);
      return statistics;
    } catch (e) {
      console.error('计算统计数据失败:', e);
      return null;
    }
  },
  syncStatisticsWithUserStats(statistics, currentWeight) {
    try {
      if (!statistics) {
        console.log('统计数据为空，无法同步到用户统计');
        return;
      }

      let userStats = wx.getStorageSync('userStats') || {};

      if (statistics.totalLost !== undefined) {
        userStats.totalWeightLoss = parseFloat(statistics.totalLost);
      }
      
      if (currentWeight !== undefined) {
        userStats.currentWeight = parseFloat(currentWeight);
      }

      const goalData = wx.getStorageSync('goalData');
      if (goalData && goalData.goalWeight && userStats.currentWeight) {
        const startWeight = parseFloat(userStats.startWeight || goalData.startWeight || userStats.currentWeight);
        const goalWeight = parseFloat(goalData.goalWeight);
        const currentWeight = parseFloat(userStats.currentWeight);

        const totalToLose = startWeight - goalWeight;
        const alreadyLost = Math.max(0, startWeight - currentWeight);

        userStats.weightLossPercentage = totalToLose > 0 
          ? Math.min(100, Math.round((alreadyLost / totalToLose) * 100)) 
          : 0;

        userStats.weightToGo = Math.max(0, currentWeight - goalWeight).toFixed(1);
      }
      wx.setStorageSync('userStats', userStats);
      console.log('用户统计数据已更新:', userStats);
    } catch (e) {
      console.error('同步用户统计数据失败:', e);
    }
  },
  updateCoreData() {
    // 使用统一的数据同步工具获取今日数据
    const todayData = dataSync.getTodayDataWithProgress();
    
    this.setData({
      coreData: {
        date: todayData.date,
        steps: todayData.steps,
        stepsPercent: todayData.stepsPercent,
        duration: todayData.duration,
        durationPercent: todayData.durationPercent,
        calories: todayData.calories,
        caloriesPercent: todayData.caloriesPercent,
        weight: todayData.weight,
        weightPercent: todayData.weightPercent
      }
    });
    
    console.log('分析页面核心数据更新:', todayData);
  },
  updateExerciseChart() {
    // 获取本周日期
    const now = new Date();
    const weekDates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      weekDates.push(d);
    }
    const dateLabels = weekDates.map(d => `${d.getMonth() + 1}/${d.getDate()}`);
    
    // 获取本地运动数据
    let exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
    const stepsData = [];
    const durationData = [];
    const caloriesData = [];
    
    weekDates.forEach(d => {
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const records = exerciseRecords[key] || [];
      let steps = 0, duration = 0, calories = 0;
      
      records.forEach(record => {
        steps += record.steps ? Number(record.steps) : 0;
        duration += record.minutes ? Number(record.minutes) : (record.duration ? Number(record.duration) : 0);
        calories += record.caloriesBurned ? Number(record.caloriesBurned) : 0;
      });
      
      // 如果运动记录中没有数据，尝试从微信运动获取步数
      if (steps === 0) {
        try {
          const weRunData = wx.getStorageSync('weRunData') || {};
          if (weRunData[key] && weRunData[key].stepInfoList && weRunData[key].stepInfoList.length > 0) {
            steps = weRunData[key].stepInfoList[0].step || 0;
            // 根据步数估算卡路里
            if (calories === 0 && steps > 0) {
              calories = Math.round(steps * 0.04);
            }
          }
        } catch (e) {
          console.log('获取微信运动数据失败');
        }
      }
      
      stepsData.push(steps);
      durationData.push(duration);
      caloriesData.push(calories);
    });
    
    this.setData({
      exerciseChart: {
        dateLabels,
        stepsData,
        durationData,
        caloriesData
      }
    });
  },
  updatePieChart() {
    // 使用统一的数据同步工具获取运动分类数据
    const pieData = dataSync.getTodayExerciseCategories();
    
    console.log('分析页面 - 饼图数据更新:', pieData);
    console.log('分析页面 - 当前日期:', dataSync.getCurrentDateString());
    
    this.setData({
      pieData: pieData
    });
  },

  // 添加测试运动数据
  addTestExerciseData() {
    const today = dataSync.getCurrentDateString();
    const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
    
    // 检查今天是否已有数据
    if (!exerciseRecords[today] || exerciseRecords[today].length === 0) {
      console.log('添加测试运动数据');
      
      const testRecords = [
        { name: '快走', caloriesBurned: 150, duration: 30 },
        { name: '慢跑', caloriesBurned: 200, duration: 25 },
        { name: '力量训练', caloriesBurned: 100, duration: 20 },
        { name: '瑜伽', caloriesBurned: 50, duration: 15 }
      ];
      
      exerciseRecords[today] = testRecords;
      wx.setStorageSync('exerciseRecords', exerciseRecords);
      
      console.log('测试运动数据已添加:', testRecords);
    }
  },

  updateExerciseCalendar() {
    // 临时写死一组monthData用于测试热力图
    const monthData = {};
    for (let day = 1; day <= 31; day++) {
      monthData[day] = Math.floor(Math.random() * 100);
    }
    console.log('setData monthData', monthData);
    this.setData({ monthData });
    console.log('setData后页面data.monthData', this.data.monthData);
  },

  switchPeriod(e) {
    const period = e.currentTarget.dataset.period;
    this.setData({ period });
    this.updateChartData(period);
  },


  onPhotoRecognize() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 模拟识别结果
        wx.showModal({
          title: '识别结果',
          content: '食物：香蕉\n热量：89千卡/100g',
          showCancel: false
        })
      }
    })
  },
}) 
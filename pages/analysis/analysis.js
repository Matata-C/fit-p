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
        const tempFilePath = res.tempFilePaths[0];
        
        wx.showLoading({
          title: '🤖 AI识别中...',
          mask: true
        });

        // 上传图片到云存储
        wx.cloud.uploadFile({
          cloudPath: `food-recognition/${Date.now()}.jpg`,
          filePath: tempFilePath,
          success: (uploadRes) => {
            console.log('图片上传成功:', uploadRes.fileID);
            
            // 调用云函数进行图像识别
            wx.cloud.callFunction({
              name: 'imageRecognition',
              data: {
                action: 'recognize',
                imageUrl: uploadRes.fileID
              },
              success: (result) => {
                wx.hideLoading();
                console.log('AI识别结果:', result);
                
                if (result.result && result.result.success) {
                  const foodData = result.result.data;
                  console.log('AI识别成功:', foodData);
                  this.showFoodRecognitionResult(foodData);
                } else {
                  console.log('AI识别失败:', result.result.error);
        wx.showModal({
                    title: '🤖 AI识别失败',
                    content: '抱歉，AI无法识别这张图片中的食物\n\n💡 建议:\n• 确保图片清晰\n• 食物在图片中占主要部分\n• 尝试手动添加食物',
                    confirmText: '手动添加',
                    cancelText: '重试',
                    success: (res) => {
                      if (res.confirm) {
                        this.showManualAddFood();
                      } else {
                        this.onPhotoRecognize();
                      }
                    }
                  });
                }
              },
              fail: (error) => {
                wx.hideLoading();
                console.error('AI识别服务失败:', error);
                wx.showModal({
                  title: '🌐 网络问题',
                  content: 'AI识别服务暂时不可用\n\n💡 可能原因:\n• 网络连接不稳定\n• 阿里云服务配置问题\n• 图片格式不支持',
                  confirmText: '手动添加',
                  cancelText: '重试',
                  success: (res) => {
                    if (res.confirm) {
                      this.showManualAddFood();
                    } else {
                      this.onPhotoRecognize();
                    }
                  }
                });
              }
            });
          },
          fail: (error) => {
            wx.hideLoading();
            console.error('图片上传失败:', error);
            wx.showModal({
              title: '📤 上传失败',
              content: '图片上传到云端失败\n\n💡 建议:\n• 检查网络连接\n• 图片大小不超过10MB\n• 确保图片格式正确',
              confirmText: '重试',
              cancelText: '手动添加',
              success: (res) => {
                if (res.confirm) {
                  this.onPhotoRecognize();
                } else {
                  this.showManualAddFood();
                }
              }
            });
          }
        });
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        });
      }
    });
  },

  showManualFoodSelection() {
        wx.showModal({
      title: '识别失败',
      content: '无法识别图片中的食物，是否手动选择？',
      confirmText: '手动选择',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.showFoodSelectionModal();
        }
      }
    });
  },

  showFoodSelectionModal() {
    // 获取所有可用的食物列表
    wx.cloud.callFunction({
      name: 'imageRecognition',
      data: {
        action: 'getFoodList'
      },
      success: (result) => {
        if (result.result && result.result.success) {
          const foodList = result.result.data;
          this.setData({
            availableFoods: foodList
          });
          this.showFoodPicker();
        }
      },
      fail: (error) => {
        console.error('获取食物列表失败:', error);
        wx.showToast({
          title: '获取食物列表失败',
          icon: 'error'
        });
      }
    });
  },

  showFoodPicker() {
    const foodList = this.data.availableFoods || [];
    const foodNames = foodList.map(food => food.name);
    
    wx.showActionSheet({
      itemList: foodNames,
      success: (res) => {
        const selectedIndex = res.tapIndex;
        const selectedFood = foodList[selectedIndex];
        
        if (selectedFood) {
          const foodData = {
            foodName: selectedFood.name,
            calories: selectedFood.calories,
            unit: selectedFood.unit,
            nutrition: selectedFood.nutrition,
            tips: selectedFood.tips,
            confidence: 0.8 // 手动选择的置信度
          };
          
          this.showFoodRecognitionResult(foodData);
        }
      },
      fail: (error) => {
        console.error('选择食物失败:', error);
      }
    });
  },

  showFoodRecognitionResult(foodData) {
    console.log('showFoodRecognitionResult 被调用');
    console.log('食物数据:', foodData);
    
    const { foodName, calories, unit, nutrition, tips, confidence } = foodData;
    
    const confidenceText = `置信度: ${(confidence * 100).toFixed(1)}%`;
    const nutritionText = `蛋白质: ${nutrition.protein}g | 脂肪: ${nutrition.fat}g | 碳水: ${nutrition.carbs}g | 纤维: ${nutrition.fiber}g`;
    
    console.log('显示食物识别结果:', foodData);
    console.log('食物名称:', foodName);
    console.log('热量:', calories);
    console.log('营养信息:', nutrition);
    
    // 只显示食物信息，不提供添加功能
    wx.showModal({
      title: `🍽️ 食物信息: ${foodName}`,
      content: `📊 营养信息:\n热量: ${calories}千卡/${unit}\n${nutritionText}\n\n💡 营养小贴士:\n${tips}\n\n🎯 ${confidenceText}`,
      confirmText: '确定',
      showCancel: false,
      success: (res) => {
        console.log('用户确认查看食物信息');
      },
      fail: (error) => {
        console.error('显示食物信息弹窗失败:', error);
        wx.showToast({
          title: '显示失败',
          icon: 'error'
        });
      }
    });
  },





  showManualAddFood() {
            wx.showModal({
          title: '🍽️ 手动添加食物',
          content: '',
          editable: true,
          placeholderText: '',
          confirmText: '确定',
          showCancel: false,
          success: (res) => {
            if (res.confirm && res.content) {
              console.log('用户输入:', res.content);
              this.searchAndShowFoodInfo(res.content);
            }
          }
        });
  },

  searchAndShowFoodInfo(foodName) {
    console.log('搜索食物信息:', foodName);
    
    // 扩展的本地食物数据库（智能搜索）
    const localFoodList = [
      // 水果类
      { key: 'banana', name: '香蕉', calories: 89, unit: '100g', nutrition: { protein: 1.1, fat: 0.3, carbs: 22.8, fiber: 2.6 }, tips: '香蕉富含钾元素，有助于肌肉恢复' },
      { key: 'apple', name: '苹果', calories: 52, unit: '100g', nutrition: { protein: 0.3, fat: 0.2, carbs: 13.8, fiber: 2.4 }, tips: '苹果富含膳食纤维，有助于消化' },
      { key: 'orange', name: '橙子', calories: 47, unit: '100g', nutrition: { protein: 0.9, fat: 0.1, carbs: 11.8, fiber: 2.4 }, tips: '橙子富含维生素C，增强免疫力' },
      { key: 'peach', name: '桃子', calories: 39, unit: '100g', nutrition: { protein: 0.9, fat: 0.3, carbs: 9.5, fiber: 1.5 }, tips: '桃子富含维生素A和C，有助于皮肤健康' },
      { key: 'grape', name: '葡萄', calories: 62, unit: '100g', nutrition: { protein: 0.6, fat: 0.2, carbs: 16.0, fiber: 0.9 }, tips: '葡萄富含抗氧化物质，有助于心血管健康' },
      { key: 'watermelon', name: '西瓜', calories: 30, unit: '100g', nutrition: { protein: 0.6, fat: 0.2, carbs: 7.6, fiber: 0.4 }, tips: '西瓜富含水分，有助于补充水分' },
      { key: 'strawberry', name: '草莓', calories: 32, unit: '100g', nutrition: { protein: 0.7, fat: 0.3, carbs: 7.7, fiber: 2.0 }, tips: '草莓富含维生素C，有助于增强免疫力' },
      { key: 'pineapple', name: '菠萝', calories: 50, unit: '100g', nutrition: { protein: 0.5, fat: 0.1, carbs: 13.1, fiber: 1.4 }, tips: '菠萝富含菠萝蛋白酶，有助于消化' },
      { key: 'mango', name: '芒果', calories: 60, unit: '100g', nutrition: { protein: 0.8, fat: 0.4, carbs: 15.0, fiber: 1.6 }, tips: '芒果富含维生素A和C，有助于皮肤健康' },

      
      // 主食类
      { key: 'rice', name: '米饭', calories: 116, unit: '100g', nutrition: { protein: 2.6, fat: 0.3, carbs: 25.6, fiber: 0.4 }, tips: '米饭是主要碳水化合物来源' },
      { key: 'noodle', name: '面条', calories: 138, unit: '100g', nutrition: { protein: 4.5, fat: 0.9, carbs: 27.0, fiber: 1.2 }, tips: '面条是快速补充能量的主食' },
      { key: 'bread', name: '面包', calories: 265, unit: '100g', nutrition: { protein: 9.0, fat: 3.2, carbs: 49.0, fiber: 2.7 }, tips: '全麦面包富含膳食纤维' },
      { key: 'potato', name: '土豆', calories: 77, unit: '100g', nutrition: { protein: 2.0, fat: 0.1, carbs: 17.0, fiber: 2.2 }, tips: '土豆富含维生素C和钾元素' },
      
      // 肉类
      { key: 'chicken', name: '鸡肉', calories: 165, unit: '100g', nutrition: { protein: 31, fat: 3.6, carbs: 0, fiber: 0 }, tips: '鸡肉是优质蛋白质来源' },
      { key: 'pork', name: '猪肉', calories: 242, unit: '100g', nutrition: { protein: 27, fat: 14, carbs: 0, fiber: 0 }, tips: '猪肉富含蛋白质和B族维生素' },
      { key: 'beef', name: '牛肉', calories: 250, unit: '100g', nutrition: { protein: 26, fat: 15, carbs: 0, fiber: 0 }, tips: '牛肉富含铁质，有助于补血' },
      { key: 'fish', name: '鱼肉', calories: 84, unit: '100g', nutrition: { protein: 20.4, fat: 0.5, carbs: 0, fiber: 0 }, tips: '鱼肉富含Omega-3脂肪酸' },
      { key: 'lamb', name: '羊肉', calories: 294, unit: '100g', nutrition: { protein: 25.6, fat: 21.2, carbs: 0, fiber: 0 }, tips: '羊肉富含蛋白质和铁质，有助于补血' },
      { key: 'duck', name: '鸭肉', calories: 337, unit: '100g', nutrition: { protein: 19.0, fat: 28.4, carbs: 0, fiber: 0 }, tips: '鸭肉富含蛋白质和B族维生素' },

      
      // 蛋奶类
      { key: 'egg', name: '鸡蛋', calories: 155, unit: '100g', nutrition: { protein: 12.6, fat: 11.3, carbs: 0.7, fiber: 0 }, tips: '鸡蛋是优质蛋白质和维生素D来源' },
      { key: 'milk', name: '牛奶', calories: 42, unit: '100ml', nutrition: { protein: 3.4, fat: 1.0, carbs: 5.0, fiber: 0 }, tips: '牛奶富含钙质，有助于骨骼健康' },
      { key: 'yogurt', name: '酸奶', calories: 59, unit: '100g', nutrition: { protein: 3.5, fat: 3.3, carbs: 4.7, fiber: 0 }, tips: '酸奶富含益生菌，有助于肠道健康' },
      
      // 蔬菜类
      { key: 'vegetables', name: '蔬菜', calories: 25, unit: '100g', nutrition: { protein: 2.0, fat: 0.2, carbs: 4.0, fiber: 2.5 }, tips: '蔬菜富含维生素和矿物质' },
      { key: 'tomato', name: '西红柿', calories: 18, unit: '100g', nutrition: { protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 }, tips: '西红柿富含番茄红素，有助于抗氧化' },
      { key: 'cucumber', name: '黄瓜', calories: 16, unit: '100g', nutrition: { protein: 0.7, fat: 0.1, carbs: 3.6, fiber: 0.5 }, tips: '黄瓜富含水分，有助于补充水分' },
      { key: 'carrot', name: '胡萝卜', calories: 41, unit: '100g', nutrition: { protein: 0.9, fat: 0.2, carbs: 9.6, fiber: 2.8 }, tips: '胡萝卜富含胡萝卜素，有助于视力保护' },
      { key: 'broccoli', name: '西兰花', calories: 34, unit: '100g', nutrition: { protein: 2.8, fat: 0.4, carbs: 7.0, fiber: 2.6 }, tips: '西兰花富含维生素C和K，有助于骨骼健康' },
      { key: 'spinach', name: '菠菜', calories: 23, unit: '100g', nutrition: { protein: 2.9, fat: 0.4, carbs: 3.6, fiber: 2.2 }, tips: '菠菜富含铁质和叶酸，有助于补血' },
      { key: 'cabbage', name: '白菜', calories: 25, unit: '100g', nutrition: { protein: 1.3, fat: 0.2, carbs: 5.8, fiber: 2.5 }, tips: '白菜富含维生素C，有助于增强免疫力' },

      
      // 坚果类

      { key: 'almond', name: '杏仁', calories: 579, unit: '100g', nutrition: { protein: 21.2, fat: 49.9, carbs: 21.7, fiber: 12.5 }, tips: '杏仁富含维生素E，有助于皮肤健康' },
      
      // 快餐和零食类
      { key: 'pizza', name: '披萨', calories: 266, unit: '100g', nutrition: { protein: 11.0, fat: 10.0, carbs: 33.0, fiber: 2.5 }, tips: '披萨富含碳水化合物，建议适量食用' },
      { key: 'hamburger', name: '汉堡', calories: 295, unit: '100g', nutrition: { protein: 12.0, fat: 15.0, carbs: 25.0, fiber: 1.5 }, tips: '汉堡热量较高，建议搭配蔬菜食用' },
      { key: 'frenchfries', name: '薯条', calories: 312, unit: '100g', nutrition: { protein: 3.4, fat: 15.0, carbs: 41.0, fiber: 3.8 }, tips: '薯条油炸食品，建议适量食用' },
      { key: 'chips', name: '薯片', calories: 536, unit: '100g', nutrition: { protein: 7.0, fat: 35.0, carbs: 53.0, fiber: 4.4 }, tips: '薯片热量很高，建议少量食用' },
      
      // 饮品类
      { key: 'coffee', name: '咖啡', calories: 2, unit: '100ml', nutrition: { protein: 0.3, fat: 0.0, carbs: 0.0, fiber: 0 }, tips: '咖啡含有咖啡因，有助于提神醒脑' },
      { key: 'tea', name: '茶', calories: 1, unit: '100ml', nutrition: { protein: 0.0, fat: 0.0, carbs: 0.2, fiber: 0 }, tips: '茶富含茶多酚，有助于抗氧化' },
      { key: 'juice', name: '果汁', calories: 54, unit: '100ml', nutrition: { protein: 0.5, fat: 0.1, carbs: 13.0, fiber: 0.2 }, tips: '果汁富含维生素，但糖分较高' },
      
      // 甜品类
      { key: 'icecream', name: '冰淇淋', calories: 207, unit: '100g', nutrition: { protein: 3.5, fat: 11.0, carbs: 24.0, fiber: 0 }, tips: '冰淇淋热量较高，建议适量食用' },
      { key: 'cheese', name: '奶酪', calories: 402, unit: '100g', nutrition: { protein: 25.0, fat: 33.0, carbs: 1.3, fiber: 0 }, tips: '奶酪富含钙质和蛋白质，有助于骨骼健康' },
      { key: 'chocolate', name: '巧克力', calories: 545, unit: '100g', nutrition: { protein: 4.9, fat: 31.0, carbs: 61.0, fiber: 7.0 }, tips: '巧克力富含可可多酚，但热量较高' },
      { key: 'cake', name: '蛋糕', calories: 257, unit: '100g', nutrition: { protein: 5.0, fat: 12.0, carbs: 35.0, fiber: 1.0 }, tips: '蛋糕糖分较高，建议适量食用' },
      
      // 海鲜类
      { key: 'shrimp', name: '虾', calories: 99, unit: '100g', nutrition: { protein: 24.0, fat: 0.3, carbs: 0.2, fiber: 0 }, tips: '虾富含优质蛋白质和矿物质' },
      { key: 'crab', name: '螃蟹', calories: 83, unit: '100g', nutrition: { protein: 18.0, fat: 1.0, carbs: 0.1, fiber: 0 }, tips: '螃蟹富含蛋白质和维生素B12' },
      
      // 豆类
      { key: 'tofu', name: '豆腐', calories: 76, unit: '100g', nutrition: { protein: 8.0, fat: 4.8, carbs: 1.9, fiber: 0.3 }, tips: '豆腐富含植物蛋白，适合素食者' },
      { key: 'soybean', name: '大豆', calories: 446, unit: '100g', nutrition: { protein: 36.5, fat: 20.0, carbs: 30.0, fiber: 9.0 }, tips: '大豆富含植物蛋白和异黄酮' }
    ];
    
    // 先尝试本地搜索
    const localMatch = this.findBestMatch(foodName, localFoodList);
    console.log('本地搜索结果:', localMatch);
    
    if (localMatch) {
      console.log('本地搜索成功:', localMatch);
      const foodData = {
        foodName: localMatch.name,
        calories: localMatch.calories,
        unit: localMatch.unit,
        nutrition: localMatch.nutrition,
        tips: localMatch.tips,
        confidence: 0.9
      };
      console.log('准备显示食物信息:', foodData);
      this.showFoodRecognitionResult(foodData);
      return;
    } else {
      console.log('本地搜索失败');
      wx.showModal({
        title: '🔍 未找到食物',
        content: `抱歉，未找到"${foodName}"的营养信息\n\n💡 请尝试其他食物名称`,
        confirmText: '确定',
          showCancel: false
      });
    }
  },

  findBestMatch(searchTerm, foodList) {
    console.log('开始搜索匹配:', searchTerm);
    console.log('可用食物列表:', foodList);
    
    const searchLower = searchTerm.toLowerCase();
    console.log('搜索词(小写):', searchLower);
    
    // 1. 精确匹配
    let match = foodList.find(food => 
      food.name.toLowerCase() === searchLower
    );
    if (match) {
      console.log('精确匹配成功:', match.name);
      return match;
    }
    console.log('精确匹配失败');
    
    // 2. 智能关键词匹配
    const keywords = {
      // 水果类
      '桃子': 'peach', '桃': 'peach',
      '苹果': 'apple', '苹果': 'apple',
      '香蕉': 'banana', '香蕉': 'banana',
      '橙子': 'orange', '橙': 'orange',
      '葡萄': 'grape', '葡萄': 'grape',
      '西瓜': 'watermelon', '西瓜': 'watermelon',
      '草莓': 'strawberry', '草莓': 'strawberry',
      
      // 主食类
      '米饭': 'rice', '米': 'rice',
      '面条': 'noodle', '面': 'noodle',
      '面包': 'bread', '面包': 'bread',
      '土豆': 'potato', '马铃薯': 'potato',
      
      // 肉类
      '鸡肉': 'chicken', '鸡': 'chicken',
      '猪肉': 'pork', '猪': 'pork',
      '牛肉': 'beef', '牛': 'beef',
      '鱼肉': 'fish', '鱼': 'fish',
      
      // 蛋奶类
      '鸡蛋': 'egg', '蛋': 'egg',
      '牛奶': 'milk', '奶': 'milk',
      '酸奶': 'yogurt', '酸奶': 'yogurt',
      
      // 蔬菜类
      '蔬菜': 'vegetables', '菜': 'vegetables',
      '西红柿': 'tomato', '番茄': 'tomato',
      '黄瓜': 'cucumber', '黄瓜': 'cucumber',
      '胡萝卜': 'carrot', '萝卜': 'carrot',
      
      // 坚果类
      '花生': 'peanut', '花生': 'peanut',
      '杏仁': 'almond', '杏仁': 'almond',
      
      // 快餐和零食类
      '披萨': 'pizza', 'pizza': 'pizza',
      '汉堡': 'hamburger', '汉堡包': 'hamburger',
      '薯条': 'frenchfries', '炸薯条': 'frenchfries',
      '薯片': 'chips', '土豆片': 'chips',
      
      // 饮品类
      '咖啡': 'coffee', '美式咖啡': 'coffee',
      '茶': 'tea', '绿茶': 'tea', '红茶': 'tea',
      '果汁': 'juice', '橙汁': 'juice',
      
      // 甜品类
      '冰淇淋': 'icecream', '雪糕': 'icecream',
      '巧克力': 'chocolate', '可可': 'chocolate',
      '蛋糕': 'cake', '生日蛋糕': 'cake',
      
      // 海鲜类
      '虾': 'shrimp', '大虾': 'shrimp',
      '螃蟹': 'crab', '大闸蟹': 'crab',
      
      // 豆类
      '豆腐': 'tofu', '豆花': 'tofu',
      '大豆': 'soybean', '黄豆': 'soybean',
      
      // 通用别名
      '水果': 'apple', '肉': 'chicken', '主食': 'rice', '饮品': 'milk',
      '零食': 'chips', '甜点': 'cake', '饮料': 'juice'
    };
    
    for (const [keyword, key] of Object.entries(keywords)) {
      if (searchLower.includes(keyword.toLowerCase())) {
        console.log('关键词匹配:', keyword, '->', key);
        match = foodList.find(food => food.key === key);
        if (match) {
          console.log('关键词匹配成功:', match.name);
          return match;
        }
      }
    }
    console.log('关键词匹配失败');
    
    // 3. 包含匹配
    match = foodList.find(food => 
      food.name.toLowerCase().includes(searchLower) || 
      searchLower.includes(food.name.toLowerCase())
    );
    if (match) {
      console.log('包含匹配成功:', match.name);
      return match;
    }
    console.log('包含匹配失败');
    
    // 4. 智能模糊匹配（改进版）
    const fuzzyMatches = foodList.filter(food => {
      const foodName = food.name.toLowerCase();
      
      // 计算相似度分数
      let score = 0;
      
      // 检查字符匹配
      const commonChars = searchLower.split('').filter(char => 
        foodName.includes(char)
      ).length;
      score += commonChars * 2;
      
      // 检查长度相似度
      const lengthDiff = Math.abs(searchLower.length - foodName.length);
      score -= lengthDiff;
      
      // 检查开头匹配
      if (foodName.startsWith(searchLower) || searchLower.startsWith(foodName)) {
        score += 10;
      }
      
      // 检查包含关系
      if (foodName.includes(searchLower) || searchLower.includes(foodName)) {
        score += 5;
      }
      
      // 检查拼音相似度（简单实现）
      const pinyinMap = {
        'pizza': '披萨', 'hamburger': '汉堡', 'coffee': '咖啡',
        'chocolate': '巧克力', 'icecream': '冰淇淋'
      };
      
      for (const [english, chinese] of Object.entries(pinyinMap)) {
        if (searchLower.includes(english) && foodName.includes(chinese)) {
          score += 15;
        }
      }
      
      return score >= 3; // 设置最低分数阈值
    });
    
    if (fuzzyMatches.length > 0) {
      console.log('智能模糊匹配找到:', fuzzyMatches.length, '个结果');
      // 按相似度排序，返回最佳匹配
      fuzzyMatches.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aScore = this.calculateSimilarity(searchLower, aName);
        const bScore = this.calculateSimilarity(searchLower, bName);
        return bScore - aScore;
      });
      
      const bestMatch = fuzzyMatches[0];
      console.log('智能模糊匹配成功:', bestMatch.name);
      return bestMatch;
    }
    console.log('智能模糊匹配失败');
    
    console.log('所有匹配方式都失败');
    return null;
  },

  // 计算字符串相似度
  calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    // 创建矩阵
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
    
    // 初始化第一行和第一列
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    // 填充矩阵
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // 删除
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j - 1] + cost // 替换
        );
      }
    }
    
    // 计算相似度
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  },



  // 测试显示功能
  testShowFoodInfo() {
    const testFoodData = {
      foodName: '鸡蛋',
      calories: 155,
      unit: '100g',
      nutrition: {
        protein: 12.6,
        fat: 11.3,
        carbs: 0.7,
        fiber: 0
      },
      tips: '鸡蛋是优质蛋白质和维生素D来源',
      confidence: 0.9
    };
    
    console.log('开始测试显示食物信息');
    this.showFoodRecognitionResult(testFoodData);
  },

  // 检查存储状态
  checkStorageStatus() {
    try {
      const foodRecords = wx.getStorageSync('foodRecords');
      const today = new Date().toISOString().split('T')[0];
      
      console.log('当前存储状态:');
      console.log('所有食物记录:', foodRecords);
      console.log('今日日期:', today);
      
      if (foodRecords && foodRecords[today]) {
        console.log('今日记录数量:', foodRecords[today].length);
        console.log('今日记录详情:', foodRecords[today]);
      } else {
        console.log('今日暂无记录');
      }
      
      wx.showModal({
        title: '📊 存储状态检查',
        content: `📅 今日记录数量: ${foodRecords && foodRecords[today] ? foodRecords[today].length : 0}\n📈 总记录天数: ${foodRecords ? Object.keys(foodRecords).length : 0}\n\n💡 食物记录功能已移除`,
        confirmText: '确定',
        showCancel: false
      });
    } catch (error) {
      console.error('检查存储状态失败:', error);
      wx.showToast({
        title: '检查失败',
        icon: 'error'
      });
    }
  },


}) 
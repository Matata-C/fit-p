// index.js
const weightUtil = require('../../utils/weightUtil');
const dateUtil = require('../../utils/dateUtil');
const tabBarManager = require('../../utils/tabBarManager');
const app = getApp()


// 自定义对象展开函数以兼容不支持spread操作符的环境
const spread = function(obj1, obj2) {
  let result = {};
  for (let key in obj1) {
    result[key] = obj1[key];
  }
  for (let key in obj2) {
    result[key] = obj2[key];
  }
  return result;
};

Page({
  data: {
    // 消耗数据
    consumptionData: {
      theoreticalConsumption: 0,  // 理论消耗
      targetConsumption: 0,      // 目标消耗
      targetPercentage: 0,       // 目标消耗百分比
      theoreticalPercentage: 0,  // 理论消耗占目标的百分比
    },
    // 用户状态数据
    userStats: {
      days: 0,               // 已记录天数
      averageConsumption: 0, // 平均消耗
      totalWeightLoss: 0,    // 总减重
      startWeight: 0,        // 起始体重
      currentWeight: 0       // 当前体重
    },
    // 显示数据
    theoreticalValue: 0,       // 理论消耗值
    targetValue: 0,            // 目标消耗值
    actualValue: 0,            // 实际消耗值
    weightPercentage: 0,       // 体重进度百分比
    totalWeightLoss: 0,        // 总减重
    goalWeight: 0,             // 目标体重
    weightRecords: [],         // 体重记录
    currentTip: '保持健康的生活方式有助于维持理想体重。',
    hasTodayWeight: false,     // 是否已记录今日体重
    todayWeight: '',           // 今日体重值
    inputWeight: '',           // 体重输入值
    showWeightDialog: false,   // 是否显示体重记录对话框
    // 健康小贴士数组
    healthTips: [
      '适量的有氧运动有助于消耗脂肪。',
      '每天喝足8杯水有助于新陈代谢。',
      '控制晚餐摄入量可以帮助减轻体重。',
      '保持充足的睡眠对减肥至关重要。',
      '增加蛋白质摄入有助于维持肌肉量。',
      '减肥应当是一个循序渐进的过程。',
      '膳食平衡比极端节食更有效。',
      '记录饮食有助于了解自己的摄入习惯。',
      '适度的力量训练有助于提高基础代谢率。',
      '小的生活习惯改变可以带来长期效果。'
    ],
    needRefresh: false,         // 是否需要刷新数据
    pageReady: false, // 标记页面是否准备好
    showWeightHistoryDialog: false, // 是否显示体重历史记录对话框
    weightHistoryRecords: [],    // 体重历史记录列表

    howModal: false, // 控制弹窗显示/隐藏
    currentDiet: {}, // 当前显示的饮食知识
    // 饮食知识数据（与轮播项一一对应）
    dietList: [
      {
        title: "科学饮食指南：从早餐到晚餐的智慧",
        content: "科学饮食应遵循「三餐均衡、营养全面」原则：\n1. 早餐要吃好：推荐全谷物（燕麦、全麦面包）+ 优质蛋白（鸡蛋、牛奶）+ 蔬果（番茄、黄瓜），为上午提供持久能量。\n2. 午餐要吃饱：主食（米饭、杂粮饭）+ 优质蛋白（瘦肉、鱼虾、豆类）+ 蔬菜（深色蔬菜占一半），注意少油少盐。\n3. 晚餐要吃少：以清淡易消化为主，避免过量碳水和油脂，可选择杂粮粥、清蒸鱼搭配绿叶菜，睡前3小时完成进食。\n此外，每天需保证1500-2000ml饮水量，少喝含糖饮料，烹饪方式多采用蒸、煮、炖，减少油炸、烧烤。"
      },
      {
        title: "夏季饮食：清热解暑的搭配技巧",
        content: "夏季饮食核心是「清热利湿、补充水分」：\n1. 多吃清热食材：绿豆（煮汤）、苦瓜（清炒或凉拌）、冬瓜（做汤）、西瓜（适量食用补充水分），帮助缓解暑热。\n2. 补充电解质：高温出汗多，可喝淡盐水或自制柠檬水（加少量盐），避免电解质紊乱。\n3. 饮食宜清淡：少吃辛辣、油腻食物，避免加重肠胃负担，推荐丝瓜炒蛋、荷叶粥、凉拌海带等清爽菜品。\n4. 注意饮食卫生：夏季食物易变质，生熟食材分开存放，剩菜及时冷藏，食用前彻底加热。"
      },
      {
        title: "减脂期饮食：吃饱又不胖的秘密",
        content: "减脂期饮食关键是「热量缺口+营养充足」，避免过度节食：\n1. 主食选低GI：用糙米、藜麦、玉米替代部分白米白面，延缓血糖上升，增加饱腹感。\n2. 蛋白要充足：每天摄入1.2-1.6g/kg体重的蛋白质（如鸡胸肉、鱼虾、豆腐），减少肌肉流失。\n3. 多吃膳食纤维：绿叶菜（菠菜、西兰花）、菌菇、杂豆等，热量低且饱腹感强。\n4. 烹饪控热量：少油少糖，多用香料（黑胡椒、柠檬汁）调味，避免沙拉酱、红烧等高热量做法。\n5. 三餐分配：早餐占30%、午餐40%、晚餐30%，晚餐尽量在睡前4小时吃完。"
      }
    ]
  },

   // 显示弹窗：根据点击的索引获取对应内容
   showPopup(e) {
    const index = e.currentTarget.dataset.index; // 获取轮播项的索引
    this.setData({
      showModal: true,
      currentDiet: this.data.dietList[index] // 赋值对应的数据
    });
  },

  // 隐藏弹窗
  hidePopup() {
    this.setData({
      showModal: false
    });
  },

  onLoad: function () {
    console.log('首页加载');
    
    // 标记页面已准备好
    this.setData({
      pageReady: true
    });
    
    // 设置TabBar选中状态为首页(索引0)
    tabBarManager.initTabBarForPage(0);
    
    // 显示随机健康提示
    this.showRandomTip();
    
    try {
      // 检查是否需要初次设置
      var needInitialSetup = wx.getStorageSync('needInitialSetup');
      console.log('初始设置状态:', needInitialSetup);
      
      if (needInitialSetup === 'true') {
        console.log('需要初始设置，跳转到目标设置页面');
        wx.navigateTo({
          url: '/pages/goal/goal'
        });
        return;
      }
    
      // 轻量级刷新数据
      this.refreshData();
    } catch(e) {
      console.error('首页加载错误:', e);
    }
  },
  
  onShow: function() {
    // 确保TabBar选中首页
    tabBarManager.setSelectedTab(0);
    
    // 检查是否有数据更新标志
    try {
      const dataUpdated = wx.getStorageSync('dataUpdated');
      const lastUpdate = wx.getStorageSync('lastIndexUpdate') || 0;
      
      // 如果有新的数据更新，或页面设置了刷新标志，强制刷新
      if ((dataUpdated && dataUpdated > lastUpdate) || this.data.needRefresh) {
        console.log('检测到数据更新，刷新首页数据');
        
        // 更新最后刷新时间
        wx.setStorageSync('lastIndexUpdate', new Date().getTime());
        
        // 重置刷新标志
        this.setData({ needRefresh: false });
        
        // 刷新所有数据
        this.refreshData();
      } else {
        // 每次显示页面时尝试刷新数据
        try {
          this.refreshData();
        } catch(e) {
          console.error('刷新数据失败:', e);
        }
      }
    } catch (e) {
      console.error('检查数据更新失败:', e);
      // 出错时仍然执行常规刷新
      try {
        this.refreshData();
      } catch(e) {
        console.error('刷新数据失败:', e);
      }
    }
  },
  
  refreshData: function() {
    try {
      // 先刷新用户统计，确保总减重计算正确
      this.refreshUserStats();
      
      // 然后加载其他数据
      this.loadConsumptionData();
      this.loadUserStats();
      this.checkTodayWeight();
    } catch(e) {
      console.error('刷新数据失败:', e);
    }
  },
  
  loadConsumptionData: function() {
    try {
      // 获取当前日期
      var today = this.getCurrentDateString();
      
      // 获取BMR和目标消耗
      var bmr = wx.getStorageSync('calculatedBMR') || 0;
      var dailyTargetConsumption = wx.getStorageSync('dailyTargetConsumption') || 0;
      
      // 从存储中获取消费记录
      var consumptionRecords = wx.getStorageSync('consumptionRecords') || {};
      var todayRecord = consumptionRecords[today] || {
        theoretical: 0,
        target: 0,
        actual: 0
      };
      
      // 检查并更新消耗记录
      if (bmr > 0 && (!todayRecord.theoretical || todayRecord.theoretical === 0)) {
        // 获取当前运动消耗
        var exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
        var todayExercises = exerciseRecords[today] || [];
        var exerciseCalories = 0;
        
        for (var i = 0; i < todayExercises.length; i++) {
          exerciseCalories += todayExercises[i].caloriesBurned || 0;
        }
        
        // 更新理论消耗
        todayRecord.theoretical = bmr + exerciseCalories;
      }
      
      // 检查并更新目标消耗
      if (dailyTargetConsumption > 0 && (!todayRecord.target || todayRecord.target === 0)) {
        todayRecord.target = parseFloat(dailyTargetConsumption);
        
        // 保存更新后的记录
        consumptionRecords[today] = todayRecord;
        wx.setStorageSync('consumptionRecords', consumptionRecords);
      }
      
      // 确保数值有效
      let theoretical = parseFloat(todayRecord.theoretical) || 0;
      let target = parseFloat(todayRecord.target) || 1; // 默认最小为1，避免除以零
      let actual = parseFloat(todayRecord.actual) || 0;
      
      // 计算比例
      let theoreticalPercentage = target > 0 ? (theoretical / target * 100) : 0;
      theoreticalPercentage = Math.min(100, theoreticalPercentage); // 限制最大为100%
      
      // 设置数据
      this.setData({
        theoreticalValue: Math.round(theoretical),
        targetValue: Math.round(target),
        actualValue: Math.round(actual),
        'consumptionData.theoreticalPercentage': theoreticalPercentage
      });
      
      console.log('理论消耗:', theoretical, '目标消耗:', target, '比例:', theoreticalPercentage);
    } catch(e) {
      console.error('加载消耗数据失败:', e);
    }
  },
  
  loadUserStats: function() {
    console.log('加载用户统计数据...');
    try {
      // 尝试获取分析页面的更精确总减重值
      const analysisStatistics = wx.getStorageSync('analysisStatistics');
      const moreAccurateTotalWeightLoss = analysisStatistics && analysisStatistics.totalLost !== undefined 
        ? parseFloat(analysisStatistics.totalLost) 
        : null;
      
      console.log('从分析页面获取的总减重值:', moreAccurateTotalWeightLoss);
      
      // 获取或初始化用户统计数据
      let userStats = wx.getStorageSync('userStats') || {
        totalWeightLoss: 0,
        weightLossPercentage: 0,
        weightToGo: 0,
        startWeight: 0,
        currentWeight: 0
      };
      
      // 如果有更精确的总减重值，则更新用户统计
      if (moreAccurateTotalWeightLoss !== null) {
        userStats.totalWeightLoss = moreAccurateTotalWeightLoss;
      }
      
      // 获取目标数据以计算进度
      const goalData = wx.getStorageSync('goalData');
      if (goalData && goalData.goalWeight) {
        // 确保起始体重存在
        if (!userStats.startWeight && goalData.startWeight) {
          userStats.startWeight = parseFloat(goalData.startWeight);
        }
        
        // 计算减重百分比和剩余减重
        const startWeight = parseFloat(userStats.startWeight || goalData.startWeight);
        const goalWeight = parseFloat(goalData.goalWeight);
        const currentWeight = parseFloat(userStats.currentWeight || startWeight);
        
        // 总需要减去的体重
        const totalToLose = startWeight - goalWeight;
        
        // 已经减去的体重
        const alreadyLost = Math.max(0, startWeight - currentWeight);
        
        // 计算百分比
        userStats.weightLossPercentage = totalToLose > 0 
          ? Math.min(100, Math.round((alreadyLost / totalToLose) * 100)) 
          : 0;
        
        // 还需减重
        userStats.weightToGo = Math.max(0, currentWeight - goalWeight).toFixed(1);
      }
      
      // 保存更新后的用户统计
      wx.setStorageSync('userStats', userStats);
      
      // 更新页面数据
      this.setData({
        userStats: userStats
      });
      
      console.log('用户统计数据加载成功:', userStats);
    } catch (e) {
      console.error('加载用户统计数据失败:', e);
    }
  },
  
  checkTodayWeight: function() {
    try {
      var today = this.getCurrentDateString();
      var weightRecords = wx.getStorageSync('weightRecords') || {};
      var todayWeightRecord = wx.getStorageSync('todayWeight');
      
      // 首先检查是否有永久性的今日体重记录
      if (todayWeightRecord && todayWeightRecord.date === today) {
        this.setData({
          hasTodayWeight: true,
          todayWeight: todayWeightRecord.weight
        });
        return;
      }
      
      // 如果没有永久性记录，则检查体重记录对象
      if (weightRecords[today]) {
        this.setData({
          hasTodayWeight: true,
          todayWeight: weightRecords[today]
        });
        
        // 同时设置永久性记录，确保下次能正确显示
        wx.setStorageSync('todayWeight', {
          date: today,
          weight: weightRecords[today]
        });
      } else {
        this.setData({
          hasTodayWeight: false,
          todayWeight: ''
        });
      }
    } catch(e) {
      console.error('检查今日体重记录失败:', e);
    }
  },
  
  showWeightDialog: function() {
    this.setData({
      showWeightDialog: true,
      inputWeight: this.data.todayWeight || ''
    });
  },
  
  cancelWeightDialog: function() {
    this.setData({
      showWeightDialog: false
    });
  },
  
  weightInput: function(e) {
    this.setData({
      inputWeight: e.detail.value
    });
  },
  
  saveWeight: function() {
    if (!this.data.inputWeight) {
      wx.showToast({
        title: '请输入体重',
        icon: 'none'
      });
      return;
    }
    
    var weight = parseFloat(this.data.inputWeight);
    if (isNaN(weight) || weight <= 0) {
      wx.showToast({
        title: '请输入有效的体重',
        icon: 'none'
      });
      return;
    }
    
    try {
      var today = this.getCurrentDateString();
      
      // 获取并更新体重记录（对象格式）
      var weightRecords = wx.getStorageSync('weightRecords') || {};
      weightRecords[today] = weight;
      wx.setStorageSync('weightRecords', weightRecords);
      
      // 同时更新数组格式的体重记录，用于分析页面
      var weightRecordsArray = [];
      try {
        // 尝试获取已有的数组格式记录
        var existingArray = wx.getStorageSync('weightRecordsArray');
        if (Array.isArray(existingArray)) {
          weightRecordsArray = existingArray;
        } else {
          // 如果不是数组或为空，从对象格式转换
          for (var date in weightRecords) {
            if (weightRecords.hasOwnProperty(date)) {
              weightRecordsArray.push({
                date: date,
                weight: weightRecords[date]
              });
            }
          }
        }
        
        // 检查是否已存在当天记录
        var existingIndex = -1;
        for (var i = 0; i < weightRecordsArray.length; i++) {
          if (weightRecordsArray[i].date === today) {
            existingIndex = i;
            break;
          }
        }
        
        if (existingIndex >= 0) {
          // 更新已存在的记录
          weightRecordsArray[existingIndex].weight = weight;
        } else {
          // 添加新记录
          weightRecordsArray.push({
            date: today,
            weight: weight
          });
        }
        
        // 保存数组格式记录
        wx.setStorageSync('weightRecordsArray', weightRecordsArray);
      } catch (e) {
        console.error('保存数组格式体重记录失败:', e);
      }
      
      // 设置永久性今日体重记录
      wx.setStorageSync('todayWeight', {
        date: today,
        weight: weight
      });
      
      // 强制刷新用户统计数据，确保总减重正确计算
      this.refreshUserStats();
      
      // 强制设置数据更新标志，确保其他页面更新数据
      wx.setStorageSync('dataUpdated', new Date().getTime());
      
      // 【新增】手动计算分析页面上的统计数据并同步到userStats
      try {
        // 从按日期排序的weightRecordsArray计算总减重
        if (weightRecordsArray.length >= 2) {
          // 复制并按日期排序（从早到晚）
          var sortedRecords = [...weightRecordsArray].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
          
          // 获取最早和最新的体重记录
          var firstWeight = parseFloat(sortedRecords[0].weight) || 0;
          var latestWeight = parseFloat(sortedRecords[sortedRecords.length - 1].weight) || 0;
          
          // 计算总减重
          var totalLost = firstWeight - latestWeight;
          
          // 计算平均减重速度
          const firstDate = new Date(sortedRecords[0].date);
          const latestDate = new Date(sortedRecords[sortedRecords.length - 1].date);
          
          let daysDiff = 1; // 默认值为1，避免除以零
          if (!isNaN(firstDate) && !isNaN(latestDate)) {
            daysDiff = Math.max(1, Math.round((latestDate - firstDate) / (24 * 60 * 60 * 1000)));
          }
          
          const avgSpeed = parseFloat((totalLost / daysDiff).toFixed(2));
          
          // 预计达到目标所需天数
          let daysToGoal = 0;
          const goalData = wx.getStorageSync('goalData') || {};
          const targetWeight = parseFloat(goalData.goalWeight);
          
          if (!isNaN(targetWeight) && targetWeight > 0 && avgSpeed > 0 && latestWeight > targetWeight) {
            daysToGoal = Math.ceil((latestWeight - targetWeight) / avgSpeed);
          }
          
          // 只有当总减重为正值时才更新
          if (totalLost > 0) {
            // 【新增】更新analysisStatistics
            const analysisStatistics = {
              totalLost: totalLost.toFixed(1),
              avgSpeed: avgSpeed,
              daysToGoal: daysToGoal,
              startWeight: firstWeight,
              currentWeight: latestWeight,
              lastUpdated: new Date().getTime()
            };
            
            // 保存分析统计结果
            wx.setStorageSync('analysisStatistics', analysisStatistics);
            console.log('保存体重记录时更新分析统计数据:', analysisStatistics);
            
            // 更新userStats中的totalWeightLoss
            var userStats = wx.getStorageSync('userStats') || {};
            userStats.totalWeightLoss = parseFloat(totalLost.toFixed(1));
            userStats.startWeight = firstWeight; // 也更新起始体重
            userStats.currentWeight = latestWeight; // 更新当前体重
            
            // 保存更新的userStats
            wx.setStorageSync('userStats', userStats);
            console.log('已同步更新userStats中的totalWeightLoss:', totalLost.toFixed(1));
          }
        }
      } catch (e) {
        console.error('同步分析统计数据失败:', e);
      }
      
      // 通知其他页面刷新数据
      try {
        // 获取页面栈
        var pages = getCurrentPages();
        if (pages && pages.length > 0) {
          // 遍历所有页面，设置刷新标志
          pages.forEach(function(page) {
            if (page && page.setData) {
              page.setData({
                needRefresh: true
              });
              
              // 如果页面有refreshData方法，调用它
              if (typeof page.refreshData === 'function') {
                page.refreshData();
              }
              
              // 特别处理：如果是分析页面，调用其calculateStatistics方法
              if (page.route === 'pages/analysis/analysis' && typeof page.calculateStatistics === 'function') {
                page.calculateStatistics();
              }
            }
          });
        }
      } catch (e) {
        console.error('通知页面刷新失败:', e);
      }
      
      // 关闭对话框并刷新数据
      this.setData({
        showWeightDialog: false,
        hasTodayWeight: true,
        todayWeight: weight
      });
      
      wx.showToast({
        title: '体重记录已保存',
        icon: 'success'
      });
    } catch(e) {
      console.error('保存体重记录失败:', e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },
  
  updateUserStats: function(currentWeight) {
    try {
      var userStats = wx.getStorageSync('userStats') || {
        days: 0,
        averageConsumption: 0,
        totalWeightLoss: 0,
        startWeight: 0,
        currentWeight: 0
      };
      
      // 如果是首次记录，设置起始体重
      if (userStats.startWeight === 0 || !userStats.startWeight) {
        userStats.startWeight = currentWeight;
        console.log('设置初始体重:', currentWeight);
      }
      
      // 更新当前体重
      userStats.currentWeight = currentWeight;
      
      // 计算总减重 - 如果当前体重小于起始体重，说明减重了
      if (userStats.startWeight > 0 && userStats.startWeight > currentWeight) {
        userStats.totalWeightLoss = parseFloat((userStats.startWeight - currentWeight).toFixed(1));
        console.log('计算减重量:', userStats.totalWeightLoss);
      } else if (userStats.startWeight > 0 && userStats.startWeight < currentWeight) {
        // 如果当前体重反而大于起始体重，可能需要重置起始体重
        // 这里我们不自动重置，但记录一个增重值
        userStats.totalWeightLoss = 0; // 增重不计入减重量
        console.log('体重增加，增加了:', (currentWeight - userStats.startWeight).toFixed(1));
      } else {
        userStats.totalWeightLoss = 0;
      }
      
      // 获取所有体重记录以计算记录天数
      var weightRecords = wx.getStorageSync('weightRecords') || {};
      var recordDays = Object.keys(weightRecords).length;
      
      // 更新记录天数
      userStats.days = recordDays;
      
      // 保存更新后的用户统计
      wx.setStorageSync('userStats', userStats);
      
      // 同时更新goalData中的当前体重
      try {
        var goalData = wx.getStorageSync('goalData') || {};
        if (goalData) {
          // 仅当goalData存在时更新
          goalData.currentWeight = currentWeight;
          wx.setStorageSync('goalData', goalData);
        }
      } catch (e) {
        console.error('更新goalData中的体重失败:', e);
      }
      
      // 刷新显示
      this.loadUserStats();
      
      console.log('用户统计数据已更新:', userStats);
    } catch(e) {
      console.error('更新用户统计数据失败:', e);
    }
  },
  
  // 跳转到运动记录页面
  goToExercise: function() {
    wx.navigateTo({
      url: '/pages/exercise/exercise'
    });
  },
  
  // 跳转到饮食记录页面
  goToFood: function() {
    wx.navigateTo({
      url: '/pages/food/food'
    });
  },
  
  // 获取当前日期字符串
  getCurrentDateString: function() {
    var date = new Date();
    var year = date.getFullYear();
    var month = (date.getMonth() + 1).toString().padStart(2, '0');
    var day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  
  // 显示随机健康提示
  showRandomTip: function() {
    try {
      // 健康小贴士数组
      var tips = [
        "每天至少喝八杯水，保持身体水分充足。",
        "每天进行30分钟中等强度的有氧运动，促进健康。",
        "多吃蔬菜水果，减少加工食品的摄入。",
        "保持规律作息，每晚保证7-8小时充足睡眠。",
        "适当控制饮食热量，但不要过度节食。",
        "锻炼时注意呼吸和姿势，避免运动伤害。",
        "坚持记录健康数据，有助于制定更合理的健康计划。",
        "运动后注意补充蛋白质，帮助肌肉恢复。",
        "心理健康与身体健康同样重要，保持积极心态。",
        "成功的减肥是一个长期过程，需要坚持和耐心。"
      ];
      
      // 随机选择一条小贴士
      var randomIndex = Math.floor(Math.random() * tips.length);
      this.setData({
        currentTip: tips[randomIndex]
      });
    } catch(e) {
      // 忽略错误
    }
  },
  
  // 显示体重历史记录对话框
  showWeightHistory: function() {
    // 加载体重历史记录
    this.loadWeightHistoryRecords();
    
    // 显示对话框
    this.setData({
      showWeightHistoryDialog: true
    });
  },
  
  // 关闭体重历史记录对话框
  closeWeightHistory: function() {
    this.setData({
      showWeightHistoryDialog: false
    });
  },
  
  // 加载体重历史记录
  loadWeightHistoryRecords: function() {
    try {
      // 尝试获取数组格式的记录
      var weightRecordsArray = wx.getStorageSync('weightRecordsArray');
      
      // 如果不是数组或为空，尝试从对象格式转换
      if (!Array.isArray(weightRecordsArray) || weightRecordsArray.length === 0) {
        var weightRecords = wx.getStorageSync('weightRecords') || {};
        weightRecordsArray = [];
        
        for (var date in weightRecords) {
          if (weightRecords.hasOwnProperty(date)) {
            weightRecordsArray.push({
              date: date,
              weight: weightRecords[date]
            });
          }
        }
      }
      
      // 按日期排序（从新到旧）
      if (weightRecordsArray.length > 0) {
        weightRecordsArray.sort(function(a, b) {
          return new Date(b.date) - new Date(a.date);
        });
      }
      
      // 设置数据
      this.setData({
        weightHistoryRecords: weightRecordsArray
      });
      
      console.log('加载体重历史记录:', weightRecordsArray.length, '条记录');
    } catch (e) {
      console.error('加载体重历史记录失败:', e);
      this.setData({
        weightHistoryRecords: []
      });
    }
  },
  
  // 删除体重记录
  deleteWeightRecord: function(e) {
    var index = e.currentTarget.dataset.index;
    var record = this.data.weightHistoryRecords[index];
    
    if (!record) return;
    
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除' + record.date + '的体重记录吗？',
      success: function(res) {
        if (res.confirm) {
          that.doDeleteWeightRecord(record.date, index);
        }
      }
    });
  },
  
  // 执行删除体重记录
  doDeleteWeightRecord: function(date, index) {
    try {
      // 更新数组格式记录
      var weightHistoryRecords = this.data.weightHistoryRecords;
      weightHistoryRecords.splice(index, 1);
      this.setData({
        weightHistoryRecords: weightHistoryRecords
      });
      
      // 更新存储中的数组格式记录
      wx.setStorageSync('weightRecordsArray', weightHistoryRecords);
      
      // 更新对象格式记录
      var weightRecords = wx.getStorageSync('weightRecords') || {};
      if (weightRecords[date]) {
        delete weightRecords[date];
        wx.setStorageSync('weightRecords', weightRecords);
      }
      
      // 如果删除的是今日记录，需要更新今日体重状态
      var today = this.getCurrentDateString();
      if (date === today) {
        this.setData({
          hasTodayWeight: false,
          todayWeight: ''
        });
        
        // 清除今日体重永久记录
        wx.removeStorageSync('todayWeight');
      }
      
      // 更新用户统计
      this.refreshUserStats();
      
      // 【新增】手动计算分析页面上的统计数据并同步到userStats
      try {
        // 只有当有两条或以上记录时才计算
        if (weightHistoryRecords.length >= 2) {
          // 复制并按日期排序（从早到晚）
          var sortedRecords = [...weightHistoryRecords].sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
          
          // 获取最早和最新的体重记录
          var firstWeight = parseFloat(sortedRecords[0].weight) || 0;
          var latestWeight = parseFloat(sortedRecords[sortedRecords.length - 1].weight) || 0;
          
          // 计算总减重
          var totalLost = firstWeight - latestWeight;
          
          // 计算平均减重速度
          const firstDate = new Date(sortedRecords[0].date);
          const latestDate = new Date(sortedRecords[sortedRecords.length - 1].date);
          
          let daysDiff = 1; // 默认值为1，避免除以零
          if (!isNaN(firstDate) && !isNaN(latestDate)) {
            daysDiff = Math.max(1, Math.round((latestDate - firstDate) / (24 * 60 * 60 * 1000)));
          }
          
          const avgSpeed = parseFloat((totalLost / daysDiff).toFixed(2));
          
          // 预计达到目标所需天数
          let daysToGoal = 0;
          const goalData = wx.getStorageSync('goalData') || {};
          const targetWeight = parseFloat(goalData.goalWeight);
          
          if (!isNaN(targetWeight) && targetWeight > 0 && avgSpeed > 0 && latestWeight > targetWeight) {
            daysToGoal = Math.ceil((latestWeight - targetWeight) / avgSpeed);
          }
          
          // 只有当总减重为正值时才更新
          if (totalLost > 0) {
            // 【新增】更新analysisStatistics
            const analysisStatistics = {
              totalLost: totalLost.toFixed(1),
              avgSpeed: avgSpeed,
              daysToGoal: daysToGoal,
              startWeight: firstWeight,
              currentWeight: latestWeight,
              lastUpdated: new Date().getTime()
            };
            
            // 保存分析统计结果
            wx.setStorageSync('analysisStatistics', analysisStatistics);
            console.log('删除记录后更新分析统计数据:', analysisStatistics);
            
            // 更新userStats中的totalWeightLoss
            var userStats = wx.getStorageSync('userStats') || {};
            userStats.totalWeightLoss = parseFloat(totalLost.toFixed(1));
            userStats.startWeight = firstWeight; // 也更新起始体重
            userStats.currentWeight = latestWeight; // 更新当前体重
            
            // 保存更新的userStats
            wx.setStorageSync('userStats', userStats);
            console.log('删除记录后更新totalWeightLoss:', totalLost.toFixed(1));
          } else {
            // 如果没有减重，设置为0并清除分析统计
            var userStats = wx.getStorageSync('userStats') || {};
            userStats.totalWeightLoss = 0;
            wx.setStorageSync('userStats', userStats);
            
            // 清除分析统计
            wx.removeStorageSync('analysisStatistics');
          }
        } else if (weightHistoryRecords.length <= 1) {
          // 如果只有一条或没有记录，重置统计数据
          var userStats = wx.getStorageSync('userStats') || {};
          userStats.totalWeightLoss = 0;
          wx.setStorageSync('userStats', userStats);
          
          // 清除分析统计
          wx.removeStorageSync('analysisStatistics');
        }
      } catch (e) {
        console.error('删除记录后同步统计数据失败:', e);
      }
      
      // 设置数据更新标志
      wx.setStorageSync('dataUpdated', new Date().getTime());
      
      // 通知其他页面刷新数据
      try {
        // 获取页面栈
        var pages = getCurrentPages();
        if (pages && pages.length > 0) {
          // 遍历所有页面，设置刷新标志
          pages.forEach(function(page) {
            if (page && page.setData) {
              page.setData({
                needRefresh: true
              });
              
              // 如果页面有refreshData方法，调用它
              if (typeof page.refreshData === 'function') {
                page.refreshData();
              }
              
              // 特别处理：如果是分析页面，调用其calculateStatistics方法
              if (page.route === 'pages/analysis/analysis' && typeof page.calculateStatistics === 'function') {
                page.calculateStatistics();
              }
            }
          });
        }
      } catch (e) {
        console.error('通知页面刷新失败:', e);
      }
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (e) {
      console.error('删除体重记录失败:', e);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  },
  
  // 重新计算用户统计数据
  refreshUserStats: function() {
    try {
      // 获取所有体重记录（对象格式）
      var weightRecords = wx.getStorageSync('weightRecords') || {};
      var dates = Object.keys(weightRecords);
      
      // 记录数量为0，则重置统计数据
      if (dates.length === 0) {
        wx.setStorageSync('userStats', {
          days: 0,
          averageConsumption: 0,
          totalWeightLoss: 0,
          startWeight: 0,
          currentWeight: 0
        });
        this.loadUserStats();
        return;
      }
      
      // 按日期排序
      dates.sort();
      
      // 获取最早和最新的记录
      var firstDate = dates[0];
      var lastDate = dates[dates.length - 1];
      
      var startWeight = parseFloat(weightRecords[firstDate]);
      var currentWeight = parseFloat(weightRecords[lastDate]);
      
      console.log('初始体重:', startWeight, '当前体重:', currentWeight);
      
      // 更新用户统计数据
      var userStats = wx.getStorageSync('userStats') || {};
      userStats.days = dates.length;
      userStats.startWeight = startWeight;
      userStats.currentWeight = currentWeight;
      
      // 计算总减重（初始体重-当前体重）
      if (startWeight > currentWeight) {
        userStats.totalWeightLoss = parseFloat((startWeight - currentWeight).toFixed(1));
      } else {
        userStats.totalWeightLoss = 0;
      }
      
      console.log('更新统计数据:', userStats);
      
      // 保存更新后的统计数据
      wx.setStorageSync('userStats', userStats);
      
      // 更新显示
      this.loadUserStats();
    } catch (e) {
      console.error('刷新用户统计数据失败:', e);
    }
  },
})

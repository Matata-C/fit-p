Page({
  data: {
    gender: 'male',
    age: '',
    height: '',
    currentWeight: '',
    goalWeight: '',
    dailyGoal: '',
    dailyTargetConsumption: '',
    weightToLose: '',
    estimatedDays: '',
    targetDate: '',
    bmr: '',
    showSummary: false,
    allowManualTargetEdit: false, // 控制是否允许手动编辑目标消耗
    isLoading: true, // 添加加载状态标记
    renderError: false, // 添加渲染错误状态
    pageReady: false, // 页面准备状态
  },

  // 生命周期函数 - 监听页面加载完成
  onReady: function() {
    // 页面渲染完成后设置加载完成状态
    this.setData({
      isLoading: false,
      pageReady: true
    });
    console.log('目标设置页面加载完成');
  },
  
  // 确保在页面显示时解除加载状态
  onShow: function() {
    console.log('页面显示，解除加载状态');
    // 延迟设置状态，确保页面完全准备好
    setTimeout(() => {
      this.setData({
        isLoading: false,
        pageReady: true
      });
    }, 100);
  },

  // 强制刷新页面
  forceRefresh: function() {
    try {
      this.setData({
        isLoading: true
      });
      
      setTimeout(() => {
        this.loadGoalData();
        this.setData({
          isLoading: false,
          pageReady: true
        });
      }, 300);
    } catch(e) {
      console.error('强制刷新失败:', e);
      this.setData({
        isLoading: false,
        renderError: true
      });
    }
  },

  // 切换目标消耗编辑状态
  toggleTargetEdit: function() {
    try {
      this.setData({
        allowManualTargetEdit: !this.data.allowManualTargetEdit
      });
    } catch(e) {
      console.error('切换目标消耗编辑状态失败', e);
    }
  },

  // 点击转换按钮，将目标减重转换为目标消耗
  convertToTargetConsumption: function() {
    try {
      var dailyGoal = this.data.dailyGoal;
      
      if (!dailyGoal) {
        wx.showToast({
          title: '请先填写目标减重',
          icon: 'none'
        });
        return;
      }
      
      var targetConsumption = this.calculateTargetConsumption();
      
      if (targetConsumption > 0) {
        this.setData({
          dailyTargetConsumption: targetConsumption.toString()
        });
        
        wx.showToast({
          title: '转换成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '转换失败，请检查输入',
          icon: 'none'
        });
      }
    } catch(e) {
      console.error('转换目标消耗失败', e);
      wx.showToast({
        title: '转换失败，请重试',
        icon: 'none'
      });
    }
  },

  onLoad: function(options) {
    // 立即设置页面准备中状态
    this.setData({
      pageReady: false,
      isLoading: true
    });
    
    // 强制设置为非加载状态，防止白屏
    setTimeout(() => {
      this.setData({ 
        isLoading: false,
        pageReady: true
      });
      console.log('强制设置非加载状态');
    }, 300);
    
    console.log('目标设置页面开始加载');
    try {
      // 检查是否从重置跳转过来
      if (options && options.fromReset) {
        // 清除重置标志
        wx.setStorageSync('needInitialSetup', '');
      }
    } catch (e) {
      console.error('检查重置状态失败', e);
    }
    
    // 使用更短的延迟防止页面加载阻塞
    setTimeout(() => {
      this.loadGoalData();
    }, 50);
  },

  loadGoalData: function() {
    try {
      console.log('开始加载目标数据');
      var gender = wx.getStorageSync('gender') || 'male';
      var age = wx.getStorageSync('age') || '';
      var height = wx.getStorageSync('height') || '';
      var currentWeight = wx.getStorageSync('currentWeight') || '';
      var goalWeight = wx.getStorageSync('goalWeight') || '';
      var dailyGoal = wx.getStorageSync('dailyGoal') || '';
      var dailyTargetConsumption = wx.getStorageSync('dailyTargetConsumption') || '';

      this.setData({
        gender: gender,
        age: age,
        height: height,
        currentWeight: currentWeight,
        goalWeight: goalWeight,
        dailyGoal: dailyGoal,
        dailyTargetConsumption: dailyTargetConsumption,
        isLoading: false, // 加载完数据后设置加载状态为false
        pageReady: true
      });

      console.log('目标数据加载完成:', {gender, age, height, currentWeight, goalWeight, dailyGoal, dailyTargetConsumption});

      if (currentWeight && goalWeight && dailyGoal) {
        // 直接调用，无需延迟
        this.calculateSummary();
      }
    } catch (e) {
      console.error('加载目标数据失败', e);
      // 即使加载失败也要设置isLoading为false，以避免一直显示加载中
      this.setData({
        isLoading: false,
        pageReady: true,
        renderError: true
      });
      // 显示更明确的错误提示
      wx.showToast({
        title: '加载数据失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  onGenderSelect: function(e) {
    var gender = e.currentTarget.dataset.gender;
    this.setData({ gender: gender });
    this.calculateSummary();
  },

  onAgeInput: function(e) {
    this.setData({
      age: e.detail.value
    });
    this.calculateSummary();
  },

  onHeightInput: function(e) {
    this.setData({
      height: e.detail.value
    });
    this.calculateSummary();
  },

  onCurrentWeightInput: function(e) {
    this.setData({
      currentWeight: e.detail.value
    });
    this.calculateSummary();
  },

  onGoalWeightInput: function(e) {
    this.setData({
      goalWeight: e.detail.value
    });
    this.calculateSummary();
  },

  onDailyGoalInput: function(e) {
    var dailyGoal = e.detail.value;
    this.setData({ dailyGoal: dailyGoal });
    this.calculateSummary();
  },

  onDailyTargetConsumptionInput: function(e) {
    // 只有在允许手动编辑时才更新
    if (this.data.allowManualTargetEdit) {
      this.setData({
        dailyTargetConsumption: e.detail.value
      });
      this.calculateSummary();
    }
  },

  // 计算基础代谢率(BMR)
  calculateBMR: function() {
    var data = this.data;
    var gender = data.gender;
    var age = data.age;
    var height = data.height;
    var currentWeight = data.currentWeight;
    
    if (!age || !height || !currentWeight) return 0;

    var ageNum = parseFloat(age);
    var heightNum = parseFloat(height);
    var weightNum = parseFloat(currentWeight);

    if (isNaN(ageNum) || isNaN(heightNum) || isNaN(weightNum)) return 0;

    // 使用Harris-Benedict公式计算BMR
    if (gender === 'male') {
      return Math.round(66 + (13.7 * weightNum) + (5 * heightNum) - (6.8 * ageNum));
    } else {
      return Math.round(655 + (9.6 * weightNum) + (1.8 * heightNum) - (4.7 * ageNum));
    }
  },

  // 根据目标减重计算目标消耗
  calculateTargetConsumption: function() {
    var data = this.data;
    var currentWeight = data.currentWeight;
    var goalWeight = data.goalWeight;
    var dailyGoal = data.dailyGoal;
    var bmr = this.calculateBMR();
    
    if (!currentWeight || !goalWeight || !dailyGoal || bmr <= 0) return 0;
    
    var currentWeightNum = parseFloat(currentWeight);
    var goalWeightNum = parseFloat(goalWeight);
    var dailyGoalNum = parseFloat(dailyGoal);
    
    if (isNaN(currentWeightNum) || isNaN(goalWeightNum) || isNaN(dailyGoalNum) || dailyGoalNum <= 0) return 0;
    
    // 1kg脂肪约等于7700千卡
    var CALORIES_PER_KG = 7700;
    
    // 每日需要的卡路里赤字
    var dailyCalorieDeficit = dailyGoalNum * CALORIES_PER_KG;
    
    // 目标消耗 = 基础代谢率 + 每日需要的卡路里赤字
    var targetConsumption = bmr + dailyCalorieDeficit;
    
    // 确保目标消耗不低于基础代谢率的80%（安全值）
    var safeMinimum = bmr * 0.8;
    
    if (targetConsumption < safeMinimum) {
      return Math.round(safeMinimum);
    }
    
    return Math.round(targetConsumption);
  },

  calculateSummary: function() {
    try {
      var data = this.data;
      var currentWeight = data.currentWeight;
      var goalWeight = data.goalWeight;
      var dailyGoal = data.dailyGoal;
      var dailyTargetConsumption = data.dailyTargetConsumption;
      
      if (!currentWeight || !goalWeight || !dailyGoal) {
        this.setData({ showSummary: false });
        return;
      }

      var current = parseFloat(currentWeight);
      var goal = parseFloat(goalWeight);
      var daily = parseFloat(dailyGoal);
      var targetConsumption = parseFloat(dailyTargetConsumption);

      if (isNaN(current) || isNaN(goal) || isNaN(daily) || daily <= 0 || (dailyTargetConsumption && isNaN(targetConsumption))) {
        this.setData({ showSummary: false });
        return;
      }

      var weightToLose = (current - goal).toFixed(1);
      var estimatedDays = Math.ceil(Math.abs(weightToLose) / daily);
      
      // 计算目标日期
      var today = new Date();
      var targetDate = new Date(today.setDate(today.getDate() + estimatedDays));
      var targetDateStr = targetDate.getFullYear() + '-' + 
                        String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(targetDate.getDate()).padStart(2, '0');

      // 计算BMR
      var bmr = this.calculateBMR();

      this.setData({
        weightToLose: weightToLose,
        estimatedDays: estimatedDays,
        targetDate: targetDateStr,
        bmr: bmr || '',
        showSummary: true
      });
    } catch (e) {
      // 忽略错误，防止UI阻塞
    }
  },

  onSave: function() {
    var data = this.data;
    var gender = data.gender;
    var age = data.age;
    var height = data.height;
    var currentWeight = data.currentWeight;
    var goalWeight = data.goalWeight;
    var dailyGoal = data.dailyGoal;
    var dailyTargetConsumption = data.dailyTargetConsumption;

    if (!gender || !age || !height || !currentWeight || !goalWeight || !dailyGoal) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 如果目标消耗为空，提示用户需要点击转换按钮
    if (!dailyTargetConsumption) {
      wx.showToast({
        title: '请点击转换计算目标消耗',
        icon: 'none'
      });
      return;
    }

    var ageNum = parseFloat(age);
    var heightNum = parseFloat(height);
    var current = parseFloat(currentWeight);
    var goal = parseFloat(goalWeight);
    var daily = parseFloat(dailyGoal);
    var targetConsumption = parseFloat(dailyTargetConsumption);

    if (isNaN(ageNum) || isNaN(heightNum) || isNaN(current) || isNaN(goal) || isNaN(daily) || isNaN(targetConsumption)) {
      wx.showToast({
        title: '请输入有效数字',
        icon: 'none'
      });
      return;
    }

    if (daily > 0.3) {
      var that = this;
      wx.showModal({
        title: '提示',
        content: '每日减重目标超过0.3kg可能不利于健康，是否继续？',
        success: function(res) {
          if (res.confirm) {
            that.saveGoalData();
          }
        }
      });
    } else {
      this.saveGoalData();
    }
  },

  saveGoalData: function() {
    var data = this.data;
    var gender = data.gender;
    var age = data.age;
    var height = data.height;
    var currentWeight = data.currentWeight;
    var goalWeight = data.goalWeight;
    var dailyGoal = data.dailyGoal;
    var dailyTargetConsumption = data.dailyTargetConsumption;
    
    var bmr = this.calculateBMR();
    
    try {
      // 使用多个存储键存储BMR，确保所有页面都能访问到
      wx.setStorageSync('calculatedBMR', bmr);
      wx.setStorageSync('bmr', bmr);
      wx.setStorageSync('todayBMR', bmr);
      
      // 保存所有数据
      wx.setStorageSync('gender', gender);
      wx.setStorageSync('age', age);
      wx.setStorageSync('height', height);
      wx.setStorageSync('currentWeight', currentWeight);
      wx.setStorageSync('goalWeight', goalWeight);
      wx.setStorageSync('dailyGoal', dailyGoal);
      wx.setStorageSync('dailyTargetConsumption', dailyTargetConsumption);

      // 强制直接更新首页的用户体重
      var userStats = wx.getStorageSync('userStats') || {};
      userStats.currentWeight = parseFloat(currentWeight);
      wx.setStorageSync('userStats', userStats);

      // 保存完整的goalData对象
      var goalData = wx.getStorageSync('goalData') || {};
      goalData.gender = gender;
      goalData.age = parseFloat(age);
      goalData.height = parseFloat(height);
      goalData.goalWeight = parseFloat(goalWeight);
      goalData.dailyTargetConsumption = parseFloat(dailyTargetConsumption);
      goalData.bmr = bmr;
      goalData.calculatedBMR = bmr;
      wx.setStorageSync('goalData', goalData);

      // 设置每日自动添加的静息代谢消耗
      this.setupDailyBMR(bmr);

      // 设置今日目标消耗
      this.setupDailyTargetConsumption(dailyTargetConsumption);

      // 更新数据变更标志，通知所有页面刷新数据
      wx.setStorageSync('dataUpdated', new Date().getTime());
      
      // 尝试获取并更新所有页面
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
            }
          });
        }
      } catch (e) {
        console.error('通知页面刷新失败:', e);
      }
    } catch (e) {
      // 保存数据出错时，只显示简单toast，不阻塞UI
      wx.showToast({
        title: '保存中...',
        icon: 'none',
        duration: 500
      });
    }

    // 显示成功提示后直接强制更新首页消耗数据
    try {
      var pages = getCurrentPages();
      if (pages && pages.length > 1) {
        var prevPage = pages[pages.length - 2]; // 获取上一个页面对象
        
        if (prevPage && prevPage.route === 'pages/index/index') {
          // 如果上一页是首页，则设置一个标记，在返回时更新数据
          prevPage.setData({
            needRefresh: true
          });
        }
      }
    } catch (e) {
      // 忽略设置标记错误
    }

    var that = this;
    wx.showToast({
      title: '保存成功',
      icon: 'success',
      success: function() {
        setTimeout(function() {
          wx.navigateBack();
        }, 1500);
      }
    });
  },

  setupDailyBMR: function(bmr) {
    try {
      // 获取今日日期
      var today = new Date();
      var todayStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
      
      // 获取消耗记录
      var consumptionRecords = wx.getStorageSync('consumptionRecords') || {};
      
      // 获取当前运动消耗
      var exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
      var todayExercises = exerciseRecords[todayStr] || [];
      var exerciseCalories = 0;
      
      for (var i = 0; i < todayExercises.length; i++) {
        exerciseCalories += todayExercises[i].caloriesBurned || 0;
      }
      
      // 获取目标消耗
      var targetConsumption = parseFloat(this.data.dailyTargetConsumption) || 0;
      
      // 如果今天的记录不存在，则创建一个新记录
      if (!consumptionRecords[todayStr]) {
        consumptionRecords[todayStr] = {
          theoretical: bmr + exerciseCalories,
          target: targetConsumption,
          actual: 0,
          bmrAdded: true
        };
      } else {
        // 如果记录存在，则更新BMR部分
        consumptionRecords[todayStr].theoretical = bmr + exerciseCalories;
        consumptionRecords[todayStr].target = targetConsumption;
        consumptionRecords[todayStr].bmrAdded = true;
      }
      
      // 保存更新后的记录
      wx.setStorageSync('consumptionRecords', consumptionRecords);
      
      // 直接设置一个单独的BMR记录，确保首页可以获取
      wx.setStorageSync('todayBMR', bmr);
      
      // 确保goalData也有正确的calculatedBMR值
      var goalData = wx.getStorageSync('goalData') || {};
      goalData.calculatedBMR = bmr;
      wx.setStorageSync('goalData', goalData);
    } catch (e) {
      // 忽略错误，保持UI流畅
    }
  },

  setupDailyTargetConsumption: function(targetConsumption) {
    try {
      // 获取现有的目标消耗记录
      var targetConsumptions = wx.getStorageSync('targetConsumptions') || {};
      var today = new Date();
      var todayStr = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
      
      // 设置今日目标消耗
      targetConsumptions[todayStr] = parseFloat(targetConsumption);
      wx.setStorageSync('targetConsumptions', targetConsumptions);
      
      // 同时更新到goalData中
      var goalData = wx.getStorageSync('goalData') || {};
      goalData.dailyTargetConsumption = parseFloat(targetConsumption);
      wx.setStorageSync('goalData', goalData);
      
      // 确保更新到消耗记录中
      var consumptionRecords = wx.getStorageSync('consumptionRecords') || {};
      
      // 如果今天没有记录，创建一个新记录
      if (!consumptionRecords[todayStr]) {
        // 获取BMR
        var bmr = wx.getStorageSync('bmr') || 0;
        
        // 获取运动消耗
        var exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
        var todayExercises = exerciseRecords[todayStr] || [];
        var exerciseCalories = 0;
        
        for (var i = 0; i < todayExercises.length; i++) {
          exerciseCalories += todayExercises[i].caloriesBurned || 0;
        }
        
        // 创建新记录
        consumptionRecords[todayStr] = {
          theoretical: bmr + exerciseCalories,
          target: parseFloat(targetConsumption),
          actual: 0,
          bmrAdded: true
        };
      } else {
        // 更新现有记录
        consumptionRecords[todayStr].target = parseFloat(targetConsumption);
      }
      
      // 保存更新后的记录
      wx.setStorageSync('consumptionRecords', consumptionRecords);
      
      // 强制设置数据更新标志，确保首页刷新
      wx.setStorageSync('dataUpdated', new Date().getTime());
    } catch (e) {
      // 忽略错误，保持UI流畅
      console.error('设置目标消耗失败', e);
    }
  },
}) 
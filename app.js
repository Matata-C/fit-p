App({
  onLaunch: function () {
    console.log('应用启动');
    wx.cloud.init({
      env: 'cloud1-6g0qn8fo7e746837',
      traceUser: true
    })
    this.tabChangeHandlers = [];

    try {
      const selectedTabIndex = wx.getStorageSync('selectedTabIndex');
      if (selectedTabIndex !== '' && selectedTabIndex !== undefined) {
        this.globalData.selectedTabIndex = parseInt(selectedTabIndex);
      }
      this.ensureBaseStorage();
      this.handleResourceErrors();
      // 初始化成就数据
      this.initAchievementData();
    } catch (e) {
      console.error('应用启动出错:', e);
    }
  },
  
  // 更新总成就点数的方法
  // 初始化成就数据
  initAchievementData: function() {
    try {
      // 从本地存储加载总成就点数
      const totalPoints = wx.getStorageSync('totalAchievementPoints') || 0;
      this.globalData.totalAchievementPoints = totalPoints;
      // 初始化成就点更新标志
      this.globalData.achievementPointsUpdated = false;
      this.globalData.newAchievementPoints = 0;
      // 初始化成就解锁状态
      this.initAchievementStatus();
      // 检查并重置日成就
      this.checkAndResetDailyAchievements();
    } catch (e) {
      console.error('初始化成就数据失败:', e);
    }
  },


  // 检查并重置日成就
  checkAndResetDailyAchievements: function() {
    try {
      const today = new Date();
      // 设置今天12点的时间戳
      const resetTime = new Date(today);
      resetTime.setHours(12, 0, 0, 0);

      // 获取上次重置日期
      const lastResetDate = wx.getStorageSync('dailyAchievementResetDate') || '';
      const currentDateStr = today.toISOString().split('T')[0];

      // 如果今天还没有重置过，并且当前时间已经过了12点
      if (lastResetDate !== currentDateStr && today >= resetTime) {
        // 记录今日已重置
        wx.setStorageSync('dailyAchievementResetDate', currentDateStr);
        // 重置日成就相关数据
        this.resetDailyAchievements();
      }
    } catch (e) {
      console.error('检查并重置日成就失败:', e);
    }
  },

  // 重置日成就
  resetDailyAchievements: function() {
    try {
      console.log('重置日成就数据');
      // 清除与日成就相关的临时数据
      // 注意：这里不直接清除运动和饮食记录，而是让成就系统重新计算
      // 可以清除日成就的缓存状态
      wx.removeStorageSync('dailyAchievementStatus');

      // 如果需要，可以通知相关页面更新
      this.globalData.dailyAchievementsReset = true;
    } catch (e) {
      console.error('重置日成就失败:', e);
    }
  },

  // 更新总成就点数的方法
  updateTotalPoints: function(newPoints) {
    if (newPoints > 0) {
      this.globalData.totalAchievementPoints = (this.globalData.totalAchievementPoints || 0) + newPoints;
      this.globalData.achievementPointsUpdated = true;
      this.globalData.newAchievementPoints = newPoints;
      
      // 保存到本地存储
      try {
        wx.setStorageSync('totalAchievementPoints', this.globalData.totalAchievementPoints);
        console.log(`成功更新总成就点数: ${this.globalData.totalAchievementPoints}`);
      } catch (e) {
        console.error('保存总成就点数失败:', e);
      }
    }
  },

  // 检查成就是否已解锁
  isAchievementUnlocked: function(achievementId) {
    try {
      const unlockedAchievements = wx.getStorageSync('unlockedAchievements') || {};
      return unlockedAchievements[achievementId] === true;
    } catch (e) {
      console.error('检查成就解锁状态失败:', e);
      return false;
    }
  },

  // 标记成就为已解锁
  markAchievementAsUnlocked: function(achievementId) {
    try {
      const unlockedAchievements = wx.getStorageSync('unlockedAchievements') || {};
      unlockedAchievements[achievementId] = true;
      wx.setStorageSync('unlockedAchievements', unlockedAchievements);
      console.log(`标记成就 ${achievementId} 为已解锁`);
    } catch (e) {
      console.error('标记成就解锁状态失败:', e);
    }
  },

  // 清除所有成就解锁状态
  clearAllAchievements: function() {
    try {
      wx.removeStorageSync('unlockedAchievements');
      console.log('已清除所有成就解锁状态');
    } catch (e) {
      console.error('清除成就解锁状态失败:', e);
    }
  },

  // 初始化成就解锁状态
  initAchievementStatus: function() {
    try {
      const unlockedAchievements = wx.getStorageSync('unlockedAchievements') || {};
      this.globalData.unlockedAchievements = unlockedAchievements;
    } catch (e) {
      console.error('初始化成就解锁状态失败:', e);
      this.globalData.unlockedAchievements = {};
    }
  },

  switchTab: function (index) {
    this.globalData.selectedTabIndex = index;
    if (this.tabChangeHandlers) {
      this.tabChangeHandlers.forEach(handler => {
        if (typeof handler === 'function') {
          handler(index);
        }
      });
    }
    wx.setStorage({
      key: 'selectedTabIndex',
      data: index
    });

    const pages = [
      '/pages/index/index',
      '/pages/analysis/analysis',
      '/pages/ai-chat/ai-chat',
      '/pages/achievement/achievement',
      '/pages/profile/profile'
    ];

    if (pages[index]) {
      wx.switchTab({
        url: pages[index]
      });
    }
  },

  ensureBaseStorage: function () {
    try {
      var items = ['userStats', 'consumptionRecords', 'weightRecords', 'goalData'];

      items.forEach(item => {
        if (!wx.getStorageSync(item)) {
          wx.setStorageSync(item, {});
        }
      });
    } catch (e) {
      console.error('初始化存储失败:', e);
    }
  },

  handleResourceErrors: function () {

    wx.onError(function (errMsg) {
      if (typeof errMsg === 'string' && (
        errMsg.indexOf('Failed to load local image resource') >= 0 ||
        errMsg.indexOf('Error: 404') >= 0)) {
        console.log('已忽略资源加载错误');
      }
    });
  },

  globalData: {
    userInfo: null,
    selectedTabIndex: 0,
    totalAchievementPoints: 0,
    achievementPointsUpdated: false,
    newAchievementPoints: 0,
    unlockedAchievements: {}
  }
})

// app.js
App({
  onLaunch: function () {
    console.log('应用启动');
    wx.cloud.init({
      env: 'green-cash-3g75t81dda4e81e4',
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
    } catch (e) {
      console.error('应用启动出错:', e);
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
    selectedTabIndex: 0
  }
})

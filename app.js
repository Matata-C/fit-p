// app.js
App({
  onLaunch: function() {
    console.log('应用启动');
     //云开发初始化
     wx.cloud.init({
      //把env替换成你自己的云开发环境id
      env: 'cloud1-6g0qn8fo7e746837',
      traceUser: true
    })
    // 添加全局TabBar状态变量和操作函数
    this.tabChangeHandlers = [];
    
    // 简化启动逻辑
    try {
      // 恢复上次的TabBar选择
      const selectedTabIndex = wx.getStorageSync('selectedTabIndex');
      if (selectedTabIndex !== '' && selectedTabIndex !== undefined) {
        this.globalData.selectedTabIndex = parseInt(selectedTabIndex);
      }
      
      // 检查并确保基本存储项存在
      this.ensureBaseStorage();
      
      // 忽略图片资源错误
      this.handleResourceErrors();
    } catch (e) {
      console.error('应用启动出错:', e);
    }
  },
  
  // 切换标签页的全局函数
  switchTab: function(index) {
    // 更新全局状态
    this.globalData.selectedTabIndex = index;
    
    // 通知所有TabBar实例
    if (this.tabChangeHandlers) {
      this.tabChangeHandlers.forEach(handler => {
        if (typeof handler === 'function') {
          handler(index);
        }
      });
    }
    
    // 保存到本地存储
    wx.setStorage({
      key: 'selectedTabIndex',
      data: index
    });
    
    // 跳转到对应页面
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
  
  // 确保基本存储项存在
  ensureBaseStorage: function() {
    try {
      // 检查关键存储项是否存在
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
  
  // 处理资源加载错误
  handleResourceErrors: function() {
    // 忽略图片资源错误
    wx.onError(function(errMsg) {
      if (typeof errMsg === 'string' && (
          errMsg.indexOf('Failed to load local image resource') >= 0 ||
          errMsg.indexOf('Error: 404') >= 0)) {
        console.log('已忽略资源加载错误');
      }
    });
  },
  
  // 全局数据共享
  globalData: {
    userInfo: null,
    selectedTabIndex: 0  // 记录当前选中的TabBar索引
  }
})

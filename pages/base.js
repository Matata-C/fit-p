const app = getApp();

// 页面基础组件
Page({
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // 设置基础页面类名
    this.setData({
      pageTransitionClass: 'page-transition'
    });
    
    // 监听页面过渡事件
    if (this.getOpenerEventChannel) {
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel && eventChannel.on) {
        eventChannel.on('pageTransitionIn', () => {
          // 收到进入过渡信号后，添加过渡动画
          this.setData({
            pageTransitionClass: 'page-transition page-transition-in'
          });
          
          // 过渡完成后恢复正常状态
          setTimeout(() => {
            this.setData({
              pageTransitionClass: 'page-transition'
            });
          }, 300); // 保持与app.js中的transitionDuration一致
        });
      }
    }
    
    // 初始化页面状态
    this._initPageStatus();
    
    // 转发当前页面方法
    this._initShareConfig();
  },

  /**
   * 初始化页面状态
   */
  _initPageStatus: function() {
    const app = getApp();
    
    // 检查是否有缓存的主题
    wx.getStorage({
      key: 'theme',
      success: (res) => {
        if (res.data) {
          this.setData({
            theme: res.data
          });
          app.globalData.theme = res.data;
        }
      }
    });
    
    // 检查页面过渡状态
    if (app.globalData.isNavigating) {
      this.setData({
        isPageTransitioning: true
      });
      
      // 300ms后自动取消过渡状态
      setTimeout(() => {
        this.setData({
          isPageTransitioning: false
        });
        app.globalData.isNavigating = false;
      }, 300);
    }
  },

  /**
   * 初始化页面分享配置
   */
  _initShareConfig: function() {
    // 实现分享配置
    this.onShareAppMessage = function() {
      return {
        title: '来看看这个小程序',
        path: '/pages/index/index'
      }
    }
  }
}); 
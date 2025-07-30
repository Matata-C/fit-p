/**
 * TabBar状态管理工具
 */
const app = getApp();

/**
 * 设置TabBar选中项
 * @param {Number} index - 要选中的TabBar索引
 */
function setSelectedTab(index) {
  if (!app || !app.globalData) return;

  // 1. 更新全局状态
  app.globalData.selectedTabIndex = index;

  // 2. 保存到存储
  wx.setStorage({
    key: 'selectedTabIndex',
    data: index
  });

  // 3. 通知所有TabBar实例
  if (app.tabChangeHandlers && app.tabChangeHandlers.length > 0) {
    app.tabChangeHandlers.forEach(handler => {
      if (typeof handler === 'function') {
        handler(index);
      }
    });
  }
}

/**
 * 在页面onLoad中调用，确保当前TabBar显示正确
 * @param {Number} pageIndex - 页面对应的TabBar索引
 */
function initTabBarForPage(pageIndex) {
  if (typeof pageIndex !== 'number') return;

  // 延迟设置，确保TabBar组件已经加载
  setTimeout(() => {
    setSelectedTab(pageIndex);
  }, 1000);
}

/**
 * 直接跳转到指定Tab页面
 * @param {Number} index - 目标页面对应的TabBar索引
 */
function switchTab(index) {
  // 先设置选中状态
  setSelectedTab(index);

  // 然后跳转页面
  const pages = [
    '/pages/index/index',
    '/pages/analysis/analysis',
    '/pages/achievement/achievement',
    '/pages/profile/profile'
  ];

  if (pages[index]) {
    wx.switchTab({
      url: pages[index]
    });
  }
}

module.exports = {
  setSelectedTab,
  initTabBarForPage,
  switchTab
};
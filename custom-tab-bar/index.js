const app = getApp()
const tabBarManager = require('../utils/tabBarManager')

Component({
  data: {
    selected: 0,
    list: [
      { pagePath: "/pages/index/index", text: "首页" },
      { pagePath: "/pages/analysis/analysis", text: "分析" },
      { pagePath: "/pages/achievement/achievement", text: "成就" },
      { pagePath: "/pages/profile/profile", text: "我的" }
    ]
  },
  attached() {
    try {
      const pages = getCurrentPages();
      const currentPage = pages && pages.length > 0 ? pages[pages.length - 1] : null;
      
      if (currentPage && currentPage.route) {
        const route = currentPage.route;
        const idx = this.data.list.findIndex(item => item.pagePath === `/${route}` || item.pagePath === route);
        this.setData({ selected: idx === -1 ? 0 : idx });
      } else {
        // 如果无法获取当前页面，默认选中第一个tab
        this.setData({ selected: 0 });
      }

      // 注册TabBar状态更新回调
      if (!app.tabChangeHandlers) app.tabChangeHandlers = [];
      app.tabChangeHandlers.push((index) => {
        this.setData({ selected: index });
      });
    } catch (error) {
      console.error('TabBar attached error:', error);
      // 出错时默认选中第一个tab
      this.setData({ selected: 0 });
    }
  },
  methods: {
    switchTab(e) {
    const idx = e.currentTarget.dataset.index;
    const pagePath = this.data.list[idx].pagePath;
    wx.switchTab({ url: pagePath });
    this.setData({ selected: idx });
    tabBarManager.setSelectedTab(idx);
  }
  }
});
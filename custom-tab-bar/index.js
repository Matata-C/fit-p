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
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const route = currentPage.route;
    const idx = this.data.list.findIndex(item => item.pagePath === `/${route}` || item.pagePath === route);
    this.setData({ selected: idx === -1 ? 0 : idx });
  },
  methods: {
    switchTab(e) {
      const idx = e.currentTarget.dataset.index;
      const pagePath = this.data.list[idx].pagePath;
      wx.switchTab({ url: pagePath });
      this.setData({ selected: idx });
    }
  }
}); 
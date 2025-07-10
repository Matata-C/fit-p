// weightRecord.js
Page({
  data: {
    currentWeight: '',
    date: '',
    time: '',
    weightRecords: [],
    showHistoryRecords: true // 控制是否显示历史记录
  },

  onLoad() {
    // 设置当前日期和时间
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;

    this.setData({
      date,
      time
    });

    // 加载历史记录
    this.loadWeightRecords();
  },

  onShow() {
    // 页面每次显示时刷新数据
    this.loadWeightRecords();
    
    // 更新自定义tabBar
    this.updateTabBar();
  },

  onPullDownRefresh() {
    // 下拉刷新
    this.loadWeightRecords();
    wx.stopPullDownRefresh();
  },

  // 监听体重输入
  onWeightInput(e) {
    this.setData({
      currentWeight: e.detail.value
    });
  },

  // 选择日期
  bindDateChange(e) {
    this.setData({
      date: e.detail.value
    });
  },

  // 选择时间
  bindTimeChange(e) {
    this.setData({
      time: e.detail.value
    });
  },

  // 加载体重记录
  loadWeightRecords() {
    try {
      const weightRecords = wx.getStorageSync('weightRecords') || [];
      this.setData({
        weightRecords: weightRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
      });
    } catch (e) {
      console.error('加载体重记录失败', e);
      wx.showToast({
        title: '加载记录失败',
        icon: 'none'
      });
    }
  },

  // 保存体重记录
  saveWeightRecord() {
    const { currentWeight } = this.data;
    
    // 验证输入
    if (!currentWeight) {
      wx.showToast({
        title: '请输入体重',
        icon: 'none'
      });
      return;
    }

    // 验证体重是否是有效数字
    const weight = parseFloat(currentWeight);
    if (isNaN(weight) || weight <= 0 || weight > 300) {
      wx.showToast({
        title: '请输入有效体重',
        icon: 'none'
      });
      return;
    }

    try {
      // 获取现有记录
      let weightRecords = wx.getStorageSync('weightRecords') || [];
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toTimeString().split(' ')[0].substr(0, 5);
      
      const newRecord = {
        date,
        time,
        weight,
        timestamp: new Date().getTime()
      };

      // 添加新记录
      weightRecords.push(newRecord);
      weightRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // 保存到本地存储
      wx.setStorageSync('weightRecords', weightRecords);
      
      // 更新当前体重
      const userData = wx.getStorageSync('userData') || {};
      userData.currentWeight = weight;
      wx.setStorageSync('userData', userData);

      // 显示成功提示
      wx.showToast({
        title: '记录成功',
        icon: 'success'
      });

      // 刷新记录列表并清空输入
      this.setData({
        currentWeight: '',
        weightRecords
      });
    } catch (e) {
      console.error('保存体重记录失败', e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 删除记录
  deleteRecord(e) {
    const { index } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            // 获取现有记录
            let weightRecords = wx.getStorageSync('weightRecords') || [];
            
            // 删除指定记录
            weightRecords.splice(index, 1);
            
            // 保存更新后的记录
            wx.setStorageSync('weightRecords', weightRecords);
            
            // 更新页面数据
            this.setData({
              weightRecords
            });
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          } catch (e) {
            console.error('删除记录失败', e);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 切换显示历史记录
  toggleHistoryRecords() {
    this.setData({
      showHistoryRecords: !this.data.showHistoryRecords
    });
  },

  // 更新TabBar选中状态
  updateTabBar() {
    try {
      const tabBar = this.getTabBar();
      if (tabBar && typeof tabBar.setData === 'function') {
        tabBar.setData({
          selected: 1 // 记录页对应的tabBar索引为1
        });
      }
    } catch (error) {
      console.error('更新TabBar失败:', error);
    }
  }
}); 
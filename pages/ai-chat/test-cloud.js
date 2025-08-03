Page({
  data: {
  },

  onLoad: function () {
  },

  async testCloudCall() {
    try {
      wx.showLoading({
        title: '测试中...'
      });
      const response = await wx.cloud.callContainer({
        path: '/health',
        method: 'GET',
      });

      wx.hideLoading();

      if (response.data.success) {
        wx.showToast({
          title: '云托管调用成功',
          icon: 'success'
        });
        console.log('云托管响应:', response.data);
      } else {
        wx.showToast({
          title: '调用失败',
          icon: 'error'
        });
        console.error('云托管调用失败:', response.data);
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      });
      console.error('云托管调用错误:', error);
    }
  }
})
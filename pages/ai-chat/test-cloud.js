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
      config: {
       env: 'prod-1g6skl837a850b7f'
      },
      path: '/health',
      method: 'GET',
      header: {
      'X-WX-SERVICE': 'ai-chat-service'
  }
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
Page({
  data: {
    response: '',
    loading: false
  },

  testCloudCall() {
    this.setData({
      loading: true,
      response: '测试中...'
    });

    wx.cloud.callContainer({
      config: {
       env: 'prod-1g6skl837a850b7f' // 云托管环境ID
      },
      path: '/api/chat/process',
      method: 'POST',
      header: {
        'X-WX-SERVICE': 'ai-chat-service', // 云托管服务名称
        'content-type': 'application/json'
      },
      data: {
        userId: 'test-user',
        message: '我今天跑了30分钟'
      }
    }).then(res => {
      console.log('云托管调用成功:', res);
      this.setData({
        response: JSON.stringify(res.data, null, 2),
        loading: false
      });
    }).catch(err => {
      console.error('云托管调用失败:', err);
      this.setData({
        response: '调用失败: ' + JSON.stringify(err, null, 2),
        loading: false
      });
    });
  }
});
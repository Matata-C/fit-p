Page({
  data: {
    response: ''
  },

  onLoad() {
    this.testAPI();
  },

  async testAPI() {
    try {
      const response = await wx.request({
        url: 'http://localhost:3000/api/chat/process',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          userId: 'test-user',
          message: '我今天跑步了30分钟'
        }
      });

      this.setData({
        response: JSON.stringify(response.data, null, 2)
      });

      console.log('API响应:', response.data);
    } catch (error) {
      console.error('API调用失败:', error);
      this.setData({
        response: 'API调用失败: ' + error.message
      });
    }
  }
});
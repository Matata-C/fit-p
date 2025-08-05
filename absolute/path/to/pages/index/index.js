Page({
  fetchWeRunSteps: function () {
    wx.getWeRunData({
      success: (res) => {
        console.log('微信运动数据获取成功:', res);

        wx.cloud.callFunction({
          name: 'werunDecrypt',
          data: {
            encryptedData: res.encryptedData,
            iv: res.iv,
            sessionKey: res.sessionKey
          },
          success: (cloudRes) => {
            if (cloudRes.result.success) {
              const stepInfoList = cloudRes.result.data.stepInfoList;
              const todaySteps = stepInfoList[stepInfoList.length - 1].step;

              const calories = Math.round(todaySteps * 0.04);
              const duration = Math.round(todaySteps / 120);

              this.setData({
                todaySteps: todaySteps,
                todayCalories: calories,
                todayDuration: duration
              });

              console.log('步数数据更新:', { steps: todaySteps, calories, duration });
            } else {
              console.error('解密微信运动数据失败:', cloudRes.result.error);
              this.handleWeRunError();
            }
          },
          fail: (err) => {
            console.error('调用云函数失败:', err);
            this.handleWeRunError();
          }
        });
      },
      fail: (err) => {
        console.error('获取微信运动数据失败:', err);
        this.handleWeRunError();
      }
    });
  },

  handleWeRunError: function () {
    this.setData({
      todaySteps: '当前用户未授权',
      todayCalories: 0,
      todayDuration: 0
    });
  }
})
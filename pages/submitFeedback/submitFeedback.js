// pages/submitFeedback/submitFeedback.js
Page({
  data: {
    content: '',
    phone: ''
  },

  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  onPhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  submitFeedback() {
    wx.showToast({
      title: '提交成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    });
  }
});
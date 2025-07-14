// pages/feedback/feedback.js
Page({
  // 问题详情数据
  faqData: {
    "问题1": `问题1的详细解答内容...`,
    "问题2": `问题2的详细解答内容...`,
    "问题3": `问题3的详细解答内容...`,
    "问题4": `问题4的详细解答内容...`,
    "问题5": `问题5的详细解答内容...`
  },

  // 打开弹窗
  openModal(e) {
    const title = e.currentTarget.dataset.title;
    const content = this.faqData[title] || '暂无详细说明';
    
    wx.showModal({
      title: title,
      content: content,
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  // 跳转提交反馈页面
  navigateToFeedback() {
    wx.navigateTo({
      url: '/pages/submitFeedback/submitFeedback',
      fail(err) {
        console.error('页面跳转失败：', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
});
// pages/about-us/about-us.js
Page({
  // 打开微信客服逻辑
  openWechatService() {
    wx.showToast({
      title: '打开微信客服',
      icon: 'none',
      duration: 2000
    });
    //这里后续改为使用 wx.openCustomerServiceChat 等接口，实现跳转到微信客服。
  },

  // 复制邮箱逻辑
  copyEmail() {
    wx.setClipboardData({
      data: 'supporter@miaoyudao.com',
      success() {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'none',
          duration: 2000
        });
      },
      fail(err) {
        console.error('复制失败', err);
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 隐私政策弹窗
  openPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: `
      1. 我们会收集您的必要信息用于提供服务...
      2. 信息将严格保密，仅用于...
      3. 您有权查阅、修改自己的信息...
      （这里替换成真实的隐私政策文本内容）
      `,
      showCancel: false, 
      confirmText: '我知道了',
      success(res) {
        if (res.confirm) {
          
        }
      }
    });
  },

  // 用户协议弹窗
  openUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: `
      1. 您需遵守平台规则使用服务...
      2. 平台保留相关条款解释权...
      3. 若有违规，平台有权...
      （这里替换成真实的用户协议文本内容）
      `,
      showCancel: false, 
      confirmText: '我知道了',
      success(res) {
        if (res.confirm) {
          
        }
      }
    });
  }
});
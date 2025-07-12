// pages/userInfo/userInfo.js
Page({
    data: {
      avatarUrl: '',
      nickName: '',
      ID: '123456',
      genderRange: ['男', '女'],
      gender: '女',
      signature: '',
      age: '',
      region: '北京'
    },
    
    onGenderChange(e) {
      const index = e.detail.value;
      this.setData({
        gender: this.data.genderRange[index]
      });
      this.saveGender(); // 保存性别
    },
    
    onSignatureInput(e) {
      this.setData({
        signature: e.detail.value
      });
    },
    
    
    onAgeInput(e) {
      // 限制只能输入数字
      const value = e.detail.value.replace(/[^0-9]/g, '');
      this.setData({
        age: value
      });
    },
    
    saveAge() {
      const age = parseInt(this.data.age);
      if (age <= 0 || age > 150) {
        wx.showToast({
          title: '请输入合理的年龄',
          icon: 'none'
        });
        return;
      }
    },
    
    onLogout() {
      wx.showToast({
        title: '退出登录成功',
        icon: 'none'
      });
    },
    
    onDeleteAccount() {
      wx.showModal({
        title: '提示',
        content: '确定要注销账号吗？注销后数据将无法恢复',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '账号注销中',
              icon: 'none'
            });
          }
        }
      });
    }
  });
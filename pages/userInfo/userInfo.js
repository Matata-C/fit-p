// pages/userInfo/userInfo.js
Page({
  data: {
    avatarUrl: '',
    nickName: '',
    ID: '123456',
    genderRange: ['男', '女'],
    gender: '女',
    signature: '',
    age: '',
    region: '北京',
    userInfo: null, // 新增：存储完整的用户信息
    isEditing: false, // 新增：编辑状态
    hasChanges: false // 新增：检测是否有数据变更
  },
  
  onLoad: function(options) {
    this.loadUserInfo();
  },
  
  // 新增：加载用户信息
  loadUserInfo: function() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          userInfo: userInfo,
          avatarUrl: userInfo.avatarUrl || '',
          nickName: userInfo.nickName || '',
          ID: userInfo.openid ? userInfo.openid.slice(-6) : '123456',
          gender: userInfo.gender || '女',
          signature: userInfo.signature || '',
          age: userInfo.age || '',
          region: userInfo.region || '北京'
        });
      }
    } catch (e) {
      console.error('加载用户信息失败：', e);
    }
  },
  
  // 新增：开始编辑
  onStartEdit: function() {
    this.setData({ 
      isEditing: true,
      hasChanges: false 
    });
  },
  
  // 新增：取消编辑
  onCancelEdit: function() {
    this.setData({ isEditing: false });
    this.loadUserInfo(); // 重新加载原始数据
  },
  
  // 新增：保存编辑
  onSaveEdit: async function() {
    const { avatarUrl, nickName, gender, signature, age, region, userInfo } = this.data;
    
    if (!avatarUrl || !nickName) {
      wx.showToast({ title: '请完善头像和昵称', icon: 'error' });
      return;
    }
    
    // 验证昵称长度
    if (nickName.length > 20) {
      wx.showToast({ title: '昵称不能超过20字', icon: 'error' });
      return;
    }
    
    // 验证年龄合理性
    if (age && (parseInt(age) < 1 || parseInt(age) > 150)) {
      wx.showToast({ title: '请输入合理年龄', icon: 'error' });
      return;
    }
    
    wx.showLoading({ title: '保存中', mask: true });
    
    try {
      // 上传新头像到云存储（如有更换）
      let finalAvatarUrl = avatarUrl;
      if (avatarUrl !== userInfo.avatarUrl && !avatarUrl.startsWith('cloud://')) {
        const suffix = /\.[^\.]+$/.exec(avatarUrl) ? /\.[^\.]+$/.exec(avatarUrl)[0] : '.png';
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: 'userimg/' + new Date().getTime() + suffix,
          filePath: avatarUrl
        });
        finalAvatarUrl = uploadRes.fileID;
      }
      
      // 更新数据库
      const db = wx.cloud.database();
      await db.collection('user2').where({ openid: userInfo.openid }).update({
        data: {
          avatarUrl: finalAvatarUrl,
          nickName: nickName,
          gender: gender,
          signature: signature,
          age: age,
          region: region,
          updateTime: new Date()
        }
      });
      
      // 更新本地存储
      const newUserInfo = { 
        ...userInfo, 
        avatarUrl: finalAvatarUrl,
        nickName: nickName,
        gender: gender,
        signature: signature,
        age: age,
        region: region
      };
      
      wx.setStorageSync('userInfo', newUserInfo);
      
      this.setData({ 
        userInfo: newUserInfo,
        isEditing: false 
      });
      
      wx.showToast({ title: '保存成功' });
      
      // 通知profile页面刷新
      wx.setStorageSync('dataUpdated', new Date().getTime());
      
    } catch (err) {
      console.error('保存失败:', err);
      let errorMsg = '保存失败，请重试';
      
      // 根据错误类型显示不同提示
      if (err.errMsg && err.errMsg.includes('cloud')) {
        errorMsg = '网络连接失败，请检查网络';
      } else if (err.errMsg && err.errMsg.includes('upload')) {
        errorMsg = '头像上传失败，请重试';
      } else if (err.message && err.message.includes('database')) {
        errorMsg = '数据保存失败，请重试';
      }
      
      wx.showToast({ title: errorMsg, icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },
  
  // 新增：选择头像
  onChooseAvatar: function(e) {
    this.setData({ 
      avatarUrl: e.detail.avatarUrl,
      hasChanges: true 
    });
  },
  
  // 新增：输入昵称
  onNickNameInput: function(e) {
    let value = e.detail.value;
    
    // 过滤敏感词和特殊字符
    const sensitiveWords = ['admin', 'root', 'system', '微信用户', '微信'];
    const hasSensitiveWord = sensitiveWords.some(word => 
      value.toLowerCase().includes(word.toLowerCase())
    );
    
    if (hasSensitiveWord) {
      wx.showToast({ title: '昵称包含敏感词', icon: 'none' });
      return;
    }
    
    // 过滤特殊字符
    value = value.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    
    this.setData({ 
      nickName: value,
      hasChanges: true 
    });
  },
  
  onGenderChange(e) {
    const index = e.detail.value;
    this.setData({
      gender: this.data.genderRange[index],
      hasChanges: true
    });
  },
  
  onSignatureInput(e) {
    const value = e.detail.value;
    // 限制签名长度
    if (value.length > 50) {
      wx.showToast({ title: '签名不能超过50字', icon: 'none' });
      return;
    }
    this.setData({
      signature: value,
      hasChanges: true
    });
  },
  
  onAgeInput(e) {
    // 限制只能输入数字
    const value = e.detail.value.replace(/[^0-9]/g, '');
    // 限制年龄范围
    const ageNum = parseInt(value);
    if (ageNum > 150) {
      wx.showToast({ title: '请输入合理年龄', icon: 'none' });
      return;
    }
    if (ageNum < 1 && value.length > 0) {
      wx.showToast({ title: '年龄不能小于1岁', icon: 'none' });
      return;
    }
    this.setData({
      age: value,
      hasChanges: true
    });
  },
  
  onRegionChange(e) {
    // 地区选择器返回的是数组，需要转换为字符串
    const regionArray = e.detail.value;
    const regionString = regionArray.join(' ');
    this.setData({ 
      region: regionString,
      hasChanges: true 
    });
  },
  
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地数据
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('isLoggedIn');
          
          // 返回上一页并刷新
          wx.navigateBack({
            success: () => {
              // 通知profile页面刷新
              wx.setStorageSync('dataUpdated', new Date().getTime());
            }
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },
  
  onDeleteAccount() {
    wx.showModal({
      title: '提示',
      content: '确定要注销账号吗？注销后数据将无法恢复',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '账号注销中',
            icon: 'none'
          });
        }
      }
    });
  }
});
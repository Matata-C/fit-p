// pages/profile/profile.js
const tabBarManager = require('../../utils/tabBarManager');
const app = getApp()

Page({
  data: {
    
    userInfo: null,         // 用户信息
    isLoggedIn: false,      // 新增：登录状态
    userInfo_tank: false,   // 弹框显示状态
    showManualLogin: false, // 新增：手动注册弹框状态
    avatarUrl: '',          // 头像临时路径
    nickName: '' ,           // 昵称
    stats: {
      recordDays: 0,
      weightLost: '0',
      daysToGoal: 0
    },
    // 目标设置相关数据
    isGoalExpanded: false,  // 是否展开目标设置面板
    allowManualTargetEdit: false, // 是否允许手动编辑目标消耗
    gender: 'male',
    age: '',
    height: '',
    currentWeight: '',
    goalWeight: '',
    dailyGoal: '',
    dailyTargetConsumption: '',
    showSummary: false,
    weightToLose: '',
    estimatedDays: '',
    targetDate: '',
    bmr: '',
    needRefresh: false,
    showEditProfile: false,
    editAvatarUrl: '',
    editNickName: '',
  },
  onLoad: async function(options) {
    try {
      // 检查微信版本兼容性 - 使用新的API
      const systemInfo = wx.getAppBaseInfo();
      const version = systemInfo.version;
      console.log('微信版本:', version);
      
      // 检查是否支持新的头像昵称API
      if (wx.canIUse('button.open-type.chooseAvatar')) {
        console.log('支持新的头像选择API');
      } else {
        console.log('不支持新的头像选择API，将使用旧版本');
      }
      
      // 新增：自动登录检测
      await this.checkAutoLogin();
      
      this.loadUserInfo();
      this.loadUserStats();
      this.loadGoalData();
      
      // 尝试自动登录，但不影响页面基本功能
      try {
        const loginRes = await wx.cloud.callFunction({ name: 'login' });
        const openid = loginRes.result.openid;
        const db = wx.cloud.database();
        const userRes = await db.collection('user2').where({ openid }).get();
        if (userRes.data.length > 0) {
          this.setData({ 
            userInfo: userRes.data[0],
            isLoggedIn: true  // 新增：设置登录状态
          });
          // 同步到本地缓存
          wx.setStorageSync('userInfo', userRes.data[0]);
          wx.setStorageSync('isLoggedIn', true);
        }
      } catch (cloudError) {
        console.warn('云函数调用失败，可能是云开发环境未配置或云函数未部署:', cloudError);
        // 云函数失败不影响页面基本功能
      }
    } catch (e) {
      console.error('加载个人资料页面数据失败：', e); 
    }
    // 设置TabBar选中状态为个人页(索引2)
    tabBarManager.initTabBarForPage(2);
  },

  // 新增：自动登录检测
  async checkAutoLogin() {
    try {
      // 1. 检查本地登录状态
      const isLoggedIn = wx.getStorageSync('isLoggedIn');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (isLoggedIn && userInfo) {
        // 2. 验证登录状态有效性
        const loginRes = await wx.cloud.callFunction({ name: 'login' });
        const openid = loginRes.result.openid;
        
        if (userInfo.openid === openid) {
          // 登录状态有效，自动登录
          this.setData({
            userInfo: userInfo,
            isLoggedIn: true
          });
          
          // 更新全局状态
          const app = getApp();
          if (app.globalData) {
            app.globalData.isLoggedIn = true;
            app.globalData.userInfo = userInfo;
          }
          
          console.log('自动登录成功');
          return true;
        }
      }
      
      // 3. 如果本地状态无效，清除缓存
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('isLoggedIn');
      
      return false;
    } catch (error) {
      console.error('自动登录检测失败:', error);
      return false;
    }
  },
  // 退出登录
  tuichu: function() {
    // 1. 清空页面数据
    this.setData({ 
      userInfo: null, 
      isLoggedIn: false,  // 新增：设置未登录状态
      userInfo_tank: false,
      avatarUrl: '',      // 新增：清空临时头像
      nickName: ''        // 新增：清空临时昵称
    });
    
    // 2. 清除本地缓存
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('isLoggedIn');
    
    // 3. 清除全局数据（如果有的话）
    const app = getApp();
    if (app.globalData) {
      app.globalData.userInfo = null;
      app.globalData.isLoggedIn = false;
    }
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  },
// 打开弹框
async closeTank() {
  if (!this.data.userInfo_tank) {
    try {
      const loginRes = await wx.cloud.callFunction({ name: 'login' });
      const openid = loginRes.result.openid;
      const db = wx.cloud.database();
      const userRes = await db.collection('user2').where({ openid }).get();
      if (userRes.data.length) {
        this.setData({
          userInfo: userRes.data[0],
          isLoggedIn: true,  // 新增：设置登录状态
          userInfo_tank: false,
        });
        // 同步到本地缓存
        wx.setStorageSync('userInfo', userRes.data[0]);
        wx.setStorageSync('isLoggedIn', true);
      } else {
        this.setData({ userInfo_tank: true });
      }
    } catch (err) {
      console.log('获取用户信息失败', err);
    }
  } else {
    this.setData({ userInfo_tank: false });
  }
},

// 微信授权登录
async onWechatLogin() {
  console.log('开始微信授权登录');
  
  try {
    // 使用新的getUserProfile API
    const userProfile = await wx.getUserProfile({
      desc: '用于完善用户资料'
    });
    console.log('微信返回的userProfile.userInfo:', userProfile.userInfo);
    
    wx.showLoading({ title: '正在登录', mask: true });

    // 1. 获取 openid
    const loginRes = await wx.cloud.callFunction({ name: 'login' });
    const openid = loginRes.result.openid;
    
    if (!openid) {
      throw new Error('获取用户openid失败');
    }

    // 2. 查询数据库是否有该用户
    const db = wx.cloud.database();
    const userRes = await db.collection('user2').where({ openid }).get();

    // 3. 使用微信用户信息
    const wechatUserInfo = userProfile.userInfo;
    
    let userInfo = {
      openid,
      avatarUrl: wechatUserInfo.avatarUrl,
      nickName: wechatUserInfo.nickName,
      createTime: new Date(),
      updateTime: new Date(),
      loginType: 'wechat' // 标记登录方式
    };

    if (userRes.data.length === 0) {
      // 新用户，注册
      await db.collection('user2').add({ data: userInfo });
      console.log('微信授权注册成功');
    } else {
      // 已有用户，更新信息
      await db.collection('user2').where({ openid }).update({
        data: { 
          avatarUrl: wechatUserInfo.avatarUrl,
          nickName: wechatUserInfo.nickName,
          updateTime: new Date(),
          loginType: 'wechat'
        }
      });
      console.log('微信授权登录成功');
    }

    wx.hideLoading();
    this.setData({ 
      userInfo, 
      userInfo_tank: false,
      isLoggedIn: true
    });
    // 写入本地缓存
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('isLoggedIn', true);
    
    // 新增：更新全局状态
    const app = getApp();
    if (app.globalData) {
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = userInfo;
    }
    
    wx.showToast({ title: '登录成功' });
  } catch (err) {
    wx.hideLoading();
    console.error('微信授权登录失败:', err);
    
    if (err.errMsg && err.errMsg.includes('getUserProfile:fail')) {
      wx.showToast({ 
        title: '用户取消授权', 
        icon: 'none' 
      });
    } else {
      wx.showToast({ 
        title: '登录失败，请重试', 
        icon: 'error' 
      });
    }
  }
},

// 显示手动注册弹框
showManualLogin() {
  this.setData({ 
    userInfo_tank: false,
    showManualLogin: true 
  });
},

// 关闭手动注册弹框
closeManualLogin() {
  this.setData({ showManualLogin: false });
},

// 游客模式
startGuestMode() {
  wx.showModal({
    title: '游客模式',
    content: '您将以游客身份体验功能，部分数据将无法保存。确定继续吗？',
    success: (res) => {
      if (res.confirm) {
        // 创建游客用户信息
        const guestUserInfo = {
          nickName: '游客用户',
          avatarUrl: '/images/default-avatar.svg',
          isGuest: true,
          createTime: new Date()
        };
        
        this.setData({ 
          userInfo: guestUserInfo,
          userInfo_tank: false,
          isLoggedIn: true
        });
        
        // 写入本地缓存
        wx.setStorageSync('userInfo', guestUserInfo);
        wx.setStorageSync('isLoggedIn', true);
        
        wx.showToast({ 
          title: '已进入游客模式',
          icon: 'success'
        });
      }
    }
  });
},
 // 获取头像
onChooseAvatar(e) {
  this.setData({ avatarUrl: e.detail.avatarUrl });
},
// 获取昵称
getNickName(e) {
  this.setData({ nickName: e.detail.value });
},
// 提交注册/登录
async submit() {
  if (!this.data.avatarUrl) {
    return wx.showToast({ title: '请选择头像', icon: 'error' });
  }
  if (!this.data.nickName) {
    return wx.showToast({ title: '请输入昵称', icon: 'error' });
  }
  wx.showLoading({ title: '正在登录', mask: true });

  try {
    // 1. 获取 openid
    const loginRes = await wx.cloud.callFunction({ name: 'login' });
    const openid = loginRes.result.openid;
    
    if (!openid) {
      throw new Error('获取用户openid失败');
    }

    // 2. 查询数据库是否有该用户
    const db = wx.cloud.database();
    const userRes = await db.collection('user2').where({ openid }).get();

    // 3. 上传头像到云存储
    let tempPath = this.data.avatarUrl;
    let suffix = /\.[^\.]+$/.exec(tempPath) ? /\.[^\.]+$/.exec(tempPath)[0] : '.png';
    const uploadRes = await wx.cloud.uploadFile({
      cloudPath: 'userimg/' + new Date().getTime() + suffix,
      filePath: tempPath
    });
    let avatarUrl = uploadRes.fileID;

    let userInfo = {
      openid,
      avatarUrl,
      nickName: this.data.nickName,
      createTime: new Date(),
      updateTime: new Date()
    };

    if (userRes.data.length === 0) {
      // 新用户，注册
      await db.collection('user2').add({ data: userInfo });
      console.log('新用户注册成功');
    } else {
      // 已有用户，更新头像昵称
      await db.collection('user2').where({ openid }).update({
        data: { 
          avatarUrl, 
          nickName: this.data.nickName,
          updateTime: new Date()
        }
      });
      console.log('用户信息更新成功');
    }

    wx.hideLoading();
    this.setData({ 
      userInfo, 
      showManualLogin: false,
      isLoggedIn: true  // 新增：设置登录状态
    });
    // 写入本地缓存
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('isLoggedIn', true);
    
    // 新增：更新全局状态
    const app = getApp();
    if (app.globalData) {
      app.globalData.isLoggedIn = true;
      app.globalData.userInfo = userInfo;
    }
    
    wx.showToast({ title: '注册成功' });
  } catch (err) {
    wx.hideLoading();
    console.error('登录失败:', err);
    
    // 根据错误类型显示不同提示
    if (err.message.includes('openid')) {
      wx.showToast({ title: '登录失败，请重试', icon: 'error' });
    } else if (err.message.includes('upload')) {
      wx.showToast({ title: '头像上传失败', icon: 'error' });
    } else {
      wx.showToast({ title: '网络错误，请检查网络连接', icon: 'error' });
    }
  }
},

 
  onShow: function() {
    // 检查是否有数据更新标志
    try {
      const dataUpdated = wx.getStorageSync('dataUpdated');
      const lastUpdate = wx.getStorageSync('lastProfileUpdate') || 0;
      
      // 如果有新的数据更新，或页面设置了刷新标志，强制刷新
      if ((dataUpdated && dataUpdated > lastUpdate) || this.data.needRefresh) {
        console.log('检测到数据更新，刷新个人页面数据');
        
        // 更新最后刷新时间
        wx.setStorageSync('lastProfileUpdate', new Date().getTime());
        
        // 重置刷新标志
        this.setData({ needRefresh: false });
        
        // 重新加载所有数据
        this.loadUserInfo();
        this.loadUserStats();
        this.loadGoalData();
      } else {
        // 常规刷新 - 每次显示页面都至少刷新用户统计数据
        this.loadUserInfo();
        this.loadUserStats();
        this.loadGoalData();
      }
    } catch (e) {
      console.error('检查数据更新失败:', e);
      // 出错时仍然执行常规刷新
      this.loadUserInfo();
      this.loadUserStats();
      this.loadGoalData();
    }
    
    // 确保TabBar选中个人页
    tabBarManager.setSelectedTab(2);
  },

  // 加载用户信息
  loadUserInfo: function() {
    try {
      var userInfo = wx.getStorageSync('userInfo');
      var isLoggedIn = wx.getStorageSync('isLoggedIn');
      
      if (userInfo && isLoggedIn) {
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true
        });
      } else {
        this.setData({
          userInfo: null,
          isLoggedIn: false
        });
      }
    } catch (e) {
      console.error('加载用户信息失败：', e);
    }
  },
  // 加载用户统计数据
  loadUserStats: function() {
    try {
      const userStats = wx.getStorageSync('userStats') || {};
      const goalData = wx.getStorageSync('goalData') || {};
      const weightRecords = wx.getStorageSync('weightRecords') || [];
      
      // 记录天数
      const recordDays = userStats.days || 0;
      
      // 优先使用分析页面计算的总减重数据
      let totalWeightLoss = 0;
      
      try {
        // 尝试从分析页面获取计算结果
        const analysisStats = wx.getStorageSync('analysisStatistics') || {};
        if (analysisStats.totalLost && parseFloat(analysisStats.totalLost) > 0) {
          // 使用分析页面的计算结果
          totalWeightLoss = parseFloat(analysisStats.totalLost);
          console.log('使用分析页面的总减重数据:', totalWeightLoss);
          
          // 同时更新userStats中的totalWeightLoss，保持一致性
          if (userStats.totalWeightLoss !== totalWeightLoss) {
            userStats.totalWeightLoss = totalWeightLoss;
            wx.setStorageSync('userStats', userStats);
          }
        } else {
          // 如果分析页面没有有效数据，再使用userStats中的数据
          totalWeightLoss = userStats.totalWeightLoss || 0;
        }
      } catch (e) {
        console.error('获取分析页面数据失败:', e);
        // 出错时使用userStats中的数据
        totalWeightLoss = userStats.totalWeightLoss || 0;
      }
      
      // 预计达成目标天数
      var daysToGoal = 0;
      if (userStats.currentWeight && goalData.goalWeight && goalData.dailyGoal) {
        const currentWeight = userStats.currentWeight;
        const goalWeight = goalData.goalWeight;
        const dailyGoal = goalData.dailyGoal;
        
        if (currentWeight > goalWeight && dailyGoal > 0) {
          daysToGoal = Math.ceil((currentWeight - goalWeight) / dailyGoal);
        }
      }
      
      this.setData({
        'stats.recordDays': recordDays,
        'stats.weightLost': totalWeightLoss.toFixed(1),
        'stats.daysToGoal': daysToGoal
      });
    } catch (e) {
      console.error('加载用户统计失败：', e);
    }
  },



  onUserInfoTap: function() {
    if (this.data.isLoggedIn) {
      // 已登录：跳转到用户详情页
      wx.navigateTo({
        url: '/pages/userInfo/userInfo'
      });
      return;
    }
    
    // 未登录：直接打开手动注册弹窗
    this.setData({ userInfo_tank: true });
  },


  // 加载目标设置数据
  loadGoalData: function() {
    try {
      var gender = wx.getStorageSync('gender') || 'male';
      var age = wx.getStorageSync('age') || '';
      var height = wx.getStorageSync('height') || '';
      var currentWeight = wx.getStorageSync('currentWeight') || '';
      var goalWeight = wx.getStorageSync('goalWeight') || '';
      var dailyGoal = wx.getStorageSync('dailyGoal') || '';
      var dailyTargetConsumption = wx.getStorageSync('dailyTargetConsumption') || '';

      this.setData({
        gender: gender,
        age: age,
        height: height,
        currentWeight: currentWeight,
        goalWeight: goalWeight,
        dailyGoal: dailyGoal,
        dailyTargetConsumption: dailyTargetConsumption
      });

      if (currentWeight && goalWeight && dailyGoal) {
        this.calculateSummary();
      }
    } catch (e) {
      console.error('加载目标数据失败', e);
    }
  },
  
  // 切换目标设置折叠面板
  toggleGoalSettings: function() {
    this.setData({
      isGoalExpanded: !this.data.isGoalExpanded
    });
  },

  // 切换目标消耗编辑状态
  toggleTargetEdit: function() {
    this.setData({
      allowManualTargetEdit: !this.data.allowManualTargetEdit
    });
  },

  // 点击转换按钮，将目标减重转换为目标消耗
  convertToTargetConsumption: function() {
    try {
      var dailyGoal = this.data.dailyGoal;
      
      if (!dailyGoal) {
        wx.showToast({
          title: '请先填写目标减重',
          icon: 'none'
        });
        return;
      }
      
      var targetConsumption = this.calculateTargetConsumption();
      
      if (targetConsumption > 0) {
        this.setData({
          dailyTargetConsumption: targetConsumption.toString()
        });
        
        wx.showToast({
          title: '转换成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '转换失败，请检查输入',
          icon: 'none'
        });
      }
    } catch(e) {
      console.error('转换目标消耗失败', e);
      wx.showToast({
        title: '转换失败，请重试',
        icon: 'none'
      });
    }
  },
  
  // 根据目标减重计算目标消耗
  calculateTargetConsumption: function() {
    var data = this.data;
    var currentWeight = data.currentWeight;
    var goalWeight = data.goalWeight;
    var dailyGoal = data.dailyGoal;
    var bmr = this.calculateBMR();
    
    if (!currentWeight || !goalWeight || !dailyGoal || bmr <= 0) return 0;
    
    var currentWeightNum = parseFloat(currentWeight);
    var goalWeightNum = parseFloat(goalWeight);
    var dailyGoalNum = parseFloat(dailyGoal);
    
    if (isNaN(currentWeightNum) || isNaN(goalWeightNum) || isNaN(dailyGoalNum) || dailyGoalNum <= 0) return 0;
    
    // 1kg脂肪约等于7700千卡
    var CALORIES_PER_KG = 7700;
    
    // 每日需要的卡路里赤字
    var dailyCalorieDeficit = dailyGoalNum * CALORIES_PER_KG / 30; // 转换为每日消耗
    
    // 目标消耗 = 基础代谢率 + 每日活动消耗 - 每日需要的卡路里赤字
    // 这里简化为基础代谢率 + 每日需要的卡路里赤字
    var targetConsumption = bmr + dailyCalorieDeficit;
    
    // 确保目标消耗不低于基础代谢率的80%（安全值）
    var safeMinimum = bmr * 0.8;
    
    if (targetConsumption < safeMinimum) {
      return Math.round(safeMinimum);
    }
    
    return Math.round(targetConsumption);
  },

  // 输入每日目标消耗
  onDailyTargetConsumptionInput: function(e) {
    // 只有在允许手动编辑时才更新
    if (this.data.allowManualTargetEdit) {
      this.setData({
        dailyTargetConsumption: e.detail.value
      });
    }
  },
  
  // 选择性别
  onGenderSelect: function(e) {
    var gender = e.currentTarget.dataset.gender;
    this.setData({ gender: gender });
    this.calculateSummary();
  },

  // 输入年龄
  onAgeInput: function(e) {
    this.setData({
      age: e.detail.value
    });
    this.calculateSummary();
  },

  // 输入身高
  onHeightInput: function(e) {
    this.setData({
      height: e.detail.value
    });
    this.calculateSummary();
  },

  // 输入当前体重
  onCurrentWeightInput: function(e) {
    this.setData({
      currentWeight: e.detail.value
    });
    this.calculateSummary();
  },

  // 输入目标体重
  onGoalWeightInput: function(e) {
    this.setData({
      goalWeight: e.detail.value
    });
    this.calculateSummary();
  },

  // 输入每日目标减重
  onDailyGoalInput: function(e) {
    this.setData({
      dailyGoal: e.detail.value
    });
    this.calculateSummary();
  },

  // 计算摘要信息
  calculateSummary: function() {
    try {
      var data = this.data;
      var currentWeight = data.currentWeight;
      var goalWeight = data.goalWeight;
      var dailyGoal = data.dailyGoal;
      
      if (!currentWeight || !goalWeight || !dailyGoal) {
        this.setData({ showSummary: false });
        return;
      }

      var current = parseFloat(currentWeight);
      var goal = parseFloat(goalWeight);
      var daily = parseFloat(dailyGoal);

      if (isNaN(current) || isNaN(goal) || isNaN(daily) || daily <= 0) {
        this.setData({ showSummary: false });
        return;
      }

      var weightToLose = (current - goal).toFixed(1);
      var estimatedDays = Math.ceil(Math.abs(weightToLose) / daily);
      
      // 计算目标日期
      var today = new Date();
      var targetDate = new Date(today.setDate(today.getDate() + estimatedDays));
      var targetDateStr = targetDate.getFullYear() + '-' + 
                        String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(targetDate.getDate()).padStart(2, '0');

      // 计算BMR
      var bmr = this.calculateBMR();

      this.setData({
        weightToLose: weightToLose,
        estimatedDays: estimatedDays,
        targetDate: targetDateStr,
        bmr: bmr || '',
        showSummary: true
      });
    } catch (e) {
      console.error('计算摘要信息失败', e);
    }
  },

  // 计算基础代谢率(BMR)
  calculateBMR: function() {
    var data = this.data;
    var gender = data.gender;
    var age = data.age;
    var height = data.height;
    var currentWeight = data.currentWeight;
    
    if (!age || !height || !currentWeight) return 0;

    var ageNum = parseFloat(age);
    var heightNum = parseFloat(height);
    var weightNum = parseFloat(currentWeight);

    if (isNaN(ageNum) || isNaN(heightNum) || isNaN(weightNum)) return 0;

    // 使用Harris-Benedict公式计算BMR
    if (gender === 'male') {
      return Math.round(66 + (13.7 * weightNum) + (5 * heightNum) - (6.8 * ageNum));
    } else {
      return Math.round(655 + (9.6 * weightNum) + (1.8 * heightNum) - (4.7 * ageNum));
    }
  },

  // 保存目标设置
  onSaveGoalSettings: function() {
    var data = this.data;
    var gender = data.gender;
    var age = data.age;
    var height = data.height;
    var currentWeight = data.currentWeight;
    var goalWeight = data.goalWeight;
    var dailyGoal = data.dailyGoal;
    var dailyTargetConsumption = data.dailyTargetConsumption;

    if (!gender || !age || !height || !currentWeight || !goalWeight || !dailyGoal) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    // 如果目标消耗为空，提示用户需要点击转换按钮
    if (!dailyTargetConsumption) {
      wx.showToast({
        title: '请点击转换计算目标消耗',
        icon: 'none'
      });
      return;
    }

    var ageNum = parseFloat(age);
    var heightNum = parseFloat(height);
    var current = parseFloat(currentWeight);
    var goal = parseFloat(goalWeight);
    var daily = parseFloat(dailyGoal);
    var targetConsumption = parseFloat(dailyTargetConsumption);

    if (isNaN(ageNum) || isNaN(heightNum) || isNaN(current) || isNaN(goal) || isNaN(daily) || isNaN(targetConsumption)) {
      wx.showToast({
        title: '请输入有效数字',
        icon: 'none'
      });
      return;
    }

    if (daily > 0.3) {
      var that = this;
      wx.showModal({
        title: '提示',
        content: '每日减重目标超过0.3kg可能不利于健康，是否继续？',
        success: function(res) {
          if (res.confirm) {
            that.saveGoalData();
          }
        }
      });
    } else {
      this.saveGoalData();
    }
  },

  // 保存目标数据
  saveGoalData: function() {
    var data = this.data;
    var gender = data.gender;
    var age = data.age;
    var height = data.height;
    var currentWeight = data.currentWeight;
    var goalWeight = data.goalWeight;
    var dailyGoal = data.dailyGoal;
    var dailyTargetConsumption = data.dailyTargetConsumption;
    
    var bmr = this.calculateBMR();
    
    try {
      // 保存所有数据
      wx.setStorageSync('gender', gender);
      wx.setStorageSync('age', age);
      wx.setStorageSync('height', height);
      wx.setStorageSync('currentWeight', currentWeight);
      wx.setStorageSync('goalWeight', goalWeight);
      wx.setStorageSync('dailyGoal', dailyGoal);
      wx.setStorageSync('dailyTargetConsumption', dailyTargetConsumption);
      wx.setStorageSync('bmr', bmr);
      wx.setStorageSync('calculatedBMR', bmr);

      // 更新用户统计数据
      var userStats = wx.getStorageSync('userStats') || {};
      userStats.currentWeight = parseFloat(currentWeight);
      wx.setStorageSync('userStats', userStats);

      // 保存完整的goalData对象
      var goalData = wx.getStorageSync('goalData') || {};
      goalData.gender = gender;
      goalData.age = parseFloat(age);
      goalData.height = parseFloat(height);
      goalData.goalWeight = parseFloat(goalWeight);
      goalData.dailyTargetConsumption = parseFloat(dailyTargetConsumption);
      goalData.bmr = bmr;
      goalData.calculatedBMR = bmr;
      wx.setStorageSync('goalData', goalData);
      
      // 更新数据变更标志，通知所有页面刷新数据
      wx.setStorageSync('dataUpdated', new Date().getTime());
      
      // 尝试获取并更新所有页面
      try {
        // 获取页面栈
        var pages = getCurrentPages();
        if (pages && pages.length > 0) {
          // 遍历所有页面，设置刷新标志
          pages.forEach(function(page) {
            if (page && page.setData) {
              page.setData({
                needRefresh: true
              });
              
              // 如果页面有refreshData方法，调用它
              if (typeof page.refreshData === 'function') {
                page.refreshData();
              }
            }
          });
        }
      } catch (e) {
        console.error('通知页面刷新失败:', e);
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 关闭折叠面板
      setTimeout(() => {
        this.setData({
          isGoalExpanded: false,
          allowManualTargetEdit: false
        });
        this.loadUserStats(); // 刷新统计数据
      }, 1500);
    } catch (e) {
      console.error('保存目标数据失败', e);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },
  
  // 清除所有数据
  onClearAllData: function() {
    const that = this;
    wx.showModal({
      title: '警告',
      content: '确定要清除所有数据吗？此操作不可恢复！',
      success: function(res) {
        if (res.confirm) {
          that.clearAllData();
        }
      }
    });
  },

  clearAllData: function() {
    try {
      // 清除所有数据
      wx.clearStorageSync();
      
      // 设置需要初始化标记
      wx.setStorageSync('needInitialSetup', 'true');
      
      // 提示用户
      wx.showToast({
        title: '数据已清除',
        icon: 'success',
        duration: 2000,
        success: function() {
          // 延迟跳转到首页
          setTimeout(function() {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }, 2000);
        }
      });
    } catch (e) {
      console.error('清除数据失败：', e);
      wx.showToast({
        title: '清除数据失败',
        icon: 'none'
      });
    }
  },

  onWeightGoal() {
    wx.navigateTo({
      url: '/pages/goal/goal'
    })
  },

  onWeightReminder() {
    wx.navigateTo({
      url: '/pages/reminder/reminder'
    })
  },

  onExportData() {
    const weightRecords = wx.getStorageSync('weightRecords') || []
    if (weightRecords.length === 0) {
      wx.showToast({
        title: '暂无记录数据',
        icon: 'none'
      })
      return
    }

    // 生成CSV格式的数据
    let csvContent = '日期,体重(kg)\n'
    weightRecords.forEach(record => {
      csvContent += `${record.date},${record.weight}\n`
    })

    // 复制到剪贴板
    wx.setClipboardData({
      data: csvContent,
      success: () => {
        wx.showToast({
          title: '数据已复制到剪贴板',
          icon: 'success'
        })
      }
    })
  },

  onFeedback() {
    // 打开意见反馈页面或客服会话
    wx.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请发送邮件至：\nfeedback@example.com',
      showCancel: false,
      confirmText: '复制邮箱',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'feedback@example.com',
            success: () => {
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: '体重记录小程序 v1.0.0\n\n帮助您轻松记录和追踪体重变化，科学管理健康生活。',
      showCancel: false,
      confirmText: '确定'
    })
  },

  // 导航到目标设置页面
  navigateToGoal: function() {
    wx.navigateTo({
      url: '/pages/goal/goal'
    });
  },
  
  // 导航到个人信息页面
  navigateToUserInfo: function() {
    wx.navigateTo({
      url: '/pages/userInfo/userInfo'
    });
  },

  //页面跳转
  navigateToPage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url,
        fail(err) {
          console.error('页面跳转失败：', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } else {
      wx.showToast({
        title: '目标页面地址无效',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 打开编辑资料弹窗
  onEditProfile() {
    this.setData({
      showEditProfile: true,
      editAvatarUrl: this.data.userInfo.avatarUrl,
      editNickName: this.data.userInfo.nickName
    });
  },

  // 关闭编辑资料弹窗
  closeEditProfile() {
    this.setData({ showEditProfile: false });
  },

  // 选择新头像
  onEditChooseAvatar(e) {
    this.setData({ editAvatarUrl: e.detail.avatarUrl });
  },

  // 输入昵称
  onEditNickNameInput(e) {
    this.setData({ editNickName: e.detail.value });
  },

  // 保存资料
  async onEditProfileSubmit() {
    const { editAvatarUrl, editNickName, userInfo } = this.data;
    if (!editAvatarUrl || !editNickName) {
      wx.showToast({ title: '请完善资料', icon: 'error' });
      return;
    }
    wx.showLoading({ title: '保存中', mask: true });
    try {
      // 上传新头像到云存储（如有更换）
      let avatarUrl = editAvatarUrl;
      if (editAvatarUrl !== userInfo.avatarUrl && !editAvatarUrl.startsWith('cloud://')) {
        const suffix = /\.[^\.]+$/.exec(editAvatarUrl) ? /\.[^\.]+$/.exec(editAvatarUrl)[0] : '.png';
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: 'userimg/' + new Date().getTime() + suffix,
          filePath: editAvatarUrl
        });
        avatarUrl = uploadRes.fileID;
      }
      // 更新数据库
      const db = wx.cloud.database();
      await db.collection('user2').where({ openid: userInfo.openid }).update({
        data: {
          avatarUrl,
          nickName: editNickName,
          updateTime: new Date()
        }
      });
      // 更新本地和页面
      const newUserInfo = { ...userInfo, avatarUrl, nickName: editNickName };
      this.setData({ userInfo: newUserInfo, showEditProfile: false });
      wx.setStorageSync('userInfo', newUserInfo);
      wx.showToast({ title: '保存成功' });
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },
}) 
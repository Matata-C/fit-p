// pages/profile/profile.js
const tabBarManager = require('../../utils/tabBarManager');
const app = getApp()

Page({
  data: {
    isLoggedIn: false,
    userInfo: {
      avatar: '/images/default-avatar.svg',
      nickName: '点击登录'
    },
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
    needRefresh: false
  },

  onLoad: function(options) {
    // 初始化默认状态
    this.setData({
      isLoggedIn: false,
      userInfo: {
        avatarUrl: '/images/default-avatar.svg',
        nickName: '点击登录'
      },
      stats: {
        recordDays: 0,
        weightLost: '0.0',
        daysToGoal: 0
      }
    });

    wx.removeStorageSync('isLoggedIn');

     // 检查实际授权状态
    this.checkRealAuthStatus();

    // 检查微信登录状态
    this.checkLoginStatus();
    
    // 加载用户统计数据
    this.loadUserStats();
    
    // 加载目标设置数据
    this.loadGoalData();
    
    // 初始化TabBar
    this.initTabBar();
  },

  onShow: function() {
    // 每次显示都检查登录状态（防止其他页面修改后状态不同步）
    this.checkLoginStatus();
    
    // 检查数据是否需要刷新
    const lastUpdateTime = wx.getStorageSync('lastProfileUpdate') || 0;
    const now = new Date().getTime();
    
    // 如果超过1小时未更新，或者有强制刷新标志，则重新加载数据
    if (now - lastUpdateTime > 3600000 || this.data.needRefresh) {
      this.loadUserStats();
      this.loadGoalData();
      wx.setStorageSync('lastProfileUpdate', now);
      this.setData({ needRefresh: false });
    }
  },

  //授权状态检查
  checkLoginStatus: function() {
    app.verifyLoginStatus().then(isLoggedIn => {
      this.setData({
        isLoggedIn,
        userInfo: isLoggedIn ? app.globalData.userInfo : this.data.userInfo
      });
    });
  },

  // 点击用户信息区域
  onUserInfoTap: function() {
    if (this.data.isLoggedIn) {
      wx.navigateTo({ url: '/pages/userInfo/userInfo' });
      return;
    }

    // 显示明确授权弹窗
    wx.showModal({
      title: '需要授权',
      content: '请授权获取您的用户信息',
      confirmText: '去授权',
      success: (res) => {
        if (res.confirm) {
          this.requestUserAuthorization();
        }
      }
    });
  },

  //检查登录状态
  checkLoginStatus: function() {
    const that = this;
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接获取用户信息
          wx.getUserInfo({
            success: function(res) {
              that.setData({
                isLoggedIn: true,
                userInfo: {
                  avatarUrl: res.userInfo.avatarUrl,
                  nickName: res.userInfo.nickName
                }
              });
              // 保存到全局和存储
              app.globalData.userInfo = res.userInfo;
              wx.setStorageSync('userInfo', res.userInfo);
            }
          });
        } else {
          // 未授权状态
          that.setData({
            isLoggedIn: false,
            userInfo: {
              avatarUrl: '/images/default-avatar.svg',
              nickName: '点击登录'
            }
          });
        }
      }
    });
  },

  // 加载用户信息
  loadUserInfo: function() {
    try {
      const isLoggedIn = wx.getStorageSync('isLoggedIn');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (isLoggedIn && userInfo) {
        this.setData({
          isLoggedIn: true,
          userInfo: {
            avatarUrl: userInfo.avatarUrl || '/images/default-avatar.svg',
            nickName: userInfo.nickName || ''
          }
        });
        // 更新全局数据
        getApp().globalData.userInfo = userInfo;
        getApp().globalData.isLoggedIn = true;
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

  isUserLoggedIn: function() {
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    // 检查是否有昵称或头像
    return !!(userInfo && (userInfo.nickname || userInfo.avatar));
  },

  onUserInfoTap: function() {
    if (this.data.isLoggedIn) {
      // 已登录：跳转到用户详情页
      wx.navigateTo({
        url: '/pages/userInfo/userInfo'
      });
      return;
    }
    
    // 显示明确的授权弹窗
    wx.showModal({
      title: '需要授权',
      content: '我们需要获取您的用户信息',
      confirmText: '去授权',
      success: (res) => {
        if (res.confirm) {
          this.requestUserAuthorization();
        }
      }
    });
  },

//授权请求
requestUserAuthorization() {
  wx.getUserProfile({
    desc: '用于个人主页展示',
    success: (res) => {
      // 用户点击同意后才更新状态
      this.setData({
        isLoggedIn: true,
        userInfo: res.userInfo
      });
    },
    fail: (err) => {
      console.error('授权拒绝:', err);
      wx.showToast({ title: '授权已取消', icon: 'none' });
    }
  });
},

//处理登录成功
  handleLoginSuccess: function(userInfo) {
  this.setData({
    isLoggedIn: true,
    userInfo: {
      avatarUrl: userInfo.avatarUrl,
      nickName: userInfo.nickName
    }
  });
  
  // 保存用户信息到本地
  wx.setStorageSync('userInfo', userInfo);
  wx.setStorageSync('isLoggedIn', true);
  
  wx.showToast({
    title: '登录成功',
    icon: 'success'
  });
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
}) 
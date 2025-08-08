Page({
  data: {
    currentWeekday: '',
    currentDate: '',
  
    targetStep: 10000,
  
   stepCount:0,//步数数据
    calories: 320,
    duration: 65,
    todaySteps: 0,
    stepGoal: 10000,
    stepRemaining: 0,
    // 数据转化区相关数据
    caloriesBurned: 0,       // 消耗热量
    calorieEquivalent: '',   // 热量等价物
    exerciseEffect: '',      // 运动效果描述
    exerciseEquivalent: '',  // 运动效果等价物
    distance: 0,             // 距离
    distanceEquivalent: ''  , // 距离等价物
    // weekSteps: [] // Remove weekSteps
    todayPeriods: [
      { label: '早', steps: 2500, percent: 40 },
      { label: '中', steps: 3200, percent: 60 },
      { label: '晚', steps: 2152, percent: 35 }
    ]
  },

  onLoad() {
       // 从本地存储读取步数
    const step = wx.getStorageSync('stepCount') || 0
    this.setData({
      stepCount: step
    })
    this.initDate();
    // this.initWeekSteps(); // Remove weekSteps init
    // 初始化日期
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    this.setData({
      currentDate: `${year}年${month}月${day}日`
    });
    
    // 获取微信运动数据
    this.getWeRunData();
    this.calcStepRemaining();
  },

  // 获取微信运动数据
  getWeRunData() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.werun']) {
          // 未授权，发起授权请求
          wx.authorize({
            scope: 'scope.werun',
            success: () => {
              this.fetchWeRunData();
            },
            fail: () => {
              wx.showToast({
                title: '需要授权微信运动才能获取步数',
                icon: 'none'
              });
              this.updateProgressAndDraw();
              this.calculateConversions(7852);//模拟数据
            }
          });
        } else {
          // 已授权，直接获取数据
          this.fetchWeRunData();
        }
      }
    });
  },
  
  // 实际获取微信运动数据
  fetchWeRunData() {
    wx.getWeRunData({
      success: (res) => {
        // 注意：真实项目中需要解密res.encryptedData获取步数
        // 这里使用模拟数据进行演示
        const mockSteps = 5959; // 模拟步数
        this.setData({ todaySteps: mockSteps }, () => {
          this.updateProgressAndDraw(); // 新增：更新进度并绘制
          this.calcStepRemaining();
        });
        this.calculateConversions(mockSteps);
      },
      fail: (err) => {
        console.error('获取步数失败', err);
        wx.showToast({
          title: '获取步数失败',
          icon: 'none'
        });
        this.calculateConversions(7852);
      }
    });
  },
  
  // 计算步数转化的数据
  calculateConversions(steps) {
    // 计算消耗热量 (大致：每2000步消耗80千卡)
    const calories = Math.round(steps / 2000 * 80);
    
    // 热量等价物 (根据热量值动态变化)
    let calorieEquivalent = '';
    if (calories < 50) {
      calorieEquivalent = '个鸡蛋';
    } else if (calories < 150) {
      calorieEquivalent = '罐可乐';
    } else if (calories < 300) {
      calorieEquivalent = '份薯条';
    } else {
      calorieEquivalent = '个汉堡';
    }
    
    // 计算距离 (大致：每2000步1.5公里)
    const distance = (steps / 2000 * 1.5).toFixed(1);
    
    // 距离等价物
    let distanceEquivalent = '';
    const distanceNum = parseFloat(distance);
    if (distanceNum < 1) {
      distanceEquivalent = '绕标准操场1圈';
    } else if (distanceNum < 3) {
      distanceEquivalent = '步行15分钟';
    } else if (distanceNum < 5) {
      distanceEquivalent = '步行30分钟';
    } else {
      distanceEquivalent = '步行1小时';
    }
    
    // 运动效果和等价物
    let exerciseEffect = '';
    let exerciseEquivalent = '';
    
    if (steps < 3000) {
      exerciseEffect = '轻度活动';
      exerciseEquivalent = '拉伸运动10分钟';
    } else if (steps < 7000) {
      exerciseEffect = '中度活动';
      exerciseEquivalent = '慢跑15分钟';
    } else if (steps < 10000) {
      exerciseEffect = '良好活动';
      exerciseEquivalent = '游泳20分钟';
    } else {
      exerciseEffect = '充分活动';
      exerciseEquivalent = '健身训练30分钟';
    }
    
    // 更新数据
    this.setData({
      caloriesBurned: calories,
      calorieEquivalent: calorieEquivalent,
      distance: distance,
      distanceEquivalent: distanceEquivalent,
      exerciseEffect: exerciseEffect,
      exerciseEquivalent: exerciseEquivalent
    });
  },

   //更新进度百分比并绘制环形进度条
   updateProgressAndDraw() {
    const { todaySteps, stepGoal } = this.data;
    const progressPercent = Math.min(Math.round((todaySteps / stepGoal) * 100), 100);
    
    this.setData({ progressPercent }, () => {
      this.drawProgressRing(); // 确保进度百分比更新后再绘制
    });
  },

  // 绘制环形进度条
  drawProgressRing() {
    wx.createSelectorQuery().select('.progress-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) return;
        
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        // 引入设备信息工具函数
        const { getDevicePixelRatio } = require('../../utils/device.js');
        const dpr = getDevicePixelRatio();
       
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = res[0].width; 
        const height = res[0].height; 
        const lineWidth = 10; 
        const radius = (width - lineWidth) / 2; 
        const centerX = width / 2; 
        const centerY = height / 2; 
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();
        
        const progress = this.data.progressPercent / 100;
        const startAngle = -0.5 * Math.PI; 
        const endAngle = startAngle + 2 * Math.PI * progress; 
      
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineWidth = lineWidth;
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#ff6f91'); 
        gradient.addColorStop(1, '#ffb3c6');
        ctx.strokeStyle = gradient;

        ctx.lineCap = 'round';
        ctx.stroke();

        // 在圆环中心绘制百分比和“完成”字样
        ctx.font = `bold ${Math.floor(width / 4)}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const percentText = `${this.data.progressPercent}%`;
        ctx.fillText(percentText, centerX, centerY - width / 12);
        ctx.font = `bold ${Math.floor(width / 8)}px Arial`;
        ctx.fillStyle = '#fff';
        ctx.fillText('完成', centerX, centerY + width / 6);
      });
  },

  //计算剩余步数
  calcStepRemaining() {
    const { stepGoal, todaySteps } = this.data;
    // 确保结果不为负数（如果今日步数超过目标，显示0）
    const remaining = Math.max(stepGoal - todaySteps, 0);
    this.setData({
      stepRemaining:
   remaining
    });
  },
  
  // 初始化日期
  initDate() {
    const now = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekday = weekdays[now.getDay()];
    
    this.setData({
      currentWeekday: weekday,
      currentDate: `${month}月${day}日`
    });
  },

  // Remove initWeekSteps function
});
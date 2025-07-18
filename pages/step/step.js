Page({
  data: {
    currentWeekday: '',
    currentDate: '',
    todaySteps: 0,
    stepGoal: 10000,
    progressPercent: 78,
    distance: 5.9,
    calories: 320,
    duration: 65,
    // weekSteps: [] // Remove weekSteps
    todayPeriods: [
      { label: '早', steps: 2500, percent: 40 },
      { label: '中', steps: 3200, percent: 60 },
      { label: '晚', steps: 2152, percent: 35 }
    ]
  },



  onLoad() {
    this.initDate();
    // this.initWeekSteps(); // Remove weekSteps init
    this.drawProgressRing();
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
              this.setData({ isAuthorized: true });
              this.fetchWeRunData();
            },
            fail: () => {
              wx.showToast({
                title: '需要授权微信运动才能获取步数',
                icon: 'none'
              });
              // 使用默认步数模拟数据（保持与之前逻辑一致）
              this.setData({ todaySteps: 7852, isAuthorized: false });
              this.updateProgressAndDraw(); // 新增：更新进度并绘制
            }
          });
        } else {
          // 已授权，直接获取数据
          this.setData({ isAuthorized: true });
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
        // 这里使用模拟数据进行演示（实际开发需替换为解密逻辑）
        const mockSteps = 7852; // 模拟步数
        this.setData({ todaySteps: mockSteps }, () => {
          this.updateProgressAndDraw(); // 新增：更新进度并绘制
          this.initWeekSteps(); // 重新初始化本周数据，确保今日步数正确
          this.calcStepRemaining();
        });
      },
      fail: (err) => {
        console.error('获取步数失败', err);
        wx.showToast({
          title: '获取步数失败',
          icon: 'none'
        });
        // 使用默认步数模拟数据
        this.setData({ todaySteps: 7852 }, () => {
          this.updateProgressAndDraw();
          this.initWeekSteps();
        });
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
        const dpr = wx.getSystemInfoSync().pixelRatio;
       
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);
        
        const width = res[0].width; 
        const height = res[0].height; 
        const radius = (width - 10) / 2; 
        const centerX = width / 2; 
        const centerY = height / 2; 
        const lineWidth = 12; 
        
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

  // 绘制环形进度条
  drawProgressRing() {
    const ctx = wx.createCanvasContext('progressRing');
    const width = 280; // 画布宽度
    const height = 280; // 画布高度
    const radius = (width - 30) / 2; // 圆环半径
    const centerX = width / 2; // 圆心x坐标
    const centerY = height / 2; // 圆心y坐标
    const lineWidth = 12; // 圆环宽度
    
    // 绘制背景圆环
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.setLineWidth(lineWidth);
    ctx.setStrokeStyle('rgba(255, 255, 255, 0.2)');
    ctx.stroke();
    
    // 绘制进度圆环
    const progress = this.data.progressPercent / 100;
    const startAngle = -0.5 * Math.PI; // 开始角度（-90度）
    const endAngle = startAngle + 2 * Math.PI * progress; // 结束角度
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.setLineWidth(lineWidth);
    ctx.setStrokeStyle('white');
    ctx.setLineCap('round');
    ctx.stroke();
    
    ctx.draw();
  }
});
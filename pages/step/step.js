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
    weekSteps: [],
     // 数据转化区相关数据
     caloriesBurned: 0,       // 消耗热量
     calorieEquivalent: '',   // 热量等价物
     exerciseEffect: '',      // 运动效果描述
     exerciseEquivalent: '',  // 运动效果等价物
     distance: 0,             // 距离
     distanceEquivalent: ''   // 距离等价物
  },



  onLoad() {
    this.initDate();
    this.initWeekSteps();
    this.drawProgressRing();
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
              // 模拟数据用于展示
              this.calculateConversions(7852);
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
        const mockSteps = 7852; // 模拟步数
        this.setData({
          todaySteps: mockSteps
        });
        
        // 计算转化数据
        this.calculateConversions(mockSteps);
      },
      fail: (err) => {
        console.error('获取步数失败', err);
        wx.showToast({
          title: '获取步数失败',
          icon: 'none'
        });
        // 模拟数据用于展示
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

  // 初始化本周步数数据
  initWeekSteps() {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const now = new Date();
    const currentDay = now.getDay();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    
    const weekData = [];
    // 生成本周数据
    for (let i = 0; i < 7; i++) {
      // 计算日期
      const dateDiff = i - currentDay;
      const stepDate = new Date(now);
      stepDate.setDate(currentDate + dateDiff);
      
      // 随机生成步数 (周末步数更多)
      let steps;
      if (i === 0 || i === 6) { // 周末
        steps = Math.floor(Math.random() * 5000) + 8000;
      } else if (i === currentDay) { // 今天
        steps = this.data.todaySteps;
      } else { // 工作日
        steps = Math.floor(Math.random() * 4000) + 5000;
      }
      
      // 计算百分比
      const percent = Math.min(Math.round((steps / this.data.stepGoal) * 100), 100);
      
      weekData.push({
        weekday: weekdays[i],
        date: `${currentMonth}月${stepDate.getDate()}日`,
        steps: steps,
        percent: percent
      });
    }
    
    this.setData({
      weekSteps: weekData
    });
  },

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

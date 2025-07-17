Page({
  data: {
    currentWeekday: '',
    currentDate: '',
    todaySteps: 7852,
    stepGoal: 10000,
    progressPercent: 78,
    distance: 5.9,
    calories: 320,
    duration: 65,
    weekSteps: []
  },

  onLoad() {
    this.initDate();
    this.initWeekSteps();
    this.drawProgressRing();
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

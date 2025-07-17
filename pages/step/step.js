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

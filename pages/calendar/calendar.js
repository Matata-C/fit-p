Page({
  data: {
    year: 0,
    month: 0,
    currentMonthDays: [],
    prevMonthDays: [],
    nextMonthDays: [],
    checkedDates: [], 
    checkedCount: 0   // 实时计算
  },

  onLoad() {
    this.initCalendar();
  },

  // 初始化日历
  initCalendar() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const today = date.getDate();

    const checkedDates = wx.getStorageSync('checkedDates') || [];
    this.setData({
      checkedDates,
      checkedCount: checkedDates.length // 初始化已打卡天数
  });
    
    this.setData({
      year,
      month,
      today
    });

    this.generateCalendarData(year, month, today);
  },

  // 生成日历数据
  generateCalendarData(year, month, today) {
    // 获取当月第一天是星期几 (0-6)
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    
    // 获取当月的总天数
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 获取上个月的总天数
    const daysInPrevMonth = new Date(year, month - 1, 0).getDate();
    
    // 生成上月剩余天数
    const prevMonthDays = [];
    for (let i = firstDayOfMonth; i > 0; i--) {
      prevMonthDays.push(daysInPrevMonth - i + 1);
    }
    
    // 生成当月天数
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      currentMonthDays.push({
        day: i,
        date: dateStr,
        isToday: i === today && this.data.month === month && this.data.year === year,
        isChecked: this.data.checkedDates.includes(dateStr)
      });
    }

    this.setData({ currentMonthDays });
    
    // 生成下月开始天数
    const nextMonthDaysCount = 42 - (prevMonthDays.length + currentMonthDays.length);
    const nextMonthDays = [];
    for (let i = 1; i <= nextMonthDaysCount; i++) {
      nextMonthDays.push(i);
    }
    
    this.setData({
      prevMonthDays,
      currentMonthDays,
      nextMonthDays
    });
  },

  // 切换到上月
  prevMonth() {
    let { year, month } = this.data;
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
    this.setData({ year, month });
    this.initCalendar();
  },

  // 切换到下月
  nextMonth() {
    let { year, month } = this.data;
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
    this.setData({ year, month });
    this.initCalendar();
  },

  // 选择日期（打卡功能）
  selectDate(e) {
    const { date } = e.currentTarget.dataset;
    const { currentMonthDays, checkedDates } = this.data;
    
    // 更新选中状态
    const updatedDays = currentMonthDays.map(day => {
      if (day.date === date) {
        day.isChecked = !day.isChecked;
      }
      return day;
    });
    
    // 更新已打卡日期数组
    let newCheckedDates = [...checkedDates];
    if (newCheckedDates.includes(date)) {
      newCheckedDates = newCheckedDates.filter(d => d !== date);
    } else {
      newCheckedDates.push(date);
    }
    
    this.setData({
      currentMonthDays: updatedDays,
      checkedDates: newCheckedDates,
      checkedCount: newCheckedDates.length
    });
    
    // 实际项目中这里应该调用API保存打卡状态
    console.log(`打卡状态更新: ${date} - ${updatedDays.find(d => d.date === date).isChecked}`);
  }
});
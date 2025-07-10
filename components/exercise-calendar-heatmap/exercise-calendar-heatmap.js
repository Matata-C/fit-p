Component({
  properties: {
    monthData: {
      type: Object,
      value: {}
    }
  },
  data: {
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarRows: []
  },
  observers: {
    'monthData': function(monthData) {
      console.log('组件 observers 收到 monthData', monthData);
      this.generateCalendar(monthData);
    }
  },
  lifetimes: {
    attached() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      const rows = [];
      let row = [];
      for (let i = 0; i < firstDay; i++) row.push({ day: '', level: '', emoji: '' });
      for (let day = 1; day <= daysInMonth; day++) {
        row.push({ day, level: 'level-0', emoji: '' });
        if (row.length === 7) { rows.push(row); row = []; }
      }
      if (row.length > 0) { while (row.length < 7) row.push({ day: '', level: '', emoji: '' }); rows.push(row); }
      this.setData({ calendarRows: rows });
      console.log('attached写死rows', rows);
    }
  },
  methods: {
    generateCalendar(monthData) {
      console.log('generateCalendar收到monthData', monthData);
      if (!monthData || typeof monthData !== 'object') {
        console.log('monthData 非法', monthData);
        return;
      }
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      // 生成二维数组
      const rows = [];
      let row = [];
      let day = 1;
      // 先补空
      for (let i = 0; i < firstDay; i++) {
        row.push({ day: '', level: '', emoji: '' });
      }
      // 填充本月天数（不管数据如何都显示格子）
      for (; day <= daysInMonth; day++) {
        row.push({ day, level: 'level-0', emoji: '' });
        if (row.length === 7) {
          rows.push(row);
          row = [];
        }
      }
      // 补齐最后一行
      if (row.length > 0) {
        while (row.length < 7) row.push({ day: '', level: '', emoji: '' });
        rows.push(row);
      }
      this.setData({ calendarRows: rows });
    }
  }
}) 
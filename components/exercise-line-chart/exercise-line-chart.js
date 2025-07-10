Component({
  properties: {
    dateLabels: {
      type: Array,
      value: []
    },
    stepsData: {
      type: Array,
      value: []
    },
    durationData: {
      type: Array,
      value: []
    },
    caloriesData: {
      type: Array,
      value: []
    },
    height: {
      type: Number,
      value: 200
    }
  },
  data: {
    showChart: false,
    canvasWidth: 0,
    canvasHeight: 0,
    dpr: 1
  },
  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ dpr: systemInfo.pixelRatio || 1 });
      this.calculateSize();
      wx.onWindowResize(this.handleResize.bind(this));
    },
    ready() {
      setTimeout(() => {
        this.calculateSize();
      }, 100);
    },
    detached() {
      wx.offWindowResize(this.handleResize);
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
    }
  },
  observers: {
    'dateLabels, stepsData, durationData, caloriesData, height': function(dateLabels, stepsData, durationData, caloriesData) {
      this.setData({
        showChart: dateLabels.length > 0 && (stepsData.length > 0 || durationData.length > 0 || caloriesData.length > 0)
      });
      if (this.data.showChart) {
        if (this.data.ctx) {
          this.calculateSize();
        } else {
          setTimeout(() => {
            this.calculateSize();
          }, 100);
        }
      }
    }
  },
  methods: {
    calculateSize() {
      const query = this.createSelectorQuery();
      query.select('.exercise-line-chart-container').boundingClientRect().exec(res => {
        if (!res || !res[0]) return;
        const containerWidth = res[0].width;
        let canvasHeight = this.properties.height;
        this.setData({
          canvasWidth: containerWidth,
          canvasHeight: canvasHeight
        });
        this.initCanvas();
      });
    },
    handleResize() {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.calculateSize();
        if (this.data.ctx && this.data.showChart) {
          this.drawChart();
        }
      }, 300);
    },
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select('.exercise-line-chart-canvas')
        .fields({ node: true, size: true })
        .exec(res => {
          if (!res || !res[0] || !res[0].node) return;
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const width = this.data.canvasWidth;
          const height = this.data.canvasHeight;
          const dpr = this.data.dpr;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
          this.canvas = canvas;
          this.ctx = ctx;
          this.data.ctx = ctx;
          if (this.data.showChart) {
            this.drawChart();
          }
        });
    },
    drawChart() {
      const ctx = this.ctx || this.data.ctx;
      if (!ctx) return;
      const width = this.data.canvasWidth;
      const height = this.data.canvasHeight;
      ctx.clearRect(0, 0, width, height);
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      // 取所有数据的最大值
      const allData = [...this.properties.stepsData, ...this.properties.durationData, ...this.properties.caloriesData];
      const maxValue = Math.max(1, ...allData);
      // Y轴刻度
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        ctx.fillStyle = '#bbb';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(maxValue * (1 - i / 5)), padding - 8, y + 4);
      }
      // X轴刻度
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const xStep = chartWidth / (this.properties.dateLabels.length - 1 || 1);
      this.properties.dateLabels.forEach((label, i) => {
        const x = padding + i * xStep;
        ctx.fillStyle = '#bbb';
        ctx.font = '12px Arial';
        ctx.fillText(label, x, padding + chartHeight + 8);
      });
      // 折线颜色
      const colors = ['#FFD600', '#FFB6B9', '#A0E7E5'];
      const datas = [this.properties.stepsData, this.properties.durationData, this.properties.caloriesData];
      datas.forEach((data, idx) => {
        if (!data || data.length === 0) return;
        ctx.beginPath();
        ctx.strokeStyle = colors[idx];
        ctx.lineWidth = 3;
        data.forEach((val, i) => {
          const x = padding + i * xStep;
          const y = padding + chartHeight * (1 - val / maxValue);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // 可爱圆点
        data.forEach((val, i) => {
          const x = padding + i * xStep;
          const y = padding + chartHeight * (1 - val / maxValue);
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = colors[idx];
          ctx.shadowColor = colors[idx];
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });
    }
  }
}) 
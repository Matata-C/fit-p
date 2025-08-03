Component({
  properties: {
    dateLabels: {
      type: Array,
      value: []
    },
    weightData: {
      type: Array,
      value: []
    },
    height: {
      type: Number,
      value: 200
    },
    autoHeight: {
      type: Boolean,
      value: true
    },
    paddingTop: {
      type: Number,
      value: 30
    },
    paddingBottom: {
      type: Number,
      value: 30
    },
    paddingLeft: {
      type: Number,
      value: 40
    },
    paddingRight: {
      type: Number,
      value: 30
    }
  },

  data: {
    showChart: false,
    chartInstance: null,
    screenWidth: 375,
    canvasWidth: 0,
    canvasHeight: 0,
    ctx: null,
    dpr: 1
  },

  lifetimes: {
    attached() {
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();

      // 保存设备像素比，用于适配高分辨率屏幕
      const dpr = systemInfo.pixelRatio || 1;
      this.setData({
        dpr,
        showChart: this.properties.dateLabels.length > 0 && this.properties.weightData.length > 0
      });

      // 计算初始尺寸
      this.calculateSize();

      // 监听窗口大小变化
      wx.onWindowResize(this.handleResize.bind(this));
    },

    ready() {
      // 组件准备完成后初始化Canvas
      setTimeout(() => {
        this.calculateSize();
      }, 100);
    },

    detached() {
      // 移除窗口大小变化监听
      wx.offWindowResize(this.handleResize);
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
    }
  },

  observers: {
    'dateLabels, weightData, height, autoHeight': function (dateLabels, weightData) {
      this.setData({
        showChart: dateLabels.length > 0 && weightData.length > 0
      });

      if (this.data.showChart) {
        // 如果组件已经初始化完成，则重新计算尺寸并绘制图表
        if (this.data.ctx) {
          this.calculateSize();
        } else {
          // 如果尚未初始化，则延迟初始化
          setTimeout(() => {
            this.calculateSize();
          }, 100);
        }
      }
    }
  },

  methods: {
    // 计算画布尺寸
    calculateSize() {
      const query = this.createSelectorQuery();
      query.select('.weight-chart-container').boundingClientRect().exec(res => {
        if (!res || !res[0]) return;

        const containerWidth = res[0].width;
        let canvasHeight = this.properties.height;

        // 如果启用自动高度，则根据屏幕宽度计算合适的高度
        if (this.properties.autoHeight) {
          // 手机竖屏时，容器宽度通常较小，需要较小的高度
          if (containerWidth < 375) {
            canvasHeight = Math.max(180, containerWidth * 0.6);
          }
          // 平板或横屏手机时，给予更大的高度
          else if (containerWidth >= 375 && containerWidth < 768) {
            canvasHeight = Math.max(200, containerWidth * 0.5);
          }
          // 大屏设备
          else {
            canvasHeight = Math.max(250, containerWidth * 0.4);
          }
        }

        this.setData({
          screenWidth: containerWidth,
          canvasWidth: containerWidth,
          canvasHeight: canvasHeight
        });

        // 初始化canvas context
        this.initCanvas();
      });
    },

    // 处理窗口大小变化
    handleResize() {
      // 延迟执行以避免频繁计算
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }

      this.resizeTimer = setTimeout(() => {
        this.calculateSize();

        if (this.data.ctx && this.properties.weightData && this.properties.weightData.length > 0) {
          this.drawChart();
        }
      }, 300);
    },

    // 初始化canvas
    initCanvas() {
      const query = this.createSelectorQuery();
      query.select('.weight-chart-canvas')
        .fields({ node: true, size: true })
        .exec(res => {
          if (!res || !res[0] || !res[0].node) return;

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');

          // 设置canvas物理像素大小
          const width = this.data.canvasWidth;
          const height = this.data.canvasHeight;
          const dpr = this.data.dpr;

          // 调整canvas大小以适应设备像素比
          canvas.width = width * dpr;
          canvas.height = height * dpr;

          // 缩放context以适应设备像素比
          ctx.scale(dpr, dpr);

          this.canvas = canvas;
          this.ctx = ctx;

          // 保存context引用，但不在setData中保存ctx对象
          this.data.ctx = ctx;

          // 如果有数据则绘制图表
          if (this.properties.weightData && this.properties.weightData.length > 0) {
            this.drawChart();
          }
        });
    },

    // 绘制图表主函数
    drawChart() {
      if (!this.ctx && !this.data.ctx) return;

      const ctx = this.ctx || this.data.ctx;
      const data = this.properties.weightData;

      if (!data || data.length === 0) return;

      const width = this.data.canvasWidth;
      const height = this.data.canvasHeight;

      // 根据设备宽度动态调整内边距
      let paddingLeft = this.properties.paddingLeft;
      let paddingRight = this.properties.paddingRight;
      let paddingTop = this.properties.paddingTop;
      let paddingBottom = this.properties.paddingBottom;

      // 小屏设备时减小内边距
      if (width < 375) {
        paddingLeft = Math.max(30, paddingLeft * 0.8);
        paddingRight = Math.max(20, paddingRight * 0.8);
        paddingTop = Math.max(20, paddingTop * 0.8);
        paddingBottom = Math.max(20, paddingBottom * 0.8);
      }

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 计算图表绘制区域
      const chartWidth = width - paddingLeft - paddingRight;
      const chartHeight = height - paddingTop - paddingBottom;

      // 找出最大和最小体重值用于比例计算
      const weights = data.map(item => parseFloat(item.weight));
      const maxWeight = Math.max(...weights);
      const minWeight = Math.min(...weights);

      // 为了更好的视觉效果，让最大/最小值有一些边距
      const weightRange = Math.max(1, maxWeight - minWeight); // 确保至少有1的范围
      const weightTop = maxWeight + weightRange * 0.1;
      const weightBottom = Math.max(0, minWeight - weightRange * 0.1);

      // 根据画布宽度确定显示的数据点数量
      let displayCount = data.length;
      // 如果数据点太多，根据宽度减少显示的点数
      if (width < 375 && data.length > 7) {
        displayCount = 7;
      } else if (width < 768 && data.length > 14) {
        displayCount = 14;
      }

      // 计算采样间隔
      const sampleInterval = Math.max(1, Math.floor(data.length / displayCount));

      // 筛选要显示的数据点
      const displayData = data.length > displayCount
        ? data.filter((_, index) => index % sampleInterval === 0 || index === data.length - 1)
        : data;

      // 绘制坐标轴
      this.drawAxes(ctx, paddingLeft, paddingTop, chartWidth, chartHeight, weightTop, weightBottom, displayData);

      // 绘制体重曲线
      this.drawWeightLine(ctx, paddingLeft, paddingTop, chartWidth, chartHeight, weightTop, weightBottom, data);

      // 绘制数据点
      this.drawDataPoints(ctx, paddingLeft, paddingTop, chartWidth, chartHeight, weightTop, weightBottom, data);
    },

    // 绘制坐标轴
    drawAxes(ctx, paddingLeft, paddingTop, chartWidth, chartHeight, weightTop, weightBottom, displayData) {
      ctx.beginPath();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;

      // 绘制Y轴
      ctx.moveTo(paddingLeft, paddingTop);
      ctx.lineTo(paddingLeft, paddingTop + chartHeight);

      // 绘制X轴
      ctx.moveTo(paddingLeft, paddingTop + chartHeight);
      ctx.lineTo(paddingLeft + chartWidth, paddingTop + chartHeight);

      ctx.stroke();

      // 绘制Y轴刻度和网格线
      const yTickCount = this.data.canvasHeight < 200 ? 3 : (this.data.canvasHeight < 300 ? 5 : 6);
      const yStep = chartHeight / (yTickCount - 1);
      const weightStep = (weightTop - weightBottom) / (yTickCount - 1);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#999';
      ctx.font = this.data.canvasWidth < 375 ? '10px Arial' : '12px Arial';

      for (let i = 0; i < yTickCount; i++) {
        const y = paddingTop + i * yStep;
        const weight = weightTop - i * weightStep;

        // 绘制横向网格线
        ctx.beginPath();
        ctx.strokeStyle = '#f0f0f0';
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + chartWidth, y);
        ctx.stroke();

        // 绘制Y轴刻度值
        ctx.fillText(weight.toFixed(1), paddingLeft - 5, y);
      }

      // 绘制X轴刻度和标签
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const xStep = chartWidth / (displayData.length - 1 || 1);

      // 根据画布宽度动态调整显示的日期数量
      const skipLabels = this.data.canvasWidth < 375
        ? Math.max(1, Math.floor(displayData.length / 4))
        : (this.data.canvasWidth < 768 ? Math.max(1, Math.floor(displayData.length / 7)) : 1);

      displayData.forEach((item, index) => {
        // 只显示部分标签，避免拥挤
        if (index % skipLabels === 0 || index === displayData.length - 1) {
          const x = paddingLeft + index * xStep;

          // 绘制垂直网格线
          ctx.beginPath();
          ctx.strokeStyle = '#f0f0f0';
          ctx.moveTo(x, paddingTop);
          ctx.lineTo(x, paddingTop + chartHeight);
          ctx.stroke();

          // 根据设备宽度选择日期格式
          let dateText = '';
          if (this.data.canvasWidth < 375) {
            // 小屏设备，仅显示日期
            dateText = item.date.substring(5); // 月-日
          } else {
            // 较大屏幕显示完整日期
            dateText = item.date;
          }

          ctx.fillText(dateText, x, paddingTop + chartHeight + 5);
        }
      });
    },

    // 绘制体重曲线
    drawWeightLine(ctx, paddingLeft, paddingTop, chartWidth, chartHeight, weightTop, weightBottom, data) {
      if (data.length < 2) return;

      const xStep = chartWidth / (data.length - 1);

      ctx.beginPath();
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;

      // 计算第一个点的位置
      const firstWeight = parseFloat(data[0].weight);
      const firstX = paddingLeft;
      const firstY = paddingTop + (weightTop - firstWeight) / (weightTop - weightBottom) * chartHeight;

      ctx.moveTo(firstX, firstY);

      // 绘制其余点并连线
      for (let i = 1; i < data.length; i++) {
        const weight = parseFloat(data[i].weight);
        const x = paddingLeft + i * xStep;
        const y = paddingTop + (weightTop - weight) / (weightTop - weightBottom) * chartHeight;

        ctx.lineTo(x, y);
      }

      ctx.stroke();
    },

    // 绘制数据点和值标签
    drawDataPoints(ctx, paddingLeft, paddingTop, chartWidth, chartHeight, weightTop, weightBottom, data) {
      const xStep = chartWidth / (data.length - 1 || 1);

      // 根据画布宽度决定是否显示所有点的标签
      const showAllLabels = this.data.canvasWidth >= 768 || data.length <= 7;
      const skipLabels = this.data.canvasWidth < 375 ? 3 : 2;

      data.forEach((item, index) => {
        const weight = parseFloat(item.weight);
        const x = paddingLeft + index * xStep;
        const y = paddingTop + (weightTop - weight) / (weightTop - weightBottom) * chartHeight;

        // 根据体重变化选择颜色
        let pointColor = '#1890ff'; // 默认蓝色
        if (index > 0) {
          const prevWeight = parseFloat(data[index - 1].weight);
          if (weight > prevWeight) {
            pointColor = '#ff5252'; // 增加，红色
          } else if (weight < prevWeight) {
            pointColor = '#4caf50'; // 减少，绿色
          } else {
            pointColor = '#ffc107'; // 维持，黄色
          }
        }

        // 绘制数据点
        ctx.beginPath();
        ctx.fillStyle = pointColor;
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // 显示体重数值
        if (showAllLabels || index % skipLabels === 0 || index === 0 || index === data.length - 1) {
          ctx.fillStyle = pointColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.font = this.data.canvasWidth < 375 ? '10px Arial' : '12px Arial';
          ctx.fillText(weight.toFixed(1), x, y - 8);
        }
      });
    }
  }
}) 
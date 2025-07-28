Component({
  properties: {
    pieData: {
      type: Array,
      value: []
    }
  },
  data: {
    canvasWidth: 220,
    canvasHeight: 220,
    colorList: [
      '#FFD600', // 可爱黄
      '#FFB6B9', // 粉
      '#A0E7E5', // 蓝绿
      '#B4F8C8', // 浅绿
      '#FFDAC1', // 橙
      '#FFFACD'  // 柠檬黄
    ]
  },
  observers: {
    'pieData': function (pieData) {
      console.log('饼图数据更新:', pieData);
      this.drawPieChart();
    }
  },
  lifetimes: {
    attached() {
      this.drawPieChart();
    }
  },
  methods: {
    drawPieChart() {
      const query = this.createSelectorQuery();
      query.select('.exercise-pie-chart-canvas').fields({ node: true, size: true }).exec(res => {
        if (!res || !res[0] || !res[0].node) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio || 1;
        const width = this.data.canvasWidth;
        const height = this.data.canvasHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);
        // 处理数据
        const data = this.properties.pieData.map((item, idx) => {
          // 确保每个分类使用正确的颜色
          let color = item.color;
          if (!color) {
            // 根据分类名称分配颜色
            const colorMap = {
              '有氧运动': '#FFD600', // 黄色
              '力量训练': '#FFB6B9', // 粉色
              '身体塑形': '#A0E7E5', // 青色
              '竞技运动': '#B4F8C8', // 绿色
              '其他运动': '#FFDAC1'  // 橙色
            };
            color = colorMap[item.name] || this.data.colorList[idx % this.data.colorList.length];
          }
          return {
            ...item,
            color: color
          };
        });
        
        console.log('处理后的饼图数据:', data);
        
        // 使用百分比数据绘制饼图
        let total = 0;
        if (data.length === 0) {
          // 如果没有数据，显示默认状态
          console.log('没有饼图数据，显示默认状态');
          this.drawDefaultState(ctx, centerX, centerY, radius);
          return;
        } else if (data.length === 1 && data[0].name === '暂无运动数据') {
          // 如果是"暂无运动数据"，显示为100%
          data[0].percentage = 100;
          total = 100;
        } else {
          // 计算总百分比
          total = data.reduce((sum, item) => sum + (item.percentage || 0), 0);
        }
        
        console.log('饼图总百分比:', total);
        
        if (total === 0) {
          console.log('总百分比为0，显示默认状态');
          this.drawDefaultState(ctx, centerX, centerY, radius);
          return;
        }
        let startAngle = -Math.PI / 2;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 14;
        // 绘制饼图
        data.forEach((item, idx) => {
          const angle = ((item.percentage || 0) / total) * Math.PI * 2;
          console.log(`绘制扇形 ${idx + 1}: ${item.name}, 百分比: ${item.percentage}%, 角度: ${angle}, 颜色: ${item.color}`);
          
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle, false);
          ctx.closePath();
          ctx.fillStyle = item.color;
          ctx.shadowColor = item.color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
          // 可爱分割线
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle, false);
          ctx.lineTo(centerX, centerY);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
          startAngle += angle;
        });
        // 中心显示信息
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFD600';
        
        // 如果是"暂无运动数据"，显示睡觉图标
        if (data.length === 1 && data[0].name === '暂无运动数据') {
          ctx.font = 'bold 32px Arial';
          ctx.fillText('😴', centerX, centerY);
        }
        // 其他情况不显示任何文字
      });
    },
    
    // 绘制默认状态（无数据时）
    drawDefaultState(ctx, centerX, centerY, radius) {
      // 绘制灰色圆圈
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#F0F0F0';
      ctx.fill();
      
      // 绘制边框
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 显示默认文字
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#999999';
      ctx.fillText('😴', centerX, centerY);
      
      // 显示提示文字
      ctx.font = 'bold 14px Arial';
      ctx.fillText('暂无运动数据', centerX, centerY + 40);
    }
  }
}); 
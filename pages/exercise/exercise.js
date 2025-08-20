// exercise.js
const app = getApp()

Page({
  data: {
    exerciseName: '',
    caloriesBurned: '',
    duration: '',                  // 统一用 duration
    exerciseRecords: [],
    todayTotalCalories: 0,         // 统一用 todayTotalCalories
    showAddDialog: false,
    showCommonExercises: false,
    commonExercises: [
      { name: '快走', caloriesPerHour: 300, unit: '小时' },
      { name: '慢跑', caloriesPerHour: 500, unit: '小时' },
      { name: '篮球', caloriesPerHour: 600, unit: '小时' },
      { name: '游泳', caloriesPerHour: 600, unit: '小时' },
      { name: '跳绳', caloriesPerHour: 750, unit: '小时' },
      { name: '瑜伽', caloriesPerHour: 250, unit: '小时' },
      { name: '举重', caloriesPerHour: 400, unit: '小时' },
      { name: '力量训练', caloriesPerHour: 350, unit: '小时' }
    ]
  },

  onLoad: function () {
    this.loadExerciseRecords()
  },

  onShow: function () {
    this.loadExerciseRecords()
  },


  loadExerciseRecords: function () {
    console.log('=== loadExerciseRecords 开始执行 ===');
    try {
      const today = this.getCurrentDateString()
      console.log('当前日期:', today);
      let exerciseRecords = wx.getStorageSync('exerciseRecords') || {}
      if (!exerciseRecords[today]) {
        exerciseRecords[today] = []
      }
      let todayRecords = exerciseRecords[today]
      let totalCalories = 0
      console.log('今日运动记录数量:', todayRecords.length);
      todayRecords.forEach(record => {
        // 确保每个记录的卡路里值有效
        let calories = parseFloat(record.caloriesBurned) || 0;
        // 检查是否为NaN
        if (isNaN(calories)) {
          calories = 0;
        }
        // 确保每个记录的卡路里值至少为1
        calories = Math.max(1, calories);
        totalCalories += calories;
        // 添加日志以调试问题
        console.log('运动记录加载:', record.name, '时长:', record.durationText, '原始卡路里:', record.caloriesBurned, '处理后卡路里:', calories);
      })
      console.log('总卡路里计算:', totalCalories);
      this.setData({
        exerciseRecords: todayRecords,
        todayTotalCalories: totalCalories
      })
      console.log('页面数据更新 - 运动记录数量:', todayRecords.length, '总卡路里:', totalCalories);
      this.updateHomeTheoreticalConsumption()
      console.log('=== loadExerciseRecords 执行完成 ===');
    } catch (e) {
      console.error('加载运动记录失败', e)
      console.log('=== loadExerciseRecords 执行出错 ===');
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    }
  },
  showAddExercise: function () {
    this.setData({
      showAddDialog: true,
      exerciseName: '',
      caloriesBurned: '',
      duration: '',
      showCommonExercises: false
    })
  },
  hideAddExercise: function () {
    this.setData({
      showAddDialog: false
    })
  },
  toggleCommonExercises: function () {
    this.setData({
      showCommonExercises: !this.data.showCommonExercises
    })
  },
  selectCommonExercise: function (e) {
    const index = e.currentTarget.dataset.index
    const exercise = this.data.commonExercises[index]

    this.setData({
      exerciseName: exercise.name,
      caloriesBurned: '',
      duration: '',
      showCommonExercises: false
    })
    if (this.data.duration) {
      this.calculateCalories(exercise.caloriesPerHour)
    }
  },
  onExerciseNameInput: function (e) {
    this.setData({
      exerciseName: e.detail.value
    })
  },
  onCaloriesBurnedInput: function (e) {
    this.setData({
      caloriesBurned: e.detail.value
    })
  },
  onDurationInput: function (e) {
    this.setData({
      duration: e.detail.value
    })
    const exerciseName = this.data.exerciseName
    const selectedExercise = this.data.commonExercises.find(
      exercise => exercise.name === exerciseName
    )

    if (selectedExercise && this.data.duration) {
      this.calculateCalories(selectedExercise.caloriesPerHour)
    }
  },
  calculateCalories: function (caloriesPerHour) {
    const duration = parseFloat(this.data.duration)
    if (!isNaN(duration) && duration > 0) {
      // 确保时长以小时为单位，如果是分钟则转换为小时
      let durationInHours = duration
      // 检查是否可能是分钟输入（例如大于10小时的输入可能实际是分钟）
      if (duration > 10 && duration <= 300) {
        // 假设输入的是分钟，转换为小时
        durationInHours = duration / 60
        wx.showToast({
          title: '已自动将分钟转换为小时',
          icon: 'none'
        })
      }
      const calories = Math.round(caloriesPerHour * durationInHours)
      // 确保卡路里值合理
      const maxReasonableCalories = 10000 // 设置一个合理的上限
      const finalCalories = Math.min(maxReasonableCalories, Math.max(1, calories))
      // 添加日志以调试问题
      console.log('calculateCalories: duration=', duration, 'durationInHours=', durationInHours, 'caloriesPerHour=', caloriesPerHour, 'calories=', calories, 'finalCalories=', finalCalories)
      this.setData({
        caloriesBurned: finalCalories.toString()
      })
    }
  },
  saveExercise: function () {
    console.log('=== saveExercise 开始执行 ===');
    console.log('输入数据 - 运动名称:', this.data.exerciseName, '时长:', this.data.duration, '卡路里:', this.data.caloriesBurned);

    if (!this.data.exerciseName.trim()) {
      console.log('验证失败: 运动名称为空');
      wx.showToast({
        title: '请输入运动名称',
        icon: 'none'
      });
      return;
    }
    if (!this.data.duration || Number(this.data.duration) <= 0) {
      console.log('验证失败: 运动时间无效');
      wx.showToast({
        title: '请输入有效的运动时间',
        icon: 'none'
      });
      return;
    }
    if (!this.data.caloriesBurned || Number(this.data.caloriesBurned) <= 0) {
      console.log('验证失败: 消耗热量无效');
      wx.showToast({
        title: '请输入有效的消耗热量',
        icon: 'none'
      });
      return;
    }
    // 将时长转换为分钟数
    let durationInMinutes = 0;
    const durationStr = this.data.duration.toString();
    if (durationStr.includes('小时')) {
      const hours = parseFloat(durationStr.replace('小时', ''));
      durationInMinutes = Math.round(hours * 60);
    } else if (durationStr.includes('分钟')) {
      const minutes = parseFloat(durationStr.replace('分钟', ''));
      durationInMinutes = Math.round(minutes);
    } else {
      // 纯数字输入，根据数值大小判断单位
      const numericValue = parseFloat(durationStr);
      if (numericValue > 10 && numericValue <= 300) {
        // 假设是分钟输入
        durationInMinutes = Math.round(numericValue);
      } else {
        // 假设是小时输入，转换为分钟
        durationInMinutes = Math.round(numericValue * 60);
      }
    }

    const newRecord = {
      id: Date.now().toString(),
      name: this.data.exerciseName,
      duration: durationInMinutes, // 保存为分钟数
      durationText: this.data.duration, // 保存原始文本用于显示
      caloriesBurned: this.ensureValidCalories(this.data.caloriesBurned),
      time: new Date().toLocaleTimeString()
    };
    console.log('创建新记录:', newRecord);
    const updatedRecords = [...this.data.exerciseRecords, newRecord];
    const totalCalories = this.calculateTotalCalories(updatedRecords);
    console.log('更新记录 - 记录数量:', updatedRecords.length, '总卡路里:', totalCalories);

    this.setData({
      exerciseRecords: updatedRecords,
      todayTotalCalories: totalCalories,
      showAddDialog: false,
      exerciseName: '',
      duration: '',
      caloriesBurned: ''
    });
    console.log('页面数据已更新');

    this.saveRecordsToStorage(updatedRecords);
    console.log('记录已保存到本地存储');

    this.updateHomeTheoreticalConsumption();
    this.updateHomeActualConsumption();
    console.log('首页消耗数据已更新');

    // 设置数据更新标志，通知其他页面刷新数据
    wx.setStorageSync('dataUpdated', Date.now());
    console.log('数据更新标志已设置');

    wx.showToast({
      title: '运动记录已保存',
      icon: 'success'
    });
    console.log('=== saveExercise 执行完成 ===');
  },
  deleteExercise: function (e) {
    console.log('=== deleteExercise 开始执行 ===');
    const recordId = e.currentTarget.dataset.id;
    console.log('删除记录ID:', recordId);
    const recordToDelete = this.data.exerciseRecords.find(record => record.id === recordId);
    console.log('要删除的记录:', recordToDelete);

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条运动记录吗？',
      success: res => {
        if (res.confirm) {
          console.log('用户确认删除');
          const updatedRecords = this.data.exerciseRecords.filter(record => record.id !== recordId);
          const totalCalories = this.calculateTotalCalories(updatedRecords);
          console.log('删除后记录数量:', updatedRecords.length, '总卡路里:', totalCalories);

          this.setData({
            exerciseRecords: updatedRecords,
            todayTotalCalories: totalCalories
          });
          console.log('页面数据已更新');

          this.saveRecordsToStorage(updatedRecords);
          console.log('记录已保存到本地存储');

          this.updateHomeTheoreticalConsumption();
          this.updateHomeActualConsumption();
          console.log('首页消耗数据已更新');

          // 设置数据更新标志，通知其他页面刷新数据
          wx.setStorageSync('dataUpdated', Date.now());
          console.log('数据更新标志已设置');

          wx.showToast({
            title: '记录已删除',
            icon: 'success'
          });
          console.log('=== deleteExercise 执行完成 ===');
        } else {
          console.log('用户取消删除');
        }
      }
    });
  },
  updateHomeTheoreticalConsumption: function () {
    try {
      const today = this.getCurrentDateString();
      let totalCaloriesBurned = 0;
      this.data.exerciseRecords.forEach(record => {
        totalCaloriesBurned += record.caloriesBurned;
      });
      let consumptionRecords = wx.getStorageSync('consumptionRecords') || {};

      const bmr = wx.getStorageSync('calculatedBMR') || 0;

      if (!consumptionRecords[today]) {
        consumptionRecords[today] = {
          theoretical: bmr + totalCaloriesBurned,
          target: 0,
          actual: 0,
          bmrAdded: true
        };
      } else {
        consumptionRecords[today].theoretical = bmr + totalCaloriesBurned;
        consumptionRecords[today].bmrAdded = true;
      }

      wx.setStorageSync('consumptionRecords', consumptionRecords);
      console.log('首页理论消耗已更新:', bmr + totalCaloriesBurned);
    } catch (e) {
      console.error('更新首页理论消耗失败', e);
    }
  },

  updateHomeActualConsumption: function () {
    console.log('=== exercise.js updateHomeActualConsumption 开始执行 ===');
    try {
      const today = this.getCurrentDateString();
      console.log('当前日期:', today);
      const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
      const todayExercises = exerciseRecords[today] || [];
      let exerciseCalories = 0;
      console.log('运动记录数量:', todayExercises.length);

      todayExercises.forEach(record => {
        const calories = parseFloat(record.caloriesBurned) || 0;
        // 确保卡路里值有效，避免NaN
        if (isNaN(calories)) {
          calories = 0;
        }
        console.log('运动记录:', record.name, '卡路里:', calories);
        exerciseCalories += calories;
      });
      console.log('运动消耗总和:', exerciseCalories);
      const foodRecords = wx.getStorageSync('foodRecords') || {};
      const todayFoods = foodRecords[today] || [];
      let foodCalories = 0;
      console.log('食物记录数量:', todayFoods.length);

      todayFoods.forEach(record => {
        const calories = parseFloat(record.totalCalories) || 0;
        // 确保卡路里值有效，避免NaN
        if (isNaN(calories)) {
          calories = 0;
        }
        console.log('食物记录:', record.name, '卡路里:', calories);
        foodCalories += calories;
      });
      console.log('食物摄入总和:', foodCalories);
      const actualConsumption = Math.max(0, exerciseCalories - foodCalories);
      console.log('实际消耗计算:', exerciseCalories, '-', foodCalories, '=', actualConsumption);
      let consumptionRecords = wx.getStorageSync('consumptionRecords') || {};

      if (!consumptionRecords[today]) {
        let targetConsumption = 0;
        const targetConsumptions = wx.getStorageSync('targetConsumptions') || {};
        if (targetConsumptions[today]) {
          targetConsumption = targetConsumptions[today];
        } else if (wx.getStorageSync('dailyTargetConsumption')) {
          targetConsumption = parseFloat(wx.getStorageSync('dailyTargetConsumption'));
        } else {
          const goalData = wx.getStorageSync('goalData') || {};
          if (goalData.dailyTargetConsumption) {
            targetConsumption = parseFloat(goalData.dailyTargetConsumption);
          }
        }

        consumptionRecords[today] = {
          theoretical: 0,
          target: targetConsumption,
          actual: actualConsumption,
          bmrAdded: false
        };
      } else {
        consumptionRecords[today].actual = actualConsumption;
      }
      wx.setStorageSync('consumptionRecords', consumptionRecords);

      console.log('实际消耗已更新:', actualConsumption);
      console.log('=== exercise.js updateHomeActualConsumption 执行完成 ===');
    } catch (e) {
      console.error('更新首页实际消耗数据失败', e);
      console.log('=== exercise.js updateHomeActualConsumption 执行出错 ===');
    }
  },
  getCurrentDateString: function () {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },
  // 保存运动记录到本地存储
  saveRecordsToStorage: function (records) {
    try {
      const today = this.getCurrentDateString();
      let allRecords = wx.getStorageSync('exerciseRecords') || {};
      allRecords[today] = records;
      wx.setStorageSync('exerciseRecords', allRecords);
    } catch (e) {
      console.error('保存运动记录失败', e);
    }
  },
  // 计算总消耗千卡
  calculateTotalCalories: function (records) {
    let total = 0;
    records.forEach(item => {
      // 确保每个记录的卡路里值至少为1
      total += Math.max(1, Number(item.caloriesBurned) || 0);
    });
    return total;
  },

  // 确保单个运动记录的卡路里不为0
  ensureValidCalories: function (calories) {
    const value = Number(calories) || 0;
    const result = Math.max(1, value);
    // 添加日志以调试问题
    console.log('ensureValidCalories input:', calories, 'value:', value, 'output:', result);
    return result;
  },
  /**
   * 格式化时长（分钟）为“X小时Y分钟”或“X分钟”
   */
  formatDuration: function (duration) {
    console.log('formatDuration 输入:', duration, typeof duration);

    // 如果是字符串格式（如"1小时"），直接返回
    if (typeof duration === 'string' && (duration.includes('小时') || duration.includes('分钟'))) {
      return duration;
    }

    duration = Number(duration) || 0;
    console.log('formatDuration 转换后:', duration);

    if (duration < 60) {
      return duration + '分钟';
    } else if (duration % 60 === 0) {
      return (duration / 60) + '小时';
    } else {
      const hour = Math.floor(duration / 60);
      const min = duration % 60;
      return hour + '小时' + min + '分钟';
    }
  }
})
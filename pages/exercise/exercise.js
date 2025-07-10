// exercise.js
const app = getApp()

Page({
  data: {
    exerciseName: '',             
    caloriesBurned: '',            
    duration: '',                  
    exerciseRecords: [],          
    todayTotalCalories: 0,         
    showAddDialog: false,         
    showCommonExercises: false,  
    commonExercises: [
      { name: '快走', caloriesPerHour: 300, unit: '小时' },
      { name: '慢跑', caloriesPerHour: 500, unit: '小时' },
      { name: '骑自行车', caloriesPerHour: 450, unit: '小时' },
      { name: '游泳', caloriesPerHour: 600, unit: '小时' },
      { name: '跳绳', caloriesPerHour: 750, unit: '小时' },
      { name: '瑜伽', caloriesPerHour: 250, unit: '小时' },
      { name: '健身操', caloriesPerHour: 400, unit: '小时' },
      { name: '力量训练', caloriesPerHour: 350, unit: '小时' }
    ]
  },

  onLoad: function() {
    this.loadExerciseRecords()
  },
  
  onShow: function() {
    this.loadExerciseRecords()
  },
  
  
  loadExerciseRecords: function() {
    try {
      const today = this.getCurrentDateString()
      let exerciseRecords = wx.getStorageSync('exerciseRecords') || {}
      if (!exerciseRecords[today]) {
        exerciseRecords[today] = []
      }
      let todayRecords = exerciseRecords[today]
      let totalCalories = 0
      
      todayRecords.forEach(record => {
        totalCalories += record.caloriesBurned || 0
      })
      this.setData({
        exerciseRecords: todayRecords,
        todayTotalCalories: totalCalories
      })
      this.updateHomeTheoreticalConsumption()
    } catch (e) {
      console.error('加载运动记录失败', e)
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    }
  },
  showAddExercise: function() {
    this.setData({
      showAddDialog: true,
      exerciseName: '',
      caloriesBurned: '',
      duration: '',
      showCommonExercises: false
    })
  },
  hideAddExercise: function() {
    this.setData({
      showAddDialog: false
    })
  },
  toggleCommonExercises: function() {
    this.setData({
      showCommonExercises: !this.data.showCommonExercises
    })
  },
  selectCommonExercise: function(e) {
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
  onExerciseNameInput: function(e) {
    this.setData({
      exerciseName: e.detail.value
    })
  },
  onCaloriesBurnedInput: function(e) {
    this.setData({
      caloriesBurned: e.detail.value
    })
  },
  onDurationInput: function(e) {
    this.setData({
      duration: e.detail.value
    })
    const exerciseName = this.data.exerciseName
    const selectedExercise = this.data.commonExercises.find(
      exercise => exercise.name === exerciseName
    )
    
    if (selectedExercise && e.detail.value) {
      this.calculateCalories(selectedExercise.caloriesPerHour)
    }
  },
  calculateCalories: function(caloriesPerHour) {
    const duration = parseFloat(this.data.duration)
    if (!isNaN(duration) && duration > 0) {
      const calories = Math.round(caloriesPerHour * duration)
      this.setData({
        caloriesBurned: calories.toString()
      })
    }
  },
  saveExercise: function() {
    if (!this.data.exerciseName.trim()) {
      wx.showToast({
        title: '请输入运动名称',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.exerciseMinutes || this.data.exerciseMinutes <= 0) {
      wx.showToast({
        title: '请输入有效的运动时间',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.caloriesBurned || this.data.caloriesBurned <= 0) {
      wx.showToast({
        title: '请输入有效的消耗热量',
        icon: 'none'
      });
      return;
    }
    const newRecord = {
      id: Date.now().toString(), 
      name: this.data.exerciseName,
      minutes: this.data.exerciseMinutes,
      caloriesBurned: this.data.caloriesBurned,
      time: new Date().toLocaleTimeString()
    };
    const updatedRecords = [...this.data.exerciseRecords, newRecord];
    this.setData({
      exerciseRecords: updatedRecords,
      totalCaloriesBurned: this.calculateTotalCalories(updatedRecords),
      showExerciseDialog: false,
      exerciseName: '',
      exerciseMinutes: '',
      caloriesBurned: ''
    });
    this.saveRecordsToStorage(updatedRecords);
    this.updateHomeTheoreticalConsumption();
    this.updateHomeActualConsumption();
    
    wx.showToast({
      title: '运动记录已保存',
      icon: 'success'
    });
  },
  deleteExercise: function(e) {
    const recordId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条运动记录吗？',
      success: res => {
        if (res.confirm) {
          const updatedRecords = this.data.exerciseRecords.filter(record => record.id !== recordId);
          this.setData({
            exerciseRecords: updatedRecords,
            totalCaloriesBurned: this.calculateTotalCalories(updatedRecords)
          });
          this.saveRecordsToStorage(updatedRecords);
          this.updateHomeTheoreticalConsumption();
          this.updateHomeActualConsumption();
          
          wx.showToast({
            title: '记录已删除',
            icon: 'success'
          });
        }
      }
    });
  },
  updateHomeTheoreticalConsumption: function() {
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
  
  updateHomeActualConsumption: function() {
    try {
      const today = this.getCurrentDateString();
      const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
      const todayExercises = exerciseRecords[today] || [];
      let exerciseCalories = 0;
      
      todayExercises.forEach(record => {
        exerciseCalories += record.caloriesBurned || 0;
      });
      const foodRecords = wx.getStorageSync('foodRecords') || {};
      const todayFoods = foodRecords[today] || [];
      let foodCalories = 0;
      
      todayFoods.forEach(record => {
        foodCalories += record.totalCalories || 0;
      });
      const actualConsumption = Math.max(0, exerciseCalories - foodCalories);
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
    } catch (e) {
      console.error('更新首页实际消耗数据失败', e);
    }
  },
  getCurrentDateString: function() {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}) 
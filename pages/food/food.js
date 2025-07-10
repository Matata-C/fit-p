// food.js
const app = getApp()

Page({
  data: {
    foodName: '',              // 食物名称
    calories: '',              // 千焦
    kcalValue: 0,              // 转换后的千卡值
    showKcalValue: false,      // 是否显示转换后的千卡值
    quantity: '',              // 数量
    unit: '份',                // 单位
    foodRecords: [],           // 食物记录数组
    todayTotalCalories: 0,     // 今日总摄入千卡
    showAddDialog: false,      // 是否显示添加对话框
    showCommonFoods: false,    // 是否显示常见食物列表
    commonFoods: [             // 常见食物及其千焦
      { name: '米饭', calories: 485, unit: '碗', amount: 1, weight: 100 },
      { name: '面条', calories: 1130, unit: '碗', amount: 1, weight: 250 },
      { name: '馒头', calories: 933, unit: '个', amount: 1, weight: 100 },
      { name: '鸡蛋', calories: 322, unit: '个', amount: 1, weight: 50 },
      { name: '牛奶', calories: 586, unit: '杯', amount: 1, weight: 200 },
      { name: '苹果', calories: 301, unit: '个', amount: 1, weight: 150 },
      { name: '香蕉', calories: 439, unit: '根', amount: 1, weight: 100 },
      { name: '猪肉', calories: 598, unit: '两', amount: 1, weight: 50 }
    ]
  },

  onLoad: function() {
    this.loadFoodRecords()
  },
  
  onShow: function() {
    this.loadFoodRecords()
  },
  
  // 加载食物记录
  loadFoodRecords: function() {
    try {
      // 获取今日日期
      const today = this.getCurrentDateString()
      
      // 从本地存储获取食物记录
      let foodRecords = wx.getStorageSync('foodRecords') || {}
      
      // 确保今日记录存在
      if (!foodRecords[today]) {
        foodRecords[today] = []
      }
      
      // 计算今日总摄入千卡
      let todayRecords = foodRecords[today]
      let totalCalories = 0
      
      todayRecords.forEach(record => {
        totalCalories += record.totalCalories || 0
      })
      
      // 更新数据
      this.setData({
        foodRecords: todayRecords,
        todayTotalCalories: totalCalories
      })
    } catch (e) {
      console.error('加载食物记录失败', e)
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      })
    }
  },
  
  // 显示添加食物对话框
  showAddFood: function() {
    this.setData({
      showAddDialog: true,
      foodName: '',
      calories: '',
      quantity: '1',
      unit: '份',
      showCommonFoods: false
    })
  },
  
  // 隐藏添加食物对话框
  hideAddFood: function() {
    this.setData({
      showAddDialog: false
    })
  },
  
  // 显示/隐藏常见食物列表
  toggleCommonFoods: function() {
    this.setData({
      showCommonFoods: !this.data.showCommonFoods
    })
  },
  
  // 转换千焦为千卡
  convertToKcal: function() {
    const kj = parseFloat(this.data.calories);
    if (isNaN(kj) || kj <= 0) {
      wx.showToast({
        title: '请先输入千焦值',
        icon: 'none'
      });
      return;
    }
    
    // 转换公式：1千卡 = 4.184千焦
    const kcal = Math.round(kj / 4.184);
    
    this.setData({
      kcalValue: kcal,
      showKcalValue: true
    });
  },
  
  // 选择常见食物
  selectCommonFood: function(e) {
    const index = e.currentTarget.dataset.index
    const food = this.data.commonFoods[index]
    
    this.setData({
      foodName: food.name + "(" + food.weight + "克)",
      calories: food.calories.toString(),
      quantity: food.amount.toString(),
      unit: food.unit,
      showCommonFoods: false,
      showKcalValue: false
    })
    
    // 自动转换为千卡
    this.convertToKcal();
  },
  
  // 输入食物名称
  onFoodNameInput: function(e) {
    this.setData({
      foodName: e.detail.value
    })
  },
  
  // 输入千卡
  onCaloriesInput: function(e) {
    this.setData({
      calories: e.detail.value
    })
    this.calculateTotalCalories()
  },
  
  // 输入数量
  onQuantityInput: function(e) {
    this.setData({
      quantity: e.detail.value
    })
    this.calculateTotalCalories()
  },
  
  // 选择单位
  onUnitChange: function(e) {
    this.setData({
      unit: e.detail.value
    })
  },
  
  // 计算总千卡
  calculateTotalCalories: function() {
    const calories = parseFloat(this.data.calories)
    const quantity = parseFloat(this.data.quantity)
    
    if (!isNaN(calories) && !isNaN(quantity)) {
      return calories * quantity
    }
    return 0
  },
  
  // 保存食物记录
  saveFood: function() {
    // 验证输入
    if (!this.data.foodName) {
      wx.showToast({
        title: '请输入食物名称',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.calories) {
      wx.showToast({
        title: '请输入千焦值',
        icon: 'none'
      })
      return
    }
    
    const kj = parseFloat(this.data.calories)
    if (isNaN(kj) || kj <= 0) {
      wx.showToast({
        title: '请输入有效的千焦值',
        icon: 'none'
      })
      return
    }
    
    const quantity = parseFloat(this.data.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      wx.showToast({
        title: '请输入有效的数量',
        icon: 'none'
      })
      return
    }
    
    try {
      const today = this.getCurrentDateString()
      const time = new Date().toTimeString().substr(0, 5) // 获取HH:MM格式的时间
      
      // 转换千焦为千卡
      const kcal = this.data.showKcalValue ? this.data.kcalValue : Math.round(kj / 4.184);
      const totalKcal = kcal * quantity;
      
      // 新食物记录
      const newRecord = {
        id: Date.now().toString(), // 使用时间戳作为唯一ID
        name: this.data.foodName,
        calories: kcal, // 存储千卡值
        kj: kj, // 存储原始千焦值
        quantity: quantity,
        unit: this.data.unit,
        totalCalories: totalKcal, // 以千卡为单位
        time: time
      }
      
      // 获取现有记录
      let foodRecords = wx.getStorageSync('foodRecords') || {}
      
      // 确保今日记录存在
      if (!foodRecords[today]) {
        foodRecords[today] = []
      }
      
      // 添加新记录
      foodRecords[today].push(newRecord)
      
      // 计算今日总千卡
      let todayTotalCalories = 0
      foodRecords[today].forEach(record => {
        todayTotalCalories += record.totalCalories || 0
      })
      
      // 保存到存储
      wx.setStorageSync('foodRecords', foodRecords)
      
      // 更新视图数据
      this.setData({
        foodRecords: foodRecords[today],
        todayTotalCalories: todayTotalCalories,
        showAddDialog: false
      })
      
      wx.showToast({
        title: '记录已保存',
        icon: 'success'
      })
      
      // 更新首页的理论消耗量
      this.updateHomeTheoreticalConsumption()
    } catch (e) {
      console.error('保存食物记录失败', e)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },
  
  // 删除食物记录
  deleteFood: function(e) {
    const index = e.currentTarget.dataset.index
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条食物记录吗？',
      success: res => {
        if (res.confirm) {
          try {
            const today = this.getCurrentDateString()
            
            // 获取现有记录
            let foodRecords = wx.getStorageSync('foodRecords') || {}
            
            // 确保今日记录存在
            if (!foodRecords[today]) {
              foodRecords[today] = []
            }
            
            // 删除记录
            foodRecords[today].splice(index, 1)
            
            // 计算新的总千卡
            let totalCalories = 0
            foodRecords[today].forEach(record => {
              totalCalories += record.totalCalories || 0
            })
            
            // 保存到存储
            wx.setStorageSync('foodRecords', foodRecords)
            
            // 更新视图数据
            this.setData({
              foodRecords: foodRecords[today],
              todayTotalCalories: totalCalories
            })
            
            wx.showToast({
              title: '记录已删除',
              icon: 'success'
            })
            
            // 更新首页的实际消耗量
            this.updateHomeActualConsumption()
          } catch (e) {
            console.error('删除食物记录失败', e)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },
  
  // 更新首页的理论消耗量
  updateHomeTheoreticalConsumption: function() {
    try {
      // 这个方法不再需要计算实际消耗，
      // 但为了保持向后兼容性，我们保留此方法
      // 方法的调用在保存和删除食物记录时不变
      
      console.log('食物记录已更新');
      
      // 更新首页的实际消耗量
      this.updateHomeActualConsumption();
      
    } catch (e) {
      console.error('更新首页消耗数据失败', e);
    }
  },
  
  // 更新首页的实际消耗量
  updateHomeActualConsumption: function() {
    try {
      const today = this.getCurrentDateString();
      
      // 获取运动消耗
      const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
      const todayExercises = exerciseRecords[today] || [];
      let exerciseCalories = 0;
      
      todayExercises.forEach(record => {
        exerciseCalories += record.caloriesBurned || 0;
      });
      
      // 获取食物摄入
      const foodRecords = wx.getStorageSync('foodRecords') || {};
      const todayFoods = foodRecords[today] || [];
      let foodCalories = 0;
      
      todayFoods.forEach(record => {
        foodCalories += record.totalCalories || 0;
      });
      
      // 实际消耗 = 运动消耗 - 食物摄入 (不能为负值)
      const actualConsumption = Math.max(0, exerciseCalories - foodCalories);
      
      // 更新消耗记录
      let consumptionRecords = wx.getStorageSync('consumptionRecords') || {};
      
      if (!consumptionRecords[today]) {
        // 获取目标消耗值
        let targetConsumption = 0;
        
        // 从多个存储位置获取目标消耗值
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
      
      // 保存更新后的记录
      wx.setStorageSync('consumptionRecords', consumptionRecords);
      
      console.log('实际消耗已更新:', actualConsumption);
    } catch (e) {
      console.error('更新首页实际消耗数据失败', e);
    }
  },
  
  // 获取当前日期字符串
  getCurrentDateString: function() {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}) 
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

  onLoad: function () {
    this.loadFoodRecords()
  },

  onShow: function () {
    this.loadFoodRecords()
  },

  // 加载食物记录
  loadFoodRecords: function () {
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
        // 确保每个记录的卡路里值至少为1
        totalCalories += Math.max(1, record.totalCalories || 0)
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
  showAddFood: function () {
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
  hideAddFood: function () {
    this.setData({
      showAddDialog: false
    })
  },

  // 显示/隐藏常见食物列表
  toggleCommonFoods: function () {
    this.setData({
      showCommonFoods: !this.data.showCommonFoods
    })
  },

  // 转换千焦为千卡
  convertToKcal: function () {
    const kj = parseFloat(this.data.calories);
    if (isNaN(kj) || kj <= 0) {
      wx.showToast({
        title: '请先输入有效的千焦值',
        icon: 'none'
      });
      return;
    }

    // 转换公式：1千卡 = 4.184千焦
    const kcal = Math.round(kj / 4.184);
    // 确保千卡值至少为1
    const finalKcal = Math.max(1, kcal);

    this.setData({
      kcalValue: finalKcal,
      showKcalValue: true
    });
  },

  // 选择常见食物
  selectCommonFood: function (e) {
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
  onFoodNameInput: function (e) {
    this.setData({
      foodName: e.detail.value
    })
  },

  // 输入千卡
  onCaloriesInput: function (e) {
    this.setData({
      calories: e.detail.value
    })
    this.calculateTotalCalories()
  },

  // 输入数量
  onQuantityInput: function (e) {
    this.setData({
      quantity: e.detail.value
    })
    this.calculateTotalCalories()
  },

  // 选择单位
  onUnitChange: function (e) {
    this.setData({
      unit: e.detail.value
    })
  },

  // 计算总千卡
  calculateTotalCalories: function () {
    const calories = parseFloat(this.data.calories)
    const quantity = parseFloat(this.data.quantity)

    if (!isNaN(calories) && !isNaN(quantity)) {
      // 确保结果至少为1
      return Math.max(1, calories * quantity)
    }
    return 0
  },

  // 保存食物记录
  saveFood: function () {
    console.log('=== saveFood 开始执行 ===');
    console.log('输入数据 - 食物名称:', this.data.foodName, '千焦:', this.data.calories, '数量:', this.data.quantity, '单位:', this.data.unit);

    // 验证输入
    if (!this.data.foodName) {
      console.log('验证失败: 食物名称为空');
      wx.showToast({
        title: '请输入食物名称',
        icon: 'none'
      })
      return
    }

    if (!this.data.calories) {
      console.log('验证失败: 千焦值为空');
      wx.showToast({
        title: '请输入千焦值',
        icon: 'none'
      })
      return
    }

    const kj = parseFloat(this.data.calories)
    if (isNaN(kj) || kj <= 0) {
      console.log('验证失败: 千焦值无效', kj);
      wx.showToast({
        title: '请输入有效的千焦值',
        icon: 'none'
      })
      return
    }

    const quantity = parseFloat(this.data.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      console.log('验证失败: 数量无效', quantity);
      wx.showToast({
        title: '请输入有效的数量',
        icon: 'none'
      })
      return
    }

    try {
      const today = this.getCurrentDateString()
      const time = new Date().toTimeString().substr(0, 5) // 获取HH:MM格式的时间
      console.log('当前日期:', today, '时间:', time);

      // 确保转换千焦为千卡
      const kcal = Math.round(kj / 4.184);
      // 确保千卡值至少为1
      const finalKcal = Math.max(1, kcal);
      const totalKcal = Math.max(1, Math.round(finalKcal * quantity));

      console.log('卡路里计算 - 千焦:', kj, '千卡:', kcal, '最终千卡:', finalKcal, '总千卡:', totalKcal);

      // 新食物记录
      const newRecord = {
        id: Date.now().toString(), // 使用时间戳作为唯一ID
        name: this.data.foodName,
        calories: finalKcal, // 存储千卡值
        kj: kj, // 存储原始千焦值
        quantity: quantity,
        unit: this.data.unit,
        totalCalories: totalKcal, // 以千卡为单位
        time: time
      }
      console.log('创建新记录:', newRecord);

      // 获取现有记录
      let foodRecords = wx.getStorageSync('foodRecords') || {}
      console.log('现有食物记录:', Object.keys(foodRecords));

      // 确保今日记录存在
      if (!foodRecords[today]) {
        foodRecords[today] = []
      }
      console.log('今日记录数量:', foodRecords[today].length);

      // 添加新记录
      foodRecords[today].push(newRecord)
      console.log('添加后记录数量:', foodRecords[today].length);

      // 计算今日总千卡
      let todayTotalCalories = 0
      foodRecords[today].forEach(record => {
        todayTotalCalories += Math.max(1, record.totalCalories || 0)
      })
      console.log('今日总千卡计算:', todayTotalCalories);

      // 保存到存储
      wx.setStorageSync('foodRecords', foodRecords)
      console.log('食物记录已保存到本地存储');

      // 更新视图数据
      this.setData({
        foodRecords: foodRecords[today],
        todayTotalCalories: todayTotalCalories,
        showAddDialog: false
      })
      console.log('页面数据已更新');

      wx.showToast({
        title: '记录已保存',
        icon: 'success'
      })

      // 更新首页的理论消耗量
      this.updateHomeTheoreticalConsumption()
      console.log('首页理论消耗已更新');
      console.log('=== saveFood 执行完成 ===');
    } catch (e) {
      console.error('保存食物记录失败', e)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 删除食物记录
  deleteFood: function (e) {
    console.log('=== deleteFood 开始执行 ===');
    const index = e.currentTarget.dataset.index
    console.log('删除记录索引:', index);
    const recordToDelete = this.data.foodRecords[index];
    console.log('要删除的记录:', recordToDelete);

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条食物记录吗？',
      success: res => {
        if (res.confirm) {
          console.log('用户确认删除');
          try {
            const today = this.getCurrentDateString()
            console.log('当前日期:', today);

            // 获取现有记录
            let foodRecords = wx.getStorageSync('foodRecords') || {}
            console.log('现有食物记录:', Object.keys(foodRecords));

            // 确保今日记录存在
            if (!foodRecords[today]) {
              foodRecords[today] = []
            }
            console.log('删除前记录数量:', foodRecords[today].length);

            // 删除记录
            foodRecords[today].splice(index, 1)
            console.log('删除后记录数量:', foodRecords[today].length);

            // 计算新的总千卡
            let totalCalories = 0
            foodRecords[today].forEach(record => {
              totalCalories += record.totalCalories || 0
            })
            console.log('新的总千卡计算:', totalCalories);

            // 保存到存储
            wx.setStorageSync('foodRecords', foodRecords)
            console.log('食物记录已保存到本地存储');

            // 更新视图数据
            this.setData({
              foodRecords: foodRecords[today],
              todayTotalCalories: totalCalories
            })
            console.log('页面数据已更新');

            wx.showToast({
              title: '记录已删除',
              icon: 'success'
            })

            // 更新首页的实际消耗量
            this.updateHomeActualConsumption()
            console.log('首页实际消耗已更新');
            console.log('=== deleteFood 执行完成 ===');
          } catch (e) {
            console.error('删除食物记录失败', e)
            console.log('=== deleteFood 执行出错 ===');
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        } else {
          console.log('用户取消删除');
        }
      }
    })
    console.log('=== deleteFood 执行完成（用户取消） ===');
  },

  // 更新首页的理论消耗量
  updateHomeTheoreticalConsumption: function () {
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
  updateHomeActualConsumption: function () {
    console.log('=== food.js updateHomeActualConsumption 开始执行 ===');
    try {
      const today = this.getCurrentDateString();
      console.log('当前日期:', today);

      // 获取运动消耗
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

      // 获取食物摄入
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

      // 实际消耗 = 运动消耗 - 食物摄入 (不能为负值)
      const actualConsumption = Math.max(0, exerciseCalories - foodCalories);
      console.log('实际消耗计算:', exerciseCalories, '-', foodCalories, '=', actualConsumption);

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
      console.log('=== food.js updateHomeActualConsumption 执行完成 ===');
    } catch (e) {
      console.error('更新首页实际消耗数据失败', e);
      console.log('=== food.js updateHomeActualConsumption 执行出错 ===');
    }
  },

  // 获取当前日期字符串
  getCurrentDateString: function () {
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
})
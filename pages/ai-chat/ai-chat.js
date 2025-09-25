const app = getApp();
const dataSync = require('../../utils/dataSync');

Page({
  data: {
    showRoleSelection: true,
    selectedRole: null,
    roles: [
      {
        id: 'professional',
        name: '腹黑教练',
        description: '专业腹黑，科学甩肉',
        avatar: '/images/总裁.jpg'
      },
      {
        id: 'energetic',
        name: '性感御姐',
        description: '活力御姐，陪你变美',
        avatar: '/images/御姐.jpg'
      },
      {
        id: 'gentle',
        name: '阳光男大',
        description: '温和男大，管饭瘦快',
        avatar: '/images/男大.jpg'
      },
      {
        id: 'strict',
        name: '甜美萝莉',
        description: '温柔萝莉，轻松享瘦',
        avatar: '/images/懵懂萝莉.png'
      }
    ],
    messages: [
      {
        type: 'ai',
        content: '您好！我是AI健身助手，可以为您提供专业的健身建议和营养指导。请问有什么可以帮助您的？',
        loading: false
      }
    ],
    inputValue: '',
    isSending: false,
    scrollIntoView: '',

    showVoiceTip: true,
    keyboardHeight: 0,
    focusInput: false
  },

  onLoad(options) {
    const tabBarManager = require('../../utils/tabBarManager');
    tabBarManager.initTabBarForPage(2);
    this.loadChatHistory();
    this.keyboardHeight = 0;
    this.lastKeyboardHeight = 0;
    this.setData({
      showQuickQuestions: false
    });
    wx.onKeyboardHeightChange(res => {
      const newHeight = res.height;
      if (Math.abs(newHeight - this.lastKeyboardHeight) > 10) {
        this.lastKeyboardHeight = newHeight;
        this.setData({
          keyboardHeight: newHeight
        });
        this.scrollToBottom();
      }
    });
  },

  onReady() {
    this.scrollToBottom();
  },

  onShow() {
    const tabBarManager = require('../../utils/tabBarManager');
    tabBarManager.setSelectedTab(2);
  },

  onUnload() {
    wx.offKeyboardHeightChange();
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
  },

  preventTap() {
  },

  selectRole(e) {
    const roleId = e.currentTarget.dataset.roleId;
    const selectedRole = this.data.roles.find(role => role.id === roleId);

    this.setData({
      selectedRole: selectedRole,
      showRoleSelection: false
    });

    const roleMessages = {
      'professional': '宝子，别想着偷懒哦～你那点小心思，我可是门儿清！但咱专业这块儿绝对没毛病，科学健身方案给你安排得明明白白，主打一个 “套路” 与 “专业” 并存，带你高效甩肉，毕竟 “瘦下来的人生，开挂都更顺溜”～',
      'energetic': '家人们谁懂啊！跟着姐练，不仅能瘦，还能收获满满动力！咱就是说，减肥路上姐陪你，主打一个年轻有活力，“练完这组，你就是街上最靓的崽”，冲就完事了～',
      'gentle': '宝子，别焦虑，减肥也能很快乐！咱主打一个温和细致，饮食营养这块儿给你整得明明白白，“好好吃饭 + 好好运动，健康变美不是梦”，有啥问题尽管问，我妥妥给你安排到位～',
      'strict': '喂！减肥可不能马虎，纪律必须严起来！别看我这样，“该掉的秤一斤不能少，该守的规矩一点不能破”，跟着我，咱踏踏实实地瘦，结果绝对让你满意～'
    };

    const initialMessage = roleMessages[roleId] || '您好！我是AI健身助手，可以为您提供专业的健身建议和营养指导。请问有什么可以帮助您的？';

    this.setData({
      messages: [
        {
          type: 'ai',
          content: initialMessage,
          loading: false
        }
      ]
    });
  },

  reselectRole() {
    this.setData({
      showRoleSelection: true,
      selectedRole: null
    });
  },

  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  sendMessage() {
    const message = this.data.inputValue.trim();
    if (!message || this.data.isSending) return;
    const userMessage = {
      type: 'user',
      content: message,
      loading: false
    };

    const messages = [...this.data.messages, userMessage];
    this.setData({
      messages: messages,
      inputValue: '',
      isSending: true,
      showVoiceTip: false,
      focusInput: true
    });

    this.scrollToBottom();
    this.callAIResponse(message);
  },



  async callAIResponse(userMessage) {
    try {
      const loadingMessage = {
        type: 'ai',
        content: '',
        loading: true
      };

      const messages = [...this.data.messages, loadingMessage];
      this.setData({
        messages: messages
      });

      this.scrollToBottom();

      const userRecords = dataSync.getTodayCompleteData();

      const weightRecords = wx.getStorageSync('weightRecordsArray') || [];
      const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
      const foodRecords = wx.getStorageSync('foodRecords') || {};

      const today = dataSync.getCurrentDateString();

      console.log('正在调用云托管服务:', {
        path: '/api/chat/process',
        method: 'POST',
        data: {
          userId: app.globalData.userId || 'test-user-id',
          message: userMessage,
          userRecords: {
            today: userRecords,
            weightHistory: weightRecords,
            exerciseHistory: exerciseRecords,
            foodHistory: foodRecords,
            currentDate: today
          },
          aiRole: this.data.selectedRole?.id || 'professional'  
        }
      });

      const envId = app.globalData.envId || 'prod-1g6skl837a850b7f';

      const response = await wx.cloud.callContainer({
        config: {
          env: envId
        },
        path: '/api/chat/process',
        method: 'POST',
        header: {
          'X-WX-SERVICE': 'ai-chat-service',
          'content-type': 'application/json; charset=utf-8'
        },
        data: {
          userId: app.globalData.userId || 'test-user-id',
          message: userMessage,
          userRecords: {
            today: userRecords,
            weightHistory: weightRecords,
            exerciseHistory: exerciseRecords,
            foodHistory: foodRecords,
            currentDate: today
          },
          aiRole: this.data.selectedRole?.id || 'professional'  
        }
      });

      console.log('云托管服务响应:', response);
      const currentMessages = this.data.messages.slice(0, -1);

      if (response.data.success) {
        let aiResponse = response.data.message || '抱歉，我没有理解您的意思。';

        if (response.data.healthAdvice && response.data.healthAdvice.length > 0) {
          aiResponse += '\n\n健康建议:\n';
          response.data.healthAdvice.forEach(advice => {
            aiResponse += `\n- ${advice}`;
          });
        }

        if (response.data.extractedData) {
          const data = response.data.extractedData;
          if (data.exercise && data.exercise.type) {
            aiResponse += `\n\n运动记录:\n类型: ${data.exercise.type}\n时长: ${data.exercise.duration}分钟`;
            if (data.exercise.intensity) {
              aiResponse += `\n强度: ${data.exercise.intensity}`;
            }

            this.saveExerciseDataToMain(data.exercise);
          }
          if (data.food && data.food.name) {
            const quantity = data.food.quantity || 1;
            const unit = data.food.unit || '个';
            aiResponse += `\n\n饮食记录:\n食物: ${data.food.name}\n量词: ${quantity}${unit}`;

            if (data.food.meal_time) {
              aiResponse += `\n用餐时间: ${data.food.meal_time}`;
            }

            this.saveFoodDataToMain(data.food);
          }
        }

        const aiMessage = {
          type: 'ai',
          content: aiResponse,
          loading: false
        };

        const updatedMessages = [...currentMessages, aiMessage];
        this.setData({
          messages: updatedMessages,
          isSending: false
        });
      } else {
        const errorMessage = {
          type: 'ai',
          content: `抱歉，处理您的请求时出现错误：${response.data.message || '未知错误'}`,
          loading: false
        };

        const updatedMessages = [...currentMessages, errorMessage];
        this.setData({
          messages: updatedMessages,
          isSending: false
        });
      }
    } catch (error) {
      const currentMessages = this.data.messages.slice(0, -1);
      let errorMessageContent = '抱歉，网络连接出现问题，请检查您的网络设置后重试。';

      if (error.errMsg && error.errMsg.includes('Service is not activated')) {
        errorMessageContent = 'AI服务正在部署中，请稍后再试。如果问题持续存在，请联系客服。';
      } else if (error.errMsg) {
        errorMessageContent = `请求失败: ${error.errMsg}`;
      } else if (error.message) {
        errorMessageContent = `请求失败: ${error.message}`;
      }

      const errorMessage = {
        type: 'ai',
        content: errorMessageContent,
        loading: false
      };

      const updatedMessages = [...currentMessages, errorMessage];
      this.setData({
        messages: updatedMessages,
        isSending: false
      });
    }

    this.scrollToBottom();
    this.saveChatHistory();
  },

  saveExerciseDataToMain(exerciseData) {
    try {
      const exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
      const today = dataSync.getCurrentDateString();
      const currentTime = new Date().toISOString();
      const timestamp = Date.now();

      if (!exerciseRecords[today]) {
        exerciseRecords[today] = [];
      }

      // 根据前端传递的信息进行回显，不设置默认值
      let caloriesBurned = exerciseData.calories_burned;
      if (caloriesBurned === undefined && exerciseData.duration) {
        // 只有在没有卡路里数据时才进行估算
        const duration = parseInt(exerciseData.duration);
        const exerciseType = exerciseData.type || '其他运动';
        
        // 简单的卡路里估算（每分钟消耗）
        const caloriesPerMinute = {
          '游泳': 8,
          '跑步': 10,
          '快走': 5,
          '慢跑': 8,
          '力量训练': 6,
          '瑜伽': 3,
          '其他运动': 5
        };
        
        caloriesBurned = Math.round(duration * (caloriesPerMinute[exerciseType] || 5));
      }

      const exerciseRecord = {
        name: exerciseData.type,
        type: exerciseData.type,
        duration: exerciseData.duration,
        minutes: exerciseData.duration,

        calories_burned: caloriesBurned,
        caloriesBurned: caloriesBurned, // 兼容两种字段名
        date: currentTime,
        timestamp: timestamp,
        // 添加更多字段确保兼容性
        id: `exercise_${timestamp}`,
        created_at: currentTime,
        updated_at: currentTime
      };

      exerciseRecords[today].push(exerciseRecord);

      wx.setStorageSync('exerciseRecords', exerciseRecords);
      console.log('运动记录已保存到主页:', exerciseRecord);
      
      // 增强数据更新通知机制
      this.enhancedNotifyDataUpdate('exercise');
    } catch (e) {
      console.error('保存运动记录到主页失败:', e);
    }
  },

  saveFoodDataToMain(foodData) {
    try {
      const foodRecords = wx.getStorageSync('foodRecords') || {};
      const today = dataSync.getCurrentDateString();
      const currentTime = new Date().toISOString();
      const timestamp = Date.now();

      if (!foodRecords[today]) {
        foodRecords[today] = [];
      }

      // 根据前端传递的信息进行回显，不设置默认值
      const weight = foodData.weight || foodData.quantity;
      let calories = foodData.calories;
      const unit = foodData.unit;

      // 只有在没有卡路里数据时才进行估算
      if (calories === undefined && weight) {
        const foodName = foodData.name || '未知食物';
        const foodCalories = this.estimateFoodCalories(foodName, weight);
        calories = foodCalories;
      }

      const foodRecord = {
        name: foodData.name,
        weight: weight,
        unit: unit,
        calories: calories,
        meal_time: foodData.meal_time,
        date: currentTime,
        timestamp: timestamp,
        // 添加更多字段确保兼容性
        id: `food_${timestamp}`,
        created_at: currentTime,
        updated_at: currentTime
      };

      foodRecords[today].push(foodRecord);

      wx.setStorageSync('foodRecords', foodRecords);
      console.log('饮食记录已保存到主页:', foodRecord);
      
      // 增强数据更新通知机制
      this.enhancedNotifyDataUpdate('food');
    } catch (e) {
      console.error('保存饮食记录到主页失败:', e);
    }
  },

  // 新增：估算食物卡路里的方法
  estimateFoodCalories(foodName, weight) {
    const foodNameLower = foodName.toLowerCase();
    const weightInGrams = parseFloat(weight) || 100;
    
    // 常见食物的卡路里密度（每100克的卡路里）
    const calorieDensity = {
      '苹果': 52,
      '香蕉': 89,
      '橙子': 47,
      '葡萄': 62,
      '草莓': 32,
      '蓝莓': 57,
      '西瓜': 30,
      '米饭': 116,
      '面条': 131,
      '面包': 265,
      '鸡蛋': 155,
      '鸡肉': 165,
      '牛肉': 250,
      '鱼肉': 100,
      '牛奶': 42,
      '酸奶': 59,
      '奶酪': 402,
      '坚果': 607,
      '巧克力': 545
    };
    
    // 查找匹配的食物
    for (const [food, density] of Object.entries(calorieDensity)) {
      if (foodNameLower.includes(food.toLowerCase())) {
        return Math.round((density * weightInGrams) / 100);
      }
    }
    
    // 如果没有找到匹配的食物，使用默认值
    return Math.round(weightInGrams * 0.5); // 默认每克0.5卡路里
  },

  // 增强：通知数据更新方法
  enhancedNotifyDataUpdate(dataType) {
    try {
      // 设置数据更新标志
      const updateTime = new Date().getTime();
      wx.setStorageSync('dataUpdated', updateTime);
      
      // 设置特定类型的数据更新标志
      wx.setStorageSync(`${dataType}DataUpdated`, updateTime);
      
      // 设置全局刷新标志
      wx.setStorageSync('globalDataRefresh', updateTime);
      
      // 延迟通知，确保数据已完全保存
      setTimeout(() => {
        this.notifyPagesToRefresh(dataType);
      }, 200);
      
      // 显示成功提示
      wx.showToast({
        title: `${dataType === 'exercise' ? '运动' : '饮食'}记录已保存并同步到主页`,
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      console.error('增强数据更新通知失败:', e);
    }
  },

  // 新增：通知页面刷新方法
  notifyPagesToRefresh(dataType) {
    try {
      // 通知所有页面刷新数据
      const pages = getCurrentPages();
      console.log(`通知页面刷新${dataType}数据，当前页面栈:`, pages.map(p => p.route));
      
      pages.forEach((page, index) => {
        if (page && page.route === 'pages/index/index' && typeof page.refreshData === 'function') {
          console.log(`通知首页刷新${dataType}数据`);
          
          // 设置页面刷新标志
          page.setData({
            needRefresh: true
          });
          
          // 调用刷新方法
          page.refreshData();
          
          // 特别调用加载运动/饮食记录的方法
          if (typeof page.loadTodayExerciseAndFoodData === 'function') {
            console.log('调用首页的loadTodayExerciseAndFoodData方法');
            page.loadTodayExerciseAndFoodData();
          }
        }
      });
      
      // 如果当前没有首页在页面栈中，设置全局刷新标志
      const hasIndexPage = pages.some(page => page.route === 'pages/index/index');
      if (!hasIndexPage) {
        console.log('首页不在页面栈中，设置全局刷新标志');
        wx.setStorageSync('needRefreshIndex', true);
      }
      
      // 设置数据同步状态
      this.updateDataSyncStatus(dataType);
      
    } catch (e) {
      console.error('通知页面刷新失败:', e);
    }
  },

  // 新增：更新数据同步状态
  updateDataSyncStatus(dataType) {
    try {
      const today = dataSync.getCurrentDateString();
      const currentTime = new Date().getTime();
      
      // 更新数据同步状态
      const syncStatus = {
        lastUpdate: currentTime,
        lastDataType: dataType,
        lastUpdateDate: today,
        dataUpdated: true
      };
      
      wx.setStorageSync('dataSyncStatus', syncStatus);
      console.log('数据同步状态已更新:', syncStatus);
      
    } catch (e) {
      console.error('更新数据同步状态失败:', e);
    }
  },

  clearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            showRoleSelection: true,
            selectedRole: null,
            messages: [{
              type: 'ai',
              content: '您好！我是AI健身助手，可以为您提供专业的健身建议和营养指导。请问有什么可以帮助您的？',
              loading: false
            }],
            showQuickQuestions: true,
            showVoiceTip: true,
            inputValue: ''
          });
          wx.removeStorageSync('chat_history');
        }
      }
    });
  },

  scrollToBottom() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      this.setData({
        scrollIntoView: `msg-${this.data.messages.length - 1}`
      });
    }, 300);
  },

  saveChatHistory() {
    try {
      wx.setStorageSync('chat_history', this.data.messages);
    } catch (e) {
      console.error('保存聊天记录失败:', e);
    }
  },

  loadChatHistory() {
    try {
      const history = wx.getStorageSync('chat_history');
      if (history && history.length > 0) {
        this.setData({
          messages: history,
          showVoiceTip: false
        });
      }
    } catch (e) {
      console.error('加载聊天记录失败:', e);
    }
  },

  onShareAppMessage() {
    return {
      title: 'AI健身助手 - 您的私人健身教练',
      path: '/pages/ai-chat/ai-chat'
    };
  }
})

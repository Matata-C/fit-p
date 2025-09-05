const app = getApp();
const dataSync = require('../../utils/dataSync');

Page({
  data: {
    showRoleSelection: true,
    selectedRole: null,
    roles: [
      {
        id: 'professional',
        name: '专业健身教练',
        description: '专业严谨，提供科学的健身建议',
        avatar: '/images/柯基.png'
      },
      {
        id: 'energetic',
        name: '活力健身伙伴',
        description: '年轻活泼，充满鼓励',
        avatar: '/images/橘猫.png'
      },
      {
        id: 'gentle',
        name: '温和营养师',
        description: '温和细致，注重饮食营养',
        avatar: '/images/田园犬.png'
      },
      {
        id: 'strict',
        name: '严厉教练',
        description: '严格直接，强调纪律',
        avatar: '/images/柯基.png'
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
      'professional': '您好！我是您的专业健身教练，我会为您提供科学严谨的健身建议和营养指导。请问有什么可以帮助您的？',
      'energetic': '嗨！我是您的活力健身伙伴，我们一起快乐地运动吧！有什么我可以帮您的吗？',
      'gentle': '您好！我是您的温和营养师，我会细致地为您分析饮食营养搭配。请问您想了解什么？',
      'strict': '您好！我是您的严厉教练，我会严格要求您的训练计划。请直接告诉我您的需求！'
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

      if (!exerciseRecords[today]) {
        exerciseRecords[today] = [];
      }

      exerciseRecords[today].push({
        name: exerciseData.type,
        type: exerciseData.type,
        duration: exerciseData.duration,
        minutes: exerciseData.duration,
        calories_burned: exerciseData.calories_burned || 0,
        date: new Date().toISOString()
      });

      wx.setStorageSync('exerciseRecords', exerciseRecords);
      console.log('运动记录已保存到主页');
    } catch (e) {
      console.error('保存运动记录到主页失败:', e);
    }
  },

  saveFoodDataToMain(foodData) {
    try {
      const foodRecords = wx.getStorageSync('foodRecords') || {};
      const today = dataSync.getCurrentDateString();

      if (!foodRecords[today]) {
        foodRecords[today] = [];
      }

      const weight = foodData.weight || foodData.quantity || 100;
      const calories = Math.max(1, foodData.calories || 0);
      const unit = foodData.unit || '克';

      foodRecords[today].push({
        name: foodData.name,
        weight: weight,
        unit: unit,
        calories: calories,
        meal_time: foodData.meal_time || '未指定',
        date: new Date().toISOString()
      });

      wx.setStorageSync('foodRecords', foodRecords);
      console.log('饮食记录已保存到主页');
    } catch (e) {
      console.error('保存饮食记录到主页失败:', e);
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

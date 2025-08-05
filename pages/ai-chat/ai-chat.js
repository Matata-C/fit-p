const app = getApp();
const dataSync = require('../../utils/dataSync');

Page({
  data: {
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
          }
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
          }
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
            if (data.exercise.calories_burned != null) {
              aiResponse += `\n消耗卡路里: ${data.exercise.calories_burned}`;
            }
            if (data.exercise.intensity) {
              aiResponse += `\n强度: ${data.exercise.intensity}`;
            }
          }
          if (data.food && data.food.name) {
            if (data.food.quantity && data.food.unit) {
              aiResponse += `\n\n饮食记录:\n食物: ${data.food.name}\n量词: ${data.food.quantity}${data.food.unit}`;
            } else {
              aiResponse += `\n\n饮食记录:\n食物: ${data.food.name}\n重量: ${data.food.weight}克`;
            }
            if (data.food.calories != null) {
              aiResponse += `\n卡路里: ${data.food.calories}`;
            }
            if (data.food.protein != null) {
              aiResponse += `\n蛋白质: ${data.food.protein}克`;
            }
            if (data.food.carbs != null) {
              aiResponse += `\n碳水化合物: ${data.food.carbs}克`;
            }
            if (data.food.fat != null) {
              aiResponse += `\n脂肪: ${data.food.fat}克`;
            }
            if (data.food.meal_time) {
              aiResponse += `\n用餐时间: ${data.food.meal_time}`;
            }
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

      // 针对云托管服务未激活的错误提供具体指导
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

  clearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            messages: [{
              type: 'ai',
              content: '您好！我是您的AI健身助手，可以为您提供专业的健身建议和营养指导。请问有什么可以帮助您的？',
              loading: false
            }],
            showQuickQuestions: true,
            showVoiceTip: true
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

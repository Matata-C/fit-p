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
    showQuickQuestions: true,
    quickQuestions: [
      '如何制定健身计划？',
      '减脂期间吃什么？',
      '增肌训练方案',
      '运动前后吃什么？',
      '如何计算卡路里？',
      '健身新手建议'
    ],
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
      showQuickQuestions: true
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
    setTimeout(() => {
      this.simulateAIResponse(message);
    }, 1000);
  },

  sendQuickQuestion(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({
      inputValue: question
    });
    this.sendMessage();
  },

  simulateAIResponse(userMessage) {
    let response = '';
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('计划') || lowerMessage.includes('方案')) {
      response = `根据您的需求，我为您制定以下健身计划：

📅 每周训练安排
周一：胸部 + 三头肌
周二：背部 + 二头肌
周三：腿部
周四：肩部
周五：有氧运动
周六：核心训练
周日：休息

💪 训练建议
- 每个部位3-4个动作
- 每个动作3-4组
- 每组8-12次
- 组间休息60-90秒

请告诉我您的具体目标（增肌/减脂/塑形），我可以为您定制更详细的计划！`;
    } else if (lowerMessage.includes('减脂') || lowerMessage.includes('减肥')) {
      response = `减脂期间的营养建议：

🥗 饮食原则
- 控制总热量摄入（每日减少300-500大卡）
- 蛋白质：每公斤体重1.6-2.2g
- 碳水化合物：适量减少精制碳水
- 健康脂肪：占总热量的20-30%

🍽️ 推荐食物
- 蛋白质：鸡胸肉、鱼、蛋、豆腐
- 碳水：燕麦、糙米、红薯、藜麦
- 脂肪：牛油果、坚果、橄榄油
- 蔬菜：西兰花、菠菜、胡萝卜

⚡ 小贴士
多喝水、保证睡眠、避免过度节食！`;
    } else if (lowerMessage.includes('增肌') || lowerMessage.includes('肌肉')) {
      response = `增肌训练方案：

🏋️ 训练原则
- 渐进超负荷：逐步增加重量
- 大重量低次数：4-6RM
- 充分休息：每个肌群休息48-72小时
- 复合动作优先：深蹲、硬拉、卧推

📊 每周计划
周一：胸 + 三头
周二：背 + 二头
周三：腿
周四：肩 + 腹
周五：全身复合动作
周六周日：休息

💊 营养补充
- 蛋白质：每公斤体重2-2.2g
- 训练前：碳水和蛋白质
- 训练后：乳清蛋白 + 香蕉
- 肌酸：每日5g

记住：增肌需要时间和耐心！`;
    } else if (lowerMessage.includes('新手')) {
      response = `健身新手建议：

🎯 入门指南
1. 从基础动作开始：深蹲、俯卧撑、平板支撑
2. 先掌握正确姿势，再增加重量
3. 每周3-4次训练，给身体适应时间
4. 记录训练日志，追踪进步

⚠️ 注意事项
- 热身10-15分钟
- 不要急于求成
- 感受目标肌群发力
- 保持充足睡眠

📈 新手计划
第1-2周：适应期（轻重量，高次数）
第3-4周：提升期（适当增加重量）
第5-8周：强化期（标准训练计划）

建议先找专业教练指导动作！`;
    } else {
      response = `感谢您的提问！作为您的AI健身助手，我可以为您提供：

✅ 专业建议
- 个性化健身计划制定
- 营养饮食指导
- 运动技巧纠正
- 进度追踪建议

🤔 您可以问我
- "如何制定健身计划？"
- "减脂期间吃什么？"
- "增肌训练方案"
- "健身新手建议"

请告诉我您的具体需求，我会为您提供最适合的建议！`;
    }

    const aiMessage = {
      type: 'ai',
      content: response,
      loading: false
    };

    const updatedMessages = [...this.data.messages, aiMessage];
    this.setData({
      messages: updatedMessages,
      isSending: false
    });

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
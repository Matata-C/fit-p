const tabBarManager = require('../../utils/tabBarManager');
const weightUtil = require('../../utils/weightUtil');
const dataSync = require('../../utils/dataSync');

const calculateWeightAchievement = () => {
  try {
    const records = weightUtil.getWeightRecords();
    if (records.length < 7) return false;

    records.sort((a, b) => new Date(a.date) - new Date(b.date));

    const today = new Date();
    let consecutiveDays = 0;

    for (let i = 0; i < Math.min(7, records.length); i++) {
      const recordDate = new Date(records[i].date);
      const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

      if (diffDays === i) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays >= 7;
  } catch (e) {
    console.error('计算体重成就失败', e);
    return false;
  }
};

const calculateDietAchievement = () => {
  try {
    const foodRecords = wx.getStorageSync('foodRecords') || {};
    const dates = Object.keys(foodRecords).sort((a, b) => new Date(b) - new Date(a));

    if (dates.length < 7) return false;

    const today = new Date();
    let consecutiveDays = 0;

    for (let i = 0; i < Math.min(7, dates.length); i++) {
      const recordDate = new Date(dates[i]);
      const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));

      if (diffDays === i && foodRecords[dates[i]].length > 0) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays >= 7;
  } catch (e) {
    console.error('计算饮食成就失败', e);
    return false;
  }
};

const calculateStepAchievement = () => {
  try {
    const stepCount = wx.getStorageSync('stepCount') || 0;
    return stepCount >= 10000;
  } catch (e) {
    console.error('计算步数成就失败', e);
    return false;
  }
};

Page({
  data: {
    achievements: [
      {
        id: 1,
        name: "减肥达人",
        type: "连续记录",
        condition: "连续7天记录体重",
        reward: "+50成就点",
        points: 50,
        unlocked: false,
        taskType: "weight"
      },
      {
        id: 2,
        name: "饮食自律",
        type: "健康饮食",
        condition: "连续7天饮食打卡",
        reward: "+40成就点",
        points: 40,
        unlocked: false,
        taskType: "diet"
      },
      {
        id: 3,
        name: "步数达人",
        type: "运动目标",
        condition: "达到今日步数目标10000步",
        reward: "+30成就点",
        points: 30,
        unlocked: false,
        taskType: "step"
      }
    ],
    totalPoints: 0,
    leaderboard: [
      { id: 1, name: "用户A", score: 120 },
      { id: 2, name: "用户B", score: 90 },
      { id: 3, name: "用户C", score: 70 }
    ],
    voiceTexts: [
      '你很棒，坚持就是胜利！再接再厉，目标就在前方！',
      '每一次努力，都是在为梦想添砖加瓦！',
      '别放弃，你离成功只差一步！',
      '健康的身体是最好的礼物，加油！',
      '相信自己，你一定可以做到！',
      '再小的进步也是进步，继续加油！',
      '每一天的坚持都值得被肯定！',
      '你已经很棒了，别忘了为自己鼓掌！',
      '胜利属于坚持到最后的人！',
      '你的努力终将被看到！'
    ],
    likedVoiceTexts: [],
    tab: 'all',
    voiceText: '你很棒，坚持就是胜利！再接再厉，目标就在前方！',
    voiceTextAnim: '',
    isPlaying: false,
    swiperIndex: 0,
    addInput: '',
    autoPlay: false,
    autoPlayTimer: null,
  },

  onLoad() {
    tabBarManager.initTabBarForPage(3);

    this.calculateAchievements();

    // 从全局数据加载总成就点数
    const app = getApp();
    this.setData({
      totalPoints: app.globalData.totalAchievementPoints || 0
    });

    console.log('[DEBUG] 成就页面初始化完成');
    console.log('当前数据:', this.data);
  },
  calculateAchievements() {
    const achievements = [...this.data.achievements];

    achievements[0].unlocked = calculateWeightAchievement();
    achievements[1].unlocked = calculateDietAchievement();
    achievements[2].unlocked = calculateStepAchievement();

    this.setData({ achievements });
  },

  calculateTotalPoints() {
    // 从全局数据获取总成就点数
    const app = getApp();
    const totalPoints = app.globalData.totalAchievementPoints || 0;
    this.setData({ totalPoints });
  },

  // 检查成就状态变化
  checkAchievementChanges() {
    // 重新计算成就状态
    const achievements = [...this.data.achievements];
    const app = getApp();

    // 使用持久化的解锁状态来设置当前成就状态
    achievements.forEach(item => {
      item.unlocked = app.isAchievementUnlocked(item.id);
    });

    // 计算最新的成就状态
    achievements[0].unlocked = calculateWeightAchievement();
    achievements[1].unlocked = calculateDietAchievement();
    achievements[2].unlocked = calculateStepAchievement();

    this.setData({ achievements });

    // 检查是否有新解锁的成就
    let newPoints = 0;
    achievements.forEach(current => {
      // 如果成就现在是解锁的，但之前没有被标记为解锁
      if (current.unlocked && !app.isAchievementUnlocked(current.id)) {
        wx.showToast({
          title: `恭喜解锁成就：${current.name}！`,
          icon: 'success',
          duration: 2000
        });

        // 累加新获得的成就点
        newPoints += current.points;
        // 标记成就为已解锁
        app.markAchievementAsUnlocked(current.id);
      }
    });

    // 如果有新获得的成就点，更新全局总成就点数
    if (newPoints > 0) {
      // 调用app方法更新全局成就点
      if (app) {
        app.updateTotalPoints(newPoints);
        // 同步更新本地数据
        this.setData({
          totalPoints: app.globalData.totalAchievementPoints
        });
      }

      // 添加获得成就点的提示
      wx.showToast({
        title: `获得${newPoints}成就点！`,
        icon: 'success',
        duration: 2000
      });
    }
  },

  onShow() {
    tabBarManager.setSelectedTab(3);
    this.stopAutoPlay();
    if (this.data.autoPlay) this.startAutoPlay();

    // 检查是否有从其他页面更新的成就点
    const app = getApp();
    if (app) {
      // 同步全局总成就点数
      this.setData({
        totalPoints: app.globalData.totalAchievementPoints || 0
      });

      // 重置全局更新标志
      if (app.globalData.achievementPointsUpdated) {
        app.globalData.achievementPointsUpdated = false;
        app.globalData.newAchievementPoints = 0;
      }
    }

    // 检查成就状态变化
    this.checkAchievementChanges();
  },

  onUnload() {
    this.stopAutoPlay();
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ tab, swiperIndex: 0 });
    this.updateVoiceTextByTab(0, tab);
  },

  onSwiperChange(e) {
    const idx = e.detail.current;
    this.setData({ swiperIndex: idx });
    this.updateVoiceTextByTab(idx, this.data.tab);
  },

  updateVoiceTextByTab(idx, tab) {
    const arr = tab === 'liked' ? this.data.likedVoiceTexts : this.data.voiceTexts;
    if (arr.length > 0) {
      this.setData({ voiceText: arr[idx] });
    }
  },

  playVoice() {
    this.setData({ isPlaying: true });
    wx.cloud.callContainer({
      config: {
        env: 'cloud1-6g0qn8fo7e746837'
      },
      path: '/api/tts/text2audio',
      method: 'GET',
      header: {
        'X-WX-SERVICE': 'tts-service-name',  // TTS服务名称
        'content-type': 'application/json'
      },
      data: {
        text: this.data.voiceText
      },
      success: (res) => {
        const innerAudioContext = wx.createInnerAudioContext();
        innerAudioContext.src = res.data.audioUrl;
        innerAudioContext.play();
        innerAudioContext.onPlay(() => {
          console.log('语音播放开始');
        });
        innerAudioContext.onEnded(() => {
          this.setData({ isPlaying: false });
        });
        innerAudioContext.onError((res) => {
          wx.showToast({
            title: '语音播放失败',
            icon: 'none'
          });
          this.setData({ isPlaying: false });
          console.error('语音播放失败', res);
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '语音生成失败',
          icon: 'none'
        });
        this.setData({ isPlaying: false });
        console.error('调用云托管服务失败', err);
      }
    });
  },

  refreshVoice() {
    const arr = this.data.tab === 'liked' ? this.data.likedVoiceTexts : this.data.voiceTexts;
    if (arr.length <= 1) return;
    let idx = this.data.swiperIndex;
    let nextIdx = Math.floor(Math.random() * arr.length);
    if (nextIdx === idx) nextIdx = (nextIdx + 1) % arr.length;
    this.setData({ swiperIndex: nextIdx });
    this.updateVoiceTextByTab(nextIdx, this.data.tab);
  },

  getCurrentVoiceText() {
    const arr = this.data.tab === 'liked' ? this.data.likedVoiceTexts : this.data.voiceTexts;
    return arr[this.data.swiperIndex] || '';
  },

  likeVoice() {
    const voiceText = this.getCurrentVoiceText();
    const likedVoiceTexts = this.data.likedVoiceTexts;
    if (!voiceText) return;
    if (likedVoiceTexts.includes(voiceText)) {
      this.setData({ likedVoiceTexts: likedVoiceTexts.filter(t => t !== voiceText) });
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      this.setData({ likedVoiceTexts: likedVoiceTexts.concat(voiceText) });
      wx.showToast({ title: '已收藏语音', icon: 'success' });
    }
  },

  copyVoice() {
    const voiceText = this.getCurrentVoiceText();
    if (!voiceText) return;
    wx.setClipboardData({
      data: voiceText,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  shareVoice() {
    wx.showShareMenu({ withShareTicket: true });
    wx.updateShareMenu({ withShareTicket: true });
    wx.showToast({ title: '请点击右上角分享', icon: 'none' });
  },

  onShareAppMessage() {
    const voiceText = this.getCurrentVoiceText();
    return {
      title: '每日激励语',
      path: '/pages/achievement/achievement',
      desc: voiceText,
    };
  },

  onInputChange(e) {
    this.setData({ addInput: e.detail.value });
  },

  addVoiceText() {
    const val = this.data.addInput.trim();
    if (!val) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }
    if (this.data.voiceTexts.includes(val)) {
      wx.showToast({ title: '已存在', icon: 'none' });
      return;
    }
    this.setData({
      voiceTexts: this.data.voiceTexts.concat(val),
      likedVoiceTexts: this.data.likedVoiceTexts.concat(val),
      addInput: '',
      tab: 'liked',
      swiperIndex: this.data.likedVoiceTexts.length
    });
    this.updateVoiceTextByTab(this.data.likedVoiceTexts.length, 'liked');
    wx.showToast({ title: '已添加并收藏', icon: 'success' });
  },

  startAutoPlay() {
    if (this.data.autoPlayTimer) return;
    this.data.autoPlayTimer = setInterval(() => {
      let arr = this.data.tab === 'liked' ? this.data.likedVoiceTexts : this.data.voiceTexts;
      let idx = this.data.swiperIndex;
      let nextIdx = (idx + 1) % arr.length;
      this.setData({ swiperIndex: nextIdx });
      this.updateVoiceTextByTab(nextIdx, this.data.tab);
    }, 4000);
  },

  stopAutoPlay() {
    if (this.data.autoPlayTimer) {
      clearInterval(this.data.autoPlayTimer);
      this.data.autoPlayTimer = null;
    }
  },

  toggleAutoPlay() {
    this.setData({ autoPlay: !this.data.autoPlay });
    if (!this.data.autoPlay) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  },

  goToTask(e) {
    const taskId = e.currentTarget.dataset.id;
    const taskType = this.data.achievements.find(item => item.id === taskId)?.taskType;

    switch (taskType) {
      case 'weight':
        wx.switchTab({
          url: '/pages/index/index',
        });
        break;
      case 'diet':
        wx.navigateTo({
          url: '/pages/food/food',
        });
        break;
      case 'step':
        wx.navigateTo({
          url: '/pages/step/step',
        });
        break;
      default:
        wx.switchTab({
          url: '/pages/index/index',
        });
    }
  },

  navigateToMoreAchievements() {
    wx.navigateTo({
      url: '/pages/achievement/more-achievements'
    });
  }
})
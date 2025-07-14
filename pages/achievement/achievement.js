const tabBarManager = require('../../utils/tabBarManager');

Page({
  data: {
    achievements: [
      {
        id: 1,
        name: "减肥达人",
        type: "连续记录",
        condition: "连续7天记录体重",
        reward: "+50成就点",
        unlocked: true
      },
      {
        id: 2,
        name: "运动健将",
        type: "累计运动",
        condition: "累计运动100分钟",
        reward: "+30成就点",
        unlocked: false
      },
      {
        id: 3,
        name: "饮食自律",
        type: "健康饮食",
        condition: "连续7天饮食打卡",
        reward: "+40成就点",
        unlocked: false
      }
    ],
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
    tabBarManager.initTabBarForPage(2);
    console.log('[DEBUG] 成就页面初始化完成');
    console.log('当前数据:', this.data);
  },
  onShow() {
    tabBarManager.setSelectedTab(2);
    this.stopAutoPlay();
    if (this.data.autoPlay) this.startAutoPlay();
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
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = 'https://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=5&text=' + encodeURIComponent(this.data.voiceText);
    innerAudioContext.play();
    innerAudioContext.onPlay(() => {
      console.log('语音播放开始');
    });
    innerAudioContext.onEnded(() => {
      this.setData({ isPlaying: false });
    });
    innerAudioContext.onError((res) => {
      wx.showToast({
        title: '语音播放失败，请检查网络',
        icon: 'none'
      });
      this.setData({ isPlaying: false });
      console.error('语音播放失败', res);
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
    wx.switchTab({
      url: '/pages/index/index',
    });
  }
})
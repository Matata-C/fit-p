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
      '相信自己，你一定可以做到！'
    ],
    voiceText: '你很棒，坚持就是胜利！再接再厉，目标就在前方！'
  },
  onLoad() {
    console.log('[DEBUG] 成就页面初始化完成');
    console.log('当前数据:', this.data);
  },
  playVoice() {
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.src = 'https://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=5&text=' + encodeURIComponent(this.data.voiceText);
    innerAudioContext.play();
    innerAudioContext.onPlay(() => {
      console.log('语音播放开始');
    });
    innerAudioContext.onError((res) => {
      wx.showToast({
        title: '语音播放失败',
        icon: 'none'
      });
      console.error('语音播放失败', res);
    });
  },
  refreshVoice() {
    const { voiceTexts, voiceText } = this.data;
    let idx = voiceTexts.indexOf(voiceText);
    let nextIdx = (idx + 1) % voiceTexts.length;
    this.setData({ voiceText: voiceTexts[nextIdx] });
  }
})
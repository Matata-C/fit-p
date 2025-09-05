const tabBarManager = require('../../utils/tabBarManager');
const dataSync = require('../../utils/dataSync');

const calculateDailyExercise = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
    if (typeof exerciseRecords !== 'object' || exerciseRecords === null) {
      exerciseRecords = {};
    }
    return Array.isArray(exerciseRecords[today]) && exerciseRecords[today].length > 0;
  } catch (e) {
    console.error('计算每日运动成就失败', e);
    return false;
  }
};

const calculateDailyDiet = () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let dietRecords = wx.getStorageSync('foodRecords') || {};
    if (typeof dietRecords !== 'object' || dietRecords === null) {
      dietRecords = {};
    }
    return Array.isArray(dietRecords[today]) && dietRecords[today].length >= 3;
  } catch (e) {
    console.error('计算每日饮食成就失败', e);
    return false;
  }
};

const calculateMonthlyExercise = () => {
  try {
    let exerciseRecords = wx.getStorageSync('exerciseRecords') || {};
    if (typeof exerciseRecords !== 'object' || exerciseRecords === null) {
      exerciseRecords = {};
    }
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    let daysWithExercise = 0;
    Object.keys(exerciseRecords).forEach(date => {
      const dateObj = new Date(date);
      if (dateObj.getMonth() + 1 === currentMonth && dateObj.getFullYear() === currentYear) {
        if (Array.isArray(exerciseRecords[date]) && exerciseRecords[date].length > 0) {
          daysWithExercise++;
        }
      }
    });
    
    return daysWithExercise >= 20;
  } catch (e) {
    console.error('计算月度运动成就失败', e);
    return false;
  }
};

const calculateMonthlyCheckin = () => {
  try {
    let checkinRecords = wx.getStorageSync('checkinRecords') || [];
    if (!Array.isArray(checkinRecords)) {
      checkinRecords = [];
    }
    if (checkinRecords.length < 30) return false;
    const today = new Date();
    let consecutiveDays = 0;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (checkinRecords.some(record => record.date === dateStr)) {
        consecutiveDays++;
      } else {
        break;
      }
    }
    
    return consecutiveDays >= 30;
  } catch (e) {
    console.error('计算月度打卡成就失败', e);
    return false;
  }
};

const calculateMonthlyWeightGoal = () => {
  try {
    const weightGoal = wx.getStorageSync('weightGoal') || null;
    const currentWeight = wx.getStorageSync('currentWeight') || null;
    
    if (!weightGoal || !currentWeight) return false;
    return currentWeight <= weightGoal;
  } catch (e) {
    console.error('计算月度减重目标成就失败', e);
    return false;
  }
};

Page({
  data: {
    dailyAchievements: [
      {
        id: 101,
        name: "每日运动",
        type: "运动",
        condition: "完成一次运动记录",
        reward: "+5成就点",
        points: 5,
        unlocked: false
      },
      {
        id: 102,
        name: "每日饮食",
        type: "健康",
        condition: "记录3次饮食",
        reward: "+4成就点",
        points: 4,
        unlocked: false
      }
    ],
    monthlyAchievements: [
      {
        id: 201,
        name: "月度健身",
        type: "运动",
        condition: "完成20天运动",
        reward: "+30成就点",
        points: 30,
        unlocked: false
      },
      {
        id: 202,
        name: "月度打卡",
        type: "坚持",
        condition: "连续打卡30天",
        reward: "+50成就点",
        points: 50,
        unlocked: false
      },
      {
        id: 203,
        name: "月度目标",
        type: "目标",
        condition: "达成月减重目标",
        reward: "+100成就点",
        points: 100,
        unlocked: false
      }
    ]
  },

  onLoad() {
    tabBarManager.initTabBarForPage(3);
    this.calculateAchievements();
  },

  onShow() {
    tabBarManager.setSelectedTab(3);
    this.calculateAchievements();
  },

  calculateAchievements() {
    const app = getApp();
    if (app.globalData && app.globalData.dailyAchievementsReset) {
      const dailyAchievements = [...this.data.dailyAchievements].map(item => ({
        ...item,
        unlocked: false
      }));
      this.setData({ dailyAchievements });
      app.globalData.dailyAchievementsReset = false;
      console.log('已重置日成就状态');
    }

    const dailyAchievements = Array.isArray(this.data.dailyAchievements) ? [...this.data.dailyAchievements] : [];
    const monthlyAchievements = Array.isArray(this.data.monthlyAchievements) ? [...this.data.monthlyAchievements] : [];

    dailyAchievements.forEach(item => {
      item.unlocked = app.isAchievementUnlocked(item.id);
    });
    monthlyAchievements.forEach(item => {
      item.unlocked = app.isAchievementUnlocked(item.id);
    });

    if (dailyAchievements.length > 0) {
      dailyAchievements[0].unlocked = calculateDailyExercise();
    }
    if (dailyAchievements.length > 1) {
      dailyAchievements[1].unlocked = calculateDailyDiet();
    }

    if (monthlyAchievements.length > 0) {
      monthlyAchievements[0].unlocked = calculateMonthlyExercise();
    }
    if (monthlyAchievements.length > 1) {
      monthlyAchievements[1].unlocked = calculateMonthlyCheckin();
    }
    if (monthlyAchievements.length > 2) {
      monthlyAchievements[2].unlocked = calculateMonthlyWeightGoal();
    }

    this.setData({
      dailyAchievements,
      monthlyAchievements
    });
    
    let newPoints = 0;
    
    dailyAchievements.forEach(current => {
      if (current.unlocked && (!app.isAchievementUnlocked(current.id) || app.globalData.dailyAchievementsReset)) {
        wx.showToast({
          title: `解锁成就：${current.name}！`,
          icon: 'success',
          duration: 2000
        });
        
        newPoints += current.points;
        app.markAchievementAsUnlocked(current.id);
      }
    });
    
    monthlyAchievements.forEach(current => {
      if (current.unlocked && !app.isAchievementUnlocked(current.id)) {
        wx.showToast({
          title: `解锁成就：${current.name}！`,
          icon: 'success',
          duration: 2000
        });
        
        newPoints += current.points;
        app.markAchievementAsUnlocked(current.id);
      }
    });
     if (newPoints > 0) {
       if (app) {
         app.updateTotalPoints(newPoints);
       }
     }
  },

  goToTask(e) {
    const id = e.currentTarget.dataset.id;
    switch(id) {
      case 101: 
      case 201: 
        wx.navigateTo({
          url: '/pages/exercise/exercise'
        });
        break;
      case 102:
        wx.navigateTo({
          url: '/pages/food/food'
        });
        break;
      case 202: 
        wx.navigateTo({
          url: '/pages/index/index'
        });
        break;
      case 203:
        wx.navigateTo({
          url: '/pages/goal/goal'
        });
        break;
      default:
        wx.showToast({
          title: '暂无相关任务页面',
          icon: 'none'
        });
    }
  }
});
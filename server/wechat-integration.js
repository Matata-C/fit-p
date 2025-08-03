class WeChatAPI {
  constructor(baseURL = 'https://your-deployed-domain.com') {
    this.baseURL = baseURL;
  }

  async request(url, method = 'GET', data = {}, headers = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.baseURL}${url}`,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          ...headers
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  async sendChatMessage(userId, message) {
    return this.request('/api/chat/process', 'POST', {
      userId,
      message
    });
  }

  async getExerciseRecords(userId, options = {}) {
    const { date, limit = 10, page = 1 } = options;
    let url = `/api/exercise/records/${userId}?limit=${limit}&page=${page}`;
    if (date) {
      url += `&date=${date}`;
    }
    return this.request(url);
  }

  async addExerciseRecord(record) {
    return this.request('/api/exercise/records', 'POST', record);
  }
  async getFoodRecords(userId, options = {}) {
    const { date, limit = 10, page = 1 } = options;
    let url = `/api/food/records/${userId}?limit=${limit}&page=${page}`;
    if (date) {
      url += `&date=${date}`;
    }
    return this.request(url);
  }

  async addFoodRecord(record) {
    return this.request('/api/food/records', 'POST', record);
  }
  async getTodayNutrition(userId) {
    return this.request(`/api/food/today-nutrition/${userId}`);
  }

  async getExerciseStats(userId, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    let url = `/api/exercise/stats/${userId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.request(url);
  }

  async getFoodStats(userId, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    let url = `/api/food/stats/${userId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    return this.request(url);
  }
}
const api = new WeChatAPI('https://your-deployed-domain.com');

Page({
  data: {
    userId: 'your_user_id',
    exerciseRecords: [],
    foodRecords: [],
    nutrition: {}
  },

  async onLoad() {
    await this.loadData();
  },

  async loadData() {
    try {
      const [exerciseRes, foodRes, nutritionRes] = await Promise.all([
        api.getExerciseRecords(this.data.userId, { date: new Date().toISOString().split('T')[0] }),
        api.getFoodRecords(this.data.userId, { date: new Date().toISOString().split('T')[0] }),
        api.getTodayNutrition(this.data.userId)
      ]);

      this.setData({
        exerciseRecords: exerciseRes.data,
        foodRecords: foodRes.data,
        nutrition: nutritionRes.data
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      wx.showToast({
        title: '加载数据失败',
        icon: 'none'
      });
    }
  },

  async handleChatMessage(message) {
    try {
      const result = await api.sendChatMessage(this.data.userId, message);

      if (result.success && result.data.hasExercise) {
        await api.addExerciseRecord(result.data.exercise);
        await this.loadData();
        wx.showToast({
          title: '锻炼记录已添加',
          icon: 'success'
        });
      }

      if (result.success && result.data.hasFood) {
        await api.addFoodRecord(result.data.food);
        await this.loadData();
        wx.showToast({
          title: '饮食记录已添加',
          icon: 'success'
        });
      }

      return result;
    } catch (error) {
      console.error('AI对话失败:', error);
      wx.showToast({
        title: 'AI对话失败',
        icon: 'none'
      });
    }
  }
});

module.exports = WeChatAPI;
const axios = require('axios');

class DoubaoService {
  constructor() {
    this.apiKey = process.env.DOUBAO_API_KEY || 'api-key-20250731224945';
    this.endpoint = process.env.DOUBAO_ENDPOINT || 'ep-20250731225431-gtq5q';
    this.baseURL = 'https://ark.cn-beijing.volces.com/api/v3';
  }

  async extractExerciseAndFoodInfo(message) {
    try {
      const prompt = this.buildPrompt(message);

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.endpoint,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的健康数据提取助手。请从用户输入中提取锻炼和饮食信息。
              
请严格按照以下JSON格式返回：
{
  "exercise": {
    "type": "运动类型",
    "duration": 分钟数,
    "calories_burned": 消耗卡路里,
    "intensity": "低/中/高"
  },
  "food": {
    "name": "食物名称",
    "weight": 重量(克),
    "calories": 卡路里,
    "protein": 蛋白质(克),
    "carbs": 碳水化合物(克),
    "fat": 脂肪(克),
    "meal_time": "早餐/午餐/晚餐/加餐"
  },
  "confidence": 0.95,
  "message": "提取结果的描述"
}

如果没有相关信息，对应字段设为null。`            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      console.log('豆包API响应:', content);

      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('解析JSON失败，尝试提取信息:', parseError);
        return this.extractFromText(content);
      }
    } catch (error) {
      console.error('豆包API调用失败:', error.response?.data || error.message);
      throw new Error('AI服务调用失败，请稍后重试');
    }
  }

  buildPrompt(message) {
    return `请分析以下文本，提取锻炼和饮食信息："${message}"`;
  }

  extractFromText(text) {
    const result = {
      exercise: null,
      food: null,
      confidence: 0.5,
      message: '信息提取中...'
    };

    const exercisePatterns = [
      /跑了?(\d+(?:\.\d+)?)\s*(?:公里|km|千米)/i,
      /走了?(\d+(?:\.\d+)?)\s*(?:公里|km|千米)/i,
      /运动了?(\d+)\s*(?:分钟|min|小时)/i,
      /锻炼了?(\d+)\s*(?:分钟|min|小时)/i,
      /游泳了?(\d+)\s*(?:分钟|min|小时)/i,
      /骑车了?(\d+)\s*(?:分钟|min|小时)/i
    ];

    const exerciseTypes = {
      '跑': '跑步',
      '走': '走路',
      '游泳': '游泳',
      '骑车': '骑行',
      '瑜伽': '瑜伽',
      '健身': '健身'
    };

    for (const [type, name] of Object.entries(exerciseTypes)) {
      if (message.includes(type)) {
        let duration = 30;
        let calories = 200;

        const durationMatch = text.match(/(\d+)\s*(?:分钟|min)/i);
        if (durationMatch) {
          duration = parseInt(durationMatch[1]);
        }

        const caloriesMatch = text.match(/(\d+)\s*卡路里/i);
        if (caloriesMatch) {
          calories = parseInt(caloriesMatch[1]);
        }

        result.exercise = {
          type: name,
          duration: duration,
          calories_burned: calories,
          intensity: '中'
        };
        break;
      }
    }

    const foodPatterns = [
      /吃了?\s*(.+?)\s*(\d+)?\s*(?:克|g|个|份)/i,
      /喝了?\s*(.+?)\s*(\d+)?\s*(?:毫升|ml|杯)/i,
      /早餐吃了?\s*(.+?)(?:\s|$)/i,
      /午餐吃了?\s*(.+?)(?:\s|$)/i,
      /晚餐吃了?\s*(.+?)(?:\s|$)/i
    ];

    for (const pattern of foodPatterns) {
      const match = text.match(pattern);
      if (match) {
        let foodName = match[1];
        let weight = match[2] ? parseInt(match[2]) : 100;

        let calories = weight * 0.5;
        if (foodName.includes('苹果')) calories = weight * 0.52;
        if (foodName.includes('香蕉')) calories = weight * 0.89;
        if (foodName.includes('米饭')) calories = weight * 1.3;
        if (foodName.includes('鸡胸肉')) calories = weight * 1.65;

        result.food = {
          name: foodName.trim(),
          weight: weight,
          calories: Math.round(calories),
          protein: Math.round(weight * 0.02),
          carbs: Math.round(weight * 0.15),
          fat: Math.round(weight * 0.01),
          meal_time: this.detectMealTime(text)
        };
        break;
      }
    }

    return result;
  }

  detectMealTime(text) {
    const now = new Date();
    const hour = now.getHours();

    if (text.includes('早餐') || text.includes('早上') || (hour >= 5 && hour < 10)) {
      return '早餐';
    } else if (text.includes('午餐') || text.includes('中午') || (hour >= 10 && hour < 15)) {
      return '午餐';
    } else if (text.includes('晚餐') || text.includes('晚上') || (hour >= 15 && hour < 22)) {
      return '晚餐';
    } else {
      return hour < 10 ? '早餐' : hour < 15 ? '午餐' : '晚餐';
    }
  }

  async testConnection() {
    try {
      const response = await this.extractExerciseAndFoodInfo('测试连接');
      return { success: true, message: '豆包API连接正常' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new DoubaoService();
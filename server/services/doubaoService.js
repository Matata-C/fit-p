const axios = require('axios');
const crypto = require('crypto');

class DoubaoService {
  constructor() {
    if (!process.env.DOUBAO_API_KEY) {
      throw new Error('缺少DOUBAO_API_KEY环境变量配置');
    }

    if (!process.env.DOUBAO_ENDPOINT) {
      throw new Error('缺少DOUBAO_ENDPOINT环境变量配置');
    }

    this.apiKey = process.env.DOUBAO_API_KEY;
    this.secretKey = process.env.DOUBAO_SECRET_KEY || '';
    this.endpoint = process.env.DOUBAO_ENDPOINT;
    this.baseURL = 'https://ark.cn-beijing.volces.com/api/v3';
  }

  async extractExerciseAndFoodInfo(message) {
    try {
      const prompt = this.buildPrompt(message);
      const requestBody = {
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

如果没有相关信息，对应字段设为null。`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      };
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest(timestamp);
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Volc-AccessKey': this.apiKey,
        'X-Volc-Signature': signature,
        'X-Volc-Timestamp': timestamp,
        'X-Volc-Content-Sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      };

      console.log('调用豆包API:', {
        url: `${this.baseURL}/chat/completions`,
        headers: headers,
        body: requestBody
      });
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        { headers }
      );

      const content = response.data.choices[0].message.content;
      console.log('豆包API响应:', content);

      try {
        const parsedData = JSON.parse(content);
        if (parsedData && (parsedData.exercise || parsedData.food)) {
          if (parsedData.exercise) {
            parsedData.exercise.calories_burned = parsedData.exercise.calories_burned != null ? parsedData.exercise.calories_burned : 0;
            parsedData.exercise.intensity = parsedData.exercise.intensity || '中';
          }

          if (parsedData.food) {
            parsedData.food.calories = parsedData.food.calories != null ? parsedData.food.calories : 0;
            parsedData.food.protein = parsedData.food.protein != null ? parsedData.food.protein : 0;
            parsedData.food.carbs = parsedData.food.carbs != null ? parsedData.food.carbs : 0;
            parsedData.food.fat = parsedData.food.fat != null ? parsedData.food.fat : 0;
          }

          return parsedData;
        } else {
          return {
            exercise: null,
            food: null,
            confidence: 0.0,
            message: '未检测到有效的运动或饮食信息'
          };
        }
      } catch (parseError) {
        console.error('解析JSON失败，尝试提取信息:', parseError);
        return this.extractFromText(content);
      }
    } catch (error) {
      console.error('豆包API调用失败:', error.response?.data || error.message);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          throw new Error('API认证失败，请检查API密钥配置');
        } else if (status === 403) {
          throw new Error('API访问被拒绝，请检查API权限');
        } else if (status === 429) {
          throw new Error('API调用频率超限，请稍后重试');
        } else {
          throw new Error(`API调用失败 (${status}): ${data?.message || '未知错误'}`);
        }
      } else if (error.request) {
        throw new Error('API服务无响应，请检查网络连接');
      } else {
        throw new Error(`请求配置错误: ${error.message}`);
      }
    }
  }

  buildPrompt(message) {
    return `请分析以下文本，提取锻炼和饮食信息："${message}"`;
  }

  signRequest(timestamp) {
    const method = 'POST';
    const url = '/api/v3/chat/completions';
    const contentType = 'application/json';
    const host = 'ark.cn-beijing.volces.com';
    const date = new Date(timestamp * 1000).toISOString().replace(/[-:]/g, '').slice(0, 8);
    const xDate = new Date(timestamp * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

    const canonicalRequest = `${method}\n${url}\n\ncontent-type:${contentType}\nhost:${host}\nx-volc-accesskey:${this.apiKey}\nx-volc-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nx-volc-timestamp:${timestamp}\n`;
    
    const kDate = crypto.createHmac('sha256', 'AWS4' + this.secretKey).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update('cn-beijing').digest();
    const kService = crypto.createHmac('sha256', kRegion).update('ark').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
    
    const hashCanonical = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const credentialScope = `${date}/cn-beijing/ark/request`;
    const stringToSign = `HMAC-SHA256\n${xDate}\n${credentialScope}\n${hashCanonical}`;
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return signature;
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
      if (text.includes(type)) {
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
        if (foodName.includes('米饭')) calories = weight * 1.16;
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

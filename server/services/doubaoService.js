const axios = require('axios');
const crypto = require('crypto');

class DoubaoService {
  constructor() {
    this.apiKey = process.env.DOUBAO_API_KEY || 'your-api-key';
    this.secretKey = process.env.DOUBAO_SECRET_KEY || 'your-secret-key';
    this.baseURL = 'https://ark.cn-beijing.volces.com/api/v3';
    this.model = process.env.DOUBAO_MODEL || 'ep-20241210143344-9v8g6';
  }

  async generateConversationalResponse(message, aiRole = 'professional', userRecords = null) {
    const rolePrompts = {
      'professional': '你是一位专业的健康顾问，请以专业、科学的方式回答用户的问题，提供准确的健康建议。',
      'energetic': '你是一位充满活力的健身教练，请以积极、热情的方式回答用户的问题，鼓励用户坚持运动。',
      'gentle': '你是一位温柔的养生顾问，请以温和、体贴的方式回答用户的问题，关心用户的身心健康。',
      'strict': '你是一位严格的健身导师，请以严肃、直接的方式回答用户的问题，要求用户严格执行计划。'
    };

    const systemPrompt = `${rolePrompts[aiRole] || rolePrompts['professional']}

请以自然对话的方式回应用户，同时自动识别并提取用户提到的运动和饮食信息。
如果用户提到运动，请提取运动类型、时长（统一转换为分钟）、消耗卡路里等信息。
如果用户提到饮食，请提取食物名称、重量（克）、卡路里、蛋白质、碳水化合物、脂肪等信息。`;

    const context = userRecords ? `
用户今日数据：
- 步数：${userRecords.steps || 0}步
- 运动时长：${userRecords.duration || 0}分钟
- 消耗卡路里：${userRecords.calories || 0}卡
- 体重：${userRecords.weight || 0}公斤` : '';

    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `${context}\n\n用户消息：${message}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    };

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest(timestamp);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Volc-Authorization': `HMAC-SHA256 Credential=${this.apiKey}, Signature=${signature}`,
        'X-Volc-AccessKey': this.apiKey,
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
        {
          headers,
          timeout: 15000,
          responseType: 'json',
          transformRequest: [(data, headers) => {
            return JSON.stringify(data);
          }]
        }
      );

      const content = response.data.choices[0].message.content;
      console.log('豆包API响应:', content);

      const extractedInfo = await this.extractExerciseAndFoodInfo(message);
      
      return {
        response: content,
        role: aiRole,
        extractedData: extractedInfo
      };
    } catch (error) {
      console.error('豆包API调用失败:', error.response?.data || error.message);
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          return {
            response: '抱歉，AI服务认证失败，请稍后重试',
            role: aiRole,
            extractedData: { exercise: null, food: null, confidence: 0.0, message: 'API认证失败' }
          };
        } else if (status === 403) {
          return {
            response: '抱歉，AI服务访问被拒绝，请稍后重试',
            role: aiRole,
            extractedData: { exercise: null, food: null, confidence: 0.0, message: 'API访问被拒绝' }
          };
        } else if (status === 429) {
          return {
            response: '抱歉，AI服务调用频率过高，请稍后重试',
            role: aiRole,
            extractedData: { exercise: null, food: null, confidence: 0.0, message: 'API调用频率超限' }
          };
        } else {
          return {
            response: '抱歉，AI服务暂时不可用，请稍后重试',
            role: aiRole,
            extractedData: { exercise: null, food: null, confidence: 0.0, message: 'API调用失败' }
          };
        }
      } else if (error.request) {
        return {
          response: '抱歉，AI服务无响应，请检查网络连接',
          role: aiRole,
          extractedData: { exercise: null, food: null, confidence: 0.0, message: 'API服务无响应' }
        };
      } else {
        return {
          response: '抱歉，AI服务配置错误，请稍后重试',
          role: aiRole,
          extractedData: { exercise: null, food: null, confidence: 0.0, message: '请求配置错误' }
        };
      }
    }
  }

  async extractExerciseAndFoodInfo(message) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.signRequest(timestamp);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Volc-Authorization': `HMAC-SHA256 Credential=${this.apiKey}, Signature=${signature}`,
        'X-Volc-AccessKey': this.apiKey,
        'X-Volc-Timestamp': timestamp,
        'X-Volc-Content-Sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      };

      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '请分析以下文本，提取锻炼和饮食信息，并以JSON格式返回。如果包含运动信息，请提取运动类型、时长（分钟）、消耗卡路里、强度。如果包含饮食信息，请提取食物名称、重量（克）、卡路里、蛋白质（克）、碳水化合物（克）、脂肪（克）、用餐时间。如果没有相关信息，请返回null。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      };

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        requestBody,
        {
          headers,
          timeout: 10000,
          responseType: 'json',
          transformRequest: [(data, headers) => {
            return JSON.stringify(data);
          }]
        }
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
        
        const hourMatch = text.match(/(\d+)\s*(?:小时|h)/i);
        if (hourMatch) {
          duration = parseInt(hourMatch[1]) * 60; 
        } else {
          const durationMatch = text.match(/(\d+)\s*(?:分钟|min)/i);
          if (durationMatch) {
            duration = parseInt(durationMatch[1]);
          }
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
        if (foodName.includes('鸡蛋')) calories = weight * 1.43;
        if (foodName.includes('牛奶')) calories = weight * 0.54;
        calories = Math.max(1, Math.round(calories));

        result.food = {
          name: foodName.trim(),
          weight: weight,
          calories: calories,
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
    if (text.includes('早餐') || text.includes('早上')) return '早餐';
    if (text.includes('午餐') || text.includes('中午')) return '午餐';
    if (text.includes('晚餐') || text.includes('晚上')) return '晚餐';
    if (text.includes('夜宵') || text.includes('睡前')) return '夜宵';
    return '其他';
  }

  testConnection() {
    return {
      status: 'ok',
      message: '豆包服务连接正常',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new DoubaoService();

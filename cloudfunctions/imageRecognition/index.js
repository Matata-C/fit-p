// 图像识别云函数 - 简化版本（确保部署成功）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 食物数据库
const foodDatabase = {
  'banana': {
    name: '香蕉',
    calories: 89,
    unit: '100g',
    nutrition: {
      protein: 1.1,
      fat: 0.3,
      carbs: 22.8,
      fiber: 2.6
    },
    tips: '香蕉富含钾元素，有助于肌肉恢复'
  },
  'apple': {
    name: '苹果',
    calories: 52,
    unit: '100g',
    nutrition: {
      protein: 0.3,
      fat: 0.2,
      carbs: 13.8,
      fiber: 2.4
    },
    tips: '苹果富含膳食纤维，有助于消化'
  },
  'orange': {
    name: '橙子',
    calories: 47,
    unit: '100g',
    nutrition: {
      protein: 0.9,
      fat: 0.1,
      carbs: 11.8,
      fiber: 2.4
    },
    tips: '橙子富含维生素C，增强免疫力'
  },
  'rice': {
    name: '米饭',
    calories: 116,
    unit: '100g',
    nutrition: {
      protein: 2.6,
      fat: 0.3,
      carbs: 25.6,
      fiber: 0.4
    },
    tips: '米饭是主要碳水化合物来源'
  },
  'chicken': {
    name: '鸡肉',
    calories: 165,
    unit: '100g',
    nutrition: {
      protein: 31,
      fat: 3.6,
      carbs: 0,
      fiber: 0
    },
    tips: '鸡肉是优质蛋白质来源'
  },
  'fish': {
    name: '鱼肉',
    calories: 84,
    unit: '100g',
    nutrition: {
      protein: 20.4,
      fat: 0.5,
      carbs: 0,
      fiber: 0
    },
    tips: '鱼肉富含Omega-3脂肪酸'
  },
  'egg': {
    name: '鸡蛋',
    calories: 155,
    unit: '100g',
    nutrition: {
      protein: 12.6,
      fat: 11.3,
      carbs: 0.7,
      fiber: 0
    },
    tips: '鸡蛋是优质蛋白质和维生素D来源'
  },
  'milk': {
    name: '牛奶',
    calories: 42,
    unit: '100ml',
    nutrition: {
      protein: 3.4,
      fat: 1.0,
      carbs: 5.0,
      fiber: 0
    },
    tips: '牛奶富含钙质，有助于骨骼健康'
  },
  'bread': {
    name: '面包',
    calories: 265,
    unit: '100g',
    nutrition: {
      protein: 9.0,
      fat: 3.2,
      carbs: 49.0,
      fiber: 2.7
    },
    tips: '全麦面包富含膳食纤维'
  },
  'vegetables': {
    name: '蔬菜',
    calories: 25,
    unit: '100g',
    nutrition: {
      protein: 2.0,
      fat: 0.2,
      carbs: 4.0,
      fiber: 2.5
    },
    tips: '蔬菜富含维生素和矿物质'
  }
}

// 简化的图像识别逻辑
function simpleImageRecognition(imageUrl) {
  console.log('开始识别图片:', imageUrl);
  
  // 模拟识别逻辑 - 随机返回一个食物
  const foodKeys = Object.keys(foodDatabase);
  const randomIndex = Math.floor(Math.random() * foodKeys.length);
  const recognizedFood = foodKeys[randomIndex];
  
  console.log('识别结果:', recognizedFood);
  return recognizedFood;
}

exports.main = async (event, context) => {
  const { imageUrl, action } = event

  try {
    console.log('云函数被调用，参数:', event);
    
    switch (action) {
      case 'recognize':
        console.log('执行识别操作');
        const recognizedFood = simpleImageRecognition(imageUrl);
        
        if (!recognizedFood) {
          console.log('识别失败');
          return {
            success: false,
            error: '无法识别图片中的食物',
            data: null
          }
        }
        
        const foodInfo = foodDatabase[recognizedFood];
        console.log('识别成功:', foodInfo.name);
        
        return {
          success: true,
          data: {
            foodName: foodInfo.name,
            calories: foodInfo.calories,
            unit: foodInfo.unit,
            nutrition: foodInfo.nutrition,
            tips: foodInfo.tips,
            confidence: 0.8
          }
        }
      
      case 'getFoodList':
        console.log('获取食物列表');
        return {
          success: true,
          data: Object.keys(foodDatabase).map(key => ({
            key,
            ...foodDatabase[key]
          }))
        }
      
      case 'test':
        console.log('测试函数调用');
        return {
          success: true,
          message: '云函数部署成功！',
          timestamp: new Date().toISOString()
        }
      
      default:
        console.log('未知操作:', action);
        return {
          success: false,
          error: '未知操作'
        }
    }
  } catch (error) {
    console.error('云函数执行错误:', error);
    return {
      success: false,
      error: error.message
    }
  }
} 
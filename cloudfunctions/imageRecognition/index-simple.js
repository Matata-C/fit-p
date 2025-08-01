// 简化版图像识别云函数 - 用于测试部署
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 简化的食物数据库
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
  }
}

// 简化的图像识别逻辑
function simpleImageRecognition(imageUrl) {
  console.log('开始识别图片:', imageUrl);
  
  // 模拟识别逻辑
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
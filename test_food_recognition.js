// 测试食物识别功能
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
  }
};

// 模拟图像识别
function simulateImageRecognition(imageUrl) {
  console.log('模拟识别图片:', imageUrl);
  
  // 根据图片URL的特征进行简单判断
  if (imageUrl.includes('banana') || imageUrl.includes('yellow')) {
    return 'banana';
  } else if (imageUrl.includes('apple') || imageUrl.includes('red')) {
    return 'apple';
  } else {
    // 随机返回一个结果用于测试
    const foodTypes = Object.keys(foodDatabase);
    return foodTypes[Math.floor(Math.random() * foodTypes.length)];
  }
}

// 测试识别功能
function testRecognition() {
  console.log('=== 食物识别功能测试 ===');
  
  const testImages = [
    'banana.jpg',
    'apple.jpg',
    'unknown.jpg'
  ];
  
  testImages.forEach(imageUrl => {
    const recognizedFood = simulateImageRecognition(imageUrl);
    const foodInfo = foodDatabase[recognizedFood];
    
    console.log(`\n图片: ${imageUrl}`);
    console.log(`识别结果: ${foodInfo.name}`);
    console.log(`热量: ${foodInfo.calories}千卡/${foodInfo.unit}`);
    console.log(`营养信息: 蛋白质${foodInfo.nutrition.protein}g, 脂肪${foodInfo.nutrition.fat}g, 碳水${foodInfo.nutrition.carbs}g`);
    console.log(`小贴士: ${foodInfo.tips}`);
  });
}

// 测试记录管理
function testRecordManagement() {
  console.log('\n=== 记录管理功能测试 ===');
  
  // 模拟添加记录
  const today = new Date().toISOString().split('T')[0];
  const testRecord = {
    id: Date.now(),
    name: '香蕉',
    calories: 89,
    unit: '100g',
    nutrition: {
      protein: 1.1,
      fat: 0.3,
      carbs: 22.8,
      fiber: 2.6
    },
    timestamp: new Date().toISOString(),
    source: 'photo-recognition'
  };
  
  console.log('添加测试记录:', testRecord);
  console.log('记录日期:', today);
  console.log('记录ID:', testRecord.id);
  console.log('食物名称:', testRecord.name);
  console.log('热量:', testRecord.calories, '千卡');
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  testRecognition();
  testRecordManagement();
} else {
  // 浏览器环境
  console.log('请在Node.js环境中运行此测试脚本');
} 
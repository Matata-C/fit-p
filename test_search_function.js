// 测试搜索功能
const foodDatabase = {
  'banana': {
    key: 'banana',
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
    key: 'apple',
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
    key: 'egg',
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
};

// 模拟搜索函数
function findBestMatch(searchTerm, foodList) {
  console.log('开始搜索匹配:', searchTerm);
  console.log('可用食物列表:', foodList);
  
  const searchLower = searchTerm.toLowerCase();
  
  // 1. 精确匹配
  let match = foodList.find(food => 
    food.name.toLowerCase() === searchLower
  );
  if (match) {
    console.log('精确匹配成功:', match);
    return match;
  }
  
  // 2. 包含匹配
  match = foodList.find(food => 
    food.name.toLowerCase().includes(searchLower) || 
    searchLower.includes(food.name.toLowerCase())
  );
  if (match) {
    console.log('包含匹配成功:', match);
    return match;
  }
  
  // 3. 关键词匹配
  const keywords = {
    '鸡蛋': 'egg',
    '蛋': 'egg',
    '鸡': 'chicken',
    '鱼': 'fish',
    '苹果': 'apple',
    '香蕉': 'banana',
    '橙子': 'orange',
    '米饭': 'rice',
    '面包': 'bread',
    '牛奶': 'milk',
    '蔬菜': 'vegetables'
  };
  
  for (const [keyword, key] of Object.entries(keywords)) {
    if (searchLower.includes(keyword.toLowerCase())) {
      console.log('关键词匹配:', keyword, '->', key);
      match = foodList.find(food => food.key === key);
      if (match) {
        console.log('关键词匹配成功:', match);
        return match;
      }
    }
  }
  
  // 4. 模糊匹配
  for (const food of foodList) {
    const foodLower = food.name.toLowerCase();
    let matchScore = 0;
    
    for (let i = 0; i < searchLower.length; i++) {
      if (foodLower.includes(searchLower[i])) {
        matchScore++;
      }
    }
    
    if (matchScore >= searchLower.length * 0.5) {
      console.log('模糊匹配成功:', food, '得分:', matchScore);
      return food;
    }
  }
  
  console.log('未找到匹配');
  return null;
}

// 测试搜索
function testSearch() {
  console.log('=== 搜索功能测试 ===');
  
  const foodList = Object.values(foodDatabase);
  const testCases = [
    '鸡蛋',
    '蛋',
    '苹果',
    '香蕉',
    '不存在的食物'
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n测试搜索: "${testCase}"`);
    const result = findBestMatch(testCase, foodList);
    if (result) {
      console.log(`✅ 找到匹配: ${result.name}`);
    } else {
      console.log(`❌ 未找到匹配`);
    }
  });
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  testSearch();
} else {
  console.log('请在Node.js环境中运行此测试脚本');
} 
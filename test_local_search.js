// 本地搜索测试
const localFoodList = [
  { key: 'banana', name: '香蕉', calories: 89, unit: '100g', nutrition: { protein: 1.1, fat: 0.3, carbs: 22.8, fiber: 2.6 }, tips: '香蕉富含钾元素，有助于肌肉恢复' },
  { key: 'apple', name: '苹果', calories: 52, unit: '100g', nutrition: { protein: 0.3, fat: 0.2, carbs: 13.8, fiber: 2.4 }, tips: '苹果富含膳食纤维，有助于消化' },
  { key: 'orange', name: '橙子', calories: 47, unit: '100g', nutrition: { protein: 0.9, fat: 0.1, carbs: 11.8, fiber: 2.4 }, tips: '橙子富含维生素C，增强免疫力' },
  { key: 'rice', name: '米饭', calories: 116, unit: '100g', nutrition: { protein: 2.6, fat: 0.3, carbs: 25.6, fiber: 0.4 }, tips: '米饭是主要碳水化合物来源' },
  { key: 'chicken', name: '鸡肉', calories: 165, unit: '100g', nutrition: { protein: 31, fat: 3.6, carbs: 0, fiber: 0 }, tips: '鸡肉是优质蛋白质来源' },
  { key: 'fish', name: '鱼肉', calories: 84, unit: '100g', nutrition: { protein: 20.4, fat: 0.5, carbs: 0, fiber: 0 }, tips: '鱼肉富含Omega-3脂肪酸' },
  { key: 'egg', name: '鸡蛋', calories: 155, unit: '100g', nutrition: { protein: 12.6, fat: 11.3, carbs: 0.7, fiber: 0 }, tips: '鸡蛋是优质蛋白质和维生素D来源' },
  { key: 'milk', name: '牛奶', calories: 42, unit: '100ml', nutrition: { protein: 3.4, fat: 1.0, carbs: 5.0, fiber: 0 }, tips: '牛奶富含钙质，有助于骨骼健康' },
  { key: 'bread', name: '面包', calories: 265, unit: '100g', nutrition: { protein: 9.0, fat: 3.2, carbs: 49.0, fiber: 2.7 }, tips: '全麦面包富含膳食纤维' },
  { key: 'vegetables', name: '蔬菜', calories: 25, unit: '100g', nutrition: { protein: 2.0, fat: 0.2, carbs: 4.0, fiber: 2.5 }, tips: '蔬菜富含维生素和矿物质' }
];

function findBestMatch(searchTerm, foodList) {
  console.log('开始搜索匹配:', searchTerm);
  
  const searchLower = searchTerm.toLowerCase();
  
  // 1. 精确匹配
  let match = foodList.find(food => 
    food.name.toLowerCase() === searchLower
  );
  if (match) {
    console.log('精确匹配成功:', match.name);
    return match;
  }
  
  // 2. 关键词匹配
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
        console.log('关键词匹配成功:', match.name);
        return match;
      }
    }
  }
  
  // 3. 包含匹配
  match = foodList.find(food => 
    food.name.toLowerCase().includes(searchLower) || 
    searchLower.includes(food.name.toLowerCase())
  );
  if (match) {
    console.log('包含匹配成功:', match.name);
    return match;
  }
  
  console.log('未找到匹配');
  return null;
}

// 测试搜索
function testSearch() {
  console.log('=== 本地搜索测试 ===');
  
  const testCases = [
    '鸡蛋',
    '蛋',
    '苹果',
    '香蕉',
    '米饭',
    '不存在的食物'
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n测试搜索: "${testCase}"`);
    const result = findBestMatch(testCase, localFoodList);
    if (result) {
      console.log(`✅ 找到匹配: ${result.name} (${result.calories}千卡/${result.unit})`);
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
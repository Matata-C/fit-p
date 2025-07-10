/**
 * 数据修复工具
 * 用于检查和修复存储数据格式
 */

/**
 * 检查并修复体重记录数据
 * 支持三种可能的数据格式转换:
 * 1. 对象格式 {日期: 体重} -> [{date: 日期, weight: 体重}]
 * 2. 无效值 -> 空数组
 * 3. 已经是数组但可能缺少某些属性 -> 过滤有效记录
 */
function repairWeightRecords() {
  try {
    // 获取当前存储的数据
    let records = wx.getStorageSync('weightRecords');
    let isModified = false;
    
    console.log('开始修复体重记录，当前类型:', typeof records);
    
    // 处理空值
    if (!records) {
      wx.setStorageSync('weightRecords', []);
      console.log('体重记录为空，已初始化为空数组');
      return true;
    }
    
    // 如果不是数组，尝试转换
    if (!Array.isArray(records)) {
      // 如果是对象，尝试将其转换为数组格式
      if (typeof records === 'object' && records !== null) {
        const recordsArray = [];
        for (const date in records) {
          if (records.hasOwnProperty(date)) {
            recordsArray.push({
              date: date,
              weight: parseFloat(records[date]) || 0
            });
          }
        }
        records = recordsArray;
        isModified = true;
        console.log('已将对象格式转换为数组格式，新记录数:', records.length);
      } else {
        // 不是对象或为null，重置为空数组
        records = [];
        isModified = true;
        console.log('数据格式无效，已重置为空数组');
      }
    } else {
      // 已经是数组，检查每条记录的格式是否正确
      const validRecords = records.filter(item => {
        return item && typeof item === 'object' && 
               item.date && 
               item.weight !== undefined;
      });
      
      // 如果有无效记录，进行修复
      if (validRecords.length !== records.length) {
        records = validRecords;
        isModified = true;
        console.log(`过滤了 ${records.length - validRecords.length} 条无效记录`);
      }
    }
    
    // 确保每条记录的weight是数字类型
    records.forEach(record => {
      if (typeof record.weight !== 'number') {
        record.weight = parseFloat(record.weight) || 0;
        isModified = true;
      }
    });
    
    // 如果数据有修改，保存回存储
    if (isModified) {
      wx.setStorageSync('weightRecords', records);
      console.log('体重记录修复完成，已保存更新后的数据');
    } else {
      console.log('体重记录格式正确，无需修复');
    }
    
    return true;
  } catch (e) {
    console.error('修复体重记录失败:', e);
    // 如果修复过程出错，重置为空数组
    try {
      wx.setStorageSync('weightRecords', []);
      console.log('修复失败，已重置为空数组');
      return true;
    } catch (error) {
      console.error('重置数据失败:', error);
      return false;
    }
  }
}

/**
 * 检查所有关键数据的格式并修复
 */
function repairAllData() {
  try {
    console.log('开始修复所有数据...');
    
    // 修复体重记录
    const weightFixed = repairWeightRecords();
    
    // 可以在这里添加其他数据类型的修复
    
    console.log('数据修复完成，结果:', {
      weightFixed
    });
    
    return true;
  } catch (e) {
    console.error('修复数据失败:', e);
    return false;
  }
}

module.exports = {
  repairWeightRecords,
  repairAllData
}; 
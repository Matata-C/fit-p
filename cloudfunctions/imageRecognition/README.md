# 阿里云图像识别集成说明

## 功能概述

本云函数集成了阿里云图像识别服务，可以智能识别图片中的食物类型，并提供详细的营养信息。

## 配置步骤

### 1. 注册阿里云账号
- 访问 [阿里云官网](https://www.aliyun.com/)
- 注册并登录账号

### 2. 开通图像识别服务
- 进入阿里云控制台
- 搜索"图像识别"服务
- 开通图像识别服务
- 创建AccessKey ID和AccessKey Secret

### 3. 配置环境变量
在微信开发者工具中，为云函数配置环境变量：

```bash
ALIYUN_ACCESS_KEY_ID=你的AccessKey ID
ALIYUN_ACCESS_KEY_SECRET=你的AccessKey Secret
```

### 4. 安装依赖
在云函数目录下运行：
```bash
npm install
```

## 支持的识别类型

### 食物类型
- 🍌 香蕉
- 🍎 苹果  
- 🍊 橙子
- 🍚 米饭
- 🍗 鸡肉
- 🐟 鱼肉
- 🥚 鸡蛋
- 🥛 牛奶
- 🍞 面包
- 🥬 蔬菜

### 识别流程
1. **阿里云识别**: 调用阿里云图像识别API
2. **关键词匹配**: 根据识别结果匹配食物类型
3. **备用逻辑**: 如果阿里云识别失败，使用本地备用逻辑

## 使用方法

### 前端调用
```javascript
wx.cloud.callFunction({
  name: 'imageRecognition',
  data: {
    action: 'recognize',
    imageUrl: '图片URL'
  },
  success: (result) => {
    if (result.result.success) {
      const foodData = result.result.data;
      console.log('识别结果:', foodData);
    }
  }
});
```

### 返回数据格式
```javascript
{
  success: true,
  data: {
    foodName: '香蕉',
    calories: 89,
    unit: '100g',
    nutrition: {
      protein: 1.1,
      fat: 0.3,
      carbs: 22.8,
      fiber: 2.6
    },
    tips: '香蕉富含钾元素，有助于肌肉恢复',
    confidence: 0.85
  }
}
```

## 注意事项

1. **图片格式**: 支持jpg、jpeg、png、bmp、gif格式
2. **图片大小**: 最大10MB
3. **网络要求**: 需要稳定的网络连接
4. **费用**: 阿里云图像识别服务按调用次数收费

## 故障排除

### 常见问题
1. **识别失败**: 检查网络连接和阿里云配置
2. **权限错误**: 确认AccessKey权限设置
3. **超时错误**: 检查图片大小和网络状况

### 调试方法
- 查看云函数日志
- 检查环境变量配置
- 验证阿里云服务状态

## 更新日志

- v1.0.0: 集成阿里云图像识别
- v1.1.0: 添加备用识别逻辑
- v1.2.0: 优化关键词匹配算法 
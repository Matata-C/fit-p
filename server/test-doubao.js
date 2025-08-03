require('dotenv').config();
const doubaoService = require('./services/doubaoService');

async function testDoubaoAPI() {
    console.log('🧪 测试豆包API连接...');

    try {
        console.log('📡 正在连接豆包API...');
        const isConnected = await doubaoService.testConnection();

        if (isConnected) {
            console.log('✅ 豆包API连接成功！');
            console.log('\n🎯 测试信息提取功能...');

            const testMessages = [
                "我今天早上跑了30分钟，大概消耗了300卡路里",
                "午餐吃了200克鸡胸肉和一碗米饭",
                "晚上去健身房做了45分钟力量训练，感觉很棒",
                "今天早餐吃了2个鸡蛋和一杯牛奶"
            ];

            for (const message of testMessages) {
                console.log(`\n📨 测试消息: "${message}"`);
                try {
                    const result = await doubaoService.extractExerciseAndFoodInfo(message);
                    console.log('📊 提取结果:', JSON.stringify(result, null, 2));
                } catch (error) {
                    console.error('❌ 提取失败:', error.message);
                }
            }

        } else {
            console.error('❌ 豆包API连接失败，请检查配置');
        }

    } catch (error) {
        console.error('❌ 测试过程中出错:', error.message);
    }
}
if (require.main === module) {
    testDoubaoAPI();
}

module.exports = testDoubaoAPI;
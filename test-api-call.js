async function testAPICall() {
  try {
    console.log('正在测试API调用...');

    const response = await fetch('http://localhost:3000/api/chat/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test-user',
        message: '我今天跑步了30分钟'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('API调用成功!');
      console.log('响应数据:', JSON.stringify(data, null, 2));
    } else {
      console.error('API调用失败:', data.message || '未知错误');
    }
  } catch (error) {
    console.error('API调用失败:', error.message);
  }
}

testAPICall();
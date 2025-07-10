const http = require('http');

// 设置端口
const PORT = process.env.PORT || 80;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 设置响应头
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  // 简单路由处理
  if (req.url === '/') {
    res.statusCode = 200;
    res.end('<h1>微信小程序后端服务正在运行中</h1><p>营养追踪应用云托管服务已成功部署</p>');
  } else if (req.url === '/health') {
    // 健康检查端点，用于云托管的健康检查
    res.statusCode = 200;
    res.end('OK');
  } else {
    // 处理404
    res.statusCode = 404;
    res.end('<h1>404 - 页面未找到</h1>');
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}/`);
});

// 处理进程终止信号，优雅关闭服务器
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('服务器已关闭');
  });
}); 
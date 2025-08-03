FROM node:16-alpine

# 创建工作目录
WORKDIR /app

# 复制服务器目录的package.json和package-lock.json
COPY server/package*.json ./

# 安装依赖
RUN npm install --production

# 复制服务器应用程序代码
COPY server/ ./

# 设置环境变量
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "app.js"]
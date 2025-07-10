FROM node:14-alpine

# 创建工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用程序代码
COPY . .

# 设置环境变量
ENV PORT=80

# 暴露端口
EXPOSE 80

# 启动应用
CMD ["node", "server.js"] 
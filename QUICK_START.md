# 🚀 快速开始

欢迎使用 H5 Video Embed Monorepo！专为国内主流视频平台优化的视频嵌入解决方案，重点支持抖音、B站、腾讯视频、西瓜视频、快手等平台。

## 📋 环境要求

- Node.js >= 16.0.0
- pnpm >= 8.0.0

**真实业务逻辑，无模拟数据！** 本项目使用真实的视频平台 API 提供完整功能。

## 🔧 安装依赖

### 安装所有依赖

```bash
# 安装所有包的依赖
pnpm install
```

就这么简单！系统会自动处理所有依赖。

### 🔑 可选：配置 API 密钥（推荐）

为了获得最佳体验，建议配置 YouTube Data API v3：

```bash
# 在 packages/server/ 下创建 .env 文件
echo "YOUTUBE_API_KEY=your_api_key_here" > packages/server/.env
```

详细配置步骤：[packages/server/API_SETUP.md](packages/server/API_SETUP.md)

## 🎯 启动项目

### 一键启动（推荐）

#### 推荐方式

```bash
# 使用 pnpm（推荐）
pnpm dev

# 或使用 npm
npm run dev:npm
```

这些命令会自动：
1. 启动后端服务（端口 3001）
2. 启动演示应用（端口 3000）
3. 自动打开浏览器

💡 **提示**：采用前端优先架构，主要逻辑在前端实现，响应更快！

### 手动启动

如果需要分别启动各个服务：

```bash
# 启动后端服务
cd packages/server
pnpm dev

# 新开终端，启动演示应用
cd packages/demo-app  
pnpm dev
```

## 🌐 访问地址

- **演示应用**: http://localhost:3000
- **后端 API**: http://localhost:3001
- **API 健康检查**: http://localhost:3001/health

## 🎮 使用演示

1. 打开浏览器访问 http://localhost:3000
2. 选择预设的演示视频或输入自定义视频链接
3. 调整播放器设置（尺寸、自动播放等）
4. 查看操作日志了解组件行为

## 📦 在你的项目中使用

### 1. 安装组件库

```bash
npm install h5-video-embed
# 或
yarn add h5-video-embed
# 或
pnpm add h5-video-embed
```

### 2. 使用组件

```jsx
import React from 'react';
import { VideoEmbed } from 'h5-video-embed';

function App() {
  return (
    <VideoEmbed 
      url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      width="800px"
      height="450px"
      onLoad={(data) => console.log('视频加载成功', data)}
      onError={(error) => console.error('视频加载失败', error)}
    />
  );
}
```

### 3. 部署后端服务

后端服务需要单独部署，参考 `packages/server/README.md` 中的部署指南。

## 🛠️ 开发命令

```bash
# 构建所有包
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 清理所有构建产物
pnpm clean
```

## 🐛 故障排除

### yt-dlp 未安装

```bash
# 检查安装
yt-dlp --version

# 如果报错，重新安装
pip install --upgrade yt-dlp
```

### 端口被占用

如果端口 3000 或 3001 被占用，可以：

1. 修改 `packages/demo-app/vite.config.js` 中的端口
2. 修改 `packages/server/server.js` 中的端口
3. 杀掉占用端口的进程

### 视频无法播放

1. 确保后端服务正在运行
2. 检查视频链接是否有效
3. 查看浏览器控制台错误信息
4. 确认 yt-dlp 支持该视频平台

## 📚 更多文档

- [组件库文档](packages/h5-video-embed/README.md)
- [后端服务文档](packages/server/README.md)
- [API 文档](packages/server/README.md#api-文档)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

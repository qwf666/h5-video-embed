# 开发指南

## 快速开始

### 方式 1：模拟数据模式（推荐用于开发）

```bash
cd packages/server
npm install
npm run dev:mock
```

这种模式会：
- ✅ 立即启动，无需等待下载
- ✅ 使用模拟视频数据进行测试
- ✅ 无需安装 Python 或 yt-dlp
- ✅ 完美用于前端开发和组件测试

### 方式 2：完整功能模式

```bash
cd packages/server
npm install
npm run dev
```

这种模式会：
- 🔄 首次启动时下载 yt-dlp（可能需要几分钟）
- 🔄 解析真实的视频数据
- ⚠️ 可能会因为网络问题超时

## 环境变量

创建 `.env` 文件：

```env
# 强制使用模拟数据
USE_MOCK_DATA=true

# 服务器端口
PORT=3001

# 开发环境
NODE_ENV=development
```

## 测试 API

### 健康检查
```bash
curl http://localhost:3001/health
```

### 测试路由
```bash
curl http://localhost:3001/api/test
```

### 视频解析（模拟数据）
```bash
curl -X POST http://localhost:3001/api/video/parse \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## 模拟数据说明

模拟数据模式下：
- 🎥 返回一个可用的演示视频（Big Buck Bunny）
- 📊 包含完整的视频元数据
- 🔄 根据输入 URL 调整平台信息
- ✅ 前端组件可以正常工作

## 故障排除

### youtube-dl-exec 下载失败
1. 检查网络连接
2. 使用模拟数据模式：`npm run dev:mock`
3. 手动设置环境变量：`USE_MOCK_DATA=true`

### 端口被占用
修改 `PORT` 环境变量或停止占用 3001 端口的进程

### 请求超时
模拟数据模式有 10 秒超时保护，真实解析失败会自动降级到模拟数据

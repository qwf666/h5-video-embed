# H5 Video Embed Server

专为国内主流视频平台优化的视频解析后端服务，基于 Express.js 和多重解析策略。

## 🎯 核心特性

- 🇨🇳 **国内平台优先**：专门优化抖音、B站、腾讯视频、西瓜视频、快手等主流平台
- 🚀 **多重解析策略**：专用API + 官方接口 + yt-dlp 通用后备
- 📊 **完整数据解析**：播放量、点赞数、评论数等完整统计信息
- 🎵 **丰富元数据**：音乐信息、话题标签、用户信息等
- 🔒 **企业级安全**：速率限制、输入验证、错误处理
- ⚡ **高性能**：智能平台识别，优先级解析
- 🔧 **RESTful API**：标准化接口设计

## 安装

### 安装 Node.js 依赖

```bash
cd packages/server
pnpm install
```

**真实业务逻辑，无模拟数据！**

本项目使用真实的视频平台 API 和 `youtube-dl-exec`，提供完整的视频解析功能。

### 可选：手动安装 yt-dlp（高级用户）

如果你想使用系统级的 yt-dlp 安装，可以安装：

```bash
# 使用 pip 安装
pip install yt-dlp

# macOS
brew install yt-dlp

# Ubuntu/Debian  
sudo apt install yt-dlp

# Windows (使用 chocolatey)
choco install yt-dlp
```

但这不是必需的，npm 包会自动处理所有依赖。

## 🔑 API 配置

为了获得最佳体验，建议配置 API 密钥：

1. **YouTube Data API v3**（推荐）：获取完整的视频信息
2. **Vimeo API**（可选）：增强 Vimeo 视频支持

详细配置步骤请参考：[API_SETUP.md](API_SETUP.md)

## 使用方法

### 开发模式

```bash
pnpm dev
```

### 生产模式

```bash
pnpm start
```

### 环境变量

创建 `.env` 文件（可选）：

```env
PORT=3001
NODE_ENV=development
```

## API 文档

### 1. 健康检查

```http
GET /health
```

**响应：**
```json
{
  "success": true,
  "message": "H5 Video Embed Server is running",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. 视频解析

```http
POST /api/video/parse
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "description": "Video description...",
    "duration": 212,
    "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    "uploader": "Rick Astley",
    "upload_date": "20091025",
    "view_count": 1000000000,
    "like_count": 10000000,
    "formats": [
      {
        "format_id": "22",
        "url": "https://...",
        "ext": "mp4",
        "quality": 720,
        "width": 1280,
        "height": 720,
        "fps": 30,
        "vcodec": "h264",
        "acodec": "aac"
      }
    ],
    "webpage_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "extractor": "youtube"
  },
  "message": "视频解析成功"
}
```

### 3. 获取缩略图

```http
GET /api/video/thumbnail?url=VIDEO_URL&quality=medium
```

**参数：**
- `url`: 视频链接（必需）
- `quality`: 缩略图质量，可选值：`low`, `medium`, `high`（默认：`medium`）

### 4. 支持的平台

```http
GET /api/platforms
```

## 支持的视频平台

## 🎬 支持的平台

### 🇨🇳 国内主流平台（专用 API，完全支持）

| 平台 | 域名 | 支持功能 | 状态 |
|------|------|----------|------|
| **抖音** | douyin.com, dy.com | 视频信息、用户信息、统计数据、音乐信息、话题标签 | ✅ 完全支持 |
| **B站** | bilibili.com, b23.tv | 视频信息、UP主信息、播放量、点赞数、投币数、收藏数、多P视频 | ✅ 完全支持 |
| **腾讯视频** | v.qq.com | 视频信息、剧集信息、基础数据 | ✅ 基础支持 |
| **西瓜视频** | ixigua.com | 视频信息、用户信息、播放数据、标签 | ✅ 完全支持 |
| **快手** | kuaishou.com | 视频信息、用户信息、基础数据 | ✅ 基础支持 |

### 🌍 国际平台（官方 API）

| 平台 | 支持功能 | 状态 |
|------|----------|------|
| **YouTube** | 完整视频信息、统计数据、标签分类 | ✅ Data API v3 |
| **Vimeo** | 基础视频信息 | ✅ oEmbed API |

### 📦 其他平台（yt-dlp 通用支持）

通过 yt-dlp 支持 1000+ 网站，包括：
- **国内**: 优酷、爱奇艺、芒果TV、微博视频、网易云音乐等
- **国际**: TikTok、Twitter、Instagram、Facebook、Twitch等

完整列表：[yt-dlp 支持的网站](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

## 错误处理

服务器提供详细的错误信息：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息（仅开发模式）"
}
```

常见错误码：
- `400`: 请求参数错误
- `404`: 视频不存在或无法访问
- `429`: 请求过于频繁
- `500`: 服务器内部错误

## 安全特性

- **CORS 支持**: 允许跨域请求
- **Helmet 安全头**: 设置安全的 HTTP 头
- **速率限制**: 防止 API 滥用（每 IP 每 15 分钟 100 次请求）
- **输入验证**: 验证 URL 格式和参数
- **超时控制**: 防止长时间挂起的请求

## 性能优化

- **格式过滤**: 只返回视频格式，忽略纯音频
- **格式限制**: 最多返回 5 个最佳质量格式
- **缓存支持**: 可配置 Redis 缓存（待实现）
- **并发控制**: 限制同时处理的请求数量

## 开发

### 项目结构

```
packages/server/
├── server.js          # 主服务器文件
├── package.json       # 项目配置
├── README.md          # 文档
└── .env.example       # 环境变量示例
```

### 开发调试

```bash
# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

### 测试 API

```bash
# 测试健康检查
curl http://localhost:3001/health

# 测试视频解析
curl -X POST http://localhost:3001/api/video/parse \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## 部署

### Docker 部署

```dockerfile
FROM node:18-alpine

RUN apk add --no-cache python3 py3-pip ffmpeg
RUN pip3 install yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3001

CMD ["npm", "start"]
```

### 环境要求

- Node.js >= 16.0.0
- Python >= 3.7（用于 yt-dlp）
- FFmpeg（可选，用于某些格式转换）

## 故障排除

### yt-dlp 未安装

```bash
# 检查 yt-dlp 安装
yt-dlp --version

# 如果未安装，使用 pip 安装
pip install yt-dlp
```

### 权限问题

确保 Node.js 进程有权限执行 yt-dlp 命令。

### 网络问题

某些视频平台可能需要代理访问，可以配置 yt-dlp 使用代理：

```bash
yt-dlp --proxy http://proxy:port URL
```

## 许可证

MIT

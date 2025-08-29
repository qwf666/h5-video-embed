# 🔑 API 配置指南

为了获得最佳的视频解析体验，建议配置以下 API 密钥。如果不配置，系统会自动使用功能受限的 oEmbed API。

## 🎥 YouTube Data API v3 配置（推荐）

### 1. 创建 Google 项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 在导航菜单中选择"API 和服务" > "库"

### 2. 启用 YouTube Data API v3
1. 搜索 "YouTube Data API v3"
2. 点击并启用该 API

### 3. 创建 API 密钥
1. 转到"API 和服务" > "凭据"
2. 点击"创建凭据" > "API 密钥"
3. 复制生成的 API 密钥
4. （可选）限制 API 密钥的使用范围

### 4. 配置环境变量
```bash
# 在 packages/server/ 目录下创建 .env 文件
YOUTUBE_API_KEY=your_actual_api_key_here
```

### 功能对比
| 功能 | oEmbed API | Data API v3 |
|------|------------|-------------|
| 视频标题 | ✅ | ✅ |
| 上传者 | ✅ | ✅ |
| 缩略图 | ✅ | ✅ (高清) |
| 视频时长 | ❌ | ✅ |
| 观看次数 | ❌ | ✅ |
| 点赞数 | ❌ | ✅ |
| 评论数 | ❌ | ✅ |
| 标签 | ❌ | ✅ |
| 分类 | ❌ | ✅ |
| 详细描述 | ❌ | ✅ |

## 📺 Bilibili API

Bilibili 使用公开 API，无需配置密钥。支持功能：
- ✅ 视频基本信息
- ✅ 观看/点赞/投币数据
- ✅ UP 主信息
- ✅ 标签和分类
- ✅ 多 P 视频支持

## 🎬 Vimeo API（可选）

### 配置步骤
1. 访问 [Vimeo Developer Portal](https://developer.vimeo.com/)
2. 创建应用程序
3. 获取访问令牌
4. 配置环境变量：
```bash
VIMEO_ACCESS_TOKEN=your_vimeo_token_here
```

## 🔄 解析策略

系统使用以下优先级顺序：

### 1. youtube-dl-exec（最高优先级）
- 支持 1000+ 网站
- 完整的视频格式信息
- 可能需要较长初始化时间

### 2. 官方平台 API（备选方案）
- YouTube: Data API v3 或 oEmbed
- Bilibili: 公开 API
- Vimeo: oEmbed 或官方 API
- 响应速度快，稳定性高

### 3. 错误处理
- 详细的错误日志
- 友好的错误信息
- 不会降级到模拟数据

## 🧪 测试 API 配置

### 测试 YouTube API
```bash
# 设置环境变量后重启服务器
cd packages/server
npm run dev

# 测试解析
curl -X POST http://localhost:3001/api/video/parse \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### 测试 Bilibili API
```bash
curl -X POST http://localhost:3001/api/video/parse \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.bilibili.com/video/BV1xx411c7mu"}'
```

## 🔒 安全建议

1. **API 密钥保护**
   - 不要将 API 密钥提交到版本控制
   - 使用环境变量存储敏感信息
   - 定期轮换 API 密钥

2. **API 限制**
   - 为 API 密钥设置使用限制
   - 监控 API 使用量
   - 实施速率限制

3. **错误处理**
   - 不在错误信息中暴露 API 密钥
   - 记录但不返回敏感错误信息

## 📊 配额管理

### YouTube Data API v3 配额
- 默认：10,000 单位/天
- 视频信息查询：1 单位/请求
- 可申请增加配额

### 成本优化建议
1. 缓存 API 响应
2. 批量请求（如果支持）
3. 只请求必要的字段
4. 使用 oEmbed 作为备选方案

## 🆘 故障排除

### YouTube API 错误
- `403 Forbidden`: 检查 API 密钥和配额
- `400 Bad Request`: 检查视频 ID 格式
- `404 Not Found`: 视频可能已删除或私有

### Bilibili API 错误
- 网络超时：可能是网络问题
- 视频不存在：检查 BV 号是否正确
- 地区限制：某些视频可能有地区限制

### 通用解决方案
1. 检查网络连接
2. 验证 URL 格式
3. 查看服务器日志
4. 使用 youtube-dl-exec 作为备选

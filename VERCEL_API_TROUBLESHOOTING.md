# Vercel API 部署排错指南

## 🔍 问题诊断

### 1. API 404 错误的原因分析

在 Vercel 部署后遇到 API 404 错误，通常是以下原因：

#### ✅ 已修复的问题
- **API 路由配置缺失**: `vercel.json` 现已包含正确的路由配置
- **CORS 头设置**: 添加了完整的 CORS 支持
- **ES 模块语法**: API 文件使用正确的 ES 模块语法
- **函数运行时**: 指定了 Node.js 18.x 运行时

#### 🔧 可能需要调试的问题
- **依赖导入问题**: API 文件避免了复杂的相对路径导入
- **环境变量**: 确保必要的环境变量已正确设置

## 📁 当前 API 结构

```
api/
├── test.js                    # 测试端点
├── video.js                   # 主视频解析端点 (重定向到 video/parse)
├── video/
│   └── parse.js              # 完整的视频解析实现
├── proxy/
│   ├── parse.js              # 通用代理解析
│   └── bilibili/
│       └── parse.js          # B站专用解析
└── package.json              # API 模块配置
```

## 🌐 API 端点映射

| 前端调用路径 | Vercel 文件 | 功能描述 |
|-------------|-------------|----------|
| `/api/test` | `api/test.js` | 测试端点，验证 API 可用性 |
| `/api/video/parse` | `api/video/parse.js` | 主要视频解析端点 |
| `/api/proxy/parse` | `api/proxy/parse.js` | 通用代理解析 |
| `/api/proxy/bilibili/parse` | `api/proxy/bilibili/parse.js` | B站专用解析 |
| `/api/video` | `api/video.js` | 兼容端点（重定向） |

## 🛠️ 部署验证步骤

### 1. 测试 API 可用性
```bash
# 测试基础 API
curl https://your-domain.vercel.app/api/test

# 测试视频解析
curl -X POST https://your-domain.vercel.app/api/video/parse \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.bilibili.com/video/BV1A1hXzHEou"}'
```

### 2. 检查 Vercel 日志
在 Vercel Dashboard 中查看：
- Functions 页面的执行日志
- 部署日志中的构建信息
- 实时日志 (Real-time Logs)

### 3. 环境变量设置
在 Vercel Dashboard → Settings → Environment Variables 中设置：
```
YOUTUBE_API_KEY=your_youtube_api_key  # 可选，用于 YouTube 解析
NODE_ENV=production
```

## 🐛 常见问题排错

### 问题 1: API 返回 404
**症状**: 所有 API 请求返回 404
**原因**: `vercel.json` 路由配置问题
**解决方案**: 确保 `vercel.json` 包含正确的路由配置

### 问题 2: CORS 错误
**症状**: 浏览器控制台显示跨域错误
**原因**: CORS 头设置不正确
**解决方案**: 检查 `vercel.json` 中的 headers 配置

### 问题 3: 函数超时
**症状**: API 请求超时
**原因**: 外部 API 调用时间过长
**解决方案**: 
- 检查网络连接
- 添加适当的超时处理
- 使用前端解析模式

### 问题 4: 模块导入错误
**症状**: 500 错误，日志显示 import 失败
**原因**: 相对路径导入或依赖问题
**解决方案**: 使用简化的 API 实现，避免复杂依赖

## 🎯 前端配置建议

### Demo App 配置
```javascript
// packages/demo-app/src/App.jsx
serverUrl: import.meta.env.VITE_SERVER_URL || 
  (window.location.hostname === 'localhost' ? 
    "http://localhost:3001" : 
    window.location.origin  // Vercel 环境使用当前域名
  )
```

### 解析模式选择
- **前端解析模式** (推荐): 速度快，无服务器依赖
- **后端解析模式**: 功能完整，需要 API 正常工作
- **智能模式**: 前端优先，后端降级

## 📊 性能优化建议

### 1. 使用前端解析优先策略
```javascript
preferFrontend={true}
strictFrontendOnly={parseMode === 'frontend'}
```

### 2. 设置合理的超时时间
```javascript
// 在 API 函数中添加超时控制
const controller = new AbortController();
setTimeout(() => controller.abort(), 10000); // 10秒超时
```

### 3. 缓存策略
- B站、YouTube 等平台的基础信息可以缓存
- 使用 CDN 缓存静态视频信息

## 🔍 调试工具

### 1. API 测试脚本
```javascript
// 在浏览器控制台中运行
async function testAPI() {
  const response = await fetch('/api/test');
  const data = await response.json();
  console.log('API Test:', data);
}
testAPI();
```

### 2. 详细错误日志
每个 API 端点都包含详细的错误信息和建议，方便排错。

### 3. 前端调试信息
Demo 应用在开发模式下显示详细的配置状态和统计信息。

## 📱 移动端适配

确保 API 响应包含移动端友好的播放链接：
- 使用 `embed_url` 而不是直接视频文件
- 支持响应式播放器尺寸
- 处理移动端的自动播放限制

## 🔐 安全注意事项

1. **API 密钥保护**: 敏感的 API 密钥应设置为环境变量
2. **速率限制**: 考虑添加 API 调用频率限制
3. **输入验证**: 所有 API 端点都包含输入验证
4. **错误信息**: 生产环境中不暴露敏感错误信息

## 📈 监控和分析

建议添加：
- API 调用成功率统计
- 响应时间监控
- 错误类型分析
- 热门视频平台统计

---

## 🚀 快速解决方案

如果仍然遇到 404 问题，尝试以下步骤：

1. **重新部署项目**
2. **检查 Vercel 项目设置**
3. **验证 git 提交包含所有修改**
4. **测试 `/api/test` 端点**
5. **查看 Vercel 函数日志**

如果问题持续存在，请检查 Vercel Dashboard 中的具体错误信息。

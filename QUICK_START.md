# 🚀 快速开始指南

> 5分钟内让H5 Video Embed在你的项目中运行起来！

## 📦 安装

选择你喜欢的包管理器：

```bash
# npm
npm install h5-video-embed

# yarn  
yarn add h5-video-embed

# pnpm (推荐)
pnpm add h5-video-embed
```

## ⚡ 最简使用

### 1. 基础导入

```jsx
import React from 'react';
import { VideoEmbed } from 'h5-video-embed';

function App() {
  return (
    <div>
      <h1>我的视频播放器</h1>
      <VideoEmbed 
        url="https://www.bilibili.com/video/BV1GJ411x7h7"
        width="800px"
        height="450px"
      />
    </div>
  );
}

export default App;
```

就这么简单！视频已经可以播放了。🎉

### 2. 添加事件处理

```jsx
<VideoEmbed 
  url="https://www.bilibili.com/video/BV1GJ411x7h7"
  width="100%"
  height="400px"
  onLoad={(data, source) => {
    console.log('视频加载成功！');
    console.log('解析来源:', source); // 'frontend' 或 'backend'
    console.log('视频信息:', data);
  }}
  onError={(error) => {
    console.error('视频加载失败:', error);
  }}
/>
```

## 🎯 选择解析模式

### 纯前端模式 (推荐新手)

```jsx
<VideoEmbed 
  url="https://www.bilibili.com/video/BV1GJ411x7h7"
  strictFrontendOnly={true}  // 不调用后端，纯前端解析
/>
```

**优点**: 
- ✅ 无需后端服务器
- ✅ 部署简单 (可用于GitHub Pages)
- ✅ 响应速度快

**支持**: B站、YouTube、Vimeo等

### 智能模式 (生产环境推荐)

```jsx
<VideoEmbed 
  url="https://www.douyin.com/video/123456"
  preferFrontend={true}                    // 优先前端
  serverUrl="http://localhost:3001"       // 后端服务器
/>
```

**优点**:
- ✅ 最佳用户体验
- ✅ 支持所有平台
- ✅ 智能降级机制

**需要**: 启动后端服务器

### 纯后端模式 (企业级)

```jsx
<VideoEmbed 
  url="https://www.kuaishou.com/short-video/abc123"
  forceBackendOnly={true}                  // 强制后端解析
  serverUrl="https://your-api.com"
/>
```

**优点**:
- ✅ 最完整数据
- ✅ 99%解析成功率
- ✅ 支持1000+网站

## 🛠️ 启动后端服务 (可选)

如果你想要完整功能，需要启动后端服务：

### 方法一：轻量代理服务器

```bash
# 克隆项目
git clone https://github.com/your-username/h5-video-embed.git
cd h5-video-embed

# 安装依赖
pnpm install

# 启动轻量代理 (仅CORS代理功能)
cd packages/server
npm run proxy
```

访问: http://localhost:3001

### 方法二：完整解析服务器

```bash
# 启动完整功能服务器
cd packages/server  
npm start
```

访问: http://localhost:3001

## 🎨 自定义样式

### CSS类名自定义

```jsx
<VideoEmbed 
  url="https://www.bilibili.com/video/BV1GJ411x7h7"
  className="my-video-player"
  style={{
    border: '2px solid #007bff',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  }}
/>
```

### 全局CSS样式

```css
.my-video-player {
  max-width: 100%;
  margin: 20px auto;
}

.my-video-player iframe {
  border-radius: 12px;
}
```

## 🌐 支持的链接格式

### B站链接示例
```
✅ https://www.bilibili.com/video/BV1GJ411x7h7
✅ https://www.bilibili.com/video/av12345678  
✅ https://b23.tv/BV1GJ411x7h7
✅ https://www.bilibili.com/video/BV1GJ411x7h7?p=2
✅ https://www.bilibili.com/bangumi/play/ep123456
✅ https://live.bilibili.com/12345
```

### YouTube链接示例
```
✅ https://www.youtube.com/watch?v=dQw4w9WgXcQ
✅ https://youtu.be/dQw4w9WgXcQ
✅ https://www.youtube.com/embed/dQw4w9WgXcQ
```

### 其他平台
```
✅ 抖音: https://www.douyin.com/video/123456
✅ 腾讯: https://v.qq.com/x/cover/abc/def.html
✅ 西瓜: https://www.ixigua.com/123456
✅ 快手: https://www.kuaishou.com/short-video/abc123
✅ Vimeo: https://vimeo.com/123456
```

## 🔧 环境变量配置 (可选)

创建 `.env` 文件:

```bash
# YouTube API密钥 (可选，提升YouTube解析质量)
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here

# 后端服务器地址 (可选，默认localhost:3001)  
VITE_SERVER_URL=http://localhost:3001
```

## 📱 响应式设计

```jsx
// 移动端友好
<VideoEmbed 
  url="https://www.bilibili.com/video/BV1GJ411x7h7"
  width="100%"                    // 自适应宽度
  height="56.25vw"               // 16:9响应式高度
  style={{ maxHeight: '400px' }} // 限制最大高度
/>

// 或者使用CSS
<VideoEmbed 
  url="https://www.bilibili.com/video/BV1GJ411x7h7"
  className="responsive-video"
/>
```

```css
.responsive-video {
  width: 100%;
  aspect-ratio: 16/9;
  max-width: 800px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .responsive-video {
    aspect-ratio: 9/16; /* 移动端竖屏 */
  }
}
```

## 🎮 完整配置示例

```jsx
import React, { useState } from 'react';
import { VideoEmbed } from 'h5-video-embed';

function MyVideoPlayer() {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState('auto');
  
  return (
    <div className="video-player-container">
      {/* URL输入 */}
      <div className="controls">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入视频链接..."
          style={{ width: '400px', padding: '8px' }}
        />
        
        {/* 模式选择 */}
        <select 
          value={mode} 
          onChange={(e) => setMode(e.target.value)}
          style={{ marginLeft: '10px', padding: '8px' }}
        >
          <option value="auto">智能模式</option>
          <option value="frontend">纯前端</option>
          <option value="backend">纯后端</option>
        </select>
      </div>
      
      {/* 视频播放器 */}
      {url && (
        <VideoEmbed
          url={url}
          width="100%"
          height="400px"
          autoplay={false}
          controls={true}
          muted={false}
          
          // 模式控制
          preferFrontend={mode === 'auto' || mode === 'frontend'}
          strictFrontendOnly={mode === 'frontend'}
          forceBackendOnly={mode === 'backend'}
          
          // 服务器配置
          serverUrl={process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'}
          youtubeApiKey={process.env.REACT_APP_YOUTUBE_API_KEY}
          
          // 事件处理
          onLoad={(data, source) => {
            console.log(`${source}解析成功:`, data.title);
            alert(`视频加载成功！\n标题: ${data.title}\n平台: ${data.platform_name}`);
          }}
          
          onError={(error) => {
            console.error('解析失败:', error);
            alert('视频解析失败，请检查链接是否正确');
          }}
          
          // 样式
          className="my-video-embed"
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginTop: '20px'
          }}
        />
      )}
    </div>
  );
}

export default MyVideoPlayer;
```

## 🚨 常见问题

### Q: 为什么某些平台解析失败？

**A**: 不同平台有不同限制：
- **前端模式**: 仅支持CORS友好的平台 (B站、YouTube、Vimeo)
- **抖音/快手**: 需要后端解析或代理服务器
- **解决方案**: 启动后端服务器或切换到智能模式

### Q: 如何提高解析成功率？

**A**: 使用智能模式或后端模式：
```jsx
<VideoEmbed 
  url={url}
  preferFrontend={true}           // 前端优先
  serverUrl="http://localhost:3001" // 失败时降级到后端
/>
```

### Q: 可以部署到GitHub Pages吗？

**A**: 可以！使用纯前端模式：
```jsx
<VideoEmbed 
  url={url}
  strictFrontendOnly={true}  // 不调用后端，适合静态部署
/>
```

### Q: 如何获取视频信息而不播放？

**A**: 监听onLoad事件：
```jsx
<VideoEmbed 
  url={url}
  onLoad={(data, source) => {
    // data包含完整的视频信息
    console.log('标题:', data.title);
    console.log('时长:', data.duration_formatted);
    console.log('播放量:', data.view_count);
  }}
/>
```

## 🎯 下一步

1. **查看演示**: 运行 `pnpm run dev` 查看完整演示
2. **阅读文档**: 查看 [API文档](README.md#api文档)
3. **自定义样式**: 参考 [样式指南](packages/demo-app/src/App.css)
4. **部署指南**: 阅读 [部署说明](README.md#部署指南)

## 💡 提示

- 🚀 **新手**: 从纯前端模式开始，简单易用
- 🎯 **进阶**: 使用智能模式，获得最佳体验  
- 🏢 **企业**: 选择纯后端模式，功能最完整

现在开始构建你的视频应用吧！如有问题，欢迎在GitHub提交Issue。🎉
# H5 Video Embed

一个用于嵌入和播放各种视频平台内容的 React 组件库。

## 特性

- 🎥 支持多种视频平台（YouTube、Bilibili、Vimeo 等）
- 📱 响应式设计，适配移动端
- 🎨 可自定义样式和主题
- ⚡ 轻量级，无额外依赖
- 🔧 TypeScript 支持
- 🎮 丰富的播放控制选项

## 安装

```bash
npm install h5-video-embed
# 或
yarn add h5-video-embed
# 或
pnpm add h5-video-embed
```

## 使用方法

### 基本用法

```jsx
import React from 'react';
import { VideoEmbed } from 'h5-video-embed';

function App() {
  return (
    <div>
      <VideoEmbed 
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        width="800px"
        height="450px"
      />
    </div>
  );
}
```

### 高级用法

```jsx
import React from 'react';
import { VideoEmbed } from 'h5-video-embed';

function App() {
  const handleVideoLoad = (videoData) => {
    console.log('视频加载成功:', videoData);
  };

  const handleVideoError = (error) => {
    console.error('视频加载失败:', error);
  };

  return (
    <VideoEmbed 
      url="https://www.bilibili.com/video/BV1xx411c7mu"
      width="100%"
      height="500px"
      autoplay={false}
      controls={true}
      muted={false}
      serverUrl="http://localhost:3001"
      onLoad={handleVideoLoad}
      onError={handleVideoError}
      className="my-video-player"
      style={{ borderRadius: '12px' }}
    />
  );
}
```

## Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `url` | string | - | 视频链接（必需） |
| `width` | string | '100%' | 视频宽度 |
| `height` | string | '315' | 视频高度 |
| `autoplay` | boolean | false | 是否自动播放 |
| `controls` | boolean | true | 是否显示播放控件 |
| `muted` | boolean | false | 是否静音 |
| `serverUrl` | string | 'http://localhost:3001' | 后端服务地址 |
| `onLoad` | function | - | 视频加载成功回调 |
| `onError` | function | - | 视频加载失败回调 |
| `className` | string | '' | 自定义 CSS 类名 |
| `style` | object | {} | 自定义样式 |

## 支持的视频平台

- YouTube
- Bilibili
- Vimeo
- 其他通过后端服务支持的平台

## 工具函数

```jsx
import { 
  extractVideoId, 
  isValidUrl, 
  formatDuration,
  getVideoPlatform,
  getVideoThumbnail
} from 'h5-video-embed';

// 提取视频 ID
const videoId = extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

// 验证 URL
const isValid = isValidUrl('https://example.com/video');

// 格式化时长
const duration = formatDuration(3661); // "01:01:01"

// 获取平台类型
const platform = getVideoPlatform('https://www.youtube.com/watch?v=abc123');

// 获取缩略图
const thumbnail = getVideoThumbnail('https://www.youtube.com/watch?v=abc123', 'high');
```

## 配合后端服务

此组件需要配合后端服务使用，后端服务负责视频解析和代理。请确保后端服务正在运行并且 `serverUrl` 配置正确。

后端服务项目请参考：[h5-video-embed-server](../server)

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 代码检查
pnpm lint
```

## 许可证

MIT

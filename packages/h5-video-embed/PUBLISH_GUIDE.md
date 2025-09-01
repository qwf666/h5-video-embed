# H5 Video Embed - NPM 发布指南

## 📋 发布准备清单

### ✅ 已完成的步骤
- [x] 更新 package.json 配置
- [x] 设置 h5-video-embed 作为包名
- [x] 创建 LICENSE 文件
- [x] 更新 README.md 文档
- [x] 配置 .npmignore 文件
- [x] 构建产物已生成（dist/ 目录）
- [x] 包预览检查通过

### 📦 包信息
- **包名**: `h5-video-embed`
- **版本**: `1.0.0`
- **大小**: 125.4 kB (打包后)
- **文件数**: 8 个文件

## 🚀 发布步骤

### 1. 登录 npm 账户
```bash
npm login
# 或者使用
npm adduser
```

输入您的 npm 用户名、密码和邮箱。

### 2. 验证登录状态
```bash
npm whoami
```

### 3. 最终构建
```bash
pnpm run build
```

### 4. 发布到 npm
```bash
npm publish
```

包使用了标准的 npm 包名 (h5-video-embed)，可以直接发布。

### 5. 验证发布
发布成功后，可以通过以下方式验证：
```bash
npm view h5-video-embed
```

## 📝 发布后的使用方式

### 安装
```bash
npm install h5-video-embed
# 或
yarn add h5-video-embed
# 或
pnpm add h5-video-embed
```

### 使用
```jsx
import React from 'react';
import { VideoEmbed } from 'h5-video-embed';

function App() {
  return (
    <VideoEmbed
      url="https://www.bilibili.com/video/BV1A1hXzHEou"
      width="100%"
      height="400px"
      strictFrontendOnly={true} // 纯前端解析模式
      onLoad={(data, source) => {
        console.log('视频加载成功:', data);
        console.log('解析来源:', source);
      }}
    />
  );
}
```

## 🔧 版本管理

### 更新版本
```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 次要版本 (1.0.0 -> 1.1.0)
npm version minor

# 主要版本 (1.0.0 -> 2.0.0)
npm version major
```

### 重新发布
```bash
pnpm run build
npm publish
```

## 📊 包内容

当前包包含以下文件：
- `dist/index.d.ts` - TypeScript 类型定义
- `dist/index.es.js` - ES 模块版本
- `dist/index.es.js.map` - ES 模块 source map
- `dist/index.umd.js` - UMD 版本
- `dist/index.umd.js.map` - UMD source map
- `README.md` - 使用文档
- `LICENSE` - MIT 许可证
- `package.json` - 包配置

## 🎯 支持的平台

- ✅ Bilibili (B站)
- ✅ YouTube
- ✅ 抖音 (Douyin)
- ✅ 腾讯视频
- ✅ 西瓜视频
- ✅ 快手
- ✅ Vimeo

## 🌟 特色功能

- **纯前端解析**: 完全不依赖后端的解析模式
- **中国平台优化**: 特别针对国内视频平台优化
- **响应式设计**: 自适应各种屏幕尺寸
- **TypeScript 支持**: 完整的类型定义

## 📞 支持

- GitHub: https://github.com/qwf666/h5-video-embed
- Issues: https://github.com/qwf666/h5-video-embed/issues
- Demo: https://h5-video-embed-demo-app.vercel.app/

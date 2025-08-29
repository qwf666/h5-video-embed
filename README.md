# H5 Video Embed Monorepo

这是一个用于 H5 视频嵌入的 monorepo 项目，包含前端组件库、后端服务和演示应用。

## 项目结构

```
h5-video-embed-monorepo/
├─ package.json         # 根目录，统一管理依赖
├─ pnpm-workspace.yaml  # pnpm workspace 配置
├─ packages/
│  ├─ h5-video-embed/   # 前端 React 组件库（npm 包）
│  ├─ server/           # 后端服务（Express + yt-dlp）
│  └─ demo-app/         # 演示应用（React）
└─ README.md
```

## 快速开始

> 📖 详细的快速开始指南请查看：[QUICK_START.md](QUICK_START.md)

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm run install:all
```

**无需安装 Python 或 yt-dlp！** 本项目使用 `youtube-dl-exec` npm 包自动管理所有依赖。

### 启动项目

#### 方式 1：Windows 一键启动

```bash
# 双击运行或在命令行执行
start.bat

# 或 PowerShell
./start.ps1
```

#### 方式 2：使用 pnpm（推荐）

```bash
# 同时启动后端服务和演示应用
pnpm dev
```

#### 方式 3：使用 npm

```bash
# 同时启动后端服务和演示应用
npm run dev:npm
```

#### 方式 4：分别启动

```bash
# 启动后端服务（端口 3001）
cd packages/server && npm run dev

# 新开终端，启动演示应用（端口 3000）
cd packages/demo-app && npm run dev
```

### 构建

```bash
pnpm build
```

## 子项目

- **h5-video-embed**: 前端 React 组件库，用于嵌入和播放视频
- **server**: 后端服务，提供视频解析和代理功能
- **demo-app**: 演示应用，展示如何使用 h5-video-embed 组件

## 技术栈

- **前端**: React, Vite
- **后端**: Express.js, yt-dlp
- **包管理**: pnpm workspace
- **构建工具**: Vite, Rollup

## 许可证

MIT

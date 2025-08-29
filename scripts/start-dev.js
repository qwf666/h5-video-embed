#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 启动 H5 Video Embed 开发环境...\n');

// 启动后端服务
console.log('📦 启动后端服务...');
const server = spawn('pnpm', ['dev'], {
  cwd: join(projectRoot, 'packages/server'),
  stdio: 'inherit',
  shell: true
});

// 等待 2 秒后启动前端
setTimeout(() => {
  console.log('🎨 启动演示应用...');
  const demo = spawn('pnpm', ['dev'], {
    cwd: join(projectRoot, 'packages/demo-app'),
    stdio: 'inherit',
    shell: true
  });

  // 处理进程退出
  const cleanup = () => {
    console.log('\n🛑 正在关闭开发服务器...');
    server.kill();
    demo.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

}, 2000);

console.log(`
✨ 开发环境已启动！

📍 服务地址：
  - 后端 API: http://localhost:3001
  - 演示应用: http://localhost:3000

🔧 可用命令：
  - Ctrl+C: 停止所有服务
  - 访问 http://localhost:3000 查看演示

💡 提示：
  - 确保已安装 yt-dlp: pip install yt-dlp
  - 后端服务需要几秒钟启动时间
`);

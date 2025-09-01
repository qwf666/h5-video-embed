#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 开始Vercel构建流程 (使用pnpm)...');

// 工作目录
const rootDir = process.cwd();
const libDir = path.join(rootDir, 'packages/h5-video-embed');
const demoDir = path.join(rootDir, 'packages/demo-app');

function runCommand(command, cwd = rootDir) {
  console.log(`📁 在目录 ${cwd} 执行: ${command}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit', 
      env: { ...process.env, NODE_ENV: 'production' }
    });
  } catch (error) {
    console.error(`❌ 命令执行失败: ${command}`);
    throw error;
  }
}

// 步骤1: 安装pnpm依赖（支持workspace）
console.log('\n📦 步骤1: 使用pnpm安装workspace依赖...');
runCommand('pnpm install --frozen-lockfile');

// 步骤2: 构建组件库
console.log('\n📦 步骤2: 构建h5-video-embed组件库...');
runCommand('pnpm run build', libDir);

// 步骤3: 构建demo-app（workspace依赖已自动解析）
console.log('\n🏗️ 步骤3: 构建demo-app...');
runCommand('pnpm run build', demoDir);

// 步骤4: 验证构建结果
console.log('\n✅ 步骤4: 验证构建结果...');
const distDir = path.join(demoDir, 'dist');
if (fs.existsSync(distDir)) {
  const distFiles = fs.readdirSync(distDir);
  console.log(`📁 构建产物 (${distFiles.length} 个文件):`);
  distFiles.forEach(file => console.log(`  - ${file}`));
} else {
  throw new Error('❌ 构建失败: dist目录不存在');
}

// 步骤5: 复制构建产物到根目录（Vercel要求）
console.log('\n📦 步骤5: 复制构建产物到根目录...');
const rootDistDir = path.join(rootDir, 'dist');

// 删除可能存在的根目录dist
if (fs.existsSync(rootDistDir)) {
  console.log('🗑️ 删除现有的dist目录...');
  fs.rmSync(rootDistDir, { recursive: true, force: true });
}

// 复制demo-app的dist到根目录
console.log('📋 复制构建产物...');
const copyRecursive = (src, dest) => {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    items.forEach(item => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

copyRecursive(distDir, rootDistDir);

console.log('\n🎉 Vercel构建流程完成!');
console.log(`📦 输出目录: ${rootDistDir}`);

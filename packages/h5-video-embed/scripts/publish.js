#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始 H5 Video Embed 包发布流程...');

// 检查当前工作目录
const packagePath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('❌ 找不到 package.json 文件');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
console.log(`📦 包名: ${packageJson.name}`);
console.log(`📌 版本: ${packageJson.version}`);

function runCommand(command, description) {
  console.log(`\n⚡ ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: path.dirname(packagePath) });
    console.log(`✅ ${description} 完成`);
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    process.exit(1);
  }
}

// 检查 npm 登录状态
try {
  console.log('\n🔐 检查 npm 登录状态...');
  const username = execSync('npm whoami', { encoding: 'utf8', cwd: path.dirname(packagePath) }).trim();
  console.log(`✅ 已登录为: ${username}`);
} catch (error) {
  console.error('❌ 未登录 npm，请先运行: npm login');
  process.exit(1);
}

// 构建流程
console.log('\n🏗️ 开始构建流程...');

// 1. 清理旧的构建文件
if (fs.existsSync(path.join(path.dirname(packagePath), 'dist'))) {
  runCommand('rm -rf dist || rmdir /s dist', '清理旧构建文件');
}

// 2. 安装依赖
runCommand('pnpm install', '安装依赖');

// 3. 构建包
runCommand('pnpm run build', '构建包');

// 4. 检查构建结果
const distPath = path.join(path.dirname(packagePath), 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ 构建失败：dist 目录不存在');
  process.exit(1);
}

const distFiles = fs.readdirSync(distPath);
console.log(`✅ 构建完成，生成 ${distFiles.length} 个文件:`);
distFiles.forEach(file => console.log(`  - ${file}`));

// 5. 预览包内容
console.log('\n📋 预览包内容...');
try {
  execSync('npm pack --dry-run', { stdio: 'inherit', cwd: path.dirname(packagePath) });
} catch (error) {
  console.error('❌ 包预览失败:', error.message);
  process.exit(1);
}

// 6. 询问是否继续发布
console.log('\n❓ 确认发布到 npm? (y/N)');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question('请输入 y 确认发布: ', (answer) => {
  readline.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('❌ 发布已取消');
    process.exit(0);
  }
  
  // 7. 发布到 npm
  runCommand('npm publish', '发布到 npm');
  
  console.log('\n🎉 发布成功！');
  console.log(`📦 包已发布到: https://www.npmjs.com/package/${packageJson.name}`);
  console.log(`📖 使用方法: npm install ${packageJson.name}`);
  
  // 8. 验证发布
  setTimeout(() => {
    console.log('\n🔍 验证发布结果...');
    try {
      execSync(`npm view ${packageJson.name}`, { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ 验证失败，可能需要等待几分钟后再试');
    }
  }, 3000);
});

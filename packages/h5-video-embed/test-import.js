// 测试导入是否正常工作
const fs = require('fs');
const path = require('path');

console.log('🧪 测试 h5-video-embed 包导入...');

// 检查必需文件是否存在
const distPath = path.join(__dirname, 'dist');
const requiredFiles = [
  'index.d.ts',
  'index.es.js', 
  'index.umd.js'
];

console.log('\n📁 检查构建文件:');
requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 检查 package.json 导出配置
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
console.log('\n📦 Package.json 配置:');
console.log(`  main: ${packageJson.main}`);
console.log(`  module: ${packageJson.module}`);
console.log(`  types: ${packageJson.types}`);
console.log(`  exports:`, JSON.stringify(packageJson.exports, null, 2));

// 检查类型定义文件内容
const typesPath = path.join(distPath, 'index.d.ts');
if (fs.existsSync(typesPath)) {
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  console.log('\n📝 类型定义文件内容 (前5行):');
  typesContent.split('\n').slice(0, 5).forEach((line, i) => {
    console.log(`  ${i + 1}: ${line}`);
  });
}

console.log('\n✅ 包结构检查完成');
console.log('\n💡 使用方法:');
console.log('  import { VideoEmbed } from "h5-video-embed";');
console.log('  // 或');
console.log('  const { VideoEmbed } = require("h5-video-embed");');

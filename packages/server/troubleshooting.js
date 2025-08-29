// 故障排除和诊断工具
import youtubeDl from 'youtube-dl-exec';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class TroubleshootingTool {
  async diagnose() {
    console.log('🔍 开始诊断 youtube-dl-exec 问题...\n');
    
    await this.checkNetworkConnectivity();
    await this.checkYoutubeDlExecInstallation();
    await this.testYoutubeDlExec();
    await this.checkPermissions();
    
    console.log('\n📋 诊断完成');
  }

  async checkNetworkConnectivity() {
    console.log('1. 检查网络连接...');
    try {
      const response = await fetch('https://github.com');
      if (response.ok) {
        console.log('   ✅ GitHub 连接正常');
      } else {
        console.log('   ⚠️ GitHub 连接异常，状态码:', response.status);
      }
    } catch (error) {
      console.log('   ❌ 网络连接失败:', error.message);
      console.log('   💡 建议：检查网络连接或使用代理');
    }
  }

  async checkYoutubeDlExecInstallation() {
    console.log('\n2. 检查 youtube-dl-exec 安装...');
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const youtubeDlVersion = packageJson.dependencies['youtube-dl-exec'];
      console.log('   ✅ youtube-dl-exec 版本:', youtubeDlVersion);
      
      // 检查 node_modules
      const modulePath = path.join('node_modules', 'youtube-dl-exec');
      if (fs.existsSync(modulePath)) {
        console.log('   ✅ node_modules 中存在 youtube-dl-exec');
      } else {
        console.log('   ❌ node_modules 中缺少 youtube-dl-exec');
        console.log('   💡 建议：运行 npm install');
      }
      
    } catch (error) {
      console.log('   ❌ 检查安装失败:', error.message);
    }
  }

  async testYoutubeDlExec() {
    console.log('\n3. 测试 youtube-dl-exec 功能...');
    
    try {
      console.log('   🔄 尝试获取版本信息（30秒超时）...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('超时')), 30000);
      });
      
      const versionPromise = youtubeDl('--version');
      const version = await Promise.race([versionPromise, timeoutPromise]);
      
      console.log('   ✅ youtube-dl-exec 工作正常');
      console.log('   📦 版本信息:', version.trim().split('\n')[0]);
      
    } catch (error) {
      console.log('   ❌ youtube-dl-exec 测试失败');
      console.log('   📝 错误类型:', error.name);
      console.log('   📝 错误信息:', error.message);
      
      if (error.message.includes('超时')) {
        console.log('   💡 可能原因：首次运行需要下载 yt-dlp 二进制文件');
        console.log('   💡 建议：等待更长时间或使用模拟数据模式');
      }
      
      if (error.message.includes('ENOENT')) {
        console.log('   💡 可能原因：yt-dlp 二进制文件未找到');
        console.log('   💡 建议：检查网络连接和防火墙设置');
      }
    }
  }

  async checkPermissions() {
    console.log('\n4. 检查文件权限...');
    try {
      const tempFile = path.join(__dirname, 'temp_test.txt');
      fs.writeFileSync(tempFile, 'test');
      fs.unlinkSync(tempFile);
      console.log('   ✅ 文件写入权限正常');
    } catch (error) {
      console.log('   ❌ 文件权限问题:', error.message);
      console.log('   💡 建议：以管理员身份运行或检查目录权限');
    }
  }

  async testVideoUrlParsing(url) {
    console.log(`\n🎥 测试解析视频 URL: ${url}`);
    
    try {
      const result = await youtubeDl(url, {
        dumpSingleJson: true,
        noDownload: true,
        simulate: true
      });
      
      console.log('   ✅ URL 解析成功');
      console.log('   📹 标题:', result.title);
      console.log('   👤 上传者:', result.uploader);
      console.log('   ⏱️ 时长:', result.duration, '秒');
      
    } catch (error) {
      console.log('   ❌ URL 解析失败');
      console.log('   📝 错误:', error.message);
      
      if (error.message.includes('Video unavailable')) {
        console.log('   💡 可能原因：视频不可用或地区限制');
      } else if (error.message.includes('network')) {
        console.log('   💡 可能原因：网络连接问题');
      }
    }
  }

  async manuallyInstallYtDlp() {
    console.log('\n🔧 尝试手动安装 yt-dlp...');
    
    return new Promise((resolve) => {
      const process = spawn('pip', ['install', 'yt-dlp'], {
        stdio: 'inherit'
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          console.log('   ✅ yt-dlp 手动安装成功');
        } else {
          console.log('   ❌ yt-dlp 手动安装失败');
        }
        resolve(code === 0);
      });
      
      process.on('error', (error) => {
        console.log('   ❌ 无法运行 pip:', error.message);
        console.log('   💡 建议：安装 Python 和 pip');
        resolve(false);
      });
    });
  }
}

// 如果直接运行此脚本
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tool = new TroubleshootingTool();
  
  if (process.argv[2] === 'test-url' && process.argv[3]) {
    await tool.testVideoUrlParsing(process.argv[3]);
  } else {
    await tool.diagnose();
  }
}

export default TroubleshootingTool;

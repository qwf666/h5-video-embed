// B站解析器测试脚本
import BilibiliParser from './src/parsers/BilibiliParser.js';

// 测试用例
const testUrls = [
  // 标准BV号视频
  'https://www.bilibili.com/video/BV1xx411c7mD',
  // av号视频
  'https://www.bilibili.com/video/av12345678',
  // 分P视频
  'https://www.bilibili.com/video/BV1xx411c7mD?p=2',
  // 移动端链接
  'https://m.bilibili.com/video/BV1xx411c7mD',
  // 番剧链接
  'https://www.bilibili.com/bangumi/play/ep123456',
  'https://www.bilibili.com/bangumi/play/ss12345',
  // 直播间链接
  'https://live.bilibili.com/12345',
  // 合集链接
  'https://www.bilibili.com/medialist/play/ml123456',
  // 短链接
  'https://b23.tv/abcdefg',
  // 播放器嵌入链接
  'https://player.bilibili.com/player.html?bvid=BV1xx411c7mD&autoplay=0',
  // 带时间戳的链接
  'https://www.bilibili.com/video/BV1xx411c7mD?t=120'
];

async function testBilibiliParser() {
  console.log('🧪 开始测试B站解析器...\n');
  
  const parser = new BilibiliParser();
  
  for (const url of testUrls) {
    console.log(`🔍 测试URL: ${url}`);
    
    try {
      // 测试URL检测
      const canParse = BilibiliParser.canParse(url);
      console.log(`  ✅ URL检测: ${canParse ? '支持' : '不支持'}`);
      
      if (canParse) {
        // 测试URL解析
        const extractResult = parser.extractBvid(url);
        console.log(`  📝 解析结果:`, extractResult);
        
        if (extractResult) {
          console.log(`    - 类型: ${extractResult.type}`);
          console.log(`    - ID: ${extractResult.id}`);
          if (extractResult.page) {
            console.log(`    - 分P: ${extractResult.page}`);
          }
        }
      }
    } catch (error) {
      console.log(`  ❌ 错误: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('📊 支持的URL示例:');
  const examples = BilibiliParser.getSupportedUrlExamples();
  examples.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example}`);
  });
}

// 运行测试
testBilibiliParser().catch(console.error);

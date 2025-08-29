// 简单的服务器测试脚本
const fetch = require('node-fetch');

async function testServer() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 开始测试服务器...\n');
  
  // 测试健康检查
  try {
    console.log('1. 测试健康检查...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ 健康检查成功:', healthData.message);
  } catch (error) {
    console.log('❌ 健康检查失败:', error.message);
    return;
  }
  
  // 测试 API 路由
  try {
    console.log('\n2. 测试 API 路由...');
    const testResponse = await fetch(`${baseUrl}/api/test`);
    const testData = await testResponse.json();
    console.log('✅ API 路由测试成功:', testData.message);
  } catch (error) {
    console.log('❌ API 路由测试失败:', error.message);
  }
  
  // 测试视频解析 API
  try {
    console.log('\n3. 测试视频解析 API...');
    const parseResponse = await fetch(`${baseUrl}/api/video/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      })
    });
    
    const parseData = await parseResponse.json();
    console.log('✅ 视频解析 API 响应:', parseData.success ? '成功' : '失败');
    console.log('   消息:', parseData.message);
    
    if (parseData.data) {
      console.log('   视频标题:', parseData.data.title);
    }
    
  } catch (error) {
    console.log('❌ 视频解析 API 测试失败:', error.message);
  }
  
  console.log('\n🧪 测试完成');
}

// 如果直接运行此脚本
if (require.main === module) {
  testServer().catch(console.error);
}

module.exports = { testServer };

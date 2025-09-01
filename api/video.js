// Vercel Serverless Function for video parsing
// 注意：这个文件暂时不使用复杂的导入，避免依赖问题

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少视频链接参数'
      });
    }

    console.log(`🎯 开始解析视频: ${url}`);

    // 暂时重定向到更完整的 /api/video/parse 端点
    console.log('🔄 重定向到 /api/video/parse 端点');
    
    // 由于这是内部重定向，我们需要重新构造请求
    const parseUrl = `${req.headers.host ? `https://${req.headers.host}` : ''}/api/video/parse`;
    
    try {
      const response = await fetch(parseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });
      
      const result = await response.json();
      return res.status(response.status).json(result);
      
    } catch (error) {
      console.error('内部重定向失败:', error.message);
      
      // 返回基础错误信息
      return res.status(200).json({
        success: false,
        message: `视频解析失败: ${error.message}`,
        error_type: 'ParseError',
        suggestions: [
          '检查视频链接是否正确',
          '确认视频是否存在且可访问',
          '某些平台可能需要特殊处理'
        ]
      });
    }

  } catch (error) {
    console.error('服务器错误:', error);
    
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

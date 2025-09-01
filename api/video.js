// Vercel Serverless Function for video parsing
import { VideoParser } from '../packages/h5-video-embed/src/parsers/index.js';

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

    // 创建解析器实例
    const parser = new VideoParser({
      corsProxy: null, // Vercel环境下不需要代理
      youtubeApiKey: process.env.YOUTUBE_API_KEY
    });

    console.log(`🎯 开始解析视频: ${url}`);

    try {
      // 尝试前端解析方法
      const result = await parser.parseVideo(url);
      
      return res.status(200).json({
        success: true,
        data: result.data,
        message: '视频解析成功',
        source: result.source || 'serverless'
      });

    } catch (error) {
      console.error('视频解析失败:', error.message);
      
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

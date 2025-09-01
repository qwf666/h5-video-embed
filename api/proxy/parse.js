// Vercel Serverless Function for general proxy parsing
const fetch = require('node-fetch');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 简化的解析器映射
const simpleParseUrl = async (url) => {
  // B站链接处理
  if (url.includes('bilibili.com') || url.includes('b23.tv')) {
    const bvMatch = url.match(/[\/\?](?:BV|bv)([A-Za-z0-9]+)/);
    const avMatch = url.match(/[\/\?]av(\d+)/);
    
    if (bvMatch) {
      const bvid = 'BV' + bvMatch[1];
      try {
        const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
        const data = await response.json();
        
        if (data.code === 0) {
          return {
            id: bvid,
            title: data.data.title,
            description: data.data.desc,
            thumbnail: data.data.pic,
            duration: data.data.duration,
            uploader: data.data.owner?.name,
            view_count: data.data.stat?.view,
            like_count: data.data.stat?.like,
            platform: 'bilibili',
            platform_name: 'B站',
            embed_url: `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&as_wide=1&high_quality=1&danmaku=0`
          };
        }
      } catch (error) {
        console.error('B站API调用失败:', error.message);
      }
    }
  }
  
  // YouTube链接处理
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (ytMatch) {
      const videoId = ytMatch[1];
      return {
        id: videoId,
        title: '视频标题获取中...',
        platform: 'youtube',
        platform_name: 'YouTube',
        embed_url: `https://www.youtube.com/embed/${videoId}`
      };
    }
  }
  
  throw new Error('不支持的视频平台或链接格式');
};

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
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

    console.log(`🎯 Vercel Proxy - 开始解析视频: ${url}`);

    try {
      const result = await simpleParseUrl(url);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: '视频解析成功',
        source: 'vercel-proxy'
      });

    } catch (error) {
      console.error('代理解析失败:', error.message);
      
      return res.status(200).json({
        success: false,
        message: `解析失败: ${error.message}`,
        error_type: 'ProxyParseError',
        suggestions: [
          '检查视频链接是否正确',
          '尝试使用其他解析模式',
          '某些平台可能需要特殊处理'
        ]
      });
    }

  } catch (error) {
    console.error('Vercel Proxy服务器错误:', error);
    
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      vercel_function: 'proxy-parse'
    });
  }
};

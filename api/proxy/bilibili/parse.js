// Vercel Serverless Function for Bilibili proxy parsing
// 使用Node.js 18+内置的fetch，无需导入

// 格式化时长
const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

    console.log(`🎯 Vercel API - 开始解析B站视频: ${url}`);

    // 检查是否为B站链接
    if (!url.includes('bilibili.com') && !url.includes('b23.tv')) {
      return res.status(400).json({
        success: false,
        message: '不是有效的B站视频链接'
      });
    }

    try {
      // 解析B站视频ID
      const bvMatch = url.match(/[\/\?](?:BV|bv)([A-Za-z0-9]+)/);
      const avMatch = url.match(/[\/\?]av(\d+)/);
      
      let bvid = null;
      if (bvMatch) {
        bvid = 'BV' + bvMatch[1];
      } else if (avMatch) {
        // 暂不支持av号转换，返回错误
        throw new Error('暂不支持av号格式，请使用BV号链接');
      } else {
        throw new Error('无法识别的B站视频链接格式');
      }

      // 调用B站API
      console.log(`📺 解析B站视频: ${bvid}`);
      const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.bilibili.com/'
        }
      });
      
      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`B站API返回错误: ${data.message || '未知错误'}`);
      }

      const videoData = data.data;
      const result = {
        id: bvid,
        title: videoData.title,
        description: videoData.desc || '',
        thumbnail: videoData.pic,
        duration: videoData.duration,
        duration_formatted: formatDuration(videoData.duration),
        uploader: videoData.owner?.name || '未知',
        upload_date: new Date(videoData.pubdate * 1000).toISOString().split('T')[0],
        view_count: videoData.stat?.view || 0,
        like_count: videoData.stat?.like || 0,
        comment_count: videoData.stat?.reply || 0,
        platform: 'bilibili',
        platform_name: 'B站',
        original_url: url,
        embed_url: `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&as_wide=1&high_quality=1&danmaku=0`,
        supports_embed: true
      };
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'B站视频解析成功',
        source: 'vercel-proxy'
      });

    } catch (error) {
      console.error('B站解析失败:', error.message);
      
      return res.status(200).json({
        success: false,
        message: `B站解析失败: ${error.message}`,
        error_type: 'BilibiliParseError',
        suggestions: [
          '检查B站视频链接是否正确',
          '确认视频是否存在且可访问',
          '尝试使用其他解析模式'
        ]
      });
    }

  } catch (error) {
    console.error('Vercel API服务器错误:', error);
    
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      vercel_function: 'bilibili-proxy-parse'
    });
  }
};

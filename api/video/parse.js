// Vercel Serverless Function for video parsing - matches /api/video/parse endpoint
// 使用Node.js 18+内置的fetch，无需导入

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 简化的平台检测和解析
const parseVideoUrl = async (url) => {
  console.log(`🎯 Vercel API - 开始解析视频: ${url}`);

  // B站链接处理
  if (url.includes('bilibili.com') || url.includes('b23.tv')) {
    const bvMatch = url.match(/[\/\?](?:BV|bv)([A-Za-z0-9]+)/);
    const avMatch = url.match(/[\/\?]av(\d+)/);
    
    if (bvMatch) {
      const bvid = 'BV' + bvMatch[1];
      try {
        console.log(`📺 解析B站视频: ${bvid}`);
        const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.bilibili.com/'
          }
        });
        
        const data = await response.json();
        
        if (data.code === 0 && data.data) {
          const videoData = data.data;
          return {
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
        } else {
          throw new Error(`B站API返回错误: ${data.message || '未知错误'}`);
        }
      } catch (error) {
        console.error('B站API调用失败:', error.message);
        throw new Error(`B站视频解析失败: ${error.message}`);
      }
    }
    
    if (avMatch) {
      // 处理av号，转换为BV号后再解析
      const aid = avMatch[1];
      try {
        const response = await fetch(`https://api.bilibili.com/x/web-interface/view?aid=${aid}`);
        const data = await response.json();
        if (data.code === 0 && data.data) {
          return parseVideoUrl(`https://www.bilibili.com/video/${data.data.bvid}`);
        }
      } catch (error) {
        throw new Error(`av号解析失败: ${error.message}`);
      }
    }
  }
  
  // YouTube链接处理
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (ytMatch) {
      const videoId = ytMatch[1];
      console.log(`📺 解析YouTube视频: ${videoId}`);
      
      // 尝试使用oEmbed API
      try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        const data = await response.json();
        
        return {
          id: videoId,
          title: data.title || '未知标题',
          description: '',
          thumbnail: data.thumbnail_url,
          uploader: data.author_name || '未知',
          platform: 'youtube',
          platform_name: 'YouTube',
          original_url: url,
          embed_url: `https://www.youtube.com/embed/${videoId}`,
          supports_embed: true
        };
      } catch (error) {
        console.error('YouTube oEmbed失败:', error.message);
        return {
          id: videoId,
          title: '视频标题获取中...',
          platform: 'youtube',
          platform_name: 'YouTube',
          original_url: url,
          embed_url: `https://www.youtube.com/embed/${videoId}`,
          supports_embed: true
        };
      }
    }
  }
  
  // Vimeo链接处理
  if (url.includes('vimeo.com')) {
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      console.log(`📺 解析Vimeo视频: ${videoId}`);
      
      try {
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
        const data = await response.json();
        
        return {
          id: videoId,
          title: data.title || '未知标题',
          description: data.description || '',
          thumbnail: data.thumbnail_url,
          uploader: data.author_name || '未知',
          platform: 'vimeo',
          platform_name: 'Vimeo',
          original_url: url,
          embed_url: `https://player.vimeo.com/video/${videoId}`,
          supports_embed: true
        };
      } catch (error) {
        console.error('Vimeo API失败:', error.message);
        return {
          id: videoId,
          title: '视频标题获取中...',
          platform: 'vimeo',
          platform_name: 'Vimeo',
          original_url: url,
          embed_url: `https://player.vimeo.com/video/${videoId}`,
          supports_embed: true
        };
      }
    }
  }
  
  throw new Error('不支持的视频平台或链接格式');
};

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

export default async function handler(req, res) {
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

    try {
      const result = await parseVideoUrl(url);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: '视频解析成功',
        source: 'vercel-serverless',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('视频解析失败:', error.message);
      
      return res.status(200).json({
        success: false,
        message: `视频解析失败: ${error.message}`,
        error_type: 'ParseError',
        suggestions: [
          '检查视频链接是否正确',
          '确认视频是否存在且可访问',
          '某些平台可能需要特殊处理'
        ],
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Vercel API服务器错误:', error);
    
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      vercel_function: 'video-parse',
      timestamp: new Date().toISOString()
    });
  }
};

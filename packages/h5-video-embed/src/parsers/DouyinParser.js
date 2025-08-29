// 抖音前端解析器
class DouyinParser {
  constructor(options = {}) {
    this.corsProxy = options.corsProxy;
  }

  async parse(url) {
    console.log(`🎵 正在解析抖音视频: ${url}`);

    try {
      // 抖音的分享链接通常需要先解析真实URL
      const realUrl = await this.resolveRealUrl(url);
      const videoId = this.extractVideoId(realUrl || url);
      
      if (!videoId) {
        throw new Error('无法提取抖音视频ID');
      }

      // 尝试从页面HTML中提取信息
      const videoInfo = await this.extractFromPage(realUrl || url);
      return this.formatVideoData(videoInfo, url);
      
    } catch (error) {
      console.warn('抖音解析失败:', error.message);
      
      // 抖音由于反爬虫机制，前端解析较困难
      // 返回基础信息，建议使用后端解析
      return this.createFallbackData(url);
    }
  }

  async resolveRealUrl(url) {
    // 如果是短链接，尝试解析
    if (url.includes('v.douyin.com') || url.includes('dy.com')) {
      try {
        // 由于CORS限制，这里可能无法直接访问
        // 实际项目中可能需要后端代理
        if (this.corsProxy) {
          const response = await fetch(`${this.corsProxy}/api/resolve-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          
          if (response.ok) {
            const result = await response.json();
            return result.resolvedUrl;
          }
        }
      } catch (error) {
        console.warn('短链接解析失败:', error.message);
      }
    }
    
    return url;
  }

  async extractFromPage(url) {
    // 抖音页面通常有CORS限制，前端难以直接访问
    // 这里提供一个基础的尝试方法
    try {
      if (this.corsProxy) {
        const response = await fetch(`${this.corsProxy}/api/proxy/douyin/page`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        if (response.ok) {
          const result = await response.json();
          return result.data;
        }
      }
      
      throw new Error('需要代理服务器解析抖音页面');
    } catch (error) {
      throw new Error('抖音页面解析失败，建议使用后端解析');
    }
  }

  formatVideoData(data, originalUrl) {
    return {
      id: data.aweme_id || 'unknown',
      title: data.desc || '抖音视频',
      description: data.desc || '',
      duration: data.duration ? data.duration / 1000 : 0,
      thumbnail: data.cover || data.dynamic_cover,
      uploader: data.author?.nickname || '抖音用户',
      uploader_id: data.author?.unique_id,
      uploader_avatar: data.author?.avatar_thumb,
      upload_date: data.create_time ? 
        new Date(data.create_time * 1000).toISOString().slice(0, 10).replace(/-/g, '') :
        new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      view_count: data.statistics?.play_count || 0,
      like_count: data.statistics?.digg_count || 0,
      comment_count: data.statistics?.comment_count || 0,
      share_count: data.statistics?.share_count || 0,
      webpage_url: originalUrl,
      platform: 'douyin',
      platform_name: '抖音',
      extractor: 'douyin_frontend',
      
      // 抖音特有数据
      music: data.music ? {
        title: data.music.title,
        author: data.music.author,
        duration: data.music.duration
      } : null,
      
      hashtags: data.text_extra?.filter(tag => tag.hashtag_name)
        ?.map(tag => tag.hashtag_name) || [],
      
      // 格式信息（前端无法获取真实播放地址）
      formats: [{
        format_id: 'douyin_web',
        url: originalUrl,
        ext: 'mp4',
        quality: 720,
        width: 720,
        height: 1280, // 抖音多为竖屏
        fps: 30,
        vcodec: 'h264',
        acodec: 'aac',
        note: '需要抖音播放器或后端解析'
      }],

      // 嵌入信息（抖音不支持iframe嵌入）
      embed: null
    };
  }

  createFallbackData(url) {
    const videoId = this.extractVideoId(url) || 'unknown';
    
    return {
      id: videoId,
      title: '抖音视频（需要后端解析获取完整信息）',
      description: '由于抖音的反爬虫机制，建议使用后端解析获取完整视频信息',
      duration: 0,
      thumbnail: 'https://via.placeholder.com/720x1280/000000/FFFFFF?text=Douyin+Video',
      uploader: '抖音用户',
      uploader_id: 'unknown',
      upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      webpage_url: url,
      platform: 'douyin',
      platform_name: '抖音',
      extractor: 'douyin_frontend_fallback',
      
      formats: [{
        format_id: 'douyin_fallback',
        url: url,
        ext: 'mp4',
        quality: 720,
        width: 720,
        height: 1280,
        fps: 30,
        vcodec: 'h264',
        acodec: 'aac',
        note: '需要后端解析获取真实播放地址'
      }],

      embed: null,
      
      // 标记需要后端解析
      needsBackendParsing: true,
      frontendLimitation: '抖音平台限制，前端无法获取完整信息'
    };
  }

  extractVideoId(url) {
    const patterns = [
      /video\/(\d+)/,
      /v\.douyin\.com\/([A-Za-z0-9]+)/,
      /aweme\/v1\/aweme\/detail\/\?aweme_id=(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  static canParse(url) {
    return /douyin\.com|dy\.com|iesdouyin\.com/.test(url);
  }
}

export default DouyinParser;

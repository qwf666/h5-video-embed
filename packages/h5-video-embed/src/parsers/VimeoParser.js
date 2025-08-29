// Vimeo前端解析器
class VimeoParser {
  constructor(options = {}) {
    this.corsProxy = options.corsProxy;
  }

  async parse(url) {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('无效的Vimeo链接');
    }

    console.log(`🎬 正在解析Vimeo视频: ${videoId}`);

    try {
      // 使用Vimeo oEmbed API
      const videoInfo = await this.getVideoInfoFromOEmbed(videoId);
      return this.formatVideoData(videoInfo, url);
    } catch (error) {
      console.warn('Vimeo解析失败:', error.message);
      return this.createBasicData(videoId, url);
    }
  }

  async getVideoInfoFromOEmbed(videoId) {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error(`Vimeo oEmbed请求失败: ${response.status}`);
    }

    return await response.json();
  }

  formatVideoData(data, url) {
    const videoId = this.extractVideoId(url);
    
    return {
      id: videoId,
      title: data.title,
      description: data.description || '通过Vimeo oEmbed API获取',
      duration: data.duration || 0,
      thumbnail: data.thumbnail_url,
      uploader: data.author_name,
      uploader_id: data.author_url?.split('/').pop(),
      upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      view_count: 0, // oEmbed不提供播放量
      like_count: 0,
      comment_count: 0,
      webpage_url: url,
      platform: 'vimeo',
      platform_name: 'Vimeo',
      extractor: 'vimeo_frontend_oembed',
      
      formats: [{
        format_id: 'vimeo_embed',
        url: `https://player.vimeo.com/video/${videoId}`,
        ext: 'mp4',
        quality: data.height || 720,
        width: data.width || 1280,
        height: data.height || 720,
        fps: 30,
        vcodec: 'h264',
        acodec: 'aac'
      }],

      embed: {
        type: 'iframe',
        url: `https://player.vimeo.com/video/${videoId}?autoplay=0&controls=1`,
        width: data.width || 1280,
        height: data.height || 720
      }
    };
  }

  createBasicData(videoId, url) {
    return {
      id: videoId,
      title: 'Vimeo视频（基础嵌入）',
      description: '无法获取详细信息，仅提供嵌入播放',
      duration: 0,
      thumbnail: 'https://via.placeholder.com/1280x720/1AB7EA/FFFFFF?text=Vimeo+Video',
      uploader: '未知',
      uploader_id: 'unknown',
      upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      webpage_url: url,
      platform: 'vimeo',
      platform_name: 'Vimeo',
      extractor: 'vimeo_frontend_basic',
      
      formats: [{
        format_id: 'vimeo_embed_basic',
        url: `https://player.vimeo.com/video/${videoId}`,
        ext: 'mp4',
        quality: 720,
        width: 1280,
        height: 720,
        fps: 30,
        vcodec: 'h264',
        acodec: 'aac'
      }],

      embed: {
        type: 'iframe',
        url: `https://player.vimeo.com/video/${videoId}?autoplay=0&controls=1`,
        width: 1280,
        height: 720
      }
    };
  }

  extractVideoId(url) {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/channels\/[\w-]+\/(\d+)/,
      /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  static canParse(url) {
    return /vimeo\.com/.test(url);
  }
}

export default VimeoParser;

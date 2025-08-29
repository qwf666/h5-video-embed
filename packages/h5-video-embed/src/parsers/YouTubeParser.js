// YouTube前端解析器
class YouTubeParser {
  constructor(options = {}) {
    this.corsProxy = options.corsProxy;
    this.apiKey = options.apiKey;
  }

  async parse(url) {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('无效的YouTube链接');
    }

    console.log(`🎬 正在解析YouTube视频: ${videoId}`);

    try {
      // 优先使用YouTube Data API v3
      if (this.apiKey) {
        const videoInfo = await this.getVideoInfoFromApi(videoId);
        return this.formatVideoData(videoInfo, url, 'api');
      }
      
      // 降级到oEmbed API
      const videoInfo = await this.getVideoInfoFromOEmbed(videoId);
      return this.formatVideoData(videoInfo, url, 'oembed');
      
    } catch (error) {
      console.warn('YouTube解析失败:', error.message);
      
      // 创建基础的嵌入信息
      return this.createBasicEmbedData(videoId, url);
    }
  }

  async getVideoInfoFromApi(videoId) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${this.apiKey}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube API请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('视频不存在或不可访问');
    }

    return {
      type: 'api',
      data: data.items[0]
    };
  }

  async getVideoInfoFromOEmbed(videoId) {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error(`YouTube oEmbed请求失败: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      type: 'oembed',
      data: data
    };
  }

  formatVideoData(info, originalUrl, source) {
    if (info.type === 'api') {
      const video = info.data;
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        duration: this.parseISO8601Duration(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails.maxres?.url || 
                  video.snippet.thumbnails.high?.url || 
                  video.snippet.thumbnails.medium?.url,
        uploader: video.snippet.channelTitle,
        uploader_id: video.snippet.channelId,
        upload_date: video.snippet.publishedAt.slice(0, 10).replace(/-/g, ''),
        view_count: parseInt(video.statistics.viewCount) || 0,
        like_count: parseInt(video.statistics.likeCount) || 0,
        comment_count: parseInt(video.statistics.commentCount) || 0,
        webpage_url: originalUrl,
        platform: 'youtube',
        platform_name: 'YouTube',
        extractor: 'youtube_frontend_api',
        
        // YouTube特有数据
        category_id: video.snippet.categoryId,
        tags: video.snippet.tags || [],
        language: video.snippet.defaultLanguage,
        
        formats: [{
          format_id: 'youtube_embed',
          url: `https://www.youtube.com/embed/${video.id}`,
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
          url: `https://www.youtube.com/embed/${video.id}?autoplay=0&controls=1`,
          width: 1280,
          height: 720
        }
      };
    } else if (info.type === 'oembed') {
      const data = info.data;
      const videoId = this.extractVideoId(originalUrl);
      
      return {
        id: videoId,
        title: data.title,
        description: '通过YouTube oEmbed API获取',
        duration: 0, // oEmbed不提供时长
        thumbnail: data.thumbnail_url,
        uploader: data.author_name,
        uploader_id: data.author_url?.split('/').pop(),
        upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        webpage_url: originalUrl,
        platform: 'youtube',
        platform_name: 'YouTube',
        extractor: 'youtube_frontend_oembed',
        
        formats: [{
          format_id: 'youtube_embed_oembed',
          url: `https://www.youtube.com/embed/${videoId}`,
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
          url: `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`,
          width: data.width || 1280,
          height: data.height || 720
        }
      };
    }
  }

  createBasicEmbedData(videoId, url) {
    return {
      id: videoId,
      title: 'YouTube视频（基础嵌入）',
      description: '无法获取详细信息，仅提供嵌入播放',
      duration: 0,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      uploader: '未知',
      uploader_id: 'unknown',
      upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      webpage_url: url,
      platform: 'youtube',
      platform_name: 'YouTube',
      extractor: 'youtube_frontend_basic',
      
      formats: [{
        format_id: 'youtube_embed_basic',
        url: `https://www.youtube.com/embed/${videoId}`,
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
        url: `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`,
        width: 1280,
        height: 720
      }
    };
  }

  extractVideoId(url) {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  parseISO8601Duration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  static canParse(url) {
    return /youtube\.com|youtu\.be/.test(url);
  }
}

export default YouTubeParser;

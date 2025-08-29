// 真实的视频平台 API 客户端
import fetch from 'node-fetch';

class VideoApiClient {
  constructor() {
    // YouTube Data API v3 配置
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    this.youtubeApiUrl = 'https://www.googleapis.com/youtube/v3';
    
    // Bilibili API 配置（公开 API）
    this.bilibiliApiUrl = 'https://api.bilibili.com';
    
    // Vimeo API 配置
    this.vimeoApiUrl = 'https://api.vimeo.com';
    this.vimeoAccessToken = process.env.VIMEO_ACCESS_TOKEN;
  }

  /**
   * 解析 YouTube 视频 - 使用官方 API
   */
  async getYouTubeVideoInfo(videoId) {
    try {
      console.log(`🔍 正在通过 YouTube Data API v3 解析视频: ${videoId}`);
      
      // 如果没有 API Key，使用 oEmbed API
      if (!this.youtubeApiKey) {
        return await this.getYouTubeOEmbedInfo(videoId);
      }

      const response = await fetch(
        `${this.youtubeApiUrl}/videos?id=${videoId}&part=snippet,statistics,contentDetails&key=${this.youtubeApiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        throw new Error('视频不存在或不可访问');
      }

      const video = data.items[0];
      
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        duration: this.parseISO8601Duration(video.contentDetails.duration),
        thumbnail: video.snippet.thumbnails.maxres?.url || 
                  video.snippet.thumbnails.high?.url || 
                  video.snippet.thumbnails.medium?.url,
        uploader: video.snippet.channelTitle,
        upload_date: video.snippet.publishedAt.slice(0, 10).replace(/-/g, ''),
        view_count: parseInt(video.statistics.viewCount) || 0,
        like_count: parseInt(video.statistics.likeCount) || 0,
        comment_count: parseInt(video.statistics.commentCount) || 0,
        formats: [{
          format_id: 'youtube_web',
          url: `https://www.youtube.com/watch?v=${videoId}`,
          ext: 'mp4',
          quality: 720,
          width: 1280,
          height: 720,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac'
        }],
        webpage_url: `https://www.youtube.com/watch?v=${videoId}`,
        extractor: 'youtube_api',
        category: video.snippet.categoryId,
        tags: video.snippet.tags || [],
        language: video.snippet.defaultLanguage || 'unknown'
      };

    } catch (error) {
      console.error('YouTube API 解析失败:', error.message);
      throw error;
    }
  }

  /**
   * YouTube oEmbed API - 无需 API Key
   */
  async getYouTubeOEmbedInfo(videoId) {
    try {
      console.log(`🔍 正在通过 YouTube oEmbed API 解析视频: ${videoId}`);
      
      const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`YouTube oEmbed 请求失败: ${response.status}`);
      }

      const data = await response.json();

      return {
        id: videoId,
        title: data.title,
        description: '通过 YouTube oEmbed API 获取',
        duration: 0, // oEmbed 不提供时长
        thumbnail: data.thumbnail_url,
        uploader: data.author_name,
        upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        formats: [{
          format_id: 'youtube_embed',
          url: `https://www.youtube.com/embed/${videoId}`,
          ext: 'mp4',
          quality: data.height || 720,
          width: data.width || 1280,
          height: data.height || 720,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac'
        }],
        webpage_url: `https://www.youtube.com/watch?v=${videoId}`,
        extractor: 'youtube_oembed',
        provider_name: data.provider_name,
        provider_url: data.provider_url
      };

    } catch (error) {
      console.error('YouTube oEmbed 解析失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析 Bilibili 视频 - 使用公开 API
   */
  async getBilibiliVideoInfo(bvid) {
    try {
      console.log(`🔍 正在通过 Bilibili API 解析视频: ${bvid}`);
      
      // 获取视频基本信息
      const response = await fetch(
        `${this.bilibiliApiUrl}/x/web-interface/view?bvid=${bvid}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Bilibili API 请求失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(`Bilibili API 错误: ${result.message}`);
      }

      const data = result.data;

      return {
        id: data.bvid,
        title: data.title,
        description: data.desc,
        duration: data.duration,
        thumbnail: data.pic,
        uploader: data.owner.name,
        upload_date: new Date(data.pubdate * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: data.stat.view || 0,
        like_count: data.stat.like || 0,
        comment_count: data.stat.reply || 0,
        formats: data.pages.map((page, index) => ({
          format_id: `bilibili_${page.cid}`,
          url: `https://www.bilibili.com/video/${data.bvid}?p=${index + 1}`,
          ext: 'mp4',
          quality: 720,
          width: page.dimension?.width || 1280,
          height: page.dimension?.height || 720,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac',
          page_title: page.part
        })),
        webpage_url: `https://www.bilibili.com/video/${data.bvid}`,
        extractor: 'bilibili_api',
        coin_count: data.stat.coin || 0,
        favorite_count: data.stat.favorite || 0,
        share_count: data.stat.share || 0,
        tags: data.tag || [],
        tid: data.tid,
        tname: data.tname
      };

    } catch (error) {
      console.error('Bilibili API 解析失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析 Vimeo 视频
   */
  async getVimeoVideoInfo(videoId) {
    try {
      console.log(`🔍 正在通过 Vimeo API 解析视频: ${videoId}`);
      
      // 首先尝试 oEmbed API（无需认证）
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`;
      const response = await fetch(oembedUrl);

      if (!response.ok) {
        throw new Error(`Vimeo oEmbed 请求失败: ${response.status}`);
      }

      const data = await response.json();

      return {
        id: videoId,
        title: data.title,
        description: data.description || '通过 Vimeo oEmbed API 获取',
        duration: data.duration || 0,
        thumbnail: data.thumbnail_url,
        uploader: data.author_name,
        upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: 0,
        like_count: 0,
        comment_count: 0,
        formats: [{
          format_id: 'vimeo_web',
          url: `https://vimeo.com/${videoId}`,
          ext: 'mp4',
          quality: data.height || 720,
          width: data.width || 1280,
          height: data.height || 720,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac'
        }],
        webpage_url: `https://vimeo.com/${videoId}`,
        extractor: 'vimeo_oembed',
        provider_name: data.provider_name,
        provider_url: data.provider_url
      };

    } catch (error) {
      console.error('Vimeo API 解析失败:', error.message);
      throw error;
    }
  }

  /**
   * 通用视频信息解析
   */
  async extractVideoInfo(url) {
    try {
      // YouTube
      const youtubeId = this.extractYouTubeId(url);
      if (youtubeId) {
        return await this.getYouTubeVideoInfo(youtubeId);
      }

      // Bilibili
      const bilibiliId = this.extractBilibiliId(url);
      if (bilibiliId) {
        return await this.getBilibiliVideoInfo(bilibiliId);
      }

      // Vimeo
      const vimeoId = this.extractVimeoId(url);
      if (vimeoId) {
        return await this.getVimeoVideoInfo(vimeoId);
      }

      throw new Error('不支持的视频平台或无效的 URL');

    } catch (error) {
      console.error('视频信息提取失败:', error.message);
      throw error;
    }
  }

  /**
   * 提取 YouTube 视频 ID
   */
  extractYouTubeId(url) {
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

  /**
   * 提取 Bilibili 视频 ID
   */
  extractBilibiliId(url) {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/,
      /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(av\d+)/,
      /(?:https?:\/\/)?(?:www\.)?b23\.tv\/([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  /**
   * 提取 Vimeo 视频 ID
   */
  extractVimeoId(url) {
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

  /**
   * 解析 ISO 8601 时长格式 (PT1H2M3S)
   */
  parseISO8601Duration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  }
}

export default VideoApiClient;

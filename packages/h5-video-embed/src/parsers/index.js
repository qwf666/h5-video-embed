// 前端视频解析器入口
import BilibiliParser from './BilibiliParser.js';
import DouyinParser from './DouyinParser.js';
import TencentParser from './TencentParser.js';
import XiguaParser from './XiguaParser.js';
import KuaishouParser from './KuaishouParser.js';
import YouTubeParser from './YouTubeParser.js';
import VimeoParser from './VimeoParser.js';

class VideoParser {
  constructor(options = {}) {
    this.corsProxy = options.corsProxy || null; // CORS代理服务器
    this.youtubeApiKey = options.youtubeApiKey || null;
    
    // 初始化各平台解析器
    this.parsers = {
      bilibili: new BilibiliParser({ corsProxy: this.corsProxy }),
      douyin: new DouyinParser({ corsProxy: this.corsProxy }),
      tencent: new TencentParser({ corsProxy: this.corsProxy }),
      xigua: new XiguaParser({ corsProxy: this.corsProxy }),
      kuaishou: new KuaishouParser({ corsProxy: this.corsProxy }),
      youtube: new YouTubeParser({ 
        corsProxy: this.corsProxy, 
        apiKey: this.youtubeApiKey 
      }),
      vimeo: new VimeoParser({ corsProxy: this.corsProxy })
    };
  }

  /**
   * 解析视频URL
   */
  async parseVideo(url) {
    const platform = this.detectPlatform(url);
    if (!platform) {
      throw new Error('不支持的视频平台');
    }

    console.log(`🎯 检测到平台: ${platform}`);
    
    try {
      const parser = this.parsers[platform];
      const result = await parser.parse(url);
      return {
        success: true,
        data: result,
        platform: platform,
        source: 'frontend'
      };
    } catch (error) {
      console.error(`${platform} 解析失败:`, error);
      // 如果前端解析失败，可以选择调用后端
      if (this.corsProxy) {
        try {
          console.log('🔄 前端解析失败，尝试后端解析...');
          return await this.fallbackToBackend(url);
        } catch (backendError) {
          throw new Error(`前端和后端解析都失败: ${error.message}, ${backendError.message}`);
        }
      }
      throw error;
    }
  }

  /**
   * 检测视频平台
   */
  detectPlatform(url) {
    // 使用各解析器的静态检测方法，提高准确性
    if (BilibiliParser.canParse(url)) return 'bilibili';
    if (DouyinParser.canParse && DouyinParser.canParse(url)) return 'douyin';
    if (TencentParser.canParse && TencentParser.canParse(url)) return 'tencent';
    if (XiguaParser.canParse && XiguaParser.canParse(url)) return 'xigua';
    if (KuaishouParser.canParse && KuaishouParser.canParse(url)) return 'kuaishou';
    if (YouTubeParser.canParse && YouTubeParser.canParse(url)) return 'youtube';
    if (VimeoParser.canParse && VimeoParser.canParse(url)) return 'vimeo';

    // 回退到正则匹配
    const patterns = {
      bilibili: /bilibili\.com|b23\.tv/,
      douyin: /douyin\.com|dy\.com|iesdouyin\.com/,
      tencent: /v\.qq\.com|qq\.com\/x\//,
      xigua: /ixigua\.com|xigua\.com/,
      kuaishou: /kuaishou\.com|ks\.com/,
      youtube: /youtube\.com|youtu\.be/,
      vimeo: /vimeo\.com/
    };

    for (const [platform, pattern] of Object.entries(patterns)) {
      if (pattern.test(url)) {
        return platform;
      }
    }

    return null;
  }

  /**
   * 后端降级处理
   */
  async fallbackToBackend(url) {
    if (!this.corsProxy) {
      throw new Error('未配置后端代理服务器');
    }

    const response = await fetch(`${this.corsProxy}/api/video/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`后端解析失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '后端解析失败');
    }

    return {
      ...result,
      source: 'backend'
    };
  }

  /**
   * 获取支持的平台列表
   */
  getSupportedPlatforms() {
    return {
      chinese: [
        { name: '哔哩哔哩', key: 'bilibili', domains: ['bilibili.com', 'b23.tv'] },
        { name: '抖音', key: 'douyin', domains: ['douyin.com', 'dy.com'] },
        { name: '腾讯视频', key: 'tencent', domains: ['v.qq.com'] },
        { name: '西瓜视频', key: 'xigua', domains: ['ixigua.com'] },
        { name: '快手', key: 'kuaishou', domains: ['kuaishou.com'] }
      ],
      international: [
        { name: 'YouTube', key: 'youtube', domains: ['youtube.com', 'youtu.be'] },
        { name: 'Vimeo', key: 'vimeo', domains: ['vimeo.com'] }
      ]
    };
  }
}

export default VideoParser;

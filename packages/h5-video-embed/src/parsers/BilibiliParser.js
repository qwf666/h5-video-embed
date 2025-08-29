// B站前端解析器
class BilibiliParser {
  constructor(options = {}) {
    this.corsProxy = options.corsProxy;
  }

  async parse(url) {
    const bvid = this.extractBvid(url);
    if (!bvid) {
      throw new Error('无效的B站链接');
    }

    console.log(`📺 正在解析B站视频: ${bvid}`);

    try {
      // 尝试直接调用B站API
      const videoInfo = await this.getVideoInfo(bvid);
      return this.formatVideoData(videoInfo, url);
    } catch (error) {
      console.warn('直接API调用失败，尝试通过代理:', error.message);
      
      if (this.corsProxy) {
        const videoInfo = await this.getVideoInfoViaProxy(bvid);
        return this.formatVideoData(videoInfo, url);
      }
      
      throw error;
    }
  }

  async getVideoInfo(bvid) {
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com'
      }
    });

    if (!response.ok) {
      throw new Error(`B站API请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`B站API错误: ${result.message}`);
    }

    return result.data;
  }

  async getVideoInfoViaProxy(bvid) {
    const proxyUrl = `${this.corsProxy}/api/proxy/bilibili/video/${bvid}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`代理请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '代理解析失败');
    }

    return result.data;
  }

  formatVideoData(data, originalUrl) {
    return {
      id: data.bvid,
      aid: data.aid,
      title: data.title,
      description: data.desc || '',
      duration: data.duration,
      thumbnail: data.pic,
      uploader: data.owner?.name || '未知用户',
      uploader_id: data.owner?.mid,
      uploader_avatar: data.owner?.face,
      upload_date: new Date(data.pubdate * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
      view_count: data.stat?.view || 0,
      like_count: data.stat?.like || 0,
      comment_count: data.stat?.reply || 0,
      coin_count: data.stat?.coin || 0,
      favorite_count: data.stat?.favorite || 0,
      share_count: data.stat?.share || 0,
      danmaku_count: data.stat?.danmaku || 0,
      webpage_url: originalUrl,
      platform: 'bilibili',
      platform_name: 'B站',
      extractor: 'bilibili_frontend',
      
      // B站特有数据
      tags: data.tag || [],
      tid: data.tid,
      tname: data.tname,
      copyright: data.copyright === 1 ? '原创' : '转载',
      
      // 分P信息
      pages: data.pages?.map(page => ({
        cid: page.cid,
        page: page.page,
        part: page.part,
        duration: page.duration,
        dimension: page.dimension
      })) || [],
      
      // 格式信息（前端无法获取真实播放地址）
      formats: [{
        format_id: 'bilibili_web',
        url: originalUrl,
        ext: 'mp4',
        quality: 720,
        width: 1280,
        height: 720,
        fps: 30,
        vcodec: 'h264',
        acodec: 'aac',
        note: '需要B站播放器'
      }],

      // 嵌入信息
      embed: {
        type: 'iframe',
        url: `https://player.bilibili.com/player.html?bvid=${data.bvid}&autoplay=0`,
        width: 1280,
        height: 720
      }
    };
  }

  extractBvid(url) {
    const patterns = [
      /\/video\/(BV[a-zA-Z0-9]+)/,
      /\/video\/(av\d+)/,
      /b23\.tv\/([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        let id = match[1];
        // 如果是av号，需要转换为BV号（这里简化处理）
        if (id.startsWith('av')) {
          // 实际项目中可能需要调用转换API
          return id;
        }
        return id;
      }
    }
    
    return null;
  }

  // 检测是否为B站URL
  static canParse(url) {
    return /bilibili\.com|b23\.tv/.test(url);
  }
}

export default BilibiliParser;

// B站前端解析器
class BilibiliParser {
  constructor(options = {}) {
    this.corsProxy = options.corsProxy;
  }

  async parse(url) {
    const extractResult = this.extractBvid(url);
    if (!extractResult) {
      throw new Error('无效的B站链接');
    }

    console.log(`📺 正在解析B站内容: ${JSON.stringify(extractResult)}`);

    try {
      // 根据不同类型调用不同的解析方法
      switch (extractResult.type) {
        case 'video':
          return await this.parseVideo(extractResult, url);
        case 'bangumi':
          return await this.parseBangumi(extractResult, url);
        case 'live':
          return await this.parseLive(extractResult, url);
        case 'medialist':
          return await this.parseMedialist(extractResult, url);
        default:
          throw new Error(`不支持的B站内容类型: ${extractResult.type}`);
      }
    } catch (error) {
      console.warn('直接API调用失败，尝试通过代理:', error.message);
      
      if (this.corsProxy) {
        const result = await this.parseViaProxy(extractResult, url);
        return result;
      }
      
      throw error;
    }
  }

  async parseVideo(extractResult, url) {
    const videoInfo = await this.getVideoInfo(extractResult.id);
    return this.formatVideoData(videoInfo, url, extractResult);
  }

  async parseBangumi(extractResult, url) {
    const bangumiInfo = await this.getBangumiInfo(extractResult.id);
    return this.formatBangumiData(bangumiInfo, url, extractResult);
  }

  async parseLive(extractResult, url) {
    const liveInfo = await this.getLiveInfo(extractResult.id);
    return this.formatLiveData(liveInfo, url, extractResult);
  }

  async parseMedialist(extractResult, url) {
    const medialistInfo = await this.getMedialistInfo(extractResult.id);
    return this.formatMedialistData(medialistInfo, url, extractResult);
  }

  async getVideoInfo(bvid) {
    // 支持BV号和av号
    const isAvId = bvid.startsWith('av');
    const apiUrl = isAvId 
      ? `https://api.bilibili.com/x/web-interface/view?aid=${bvid.slice(2)}`
      : `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    
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

  async getBangumiInfo(epOrSsId) {
    // 处理ep号和ss号
    const isEpId = epOrSsId.startsWith('ep');
    const id = epOrSsId.slice(2); // 去掉ep或ss前缀
    const apiUrl = isEpId
      ? `https://api.bilibili.com/pgc/view/web/season?ep_id=${id}`
      : `https://api.bilibili.com/pgc/view/web/season?season_id=${id}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com'
      }
    });

    if (!response.ok) {
      throw new Error(`B站番剧API请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`B站番剧API错误: ${result.message}`);
    }

    return result.result;
  }

  async getLiveInfo(roomId) {
    const apiUrl = `https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomId}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://live.bilibili.com/',
        'Origin': 'https://live.bilibili.com'
      }
    });

    if (!response.ok) {
      throw new Error(`B站直播API请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`B站直播API错误: ${result.message}`);
    }

    return result.data;
  }

  async getMedialistInfo(mlId) {
    const id = mlId.slice(2); // 去掉ml前缀
    const apiUrl = `https://api.bilibili.com/x/v2/medialist/resource/list?media_id=${id}&pn=1&ps=20`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.bilibili.com/',
        'Origin': 'https://www.bilibili.com'
      }
    });

    if (!response.ok) {
      throw new Error(`B站合集API请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(`B站合集API错误: ${result.message}`);
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

  async parseViaProxy(extractResult, url) {
    const proxyUrl = `${this.corsProxy}/api/proxy/bilibili/parse`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        url: url,
        extractResult: extractResult 
      })
    });
    
    if (!response.ok) {
      throw new Error(`代理解析请求失败: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '代理解析失败');
    }

    return {
      success: true,
      data: result.data,
      platform: 'bilibili',
      source: 'backend_proxy'
    };
  }

  formatVideoData(data, originalUrl, extractResult) {
    const baseData = {
      id: data.bvid || `av${data.aid}`,
      aid: data.aid,
      bvid: data.bvid,
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
      content_type: 'video',
      
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

    // 如果指定了分P，添加分P信息
    if (extractResult.page && data.pages && data.pages[extractResult.page - 1]) {
      const pageInfo = data.pages[extractResult.page - 1];
      baseData.current_page = extractResult.page;
      baseData.page_title = pageInfo.part;
      baseData.page_duration = pageInfo.duration;
      baseData.embed.url += `&p=${extractResult.page}`;
    }

    return baseData;
  }

  formatBangumiData(data, originalUrl, extractResult) {
    const episodes = data.episodes || [];
    const currentEp = episodes.find(ep => ep.ep_id == extractResult.id.slice(2)) || episodes[0];

    return {
      id: `ss${data.season_id}`,
      season_id: data.season_id,
      title: data.title,
      description: data.evaluate || '',
      thumbnail: data.cover,
      type_name: data.type_name,
      total_count: data.total,
      webpage_url: originalUrl,
      platform: 'bilibili',
      platform_name: 'B站',
      extractor: 'bilibili_frontend',
      content_type: 'bangumi',
      
      // 番剧特有数据
      rating: data.rating?.score || 0,
      tags: data.styles || [],
      actors: data.actor?.info || '',
      staff: data.staff?.info || '',
      
      // 当前集数信息
      current_episode: currentEp ? {
        ep_id: currentEp.ep_id,
        title: currentEp.title,
        long_title: currentEp.long_title,
        duration: currentEp.duration,
        thumbnail: currentEp.cover
      } : null,
      
      // 所有集数
      episodes: episodes.map(ep => ({
        ep_id: ep.ep_id,
        title: ep.title,
        long_title: ep.long_title,
        duration: ep.duration,
        thumbnail: ep.cover
      })),
      
      // 嵌入信息
      embed: {
        type: 'iframe',
        url: currentEp ? `https://player.bilibili.com/player.html?bvid=${currentEp.bvid}&autoplay=0` : originalUrl,
        width: 1280,
        height: 720
      }
    };
  }

  formatLiveData(data, originalUrl, extractResult) {
    return {
      id: data.room_id,
      title: data.title,
      description: data.description || '',
      thumbnail: data.user_cover || data.keyframe,
      uploader: data.uname,
      uploader_id: data.uid,
      uploader_avatar: data.face,
      live_status: data.live_status, // 0: 未开播, 1: 直播中, 2: 轮播中
      online: data.online || 0,
      webpage_url: originalUrl,
      platform: 'bilibili',
      platform_name: 'B站',
      extractor: 'bilibili_frontend',
      content_type: 'live',
      
      // 直播特有数据
      area_name: data.area_name,
      parent_area_name: data.parent_area_name,
      live_time: data.live_time,
      
      // 嵌入信息
      embed: {
        type: 'iframe',
        url: `https://live.bilibili.com/blanc/${data.room_id}`,
        width: 1280,
        height: 720
      }
    };
  }

  formatMedialistData(data, originalUrl, extractResult) {
    const info = data.info || {};
    const medias = data.medias || [];

    return {
      id: extractResult.id,
      title: info.title,
      description: info.intro || '',
      thumbnail: info.cover,
      uploader: info.upper?.name,
      uploader_id: info.upper?.mid,
      uploader_avatar: info.upper?.face,
      media_count: info.media_count || 0,
      webpage_url: originalUrl,
      platform: 'bilibili',
      platform_name: 'B站',
      extractor: 'bilibili_frontend',
      content_type: 'medialist',
      
      // 合集特有数据
      type: info.type, // 1: 普通收藏夹, 2: 订阅合集
      attr: info.attr,
      
      // 合集中的视频
      medias: medias.map(media => ({
        id: media.bvid,
        title: media.title,
        thumbnail: media.cover,
        uploader: media.upper?.name,
        duration: media.duration,
        view_count: media.cnt_info?.play || 0
      })),
      
      // 嵌入信息 - 播放第一个视频
      embed: {
        type: 'iframe',
        url: medias[0] ? `https://player.bilibili.com/player.html?bvid=${medias[0].bvid}&autoplay=0` : originalUrl,
        width: 1280,
        height: 720
      }
    };
  }

  extractBvid(url) {
    // 更完整的B站URL匹配模式
    const patterns = [
      // 标准视频页面 - BV号
      /(?:bilibili\.com\/video\/|b23\.tv\/)(BV[a-zA-Z0-9]+)/i,
      // 标准视频页面 - av号  
      /(?:bilibili\.com\/video\/|b23\.tv\/)(av\d+)/i,
      // 移动端链接
      /m\.bilibili\.com\/video\/((?:BV|av)[a-zA-Z0-9]+)/i,
      // 嵌入播放器链接
      /player\.bilibili\.com\/player\.html.*?(?:bvid=|aid=)((?:BV|av)[a-zA-Z0-9]+)/i,
      // 番剧/影视链接 - ep号
      /(?:bilibili\.com\/bangumi\/play\/)(ep\d+)/i,
      // 番剧/影视链接 - ss号
      /(?:bilibili\.com\/bangumi\/play\/)(ss\d+)/i,
      // 直播间链接
      /(?:live\.bilibili\.com\/)(h5\/)?(\d+)/i,
      // 短链接 b23.tv
      /b23\.tv\/([a-zA-Z0-9]+)/i,
      // 分P视频带p参数
      /(?:bilibili\.com\/video\/)((?:BV|av)[a-zA-Z0-9]+)(?:\?p=(\d+))?/i,
      // 带时间戳的链接
      /(?:bilibili\.com\/video\/)((?:BV|av)[a-zA-Z0-9]+)(?:\?.*?t=(\d+))?/i,
      // 合集视频
      /(?:bilibili\.com\/medialist\/play\/)(ml\d+)/i,
      // 收藏夹链接
      /(?:bilibili\.com\/favlist\?fid=)(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        let id = match[1];
        let pageNum = match[2]; // 分P或其他参数
        
        // 处理特殊情况
        if (id.startsWith('ep') || id.startsWith('ss')) {
          // 番剧链接，需要特殊处理
          return { type: 'bangumi', id: id };
        }
        
        if (id.startsWith('ml')) {
          // 合集链接
          return { type: 'medialist', id: id };
        }
        
        if (/^\d+$/.test(id)) {
          // 纯数字可能是直播间ID
          return { type: 'live', id: id };
        }
        
        // 标准视频ID处理
        const result = { type: 'video', id: id };
        
        // 添加分P信息
        if (pageNum && /^\d+$/.test(pageNum)) {
          result.page = parseInt(pageNum);
        }
        
        return result;
      }
    }
    
    return null;
  }

  // 检测是否为B站URL
  static canParse(url) {
    const patterns = [
      /(?:www\.)?bilibili\.com\/video\//i,
      /(?:www\.)?bilibili\.com\/bangumi\/play\//i,
      /(?:m\.)?bilibili\.com\/video\//i,
      /live\.bilibili\.com\//i,
      /player\.bilibili\.com\/player\.html/i,
      /(?:www\.)?bilibili\.com\/medialist\/play\//i,
      /(?:www\.)?bilibili\.com\/favlist/i,
      /b23\.tv\//i
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }

  // 获取支持的URL示例
  static getSupportedUrlExamples() {
    return [
      'https://www.bilibili.com/video/BV1xx411c7mD',
      'https://www.bilibili.com/video/av12345678',
      'https://www.bilibili.com/video/BV1xx411c7mD?p=2',
      'https://m.bilibili.com/video/BV1xx411c7mD',
      'https://www.bilibili.com/bangumi/play/ep123456',
      'https://www.bilibili.com/bangumi/play/ss12345',
      'https://live.bilibili.com/12345',
      'https://www.bilibili.com/medialist/play/ml123456',
      'https://b23.tv/abcdefg',
      'https://player.bilibili.com/player.html?bvid=BV1xx411c7mD'
    ];
  }
}

export default BilibiliParser;

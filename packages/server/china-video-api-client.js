// 国内主流视频平台 API 客户端
import fetch from 'node-fetch';

class ChinaVideoApiClient {
  constructor() {
    // 通用请求头，模拟真实浏览器
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }

  /**
   * 解析抖音视频
   */
  async getDouyinVideoInfo(url) {
    try {
      console.log(`🎵 正在解析抖音视频: ${url}`);
      
      // 提取抖音视频ID
      const videoId = this.extractDouyinId(url);
      if (!videoId) {
        throw new Error('无效的抖音链接');
      }

      // 获取视频详细信息的API
      const apiUrl = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${videoId}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          ...this.headers,
          'Referer': 'https://www.douyin.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`抖音 API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.item_list || data.item_list.length === 0) {
        throw new Error('抖音视频不存在或已删除');
      }

      const video = data.item_list[0];
      
      return {
        id: video.aweme_id,
        title: video.desc || '抖音视频',
        description: video.desc || '',
        duration: video.duration / 1000, // 毫秒转秒
        thumbnail: video.video?.cover?.url_list?.[0] || video.video?.dynamic_cover?.url_list?.[0],
        uploader: video.author?.nickname || '抖音用户',
        uploader_id: video.author?.unique_id,
        upload_date: new Date(video.create_time * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: video.statistics?.play_count || 0,
        like_count: video.statistics?.digg_count || 0,
        comment_count: video.statistics?.comment_count || 0,
        share_count: video.statistics?.share_count || 0,
        formats: this.processDouyinFormats(video.video),
        webpage_url: url,
        extractor: 'douyin',
        platform: '抖音',
        music: video.music ? {
          title: video.music.title,
          author: video.music.author,
          duration: video.music.duration
        } : null,
        hashtags: video.text_extra?.filter(tag => tag.hashtag_name)?.map(tag => tag.hashtag_name) || []
      };

    } catch (error) {
      console.error('抖音视频解析失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析B站视频（增强版）
   */
  async getBilibiliVideoInfo(bvid) {
    try {
      console.log(`📺 正在解析B站视频: ${bvid}`);
      
      // 获取视频基本信息
      const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
      const response = await fetch(viewUrl, {
        headers: {
          ...this.headers,
          'Referer': 'https://www.bilibili.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`B站 API 请求失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 0) {
        throw new Error(`B站 API 错误: ${result.message}`);
      }

      const data = result.data;

      // 获取视频播放信息
      let playInfo = null;
      try {
        const playUrl = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${data.cid}&qn=80`;
        const playResponse = await fetch(playUrl, {
          headers: {
            ...this.headers,
            'Referer': `https://www.bilibili.com/video/${bvid}`
          }
        });
        
        if (playResponse.ok) {
          const playResult = await playResponse.json();
          if (playResult.code === 0) {
            playInfo = playResult.data;
          }
        }
      } catch (error) {
        console.warn('获取B站播放信息失败:', error.message);
      }

      return {
        id: data.bvid,
        aid: data.aid,
        title: data.title,
        description: data.desc,
        duration: data.duration,
        thumbnail: data.pic,
        uploader: data.owner.name,
        uploader_id: data.owner.mid,
        upload_date: new Date(data.pubdate * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: data.stat.view || 0,
        like_count: data.stat.like || 0,
        comment_count: data.stat.reply || 0,
        coin_count: data.stat.coin || 0,
        favorite_count: data.stat.favorite || 0,
        share_count: data.stat.share || 0,
        danmaku_count: data.stat.danmaku || 0,
        formats: this.processBilibiliFormats(data, playInfo),
        webpage_url: `https://www.bilibili.com/video/${data.bvid}`,
        extractor: 'bilibili',
        platform: 'B站',
        tags: data.tag || [],
        tid: data.tid,
        tname: data.tname,
        copyright: data.copyright === 1 ? '原创' : '转载',
        pages: data.pages?.map(page => ({
          cid: page.cid,
          page: page.page,
          part: page.part,
          duration: page.duration,
          dimension: page.dimension
        })) || []
      };

    } catch (error) {
      console.error('B站视频解析失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析腾讯视频
   */
  async getTencentVideoInfo(url) {
    try {
      console.log(`🎬 正在解析腾讯视频: ${url}`);
      
      const videoId = this.extractTencentId(url);
      if (!videoId) {
        throw new Error('无效的腾讯视频链接');
      }

      // 腾讯视频详情API
      const apiUrl = `https://h5vv.video.qq.com/getinfo?callback=jsonp&vid=${videoId}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          ...this.headers,
          'Referer': 'https://v.qq.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`腾讯视频 API 请求失败: ${response.status}`);
      }

      let text = await response.text();
      // 移除JSONP包装
      text = text.replace(/^jsonp\(/, '').replace(/\)$/, '');
      const data = JSON.parse(text);

      if (!data.vl || !data.vl.vi || data.vl.vi.length === 0) {
        throw new Error('腾讯视频不存在或无法访问');
      }

      const video = data.vl.vi[0];

      return {
        id: video.vid,
        title: video.ti,
        description: video.desc || '',
        duration: video.dur,
        thumbnail: video.pic || `https://puui.qpic.cn/qqvideo_ori/0/${video.vid}_496_280/0`,
        uploader: video.owner || '腾讯视频',
        upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: 0, // 腾讯视频不提供公开播放量
        like_count: 0,
        comment_count: 0,
        formats: [{
          format_id: 'tencent_web',
          url: url,
          ext: 'mp4',
          quality: 720,
          width: 1280,
          height: 720,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac'
        }],
        webpage_url: url,
        extractor: 'tencent',
        platform: '腾讯视频',
        series: video.albuminfo ? {
          name: video.albuminfo.title,
          desc: video.albuminfo.desc
        } : null
      };

    } catch (error) {
      console.error('腾讯视频解析失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析西瓜视频
   */
  async getXiguaVideoInfo(url) {
    try {
      console.log(`🍉 正在解析西瓜视频: ${url}`);
      
      const videoId = this.extractXiguaId(url);
      if (!videoId) {
        throw new Error('无效的西瓜视频链接');
      }

      // 西瓜视频API（头条系）
      const apiUrl = `https://www.ixigua.com/tlb/reflow/${videoId}/`;
      
      const response = await fetch(apiUrl, {
        headers: {
          ...this.headers,
          'Referer': 'https://www.ixigua.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`西瓜视频 API 请求失败: ${response.status}`);
      }

      const html = await response.text();
      
      // 从HTML中提取JSON数据
      const jsonMatch = html.match(/window\._SSR_HYDRATED_DATA\s*=\s*({.*?});/);
      if (!jsonMatch) {
        throw new Error('无法提取西瓜视频数据');
      }

      const data = JSON.parse(jsonMatch[1]);
      const videoData = data.anyVideo?.gidInformation?.packerData?.video;
      
      if (!videoData) {
        throw new Error('西瓜视频数据格式错误');
      }

      return {
        id: videoData.video_id,
        title: videoData.title,
        description: videoData.abstract || '',
        duration: videoData.duration,
        thumbnail: videoData.poster_url,
        uploader: videoData.user_info?.name || '西瓜视频用户',
        uploader_id: videoData.user_info?.user_id,
        upload_date: new Date(videoData.publish_time * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: videoData.video_play_count || 0,
        like_count: videoData.digg_count || 0,
        comment_count: videoData.comment_count || 0,
        share_count: videoData.share_count || 0,
        formats: this.processXiguaFormats(videoData),
        webpage_url: url,
        extractor: 'xigua',
        platform: '西瓜视频',
        tags: videoData.tags || []
      };

    } catch (error) {
      console.error('西瓜视频解析失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析快手视频
   */
  async getKuaishouVideoInfo(url) {
    try {
      console.log(`⚡ 正在解析快手视频: ${url}`);
      
      const photoId = this.extractKuaishouId(url);
      if (!photoId) {
        throw new Error('无效的快手链接');
      }

      // 快手分享页面API
      const apiUrl = `https://www.kuaishou.com/graphql`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Content-Type': 'application/json',
          'Referer': 'https://www.kuaishou.com/'
        },
        body: JSON.stringify({
          operationName: 'visionVideoDetail',
          variables: {
            photoId: photoId
          },
          query: 'query visionVideoDetail($photoId: String) { visionVideoDetail(photoId: $photoId) { status author { id name } photo { id caption duration coverUrl playUrl } } }'
        })
      });

      if (!response.ok) {
        throw new Error(`快手 API 请求失败: ${response.status}`);
      }

      const result = await response.json();
      const data = result.data?.visionVideoDetail;
      
      if (!data || data.status !== 1) {
        throw new Error('快手视频不存在或无法访问');
      }

      const video = data.photo;
      const author = data.author;

      return {
        id: video.id,
        title: video.caption || '快手视频',
        description: video.caption || '',
        duration: video.duration / 1000, // 毫秒转秒
        thumbnail: video.coverUrl,
        uploader: author.name || '快手用户',
        uploader_id: author.id,
        upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        view_count: 0, // 快手不提供公开播放量
        like_count: 0,
        comment_count: 0,
        formats: [{
          format_id: 'kuaishou_web',
          url: video.playUrl,
          ext: 'mp4',
          quality: 720,
          width: 720,
          height: 1280, // 快手多为竖屏视频
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac'
        }],
        webpage_url: url,
        extractor: 'kuaishou',
        platform: '快手'
      };

    } catch (error) {
      console.error('快手视频解析失败:', error.message);
      throw error;
    }
  }

  /**
   * 通用解析入口
   */
  async extractVideoInfo(url) {
    try {
      // 抖音
      if (this.isDouyinUrl(url)) {
        return await this.getDouyinVideoInfo(url);
      }

      // B站
      if (this.isBilibiliUrl(url)) {
        const bvid = this.extractBilibiliId(url);
        return await this.getBilibiliVideoInfo(bvid);
      }

      // 腾讯视频
      if (this.isTencentUrl(url)) {
        return await this.getTencentVideoInfo(url);
      }

      // 西瓜视频
      if (this.isXiguaUrl(url)) {
        return await this.getXiguaVideoInfo(url);
      }

      // 快手
      if (this.isKuaishouUrl(url)) {
        return await this.getKuaishouVideoInfo(url);
      }

      throw new Error('不支持的国内视频平台');

    } catch (error) {
      console.error('国内视频平台解析失败:', error.message);
      throw error;
    }
  }

  // URL 检测方法
  isDouyinUrl(url) {
    return url.includes('douyin.com') || url.includes('dy.com') || url.includes('iesdouyin.com');
  }

  isBilibiliUrl(url) {
    return url.includes('bilibili.com') || url.includes('b23.tv');
  }

  isTencentUrl(url) {
    return url.includes('v.qq.com') || url.includes('qq.com/x/');
  }

  isXiguaUrl(url) {
    return url.includes('ixigua.com') || url.includes('xigua.com');
  }

  isKuaishouUrl(url) {
    return url.includes('kuaishou.com') || url.includes('ks.com');
  }

  // ID 提取方法
  extractDouyinId(url) {
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

  extractBilibiliId(url) {
    const patterns = [
      /\/video\/(BV[a-zA-Z0-9]+)/,
      /\/video\/(av\d+)/,
      /b23\.tv\/([a-zA-Z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  extractTencentId(url) {
    const patterns = [
      /\/([a-zA-Z0-9_]+)\.html/,
      /vid=([a-zA-Z0-9_]+)/,
      /v\.qq\.com\/x\/page\/([a-zA-Z0-9_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  extractXiguaId(url) {
    const patterns = [
      /\/(\d+)\//,
      /xigua\.com\/(\d+)/,
      /ixigua\.com\/(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  extractKuaishouId(url) {
    const patterns = [
      /photo\/(\d+)/,
      /short-video\/([a-zA-Z0-9_-]+)/,
      /kuaishou\.com\/u\/[^\/]+\/([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // 格式处理方法
  processDouyinFormats(video) {
    const formats = [];
    
    if (video?.play_addr?.url_list) {
      video.play_addr.url_list.forEach((url, index) => {
        formats.push({
          format_id: `douyin_${index}`,
          url: url,
          ext: 'mp4',
          quality: 720,
          width: video.width || 720,
          height: video.height || 1280,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac'
        });
      });
    }
    
    return formats;
  }

  processBilibiliFormats(data, playInfo) {
    const formats = [];
    
    // 如果有播放信息
    if (playInfo?.durl) {
      playInfo.durl.forEach((item, index) => {
        formats.push({
          format_id: `bilibili_${playInfo.quality || 'unknown'}_${index}`,
          url: item.url,
          ext: 'flv',
          quality: playInfo.quality || 80,
          width: 1280,
          height: 720,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac',
          filesize: item.size
        });
      });
    }
    
    // 默认格式
    if (formats.length === 0) {
      data.pages.forEach((page, index) => {
        formats.push({
          format_id: `bilibili_web_${page.cid}`,
          url: `https://www.bilibili.com/video/${data.bvid}?p=${index + 1}`,
          ext: 'mp4',
          quality: 720,
          width: page.dimension?.width || 1280,
          height: page.dimension?.height || 720,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac',
          page_title: page.part
        });
      });
    }
    
    return formats;
  }

  processXiguaFormats(videoData) {
    const formats = [];
    
    if (videoData.video_list) {
      Object.entries(videoData.video_list).forEach(([quality, info]) => {
        formats.push({
          format_id: `xigua_${quality}`,
          url: info.main_url,
          ext: 'mp4',
          quality: parseInt(quality) || 720,
          width: info.width || 1280,
          height: info.height || 720,
          fps: 30,
          vcodec: 'h264',
          acodec: 'aac',
          filesize: info.size
        });
      });
    }
    
    return formats;
  }
}

export default ChinaVideoApiClient;

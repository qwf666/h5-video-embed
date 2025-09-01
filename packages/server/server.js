import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import youtubeDl from 'youtube-dl-exec';
import path from 'path';
import { fileURLToPath } from 'url';
import VideoApiClient from './video-api-client.js';
import ChinaVideoApiClient from './china-video-api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// youtube-dl-exec 不需要 promisify，它本身就返回 Promise
const app = express();
const PORT = process.env.PORT || 3001;

// 初始化视频 API 客户端
const videoApiClient = new VideoApiClient();
const chinaVideoApiClient = new ChinaVideoApiClient();

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 每 15 分钟最多 100 个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});

app.use('/api/', limiter);

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'H5 Video Embed Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API 路由正常工作',
    timestamp: new Date().toISOString()
  });
});

// 增强的视频解析端点
app.post('/api/video/parse', async (req, res) => {
  const startTime = Date.now();
  console.log('收到视频解析请求:', req.method, req.path);
  console.log('请求体:', req.body);
  
  try {
    const { url, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少视频链接参数'
      });
    }

    // 验证 URL 格式
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        message: '无效的视频链接格式'
      });
    }

    console.log(`正在解析视频: ${url}`);
    console.log(`解析选项:`, options);

    // 增强的视频信息获取
    const videoInfo = await getVideoInfoEnhanced(url, options);
    
    if (!videoInfo) {
      return res.status(404).json({
        success: false,
        message: '无法解析视频信息'
      });
    }

    // 处理视频格式信息
    const processedData = processVideoDataEnhanced(videoInfo);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ 视频解析成功，耗时: ${processingTime}ms`);

    res.json({
      success: true,
      data: processedData,
      message: '视频解析成功',
      metadata: {
        processing_time: processingTime,
        extractor_used: videoInfo.extractor,
        platform: videoInfo.platform || detectPlatformFromUrl(url),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('视频解析错误:', error);
    
    const processingTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      message: error.message || '视频解析失败',
      error_type: error.name || 'UnknownError',
      metadata: {
        processing_time: processingTime,
        timestamp: new Date().toISOString()
      },
      debug: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        url: req.body.url
      } : undefined
    });
  }
});

// 获取视频缩略图
app.get('/api/video/thumbnail', async (req, res) => {
  try {
    const { url, quality = 'medium' } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少视频链接参数'
      });
    }

    const thumbnailUrl = await getVideoThumbnail(url, quality);
    
    if (!thumbnailUrl) {
      return res.status(404).json({
        success: false,
        message: '无法获取视频缩略图'
      });
    }

    res.json({
      success: true,
      data: {
        thumbnail: thumbnailUrl,
        quality
      }
    });

  } catch (error) {
    console.error('缩略图获取错误:', error);
    
    res.status(500).json({
      success: false,
      message: '缩略图获取失败'
    });
  }
});

// 批量视频解析端点
app.post('/api/video/batch-parse', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { urls, options = {} } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'urls参数必须是非空数组'
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({
        success: false,
        message: '批量解析最多支持10个视频链接'
      });
    }

    console.log(`开始批量解析 ${urls.length} 个视频...`);

    const results = await Promise.allSettled(
      urls.map(async (url, index) => {
        try {
          const videoInfo = await getVideoInfoEnhanced(url, options);
          const processedData = processVideoDataEnhanced(videoInfo);
          
          return {
            index,
            url,
            success: true,
            data: processedData
          };
        } catch (error) {
          console.error(`批量解析第${index + 1}个视频失败:`, error.message);
          return {
            index,
            url,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
    
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        total: urls.length,
        successful: successful.length,
        failed: failed.length,
        results: results.map(r => r.status === 'fulfilled' ? r.value : {
          success: false,
          error: r.reason?.message || '未知错误'
        })
      },
      metadata: {
        processing_time: processingTime,
        batch_size: urls.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('批量解析错误:', error);
    
    const processingTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      message: '批量解析失败',
      metadata: {
        processing_time: processingTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// 视频平台分析端点
app.post('/api/video/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少视频链接参数'
      });
    }

    const platformInfo = detectPlatformFromUrl(url);
    const videoId = extractVideoIdFromUrl(url);
    
    const analysis = {
      url: url,
      platform: platformInfo,
      video_id: videoId,
      can_embed: platformInfo.supports_embed,
      recommended_parser: platformInfo.type === 'chinese' ? 'china_api' : 
                         platformInfo.type === 'international' ? 'international_api' : 
                         'youtube_dl_exec',
      analysis_timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('视频分析错误:', error);
    
    res.status(500).json({
      success: false,
      message: '视频分析失败'
    });
  }
});

// 支持的平台列表
app.get('/api/platforms', (req, res) => {
  res.json({
    success: true,
    data: {
      chinese_platforms: {
        '抖音': {
          domains: ['douyin.com', 'dy.com'],
          features: ['视频信息', '用户信息', '统计数据', '音乐信息', '话题标签'],
          status: '✅ 完全支持'
        },
        'B站': {
          domains: ['bilibili.com', 'b23.tv'],
          features: ['视频信息', 'UP主信息', '播放量', '点赞数', '投币数', '收藏数', '多P视频'],
          status: '✅ 完全支持'
        },
        '腾讯视频': {
          domains: ['v.qq.com'],
          features: ['视频信息', '剧集信息', '基础数据'],
          status: '✅ 基础支持'
        },
        '西瓜视频': {
          domains: ['ixigua.com'],
          features: ['视频信息', '用户信息', '播放数据', '标签'],
          status: '✅ 完全支持'
        },
        '快手': {
          domains: ['kuaishou.com'],
          features: ['视频信息', '用户信息', '基础数据'],
          status: '✅ 基础支持'
        }
      },
      international_platforms: {
        'YouTube': {
          domains: ['youtube.com', 'youtu.be'],
          features: ['完整视频信息', '统计数据', '标签分类'],
          status: '✅ API支持'
        },
        'Vimeo': {
          domains: ['vimeo.com'],
          features: ['基础视频信息'],
          status: '✅ oEmbed支持'
        }
      },
      fallback_support: [
        '通过 yt-dlp 支持 1000+ 其他网站',
        '包括但不限于：优酷、爱奇艺、芒果TV、微博视频等'
      ],
      priority: [
        '1. 国内平台专用 API（最高优先级）',
        '2. 国际平台官方 API',
        '3. youtube-dl-exec 通用解析'
      ]
    }
  });
});

/**
 * 验证 URL 格式
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * 增强的视频信息获取策略
 */
async function getVideoInfoEnhanced(url, options = {}) {
  const errors = [];
  const startTime = Date.now();
  
  console.log(`🎯 开始增强解析视频: ${url}`);
  console.log(`📋 解析选项:`, options);
  
  // 平台检测
  const platformInfo = detectPlatformFromUrl(url);
  console.log(`🔍 检测到平台: ${platformInfo.name} (${platformInfo.type})`);

  // 策略 1: 优先使用国内平台专用 API（增强版）
  if (platformInfo.type === 'chinese') {
    try {
      console.log('🇨🇳 使用增强的国内平台 API...');
      const videoData = await chinaVideoApiClient.extractVideoInfo(url);
      
      if (videoData) {
        // 增强数据处理
        videoData.extractor = 'china_api_enhanced';
        videoData.platform_type = 'chinese';
        videoData.parsing_method = 'specialized_api';
        
        console.log(`✅ 国内平台 API 解析成功 (${videoData.platform}) - ${Date.now() - startTime}ms`);
        return await enrichVideoData(videoData, url, options);
      }
    } catch (error) {
      console.warn('⚠️ 国内平台 API 失败:', error.message);
      errors.push(`国内平台API: ${error.message}`);
    }
  }

  // 策略 2: 使用国际平台 API（增强版）
  if (platformInfo.type === 'international') {
    try {
      console.log('🌍 使用增强的国际平台 API...');
      const videoData = await videoApiClient.extractVideoInfo(url);
      
      if (videoData) {
        // 增强数据处理
        videoData.extractor = 'international_api_enhanced';
        videoData.platform_type = 'international';
        videoData.parsing_method = 'official_api';
        
        console.log(`✅ 国际平台 API 解析成功 - ${Date.now() - startTime}ms`);
        return await enrichVideoData(videoData, url, options);
      }
    } catch (error) {
      console.warn('⚠️ 国际平台 API 失败:', error.message);
      errors.push(`国际平台API: ${error.message}`);
    }
  }

  // 策略 3: 使用 youtube-dl-exec 通用解析（增强版）
  try {
    console.log('🔄 使用增强的 youtube-dl-exec 解析...');
    
    const ytDlpOptions = {
      dumpSingleJson: true,
      noDownload: true,
      noWarnings: true,
      skipDownload: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      writeInfoJson: false,
      writeDescription: false,
      writeThumbnail: false,
      extractFlat: false,
      // 根据平台优化提取器
      ...(platformInfo.type === 'chinese' && {
        cookiesFromBrowser: 'chrome',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }),
      // 添加自定义选项
      ...options.ytdlp_options
    };

    const timeoutMs = options.timeout || 30000; // 默认30秒超时
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`youtube-dl-exec 超时 (${timeoutMs}ms)`)), timeoutMs);
    });

    const videoPromise = youtubeDl(url, ytDlpOptions);
    const videoData = await Promise.race([videoPromise, timeoutPromise]);
    
    // 增强数据处理
    videoData.extractor = videoData.extractor || 'youtube_dl_enhanced';
    videoData.platform_type = platformInfo.type;
    videoData.parsing_method = 'youtube_dl_exec';
    
    console.log(`✅ youtube-dl-exec 解析成功 - ${Date.now() - startTime}ms`);
    return await enrichVideoData(videoData, url, options);

  } catch (error) {
    console.warn('⚠️ youtube-dl-exec 失败:', error.message);
    errors.push(`youtube-dl-exec: ${error.message}`);
  }

  // 策略 4: 降级到基础信息提取
  try {
    console.log('🔄 使用降级基础信息提取...');
    const basicInfo = await extractBasicInfoFallback(url);
    
    if (basicInfo) {
      console.log(`✅ 基础信息提取成功 - ${Date.now() - startTime}ms`);
      return basicInfo;
    }
  } catch (error) {
    console.warn('⚠️ 基础信息提取失败:', error.message);
    errors.push(`基础信息提取: ${error.message}`);
  }

  // 如果所有方法都失败，抛出详细错误
  const totalTime = Date.now() - startTime;
  const errorMessage = `所有视频解析方法都失败 (${totalTime}ms):\n${errors.join('\n')}`;
  console.error('❌ 视频解析完全失败:', errorMessage);
  throw new Error(errorMessage);
}

/**
 * 增强视频数据
 */
async function enrichVideoData(videoData, originalUrl, options) {
  try {
    const enriched = { ...videoData };
    
    // 添加标准化字段
    enriched.original_url = originalUrl;
    enriched.parsed_at = new Date().toISOString();
    enriched.parser_version = '2.0.0';
    
    // 格式化时长
    if (enriched.duration && typeof enriched.duration === 'number') {
      enriched.duration_formatted = formatDuration(enriched.duration);
    }
    
    // 格式化上传日期
    if (enriched.upload_date && enriched.upload_date.length === 8) {
      const year = enriched.upload_date.slice(0, 4);
      const month = enriched.upload_date.slice(4, 6);
      const day = enriched.upload_date.slice(6, 8);
      enriched.upload_date_formatted = `${year}-${month}-${day}`;
    }
    
    // 添加统计数据汇总
    enriched.engagement = {
      total_interactions: (enriched.like_count || 0) + 
                         (enriched.comment_count || 0) + 
                         (enriched.share_count || 0),
      engagement_rate: enriched.view_count > 0 ? 
        ((enriched.like_count || 0) / enriched.view_count * 100).toFixed(2) : 0
    };
    
    // 处理格式信息
    if (enriched.formats && Array.isArray(enriched.formats)) {
      enriched.formats = enriched.formats
        .filter(format => format.url && (format.vcodec !== 'none' || format.acodec !== 'none'))
        .map(format => ({
          ...format,
          quality_label: getQualityLabel(format),
          file_size_formatted: format.filesize ? formatFileSize(format.filesize) : null
        }))
        .sort((a, b) => (b.height || 0) - (a.height || 0));
    }
    
    // 添加嵌入信息
    if (!enriched.embed && canGenerateEmbed(originalUrl)) {
      enriched.embed = generateEmbedInfo(originalUrl, enriched);
    }
    
    // 添加SEO友好的元数据
    enriched.seo = {
      title: enriched.title ? enriched.title.substring(0, 60) : '',
      description: enriched.description ? enriched.description.substring(0, 160) : '',
      keywords: extractKeywords(enriched)
    };
    
    return enriched;
    
  } catch (error) {
    console.warn('数据增强失败，返回原始数据:', error.message);
    return videoData;
  }
}

/**
 * 降级基础信息提取
 */
async function extractBasicInfoFallback(url) {
  try {
    console.log('🔄 尝试基础信息提取...');
    
    // 从URL中提取基础信息
    const platformInfo = detectPlatformFromUrl(url);
    const basicInfo = {
      id: extractVideoIdFromUrl(url) || 'unknown',
      title: `${platformInfo.name}视频`,
      description: '视频解析失败，但检测到有效的视频链接',
      duration: 0,
      thumbnail: generatePlaceholderThumbnail(platformInfo.name),
      uploader: `${platformInfo.name}用户`,
      upload_date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      webpage_url: url,
      extractor: 'fallback_basic',
      platform: platformInfo.name,
      platform_type: platformInfo.type,
      parsing_method: 'fallback',
      formats: [{
        format_id: 'fallback',
        url: url,
        ext: 'unknown',
        quality: 0,
        note: '需要支持的播放器'
      }],
      is_fallback: true,
      fallback_reason: '所有高级解析方法均失败'
    };
    
    return basicInfo;
    
  } catch (error) {
    console.error('基础信息提取也失败:', error.message);
    return null;
  }
}

/**
 * 检测是否为国内视频平台
 */
function isChineseVideoUrl(url) {
  const chinesePlatforms = [
    'douyin.com', 'dy.com', 'iesdouyin.com',     // 抖音
    'bilibili.com', 'b23.tv',                     // B站
    'v.qq.com', 'qq.com/x/',                      // 腾讯视频
    'ixigua.com', 'xigua.com',                    // 西瓜视频
    'kuaishou.com', 'ks.com',                     // 快手
    'weibo.com', 'weibo.cn',                      // 微博视频
    'youku.com',                                  // 优酷
    'iqiyi.com',                                  // 爱奇艺
    'mgtv.com',                                   // 芒果TV
    'le.com'                                      // 乐视
  ];
  
  return chinesePlatforms.some(platform => url.includes(platform));
}

/**
 * 检测是否为国际视频平台
 */
function isInternationalVideoUrl(url) {
  const internationalPlatforms = [
    'youtube.com', 'youtu.be',                    // YouTube
    'vimeo.com',                                  // Vimeo
    'twitter.com', 'x.com',                       // Twitter/X
    'instagram.com',                              // Instagram
    'facebook.com',                               // Facebook
    'tiktok.com',                                 // TikTok (国际版)
    'twitch.tv'                                   // Twitch
  ];
  
  return internationalPlatforms.some(platform => url.includes(platform));
}

/**
 * 增强的视频数据处理
 */
function processVideoDataEnhanced(rawData) {
  return {
    // 基础信息
    id: rawData.id,
    title: rawData.title || '未知标题',
    description: rawData.description || '',
    duration: rawData.duration || 0,
    duration_formatted: rawData.duration_formatted || formatDuration(rawData.duration || 0),
    thumbnail: rawData.thumbnail || '',
    uploader: rawData.uploader || '',
    uploader_id: rawData.uploader_id || '',
    uploader_avatar: rawData.uploader_avatar || '',
    upload_date: rawData.upload_date || '',
    upload_date_formatted: rawData.upload_date_formatted || '',
    
    // 统计数据
    view_count: rawData.view_count || 0,
    like_count: rawData.like_count || 0,
    comment_count: rawData.comment_count || 0,
    share_count: rawData.share_count || 0,
    engagement: rawData.engagement || {},
    
    // 平台特定数据
    platform: rawData.platform || '',
    platform_type: rawData.platform_type || '',
    platform_name: rawData.platform_name || rawData.platform || '',
    
    // 技术信息
    formats: processFormatsEnhanced(rawData.formats || []),
    webpage_url: rawData.webpage_url || rawData.original_url || '',
    original_url: rawData.original_url || '',
    extractor: rawData.extractor || '',
    parsing_method: rawData.parsing_method || '',
    parser_version: rawData.parser_version || '2.0.0',
    parsed_at: rawData.parsed_at || new Date().toISOString(),
    
    // 嵌入信息
    embed: rawData.embed || null,
    
    // SEO和元数据
    seo: rawData.seo || {},
    tags: rawData.tags || [],
    
    // 平台特有字段
    ...(rawData.platform === 'bilibili' || rawData.platform === 'B站') && {
      coin_count: rawData.coin_count || 0,
      favorite_count: rawData.favorite_count || 0,
      danmaku_count: rawData.danmaku_count || 0,
      pages: rawData.pages || [],
      copyright: rawData.copyright || '',
      tid: rawData.tid,
      tname: rawData.tname
    },
    
    ...(rawData.platform === 'douyin' || rawData.platform === '抖音') && {
      music: rawData.music || null,
      hashtags: rawData.hashtags || []
    },
    
    // 降级信息
    ...(rawData.is_fallback && {
      is_fallback: true,
      fallback_reason: rawData.fallback_reason
    })
  };
}

/**
 * 处理视频数据（兼容性保留）
 */
function processVideoData(rawData) {
  return processVideoDataEnhanced(rawData);
}

/**
 * 增强的视频格式处理
 */
function processFormatsEnhanced(formats) {
  if (!formats || !Array.isArray(formats)) return [];
  
  return formats
    .filter(format => format.url && (format.vcodec !== 'none' || format.acodec !== 'none'))
    .map(format => ({
      format_id: format.format_id,
      url: format.url,
      ext: format.ext,
      quality: format.quality || 0,
      quality_label: getQualityLabel(format),
      filesize: format.filesize,
      file_size_formatted: format.filesize ? formatFileSize(format.filesize) : null,
      width: format.width,
      height: format.height,
      fps: format.fps,
      vcodec: format.vcodec,
      acodec: format.acodec,
      note: format.note || '',
      is_video: format.vcodec && format.vcodec !== 'none',
      is_audio: format.acodec && format.acodec !== 'none',
      resolution: format.width && format.height ? `${format.width}x${format.height}` : null
    }))
    .sort((a, b) => {
      // 优先按视频质量排序，然后按文件大小
      if (a.height && b.height) return b.height - a.height;
      if (a.quality && b.quality) return b.quality - a.quality;
      if (a.filesize && b.filesize) return b.filesize - a.filesize;
      return 0;
    })
    .slice(0, 10); // 返回前10个最佳格式
}

/**
 * 处理视频格式信息（兼容性保留）
 */
function processFormats(formats) {
  return processFormatsEnhanced(formats).slice(0, 5);
}

/**
 * 增强的平台检测
 */
function detectPlatformFromUrl(url) {
  const platforms = {
    // 国内平台
    'douyin.com': { name: '抖音', type: 'chinese', supports_embed: false },
    'dy.com': { name: '抖音', type: 'chinese', supports_embed: false },
    'iesdouyin.com': { name: '抖音', type: 'chinese', supports_embed: false },
    'bilibili.com': { name: 'B站', type: 'chinese', supports_embed: true },
    'b23.tv': { name: 'B站', type: 'chinese', supports_embed: true },
    'v.qq.com': { name: '腾讯视频', type: 'chinese', supports_embed: false },
    'ixigua.com': { name: '西瓜视频', type: 'chinese', supports_embed: false },
    'xigua.com': { name: '西瓜视频', type: 'chinese', supports_embed: false },
    'kuaishou.com': { name: '快手', type: 'chinese', supports_embed: false },
    'ks.com': { name: '快手', type: 'chinese', supports_embed: false },
    'youku.com': { name: '优酷', type: 'chinese', supports_embed: true },
    'iqiyi.com': { name: '爱奇艺', type: 'chinese', supports_embed: true },
    'mgtv.com': { name: '芒果TV', type: 'chinese', supports_embed: true },
    'weibo.com': { name: '微博视频', type: 'chinese', supports_embed: false },
    
    // 国际平台
    'youtube.com': { name: 'YouTube', type: 'international', supports_embed: true },
    'youtu.be': { name: 'YouTube', type: 'international', supports_embed: true },
    'vimeo.com': { name: 'Vimeo', type: 'international', supports_embed: true },
    'twitter.com': { name: 'Twitter', type: 'international', supports_embed: true },
    'x.com': { name: 'X', type: 'international', supports_embed: true },
    'instagram.com': { name: 'Instagram', type: 'international', supports_embed: true },
    'facebook.com': { name: 'Facebook', type: 'international', supports_embed: true },
    'tiktok.com': { name: 'TikTok', type: 'international', supports_embed: false },
    'twitch.tv': { name: 'Twitch', type: 'international', supports_embed: true }
  };
  
  for (const [domain, info] of Object.entries(platforms)) {
    if (url.includes(domain)) {
      return info;
    }
  }
  
  return { name: '未知平台', type: 'unknown', supports_embed: false };
}

/**
 * 工具函数集合
 */

// 格式化时长（秒转换为可读格式）
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return null;
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// 获取质量标签
function getQualityLabel(format) {
  if (format.height) {
    if (format.height >= 2160) return '4K';
    if (format.height >= 1440) return '2K';
    if (format.height >= 1080) return '1080p';
    if (format.height >= 720) return '720p';
    if (format.height >= 480) return '480p';
    if (format.height >= 360) return '360p';
    if (format.height >= 240) return '240p';
    return `${format.height}p`;
  }
  
  if (format.quality) {
    return `质量 ${format.quality}`;
  }
  
  return '未知质量';
}

// 检查是否可以生成嵌入代码
function canGenerateEmbed(url) {
  const platformInfo = detectPlatformFromUrl(url);
  return platformInfo.supports_embed;
}

// 生成嵌入信息
function generateEmbedInfo(url, videoData) {
  const platformInfo = detectPlatformFromUrl(url);
  
  if (!platformInfo.supports_embed) return null;
  
  // YouTube
  if (platformInfo.name === 'YouTube') {
    const videoId = extractVideoIdFromUrl(url);
    if (videoId) {
      return {
        type: 'iframe',
        url: `https://www.youtube.com/embed/${videoId}`,
        width: 1280,
        height: 720,
        responsive: true
      };
    }
  }
  
  // B站
  if (platformInfo.name === 'B站') {
    const bvid = videoData.id || videoData.bvid;
    if (bvid) {
      return {
        type: 'iframe',
        url: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0`,
        width: 1280,
        height: 720,
        responsive: true
      };
    }
  }
  
  // Vimeo
  if (platformInfo.name === 'Vimeo') {
    const videoId = extractVideoIdFromUrl(url);
    if (videoId) {
      return {
        type: 'iframe',
        url: `https://player.vimeo.com/video/${videoId}`,
        width: 1280,
        height: 720,
        responsive: true
      };
    }
  }
  
  return null;
}

// 从URL提取视频ID
function extractVideoIdFromUrl(url) {
  // YouTube
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  // B站
  const bilibiliPatterns = [
    /\/video\/(BV[a-zA-Z0-9]+)/,
    /\/video\/(av\d+)/,
    /b23\.tv\/([a-zA-Z0-9]+)/
  ];
  
  for (const pattern of bilibiliPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  // Vimeo
  const vimeoPatterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/channels\/[\w-]+\/(\d+)/
  ];
  
  for (const pattern of vimeoPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  // 通用模式：尝试提取数字或字母数字组合
  const genericPatterns = [
    /\/([a-zA-Z0-9_-]{8,})/,
    /id=([a-zA-Z0-9_-]+)/,
    /v=([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of genericPatterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// 生成占位符缩略图
function generatePlaceholderThumbnail(platformName) {
  const colors = {
    '抖音': '#000000',
    'B站': '#FB7299',
    '腾讯视频': '#FF6600',
    '西瓜视频': '#FF6B35',
    '快手': '#FFE066',
    'YouTube': '#FF0000',
    'Vimeo': '#1AB7EA',
    '未知平台': '#666666'
  };
  
  const color = colors[platformName] || colors['未知平台'];
  return `https://via.placeholder.com/1280x720/${color.slice(1)}/FFFFFF?text=${encodeURIComponent(platformName)}+Video`;
}

// 提取关键词
function extractKeywords(videoData) {
  const keywords = [];
  
  // 从标题提取
  if (videoData.title) {
    const titleWords = videoData.title
      .split(/[\s,，。！？\-_]+/)
      .filter(word => word.length > 1)
      .slice(0, 5);
    keywords.push(...titleWords);
  }
  
  // 从标签提取
  if (videoData.tags && Array.isArray(videoData.tags)) {
    keywords.push(...videoData.tags.slice(0, 5));
  }
  
  // 从平台名称
  if (videoData.platform) {
    keywords.push(videoData.platform);
  }
  
  // 从上传者
  if (videoData.uploader) {
    keywords.push(videoData.uploader);
  }
  
  return [...new Set(keywords)].slice(0, 10); // 去重并限制数量
}

/**
 * 获取视频缩略图
 */
async function getVideoThumbnail(url, quality) {
  try {
    const result = await youtubeDl(url, {
      getThumbnail: true,
      noDownload: true
    });
    return result;
  } catch (error) {
    console.error('获取缩略图失败:', error);
    return null;
  }
}



// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 H5 Video Embed Server 正在运行在端口 ${PORT}`);
  console.log(`📍 健康检查: http://localhost:${PORT}/health`);
  console.log(`🎥 视频解析 API: http://localhost:${PORT}/api/video/parse`);
  console.log(`🧪 测试 API: http://localhost:${PORT}/api/test`);
  console.log(`🎯 使用真实业务逻辑，无模拟数据`);
  
  // 检查环境变量配置
  console.log('\n📋 环境配置检查:');
  
  if (process.env.YOUTUBE_API_KEY) {
    console.log('✅ YouTube Data API v3 密钥已配置');
  } else {
    console.log('⚠️ YouTube Data API v3 密钥未配置，将使用 oEmbed API（功能有限）');
    console.log('   💡 提示：设置 YOUTUBE_API_KEY 环境变量以获得完整功能');
  }
  
  if (process.env.VIMEO_ACCESS_TOKEN) {
    console.log('✅ Vimeo 访问令牌已配置');
  } else {
    console.log('⚠️ Vimeo 访问令牌未配置，将使用 oEmbed API（功能有限）');
  }
  
  // 检查 youtube-dl-exec 可用性
  console.log('\n🔧 检查 youtube-dl-exec 可用性...');
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('版本检查超时')), 8000);
    });
    
    const versionPromise = youtubeDl('--version');
    const version = await Promise.race([versionPromise, timeoutPromise]);
    
    console.log(`✅ youtube-dl/yt-dlp 可用`);
    console.log(`   版本: ${version.trim().split('\n')[0]}`);
    console.log(`   优先级: 主要解析方法`);
  } catch (error) {
    console.warn('⚠️ youtube-dl-exec 不可用:', error.message);
    console.warn('   将使用官方平台 API 作为主要解析方法');
  }
  
  console.log('\n🎬 支持的视频平台:');
  console.log('   🇨🇳 国内主流平台 (专用 API):');
  console.log('      • 抖音 (完全支持)');
  console.log('      • B站 (完全支持)');
  console.log('      • 腾讯视频 (基础支持)');
  console.log('      • 西瓜视频 (完全支持)');
  console.log('      • 快手 (基础支持)');
  console.log('   🌍 国际平台:');
  console.log('      • YouTube (Data API v3 / oEmbed)');
  console.log('      • Vimeo (oEmbed / API)');
  console.log('   📦 其他平台 (通过 youtube-dl-exec):');
  console.log('      • 优酷、爱奇艺、芒果TV、微博视频等 1000+ 网站');
  
  console.log('\n🚀 服务器启动完成！');
});

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

// 视频解析端点
app.post('/api/video/parse', async (req, res) => {
  console.log('收到视频解析请求:', req.method, req.path);
  console.log('请求体:', req.body);
  
  try {
    const { url } = req.body;

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

    // 使用 yt-dlp 获取视频信息
    const videoInfo = await getVideoInfo(url);
    
    if (!videoInfo) {
      return res.status(404).json({
        success: false,
        message: '无法解析视频信息'
      });
    }

    // 处理视频格式信息
    const processedData = processVideoData(videoInfo);

    res.json({
      success: true,
      data: processedData,
      message: '视频解析成功'
    });

  } catch (error) {
    console.error('视频解析错误:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || '视频解析失败',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
 * 真实视频信息获取策略（专注国内平台）
 */
async function getVideoInfo(url) {
  const errors = [];
  
  console.log(`🎯 开始解析视频: ${url}`);

  // 策略 1: 优先使用国内平台专用 API
  if (isChineseVideoUrl(url)) {
    try {
      console.log('🇨🇳 检测到国内视频平台，使用专用 API...');
      const videoData = await chinaVideoApiClient.extractVideoInfo(url);
      
      if (videoData) {
        console.log(`✅ 国内平台 API 解析成功 (${videoData.platform})`);
        return videoData;
      }
    } catch (error) {
      console.warn('⚠️ 国内平台 API 失败:', error.message);
      errors.push(`国内平台API: ${error.message}`);
    }
  }

  // 策略 2: 使用国际平台 API（YouTube、Vimeo 等）
  if (isInternationalVideoUrl(url)) {
    try {
      console.log('🌍 检测到国际视频平台，使用对应 API...');
      const videoData = await videoApiClient.extractVideoInfo(url);
      
      if (videoData) {
        console.log('✅ 国际平台 API 解析成功');
        return videoData;
      }
    } catch (error) {
      console.warn('⚠️ 国际平台 API 失败:', error.message);
      errors.push(`国际平台API: ${error.message}`);
    }
  }

  // 策略 3: 使用 youtube-dl-exec 作为通用后备方案
  try {
    console.log('🔄 使用 youtube-dl-exec 通用解析...');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('youtube-dl-exec 超时')), 20000); // 20秒超时
    });

    const videoPromise = youtubeDl(url, {
      dumpSingleJson: true,
      noDownload: true,
      noWarnings: true,
      skipDownload: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      extractor: 'generic'
    });

    const videoData = await Promise.race([videoPromise, timeoutPromise]);
    
    console.log('✅ youtube-dl-exec 通用解析成功');
    return videoData;

  } catch (error) {
    console.warn('⚠️ youtube-dl-exec 失败:', error.message);
    errors.push(`youtube-dl-exec: ${error.message}`);
  }

  // 如果所有方法都失败，抛出详细错误
  const errorMessage = `所有视频解析方法都失败:\n${errors.join('\n')}`;
  console.error('❌ 视频解析完全失败:', errorMessage);
  throw new Error(errorMessage);
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
 * 处理视频数据
 */
function processVideoData(rawData) {
  return {
    id: rawData.id,
    title: rawData.title || '未知标题',
    description: rawData.description || '',
    duration: rawData.duration || 0,
    thumbnail: rawData.thumbnail || '',
    uploader: rawData.uploader || '',
    upload_date: rawData.upload_date || '',
    view_count: rawData.view_count || 0,
    like_count: rawData.like_count || 0,
    formats: processFormats(rawData.formats || []),
    webpage_url: rawData.webpage_url || '',
    extractor: rawData.extractor || ''
  };
}

/**
 * 处理视频格式信息
 */
function processFormats(formats) {
  return formats
    .filter(format => format.vcodec && format.vcodec !== 'none')
    .map(format => ({
      format_id: format.format_id,
      url: format.url,
      ext: format.ext,
      quality: format.quality || 0,
      filesize: format.filesize,
      width: format.width,
      height: format.height,
      fps: format.fps,
      vcodec: format.vcodec,
      acodec: format.acodec
    }))
    .sort((a, b) => (b.quality || 0) - (a.quality || 0))
    .slice(0, 5); // 只返回前5个最佳格式
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

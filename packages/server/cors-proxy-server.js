// CORS 代理服务器 - 主要为前端提供跨域支持
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: false, // 允许iframe嵌入
}));

app.use(cors({
  origin: true, // 允许所有来源（开发环境）
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 200, // 每个 IP 每 15 分钟最多 200 个请求（前端需要更多请求）
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  }
});

app.use('/api/', limiter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CORS Proxy Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: 'cors-proxy'
  });
});

// 通用CORS代理端点
app.all('/api/proxy/*', async (req, res) => {
  try {
    const targetUrl = req.path.replace('/api/proxy/', '');
    const decodedUrl = decodeURIComponent(targetUrl);
    
    console.log(`🔄 代理请求: ${req.method} ${decodedUrl}`);
    
    const options = {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache'
      }
    };

    if (req.method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
      options.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(decodedUrl, options);
    const contentType = response.headers.get('content-type');
    
    // 设置响应头
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }

  } catch (error) {
    console.error('代理请求失败:', error);
    res.status(500).json({
      success: false,
      message: '代理请求失败',
      error: error.message
    });
  }
});

// B站专用代理
app.get('/api/proxy/bilibili/video/:bvid', async (req, res) => {
  try {
    const { bvid } = req.params;
    const apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
    
    console.log(`📺 B站视频代理: ${bvid}`);
    
    const response = await fetch(apiUrl, {
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
      return res.status(400).json({
        success: false,
        message: result.message || 'B站API错误'
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('B站代理失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// URL解析代理（用于短链接解析）
app.post('/api/resolve-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少URL参数'
      });
    }

    console.log(`🔗 解析短链接: ${url}`);

    // 发送HEAD请求获取重定向后的URL
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    res.json({
      success: true,
      originalUrl: url,
      resolvedUrl: response.url,
      status: response.status
    });

  } catch (error) {
    console.error('URL解析失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 抖音页面代理
app.post('/api/proxy/douyin/page', async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log(`🎵 抖音页面代理: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`抖音页面请求失败: ${response.status}`);
    }

    const html = await response.text();
    
    // 尝试从HTML中提取JSON数据
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
    
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        res.json({
          success: true,
          data: data
        });
        return;
      } catch (parseError) {
        console.warn('JSON解析失败:', parseError.message);
      }
    }

    // 如果无法解析JSON，返回基础信息
    res.json({
      success: false,
      message: '无法从抖音页面提取视频信息',
      html: html.substring(0, 1000) // 返回部分HTML用于调试
    });

  } catch (error) {
    console.error('抖音页面代理失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 后端解析接口 - 作为前端解析失败时的后备方案
app.post('/api/video/parse', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: '缺少视频链接参数'
      });
    }

    console.log(`🔄 后端解析请求: ${url}`);

    // 检查是否为B站链接
    if (url.includes('bilibili.com') || url.includes('b23.tv')) {
      // 对于B站，提供基础的嵌入式播放支持
      const bvidMatch = url.match(/\/video\/(BV[a-zA-Z0-9]+)/);
      if (bvidMatch) {
        const bvid = bvidMatch[1];
        
        // 尝试获取B站基础信息
        try {
          const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://www.bilibili.com/'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.code === 0) {
              const data = result.data;
              
              return res.json({
                success: true,
                data: {
                  id: data.bvid,
                  title: data.title,
                  description: data.desc || '',
                  duration: data.duration,
                  thumbnail: data.pic,
                  uploader: data.owner?.name || '未知用户',
                  upload_date: new Date(data.pubdate * 1000).toISOString().slice(0, 10).replace(/-/g, ''),
                  view_count: data.stat?.view || 0,
                  like_count: data.stat?.like || 0,
                  comment_count: data.stat?.reply || 0,
                  webpage_url: url,
                  platform: 'bilibili',
                  platform_name: 'B站',
                  extractor: 'bilibili_backend',
                  embed: {
                    type: 'iframe',
                    url: `https://player.bilibili.com/player.html?bvid=${data.bvid}&autoplay=0`,
                    width: 1280,
                    height: 720
                  },
                  formats: [{
                    format_id: 'bilibili_embed',
                    url: `https://player.bilibili.com/player.html?bvid=${data.bvid}`,
                    ext: 'mp4',
                    quality: 720,
                    width: 1280,
                    height: 720,
                    fps: 30,
                    vcodec: 'h264',
                    acodec: 'aac',
                    note: '需要B站播放器'
                  }]
                },
                message: '视频解析成功（后端基础解析）'
              });
            }
          }
        } catch (apiError) {
          console.warn('B站API调用失败:', apiError.message);
        }
      }
    }

    // 对于其他平台或B站解析失败的情况
    res.json({
      success: false,
      message: '此CORS代理服务器主要支持前端解析，建议使用前端VideoParser或完整的server.js服务器',
      suggestion: {
        frontend: '优先使用前端VideoParser进行解析',
        backend: '如需完整后端解析，请使用packages/server/server.js服务器',
        supported: '当前代理服务器支持B站基础解析和CORS代理功能'
      },
      availableServices: {
        corsProxy: '/api/proxy/{url}',
        bilibiliProxy: '/api/proxy/bilibili/video/{bvid}',
        urlResolver: '/api/resolve-url'
      }
    });

  } catch (error) {
    console.error('后端解析错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 支持的服务列表
app.get('/api/services', (req, res) => {
  res.json({
    success: true,
    data: {
      primary_function: 'CORS代理服务器',
      services: [
        {
          name: '通用CORS代理',
          endpoint: '/api/proxy/{encoded_url}',
          description: '为前端提供跨域请求支持'
        },
        {
          name: 'B站视频代理',
          endpoint: '/api/proxy/bilibili/video/{bvid}',
          description: '专门的B站视频信息代理'
        },
        {
          name: 'URL解析服务',
          endpoint: '/api/resolve-url',
          description: '解析短链接重定向'
        },
        {
          name: '抖音页面代理',
          endpoint: '/api/proxy/douyin/page',
          description: '抖音页面内容代理'
        }
      ],
      note: '主要逻辑在前端实现，后端仅提供必要的代理支持'
    }
  });
});

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
    message: '接口不存在',
    availableEndpoints: [
      '/health',
      '/api/services',
      '/api/proxy/*',
      '/api/proxy/bilibili/video/:bvid',
      '/api/resolve-url',
      '/api/proxy/douyin/page'
    ]
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server 正在运行在端口 ${PORT}`);
  console.log(`📍 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔧 服务列表: http://localhost:${PORT}/api/services`);
  console.log(`🎯 主要功能: 为前端提供CORS代理支持`);
  
  console.log('\n📋 可用服务:');
  console.log('   🔄 通用CORS代理: /api/proxy/{url}');
  console.log('   📺 B站视频代理: /api/proxy/bilibili/video/{bvid}');
  console.log('   🔗 URL解析服务: /api/resolve-url');
  console.log('   🎵 抖音页面代理: /api/proxy/douyin/page');
  
  console.log('\n💡 架构说明:');
  console.log('   • 主要解析逻辑在前端实现');
  console.log('   • 后端仅提供必要的CORS代理');
  console.log('   • 减少服务器负载，提升响应速度');
  
  console.log('\n🚀 服务器启动完成！');
});

export default app;

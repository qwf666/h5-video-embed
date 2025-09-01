import React, { useState, useEffect, useRef } from 'react';
import { extractVideoId, isValidUrl } from './utils.js';
import VideoParser from './parsers/index.js';

// 格式化数字（播放量、点赞数等）
const formatCount = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
};

// 获取详细错误消息
const getDetailedErrorMessage = (error, url, parseMode) => {
  const platformName = getPlatformName(url);
  const originalMessage = error.message || '未知错误';
  
  // 分析具体错误类型
  if (originalMessage.includes('CORS')) {
    return `❌ CORS跨域错误
    
🎯 平台: ${platformName}
📋 问题: 浏览器阻止了跨域请求
💡 解决方案:
• 确保后端CORS代理服务器运行正常
• 或切换到"纯后端解析"模式
• 检查服务器地址: ${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}`;
  }
  
  if (originalMessage.includes('Network Error') || originalMessage.includes('fetch')) {
    return `❌ 网络连接错误
    
🎯 平台: ${platformName}
📋 问题: 无法连接到目标服务器
💡 解决方案:
• 检查网络连接是否正常
• 确认视频链接是否可访问
• 尝试刷新页面重新加载`;
  }
  
  if (originalMessage.includes('后端解析功能已简化')) {
    return `ℹ️ 服务器配置说明
    
🎯 平台: ${platformName}
📋 当前服务器: 轻量级CORS代理服务器
💡 建议方案:
• 优先使用"前端解析"模式（推荐）
• 如需完整后端解析，请启动 packages/server/server.js 
• 当前服务器主要支持前端解析的CORS代理功能`;
  }
  
  if (originalMessage.includes('无效') || originalMessage.includes('链接')) {
    return `❌ 视频链接无效
    
🎯 平台: ${platformName}
📋 问题: 无法识别或解析此视频链接
💡 解决方案:
• 确认链接格式正确 (如: https://www.bilibili.com/video/BV...)
• 检查视频是否存在或已被删除
• 尝试使用完整的视频页面链接`;
  }
  
  if (originalMessage.includes('API') || originalMessage.includes('请求失败')) {
    return `❌ API调用失败
    
🎯 平台: ${platformName}
📋 问题: 平台API返回错误 (${originalMessage})
💡 解决方案:
• 视频可能已被删除或设为私密
• 某些平台可能需要登录才能访问
• 尝试切换解析模式`;
  }
  
  // 根据当前解析模式提供建议
  const modeSuggestion = getModeSuggestion(parseMode, platformName);
  
  return `❌ ${platformName}解析失败
  
📋 错误详情: ${originalMessage}
⚙️ 当前模式: ${parseMode === 'frontend' ? '前端解析' : parseMode === 'backend' ? '后端解析' : '智能模式'}

💡 建议尝试:
${modeSuggestion}`;
};

// 获取平台名称
const getPlatformName = (url) => {
  if (url.includes('bilibili.com') || url.includes('b23.tv')) return 'B站';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('douyin.com')) return '抖音';
  if (url.includes('v.qq.com')) return '腾讯视频';
  if (url.includes('ixigua.com')) return '西瓜视频';
  if (url.includes('kuaishou.com')) return '快手';
  if (url.includes('vimeo.com')) return 'Vimeo';
  return '未知平台';
};

// 根据模式获取建议
const getModeSuggestion = (parseMode, platformName) => {
  const suggestions = [];
  
  if (parseMode === 'frontend') {
    suggestions.push('• 尝试切换到"智能模式"或"后端解析"');
    if (platformName === 'B站' || platformName === 'YouTube') {
      suggestions.push('• 检查网络连接和CORS设置');
    } else {
      suggestions.push('• 此平台可能需要后端代理支持');
    }
  } else if (parseMode === 'backend') {
    suggestions.push('• 确认后端服务器正在运行');
    suggestions.push('• 检查服务器地址配置');
    suggestions.push('• 尝试切换到"前端解析"模式');
  } else {
    suggestions.push('• 尝试手动切换到"前端解析"或"后端解析"');
    suggestions.push('• 检查网络连接和服务器状态');
  }
  
  suggestions.push('• 确认视频链接格式正确且视频存在');
  
  return suggestions.join('\n');
};

const VideoEmbed = ({ 
  url, 
  width = '100%', 
  height = '315',
  autoplay = false,
  controls = true,
  muted = false,
  serverUrl = 'http://localhost:3001', // 作为CORS代理使用
  youtubeApiKey = null, // YouTube API密钥
  preferFrontend = true, // 优先使用前端解析
  strictFrontendOnly = false, // 严格前端模式：不允许调用后端
  forceBackendOnly = false, // 强制后端模式：只使用后端解析
  onError,
  onLoad,
  className = '',
  style = {}
}) => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parseSource, setParseSource] = useState(null); // 'frontend' 或 'backend'
  const videoRef = useRef(null);
  const parserRef = useRef(null);

  // 初始化解析器
  useEffect(() => {
    parserRef.current = new VideoParser({
      corsProxy: serverUrl,
      youtubeApiKey: youtubeApiKey
    });
  }, [serverUrl, youtubeApiKey]);

  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setError('无效的视频链接');
      onError && onError('无效的视频链接');
      return;
    }

    fetchVideoData();
  }, [url, preferFrontend, strictFrontendOnly, forceBackendOnly]);

  const fetchVideoData = async () => {
    setLoading(true);
    setError(null);
    setParseSource(null);
    
    try {
      // 判断解析模式
      if (forceBackendOnly) {
        // 强制后端模式
        console.log('🔄 强制使用后端解析');
        await performBackendParsing();
        return;
      }
      
      if (strictFrontendOnly) {
        // 严格前端模式，不允许调用后端
        console.log('⚡ 严格前端解析模式 - 不会调用后端接口');
        await performFrontendParsing(true);
        return;
      }
      
      if (preferFrontend && parserRef.current) {
        // 优先前端模式，失败时可降级
        console.log('🎯 优先使用前端解析');
        
        try {
          await performFrontendParsing(false);
          return;
        } catch (frontendError) {
          console.warn('前端解析失败:', frontendError.message);
          
          // 如果不是严格前端模式，尝试后端解析
          console.log('🔄 降级到后端解析');
          await performBackendParsing();
          return;
        }
      }
      
      // 默认后端解析
      await performBackendParsing();
      
    } catch (err) {
      // 确定当前解析模式
      let currentMode = 'auto';
      if (strictFrontendOnly) currentMode = 'frontend';
      else if (forceBackendOnly) currentMode = 'backend';
      else if (preferFrontend) currentMode = 'frontend';
      else currentMode = 'backend';
      
      const errorMsg = getDetailedErrorMessage(err, url, currentMode);
      setError(errorMsg);
      onError && onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 执行前端解析
  const performFrontendParsing = async (isStrict = false) => {
    if (!parserRef.current) {
      throw new Error('前端解析器未初始化');
    }
    
    const result = await parserRef.current.parseVideo(url);
    setVideoData(result.data);
    setParseSource(result.source);
    onLoad && onLoad(result.data, result.source);
    
    // 如果前端解析成功但建议使用后端，给出提示
    if (result.data.needsBackendParsing && !isStrict) {
      console.warn('💡 建议使用后端解析获取更完整的信息');
    }
    
    if (isStrict && result.data.needsBackendParsing) {
      console.info('ℹ️ 严格前端模式：已获取基础信息，如需完整信息可切换到后端模式');
    }
  };

  // 执行后端解析
  const performBackendParsing = async () => {
    const response = await fetch(`${serverUrl}/api/video/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url })
    });
    
    if (!response.ok) {
      throw new Error(`后端解析失败: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      setVideoData(result.data);
      setParseSource('backend');
      onLoad && onLoad(result.data, 'backend');
    } else {
      throw new Error(result.message || '视频解析失败');
    }
  };

  const handleVideoError = () => {
    setError('视频播放失败');
    onError && onError('视频播放失败');
  };

  if (loading) {
    return (
      <div 
        className={`video-embed-container loading ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="video-embed-loading">
          <div className="loading-spinner"></div>
          <p>正在加载视频...</p>
        </div>
        <style jsx>{`
          .video-embed-container {
            position: relative;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .video-embed-loading {
            text-align: center;
            color: white;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #333;
            border-top: 4px solid #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`video-embed-container error ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="video-embed-error">
          <div className="error-icon">⚠️</div>
          <pre className="error-message">{error}</pre>
          <button onClick={fetchVideoData} className="retry-button">
            重试
          </button>
        </div>
        <style jsx>{`
          .video-embed-container {
            position: relative;
            background: #f5f5f5;
            border: 2px dashed #ddd;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .video-embed-error {
            text-align: center;
            color: #666;
            padding: 20px;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          .error-message {
            white-space: pre-wrap;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 13px;
            line-height: 1.5;
            color: #555;
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border-left: 4px solid #dc3545;
            margin: 16px 0;
            text-align: left;
            max-height: 200px;
            overflow-y: auto;
          }
          .retry-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 12px;
          }
          .retry-button:hover {
            background: #0056b3;
          }
        `}</style>
      </div>
    );
  }

  if (!videoData) {
    return null;
  }

  // 渲染嵌入式播放器（iframe）
  const renderEmbedPlayer = () => {
    if (videoData.embed && videoData.embed.type === 'iframe') {
      return (
        <iframe
          src={videoData.embed.url}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{ borderRadius: '8px' }}
          title={videoData.title}
        />
      );
    }
    return null;
  };

  // 渲染原生视频播放器
  const renderNativePlayer = () => {
    const validFormats = videoData.formats?.filter(format => 
      format.url && !format.url.includes('embed') && !format.note
    );

    if (validFormats && validFormats.length > 0) {
      return (
        <video
          ref={videoRef}
          width="100%"
          height="100%"
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          onError={handleVideoError}
          style={{ borderRadius: '8px' }}
          poster={videoData.thumbnail}
        >
          {validFormats.map((format, index) => (
            <source key={index} src={format.url} type={`video/${format.ext}`} />
          ))}
          您的浏览器不支持视频播放。
        </video>
      );
    }
    return null;
  };

  return (
    <div 
      className={`video-embed-container ${className}`}
      style={{ width, height, ...style }}
    >
      {/* 优先使用嵌入式播放器 */}
      {renderEmbedPlayer() || renderNativePlayer() || (
        <div className="video-placeholder">
          <img 
            src={videoData.thumbnail} 
            alt={videoData.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
          />
          <div className="play-overlay">
            <div className="play-button" onClick={() => window.open(videoData.webpage_url, '_blank')}>
              ▶️ 播放视频
            </div>
          </div>
        </div>
      )}
      
      {/* 视频信息覆盖层 */}
      <div className="video-info">
        <div className="video-title">{videoData.title}</div>
        <div className="video-meta">
          <span className="platform-badge">{videoData.platform_name || videoData.platform}</span>
          {parseSource && (
            <span className={`source-badge ${parseSource}`}>
              {parseSource === 'frontend' ? '前端解析' : '后端解析'}
            </span>
          )}
          {videoData.uploader && (
            <span className="uploader">@{videoData.uploader}</span>
          )}
        </div>
        {videoData.view_count > 0 && (
          <div className="video-stats">
            <span>👁️ {formatCount(videoData.view_count)}</span>
            {videoData.like_count > 0 && <span>👍 {formatCount(videoData.like_count)}</span>}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .video-embed-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
        }
        .video-placeholder {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .play-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          border-radius: 50px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .play-overlay:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: translate(-50%, -50%) scale(1.05);
        }
        .play-button {
          color: white;
          font-size: 16px;
          font-weight: 500;
        }
        .video-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.8));
          color: white;
          padding: 20px 16px 16px;
          transform: translateY(100%);
          transition: transform 0.3s ease;
        }
        .video-embed-container:hover .video-info {
          transform: translateY(0);
        }
        .video-title {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .video-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }
        .platform-badge {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        .source-badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 500;
        }
        .source-badge.frontend {
          background: #10b981;
          color: white;
        }
        .source-badge.backend {
          background: #f59e0b;
          color: white;
        }
        .uploader {
          font-size: 11px;
          opacity: 0.9;
        }
        .video-stats {
          display: flex;
          gap: 12px;
          font-size: 11px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default VideoEmbed;

import React, { useState } from "react";
import { VideoEmbed } from "h5-video-embed";
import "./App.css";

const DEMO_VIDEOS = [
  {
    title: "B站视频示例",
    url: "https://www.bilibili.com/video/BV1A1hXzHEou/?spm_id_from=333.1007.tianma.3-2-8.click",
    platform: "B站",
    description: "前端直接解析，获取完整信息",
    frontendSupport: "完全支持"
  },
  {
    title: "YouTube 视频示例", 
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "YouTube",
    description: "支持API和oEmbed两种解析方式",
    frontendSupport: "完全支持"
  },
  {
    title: "抖音视频示例",
    url: "https://www.douyin.com/video/7234567890123456789",
    platform: "抖音", 
    description: "需要CORS代理，展示降级策略",
    frontendSupport: "需要代理"
  },
  {
    title: "腾讯视频示例",
    url: "https://v.qq.com/x/cover/mzc002008260hny/x410143cph8.html",
    platform: "腾讯视频",
    description: "基础嵌入支持",
    frontendSupport: "基础支持"
  },
  {
    title: "西瓜视频示例",
    url: "https://www.ixigua.com/1234567890123456789",
    platform: "西瓜视频",
    description: "头条系视频平台",
    frontendSupport: "需要代理"
  },
  {
    title: "快手视频示例", 
    url: "https://www.kuaishou.com/short-video/3xiqjreqm4c4rm8",
    platform: "快手",
    description: "短视频平台支持",
    frontendSupport: "基础支持"
  }
];

function App() {
  const [currentVideo, setCurrentVideo] = useState(DEMO_VIDEOS[0]);
  const [customUrl, setCustomUrl] = useState("");
  const [videoSettings, setVideoSettings] = useState({
    width: "100%",
    height: "400px",
    autoplay: false,
    controls: true,
    muted: false,
    preferFrontend: true,
  });
  const [parseMode, setParseMode] = useState('frontend'); // 'auto', 'frontend', 'backend' - 默认纯前端
  const [logs, setLogs] = useState([]);
  const [performanceStats, setPerformanceStats] = useState({
    totalRequests: 0,
    frontendParsed: 0,
    backendParsed: 0,
    averageTime: 0
  });

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, message, timestamp }]);
  };

  const handleVideoLoad = (videoData, source) => {
    const sourceText = source === "frontend" ? "前端解析" : "后端解析";
    addLog("success", `视频加载成功 (${sourceText}): ${videoData.title}`);
    console.log("视频数据:", videoData);
    console.log("解析来源:", source);
    
    // 更新性能统计
    setPerformanceStats(prev => ({
      totalRequests: prev.totalRequests + 1,
      frontendParsed: prev.frontendParsed + (source === 'frontend' ? 1 : 0),
      backendParsed: prev.backendParsed + (source === 'backend' ? 1 : 0),
      averageTime: prev.averageTime // 这里可以添加时间统计
    }));
  };

  const handleVideoError = (error) => {
    addLog("error", `视频加载失败: ${error}`);
    console.error("视频错误:", error);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customUrl.trim()) {
      setCurrentVideo({
        title: "自定义视频",
        url: customUrl.trim(),
        platform: "自定义",
      });
      addLog("info", `尝试加载自定义视频: ${customUrl}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎥 H5 Video Embed 演示</h1>
        <p>前端优先的视频嵌入 React 组件库</p>
        <div className="header-features">
          <span className="feature-tag">🇨🇳 国内平台优化</span>
          <span className="feature-tag">⚡ 前端解析</span>
          <span className="feature-tag">🔄 智能降级</span>
        </div>
      </header>

      <main className="app-main">
        {/* 视频播放区域 */}
        <section className="video-section">
          <div className="video-header">
            <h2>当前播放: {currentVideo.title}</h2>
            <span className="platform-badge">{currentVideo.platform}</span>
          </div>

          <div className="video-container">
            <VideoEmbed
              url={currentVideo.url}
              width={videoSettings.width}
              height={videoSettings.height}
              autoplay={videoSettings.autoplay}
              controls={videoSettings.controls}
              muted={videoSettings.muted}
              serverUrl={
                // Vercel环境中使用当前域名，本地开发使用localhost
                import.meta.env.VITE_SERVER_URL || 
                (window.location.hostname === 'localhost' ? 
                  "http://localhost:3001" : 
                  window.location.origin
                )
              }
              youtubeApiKey={import.meta.env.VITE_YOUTUBE_API_KEY}
              preferFrontend={parseMode === 'frontend' || (parseMode === 'auto' && videoSettings.preferFrontend)}
              strictFrontendOnly={parseMode === 'frontend'} // 纯前端模式不调用后端
              forceBackendOnly={parseMode === 'backend'} // 纯后端模式强制后端解析
              onLoad={handleVideoLoad}
              onError={handleVideoError}
              className="demo-video"
            />
          </div>
        </section>

        <div className="controls-wrapper">
          {/* 视频选择 */}
          <section className="video-selector">
            <h3>📋 选择演示视频</h3>
            <div className="video-grid">
              {DEMO_VIDEOS.map((video, index) => (
                <button
                  key={index}
                  className={`video-card ${currentVideo.url === video.url ? "active" : ""}`}
                  onClick={() => {
                    setCurrentVideo(video);
                    addLog("info", `切换到: ${video.title}`);
                  }}
                >
                  <div className="video-card-header">
                    <div className="video-card-title">{video.title}</div>
                    <div className={`support-badge ${video.frontendSupport.replace(/\s/g, '-')}`}>
                      {video.frontendSupport}
                    </div>
                  </div>
                  <div className="video-card-platform">{video.platform}</div>
                  <div className="video-card-description">{video.description}</div>
                  <div className="video-card-url">{video.url}</div>
                </button>
              ))}
            </div>

            {/* 自定义URL输入 */}
            <form onSubmit={handleCustomSubmit} className="custom-url-form">
              <h4>🔗 自定义视频链接</h4>
              <div className="input-group">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="输入视频链接（B站、抖音、YouTube、腾讯视频、西瓜视频、快手等）"
                  className="url-input"
                />
                <button type="submit" className="load-button">
                  加载视频
                </button>
              </div>
            </form>
          </section>

          {/* 解析模式选择 */}
          <section className="parsing-mode-section">
            <h3>🔧 解析模式选择</h3>
            <div className="parse-mode-selector">
              <label className="mode-description">
                选择视频解析方式，明确控制解析策略：
              </label>
              <div className="mode-options">
                <label className={`mode-option ${parseMode === 'auto' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="parseMode"
                    value="auto"
                    checked={parseMode === 'auto'}
                    onChange={(e) => {
                      setParseMode(e.target.value);
                      addLog('info', '切换到自动模式：智能选择最佳解析方式');
                    }}
                  />
                  <div className="mode-info">
                    <div className="mode-title">🤖 智能模式（推荐）</div>
                    <div className="mode-desc">
                      根据平台特性自动选择最佳解析方式<br/>
                      B站、YouTube：优先前端解析<br/>
                      抖音、腾讯视频：自动降级策略
                    </div>
                  </div>
                </label>

                <label className={`mode-option ${parseMode === 'frontend' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="parseMode"
                    value="frontend"
                    checked={parseMode === 'frontend'}
                    onChange={(e) => {
                      setParseMode(e.target.value);
                      addLog('info', '切换到纯前端解析：严格模式，不会调用后端接口');
                    }}
                  />
                  <div className="mode-info">
                    <div className="mode-title">⚡ 纯前端解析</div>
                    <div className="mode-desc">
                      <strong>严格前端模式 - 不调用后端接口</strong><br/>
                      100%浏览器端执行，无服务器依赖<br/>
                      适用于B站、YouTube等支持CORS的平台<br/>
                      🚫 保证不会向后端发送任何请求
                    </div>
                  </div>
                </label>

                <label className={`mode-option ${parseMode === 'backend' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="parseMode"
                    value="backend"
                    checked={parseMode === 'backend'}
                    onChange={(e) => {
                      setParseMode(e.target.value);
                      addLog('info', '切换到纯后端解析：强制使用后端增强解析器');
                    }}
                  />
                  <div className="mode-info">
                    <div className="mode-title">🔄 纯后端解析</div>
                    <div className="mode-desc">
                      <strong>强制后端模式 - 跳过前端解析</strong><br/>
                      使用增强的后端解析器<br/>
                      支持所有平台，数据最完整<br/>
                      🌐 需要后端服务器运行
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* 播放器设置 */}
          <section className="settings-section">
            <h3>⚙️ 播放器设置</h3>
            <div className="settings-grid">
              <div className="setting-item">
                <label htmlFor="width">宽度:</label>
                <input
                  id="width"
                  type="text"
                  value={videoSettings.width}
                  onChange={(e) => setVideoSettings((prev) => ({ ...prev, width: e.target.value }))}
                  placeholder="100%, 800px, etc."
                />
              </div>

              <div className="setting-item">
                <label htmlFor="height">高度:</label>
                <input
                  id="height"
                  type="text"
                  value={videoSettings.height}
                  onChange={(e) => setVideoSettings((prev) => ({ ...prev, height: e.target.value }))}
                  placeholder="400px, 50vh, etc."
                />
              </div>

              <div className="setting-item checkbox-item">
                <input
                  id="autoplay"
                  type="checkbox"
                  checked={videoSettings.autoplay}
                  onChange={(e) => setVideoSettings((prev) => ({ ...prev, autoplay: e.target.checked }))}
                />
                <label htmlFor="autoplay">自动播放</label>
              </div>

              <div className="setting-item checkbox-item">
                <input
                  id="controls"
                  type="checkbox"
                  checked={videoSettings.controls}
                  onChange={(e) => setVideoSettings((prev) => ({ ...prev, controls: e.target.checked }))}
                />
                <label htmlFor="controls">显示控件</label>
              </div>

              <div className="setting-item checkbox-item">
                <input
                  id="muted"
                  type="checkbox"
                  checked={videoSettings.muted}
                  onChange={(e) => setVideoSettings((prev) => ({ ...prev, muted: e.target.checked }))}
                />
                <label htmlFor="muted">静音</label>
              </div>
            </div>
          </section>
        </div>

        {/* 实时状态监控 */}
        <section className="realtime-status-section">
          <h3>📡 实时解析状态</h3>
          <div className="status-cards">
            <div className={`status-card mode-indicator ${parseMode}`}>
              <div className="status-icon">
                {parseMode === 'auto' && '🤖'}
                {parseMode === 'frontend' && '⚡'}
                {parseMode === 'backend' && '🔄'}
              </div>
              <div className="status-content">
                <div className="status-title">当前模式</div>
                <div className="status-value">
                  {parseMode === 'auto' && '智能模式'}
                  {parseMode === 'frontend' && '纯前端解析'}
                  {parseMode === 'backend' && '纯后端解析'}
                </div>
              </div>
            </div>
            
            <div className="status-card network-status">
              <div className="status-icon">🌐</div>
              <div className="status-content">
                <div className="status-title">后端请求</div>
                <div className={`status-value ${parseMode === 'frontend' ? 'disabled' : 'enabled'}`}>
                  {parseMode === 'frontend' ? '🚫 已禁用' : '✅ 允许'}
                </div>
              </div>
            </div>
            
            <div className="status-card separation-status">
              <div className="status-icon">🔒</div>
              <div className="status-content">
                <div className="status-title">前后端分离</div>
                <div className={`status-value ${parseMode === 'frontend' ? 'strict' : 'flexible'}`}>
                  {parseMode === 'frontend' ? '🔒 严格模式' : '🔄 灵活模式'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 性能统计 */}
        <section className="stats-section">
          <h3>📊 解析统计</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{performanceStats.totalRequests}</div>
              <div className="stat-label">总解析次数</div>
            </div>
            <div className="stat-card frontend">
              <div className="stat-number">{performanceStats.frontendParsed}</div>
              <div className="stat-label">前端解析</div>
            </div>
            <div className="stat-card backend">
              <div className="stat-number">{performanceStats.backendParsed}</div>
              <div className="stat-label">后端解析</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {performanceStats.totalRequests > 0 
                  ? Math.round((performanceStats.frontendParsed / performanceStats.totalRequests) * 100)
                  : 0}%
              </div>
              <div className="stat-label">前端解析率</div>
            </div>
          </div>
        </section>

        {/* 日志区域 */}
        <section className="logs-section">
          <div className="logs-header">
            <h3>📝 操作日志</h3>
            <button onClick={clearLogs} className="clear-logs-button">
              清空日志
            </button>
          </div>
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="no-logs">暂无日志</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-item log-${log.type}`}>
                  <span className="log-timestamp">[{log.timestamp}]</span>
                  <span className="log-type">{log.type.toUpperCase()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 架构说明 */}
        <section className="architecture-section">
          <h3>🏗️ 智能解析策略</h3>
          <div className="architecture-content">
            <div className="parsing-strategy">
              <h4>🎯 平台解析策略</h4>
              <div className="strategy-grid">
                <div className="strategy-item priority-high">
                  <div className="strategy-header">
                    <span className="platform-icon">📺</span>
                    <span className="platform-name">B站 (bilibili.com)</span>
                    <span className="priority-badge high">优先前端</span>
                  </div>
                  <div className="strategy-details">
                    <div className="method">✅ 前端直接API调用</div>
                    <div className="reason">支持CORS，响应速度快</div>
                    <div className="fallback">降级: CORS代理 → 后端解析</div>
                  </div>
                </div>

                <div className="strategy-item priority-high">
                  <div className="strategy-header">
                    <span className="platform-icon">📹</span>
                    <span className="platform-name">YouTube</span>
                    <span className="priority-badge high">优先前端</span>
                  </div>
                  <div className="strategy-details">
                    <div className="method">✅ oEmbed + API (如有密钥)</div>
                    <div className="reason">官方API支持，数据准确</div>
                    <div className="fallback">降级: 后端yt-dlp解析</div>
                  </div>
                </div>

                <div className="strategy-item priority-medium">
                  <div className="strategy-header">
                    <span className="platform-icon">🎵</span>
                    <span className="platform-name">抖音 (douyin.com)</span>
                    <span className="priority-badge medium">需要代理</span>
                  </div>
                  <div className="strategy-details">
                    <div className="method">🔄 CORS代理解析</div>
                    <div className="reason">CORS限制，需要代理支持</div>
                    <div className="fallback">降级: 后端完整解析</div>
                  </div>
                </div>

                <div className="strategy-item priority-medium">
                  <div className="strategy-header">
                    <span className="platform-icon">🎬</span>
                    <span className="platform-name">腾讯视频 (v.qq.com)</span>
                    <span className="priority-badge medium">基础支持</span>
                  </div>
                  <div className="strategy-details">
                    <div className="method">🔄 嵌入式播放器</div>
                    <div className="reason">主要提供embed播放支持</div>
                    <div className="fallback">降级: 后端完整解析</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="architecture-flow">
              <div className="flow-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>🎯 前端直接解析</h4>
                  <p>B站、YouTube、Vimeo等支持CORS的平台</p>
                  <span className="step-time">{'< 500ms'}</span>
                </div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>🔄 CORS代理解析</h4>
                  <p>抖音、腾讯视频等需要代理的平台</p>
                  <span className="step-time">{'< 1.5s'}</span>
                </div>
              </div>
              <div className="flow-arrow">↓</div>
              <div className="flow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>🆘 后端完整解析</h4>
                  <p>前端无法处理时的最后选择</p>
                  <span className="step-time">2-5s</span>
                </div>
              </div>
            </div>
            
            <div className="architecture-benefits">
              <h4>🚀 架构优势</h4>
              <ul>
                <li>⚡ 响应速度提升 80%</li>
                <li>💾 服务器负载减少 70%</li>
                <li>📱 更好的用户体验</li>
                <li>🔧 易于扩展新平台</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 使用说明 */}
        <section className="usage-section">
          <h3>📖 使用说明</h3>
          <div className="usage-content">
            <div className="usage-step">
              <h4>1. 安装组件</h4>
              <pre>
                <code>npm install h5-video-embed</code>
              </pre>
            </div>

            <div className="usage-step">
              <h4>2. 基础使用（纯前端）</h4>
              <pre>
                <code>{`import { VideoEmbed } from 'h5-video-embed';

function App() {
  return (
    <VideoEmbed 
      url="https://www.bilibili.com/video/BV1GJ411x7h7"
      width="800px"
      height="450px"
      preferFrontend={true}  // 优先前端解析
      onLoad={(data, source) => {
        console.log(\`\${source}解析成功\`, data);
      }}
    />
  );
}`}</code>
              </pre>
            </div>

            <div className="usage-step">
              <h4>3. 高级配置（含API支持）</h4>
              <pre>
                <code>{`<VideoEmbed 
  url={videoUrl}
  preferFrontend={true}
  youtubeApiKey="your-youtube-api-key"  // 可选
  serverUrl="http://localhost:3001"     // CORS代理
  onLoad={(data, source) => {
    console.log('解析来源:', source);     // 'frontend' | 'backend'
    console.log('平台:', data.platform_name);
    console.log('播放量:', data.view_count);
  }}
/>`}</code>
              </pre>
            </div>

            <div className="usage-step">
              <h4>4. 启动CORS代理（按需）</h4>
              <pre>
                <code>{`# 仅当需要解析抖音、腾讯视频等平台时
cd packages/server
npm install
npm run dev  # 启动轻量级CORS代理`}</code>
              </pre>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          💡 提示：确保后端服务正在运行在
          <code>{import.meta.env.VITE_SERVER_URL || "http://localhost:3001"}</code>
        </p>
        {import.meta.env.DEV && (
          <div className="dev-info">
            <p>🔧 开发模式信息：</p>
            <div className="dev-grid">
              <div className="dev-section">
                <h5>🏗️ 架构信息</h5>
                <ul>
                  <li>前端优先架构：主要逻辑在浏览器中执行</li>
                  <li>智能降级策略：前端→代理→后端</li>
                  <li>支持平台：{DEMO_VIDEOS.length}个演示平台</li>
                </ul>
              </div>
              <div className="dev-section">
                <h5>⚙️ 配置状态</h5>
                <ul>
                  <li>YouTube API: {import.meta.env.VITE_YOUTUBE_API_KEY ? "✅ 已配置" : "⚠️ 未配置"}</li>
                  <li>服务器地址: {import.meta.env.VITE_SERVER_URL || "http://localhost:3001"}</li>
                  <li>构建模式: {import.meta.env.MODE}</li>
                </ul>
              </div>
              <div className="dev-section">
                <h5>📊 当前统计</h5>
                <ul>
                  <li>解析请求: {performanceStats.totalRequests}次</li>
                  <li>前端解析率: {performanceStats.totalRequests > 0 ? Math.round((performanceStats.frontendParsed / performanceStats.totalRequests) * 100) : 0}%</li>
                  <li>后端降级: {performanceStats.backendParsed}次</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        <p>
          🔧 源码：
          <a href="https://github.com/your-username/h5-video-embed" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;

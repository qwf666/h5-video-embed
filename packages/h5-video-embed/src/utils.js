/**
 * 从视频 URL 中提取视频 ID
 * @param {string} url - 视频链接
 * @returns {string|null} 视频 ID
 */
export const extractVideoId = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // YouTube
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return youtubeMatch[1];
  }

  // Bilibili
  const bilibiliRegex = /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV[a-zA-Z0-9]+|av\d+)/;
  const bilibiliMatch = url.match(bilibiliRegex);
  if (bilibiliMatch) {
    return bilibiliMatch[1];
  }

  // Vimeo
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return vimeoMatch[1];
  }

  return null;
};

/**
 * 验证 URL 是否有效
 * @param {string} url - 要验证的 URL
 * @returns {boolean} 是否为有效 URL
 */
export const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch {
    // 如果不是完整 URL，检查是否为相对路径或简化格式
    const patterns = [
      /^https?:\/\/.+/,  // HTTP/HTTPS
      /^\/\/.+/,         // Protocol-relative
      /^\/[^\/].*/,      // Absolute path
      /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/, // Domain without protocol
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }
};

/**
 * 格式化视频时长
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长字符串
 */
export const formatDuration = (seconds) => {
  if (!seconds || typeof seconds !== 'number') {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
};

/**
 * 获取视频平台类型
 * @param {string} url - 视频链接
 * @returns {string} 平台类型
 */
export const getVideoPlatform = (url) => {
  if (!url || typeof url !== 'string') {
    return 'unknown';
  }

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (url.includes('bilibili.com')) {
    return 'bilibili';
  }
  
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  
  if (url.includes('douyin.com') || url.includes('tiktok.com')) {
    return 'tiktok';
  }

  return 'other';
};

/**
 * 生成视频缩略图 URL
 * @param {string} url - 视频链接
 * @param {string} quality - 缩略图质量 (default, medium, high, maxres)
 * @returns {string|null} 缩略图 URL
 */
export const getVideoThumbnail = (url, quality = 'default') => {
  const videoId = extractVideoId(url);
  const platform = getVideoPlatform(url);

  if (!videoId) return null;

  switch (platform) {
    case 'youtube':
      const qualities = {
        default: 'default',
        medium: 'mqdefault',
        high: 'hqdefault',
        maxres: 'maxresdefault'
      };
      return `https://img.youtube.com/vi/${videoId}/${qualities[quality] || qualities.default}.jpg`;
    
    case 'vimeo':
      // Vimeo 需要 API 调用获取缩略图，这里返回默认格式
      return `https://vumbnail.com/${videoId}.jpg`;
    
    default:
      return null;
  }
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 简单的测试端点，验证Vercel Serverless Functions是否正常工作

module.exports = async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // 返回测试信息
  return res.status(200).json({
    success: true,
    message: 'Vercel Serverless Functions 正常工作',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV
    }
  });
};

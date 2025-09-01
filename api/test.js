// 简单的测试端点，用于验证 Vercel API 是否正常工作
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  try {
    const result = {
      success: true,
      message: 'API 端点工作正常',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers,
      query: req.query,
      body: req.body,
      url: req.url,
      vercel_function: 'test'
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('测试端点错误:', error);
    
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message,
      vercel_function: 'test'
    });
  }
}
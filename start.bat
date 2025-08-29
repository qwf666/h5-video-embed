@echo off
echo 🚀 启动 H5 Video Embed 开发环境...
echo.

echo 📦 安装依赖...
call npm install
echo.

echo 📦 启动后端服务...
start "H5 Video Embed Server" cmd /k "cd packages/server && npm run dev"

echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

echo 🎨 启动演示应用...
start "H5 Video Embed Demo" cmd /k "cd packages/demo-app && npm run dev"

echo.
echo ✨ 开发环境已启动！
echo.
echo 📍 服务地址：
echo   - 后端 API: http://localhost:3001
echo   - 演示应用: http://localhost:3000
echo.
echo 💡 提示：
echo   - 无需安装 Python 或 yt-dlp，npm 包会自动处理
echo   - 后端服务需要几秒钟启动时间
echo   - 访问 http://localhost:3000 查看演示
echo.
pause

# H5 Video Embed 快速启动脚本
Write-Host "🚀 启动 H5 Video Embed 开发环境..." -ForegroundColor Green
Write-Host ""

Write-Host "📦 安装依赖..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

Write-Host ""
Write-Host "📦 启动后端服务..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd packages/server && npm run dev" -WindowStyle Normal

Write-Host "等待后端服务启动..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "🎨 启动演示应用..." -ForegroundColor Yellow  
Start-Process -FilePath "cmd" -ArgumentList "/k", "cd packages/demo-app && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✨ 开发环境已启动！" -ForegroundColor Green
Write-Host ""
Write-Host "📍 服务地址：" -ForegroundColor Cyan
Write-Host "  - 后端 API: http://localhost:3001" -ForegroundColor White
Write-Host "  - 演示应用: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "💡 提示：" -ForegroundColor Cyan
Write-Host "  - 无需安装 Python 或 yt-dlp，npm 包会自动处理" -ForegroundColor White
Write-Host "  - 后端服务需要几秒钟启动时间" -ForegroundColor White
Write-Host "  - 访问 http://localhost:3000 查看演示" -ForegroundColor White
Write-Host ""

Read-Host "按 Enter 键退出"

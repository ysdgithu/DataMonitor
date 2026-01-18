# PowerShell 性能测试脚本
# 用于快速切换不同性能模式进行测试

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("NORMAL", "LOW_FREQUENCY", "MEDIUM_FREQUENCY", "HIGH_FREQUENCY", "EXTREME", "STRESS_TEST")]
    [string]$Mode = "NORMAL"
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  WebSocket 性能测试工具" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 显示模式说明
$modeDescriptions = @{
    "NORMAL" = "正常模式 (2条/秒) - 适合演示"
    "LOW_FREQUENCY" = "低频模式 (10条/秒) - 适合生产"
    "MEDIUM_FREQUENCY" = "中频模式 (50条/秒) - 适合监控"
    "HIGH_FREQUENCY" = "高频模式 (100条/秒) - 实时监控"
    "EXTREME" = "极限模式 (500条/秒) - 压力测试"
    "STRESS_TEST" = "压测模式 (1000条/秒) - 性能测试"
}

Write-Host "当前模式: $Mode" -ForegroundColor Green
Write-Host "说明: $($modeDescriptions[$Mode])" -ForegroundColor Yellow
Write-Host ""

# 设置环境变量
$env:PERFORMANCE_MODE = $Mode

Write-Host "正在启动服务器..." -ForegroundColor Cyan
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host ""

# 启动服务器
npm run dev


# WebSocket 连接问题解决指南

## 🔍 问题诊断

### 当前状态
- ✅ **本地开发**: HTTP + WS 正常连接
- ❌ **Vercel生产**: HTTPS + WS 连接被阻止

### 根本原因
浏览器的**混合内容安全策略**阻止HTTPS页面连接到非安全的WebSocket (ws://)

## 🛠️ 已实施的前端修复

### 1. 自适应协议选择
- 修改了 `src/stores/realtime.ts`
- 自动根据页面协议选择WebSocket协议:
  - HTTPS → WSS
  - HTTP → WS

### 2. 环境配置优化
- **开发环境**: `ws://cloudgu.xyz:8080`
- **生产环境**: `wss://echo.websocket.org` (临时测试)

### 3. 增强错误处理
- 添加了协议不匹配检测
- 提供详细的调试信息

## 🚀 后端解决方案

### 选项1: Nginx反向代理 (推荐)
```nginx
server {
    listen 443 ssl;
    server_name cloudgu.xyz;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 选项2: Node.js HTTPS服务器
已创建 `websocket-server/src/server-https.ts`
- 支持WSS连接
- 需要SSL证书配置

## 📋 部署步骤

### 1. 立即测试 (使用echo服务)
```bash
# 重新构建
yarn build

# 部署到Vercel
# 应该能看到WebSocket连接尝试 (虽然数据格式不匹配)
```

### 2. 配置后端WSS支持
```bash
# 在服务器上安装SSL证书
# 配置Nginx反向代理
# 或使用Node.js HTTPS服务器

# 更新生产环境配置
VITE_WS_URL=wss://cloudgu.xyz:8443
```

### 3. 验证连接
- 检查浏览器开发者工具的Network标签
- 查看WebSocket连接状态
- 确认没有协议错误

## 🔧 调试技巧

### 浏览器控制台检查
```javascript
// 检查当前协议
console.log('页面协议:', window.location.protocol)

// 检查WebSocket支持
console.log('WSS支持:', 'WebSocket' in window)
```

### 常见错误码
- **1006**: 连接异常关闭 (通常是协议问题)
- **1015**: TLS握手失败
- **403**: 服务器拒绝连接

## 📞 下一步行动

1. **立即**: 部署当前版本到Vercel测试协议选择逻辑
2. **短期**: 在服务器上配置SSL证书和WSS支持
3. **长期**: 考虑使用云服务提供商的WebSocket服务

## 🆘 如果仍有问题

请提供以下信息:
- 浏览器开发者工具的Network标签截图
- Console中的错误信息
- 服务器端的WebSocket日志

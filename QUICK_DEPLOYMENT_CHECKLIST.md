# ✅ 快速部署检查清单

## 🎯 已完成的配置

### ✅ 前端配置
- **开发环境**: `ws://cloudgu.xyz:8080` (HTTP/WS)
- **生产环境**: `wss://cloudgu.xyz` (HTTPS/WSS)
- **自适应协议**: 根据页面协议自动选择WS/WSS
- **构建成功**: 无TypeScript错误

### 📁 提供的配置文件
- `nginx-letsencrypt.conf` - 使用Let's Encrypt证书
- `nginx-selfsigned.conf` - 使用自签名证书
- `setup-ssl.sh` - Let's Encrypt自动设置脚本
- `create-self-signed-cert.sh` - 自签名证书创建脚本

## 🚀 立即执行步骤

### 1. 选择SSL方案并配置服务器

#### 快速测试方案 (自签名证书)
```bash
# 在您的服务器上执行:
chmod +x create-self-signed-cert.sh
sudo ./create-self-signed-cert.sh
sudo cp nginx-selfsigned.conf /etc/nginx/sites-available/datamonitor
sudo ln -sf /etc/nginx/sites-available/datamonitor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

#### 生产环境方案 (Let's Encrypt)
```bash
# 在您的服务器上执行:
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
sudo cp nginx-letsencrypt.conf /etc/nginx/sites-available/datamonitor
sudo ln -sf /etc/nginx/sites-available/datamonitor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 2. 验证服务运行状态
```bash
# 检查WebSocket服务 (端口8080)
netstat -tlnp | grep 8080

# 检查API服务 (端口3002)
netstat -tlnp | grep 3002

# 检查Nginx状态
sudo systemctl status nginx
```

### 3. 部署前端到Vercel
```bash
# 提交更改
git add .
git commit -m "配置HTTPS/WSS支持"
git push origin main

# Vercel会自动重新部署
```

## 🔍 测试验证

### 预期结果
1. **访问** https://data-monitor-t4je.vercel.app/
2. **浏览器控制台显示**:
   ```
   [Realtime Store] WebSocket URL: wss://cloudgu.xyz
   [Realtime Store] 当前页面协议: https:
   [WebSocket] 尝试连接到: wss://cloudgu.xyz
   [WebSocket] 连接成功
   ```
3. **实时数据正常显示**

### 如果连接失败
检查浏览器控制台错误信息:
- **证书错误**: 自签名证书需要手动信任
- **连接被拒绝**: 检查防火墙和服务状态
- **协议错误**: 确认Nginx配置正确

## 📞 下一步

1. **立即**: 在服务器上执行SSL配置
2. **然后**: 重新部署前端到Vercel
3. **最后**: 测试WSS连接是否正常

## 🆘 需要帮助?

如果遇到问题，请提供:
- 浏览器控制台的完整错误信息
- 服务器上的Nginx错误日志: `sudo tail -f /var/log/nginx/error.log`
- SSL证书状态: `sudo nginx -t`

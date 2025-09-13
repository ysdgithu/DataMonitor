# 🚀 WebSocket HTTPS/WSS 部署步骤

## 📋 服务器端配置

### 步骤1: 选择SSL证书方案

#### 方案A: Let's Encrypt免费证书 (推荐生产环境)
```bash
# 1. 运行SSL设置脚本
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh

# 2. 使用Let's Encrypt配置
sudo cp nginx-letsencrypt.conf /etc/nginx/sites-available/datamonitor
sudo ln -sf /etc/nginx/sites-available/datamonitor /etc/nginx/sites-enabled/
```

#### 方案B: 自签名证书 (快速测试)
```bash
# 1. 创建自签名证书
chmod +x create-self-signed-cert.sh
sudo ./create-self-signed-cert.sh

# 2. 使用自签名配置
sudo cp nginx-selfsigned.conf /etc/nginx/sites-available/datamonitor
sudo ln -sf /etc/nginx/sites-available/datamonitor /etc/nginx/sites-enabled/
```

### 步骤2: 更新Nginx配置
```bash
# 删除默认配置 (如果存在)
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置文件语法
sudo nginx -t

# 重新加载Nginx
sudo systemctl reload nginx

# 检查Nginx状态
sudo systemctl status nginx
```

### 步骤3: 确保服务运行
```bash
# 确保WebSocket服务运行在8080端口
netstat -tlnp | grep 8080

# 确保API服务运行在3002端口
netstat -tlnp | grep 3002

# 检查防火墙设置
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
```

## 💻 前端配置

### 已完成的配置更新
- ✅ 生产环境: `wss://8.134.137.185` + `https://8.134.137.185/api`
- ✅ 开发环境: `ws://8.134.137.185:8080` + `http://8.134.137.185:3002/api`
- ✅ 自适应协议选择逻辑

### 重新构建和部署
```bash
# 1. 重新构建项目
yarn build

# 2. 部署到Vercel
# 提交代码到Git仓库，Vercel会自动部署
git add .
git commit -m "配置HTTPS/WSS支持"
git push origin main
```

## 🔍 测试验证

### 1. 本地测试
```bash
# 启动开发服务器
yarn dev

# 应该连接到: ws://8.134.137.185:8080
```

### 2. 生产环境测试
访问: https://data-monitor-t4je.vercel.app/

检查浏览器控制台:
- WebSocket连接应该显示: `wss://8.134.137.185`
- 没有协议错误
- 连接状态为已连接

### 3. 连接验证命令
```bash
# 测试HTTPS连接
curl -I https://8.134.137.185/api

# 测试WSS连接 (使用wscat工具)
npm install -g wscat
wscat -c wss://8.134.137.185
```

## 🐛 故障排除

### 常见问题
1. **证书错误**: 检查证书路径和权限
2. **连接被拒绝**: 检查防火墙和服务状态
3. **协议错误**: 确认前端使用正确的WSS URL

### 调试命令
```bash
# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 查看Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# 检查SSL证书
openssl s_client -connect 8.134.137.185:443 -servername 8.134.137.185
```

## ✅ 成功标志
- [ ] HTTPS网站可以正常访问
- [ ] WebSocket连接显示为WSS协议
- [ ] 浏览器控制台没有协议错误
- [ ] 实时数据正常推送和显示

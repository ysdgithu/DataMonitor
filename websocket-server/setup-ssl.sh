#!/bin/bash

# SSL证书设置脚本
echo "开始设置SSL证书..."

# 1. 安装certbot (如果尚未安装)
if ! command -v certbot &> /dev/null; then
    echo "安装certbot..."
    # Ubuntu/Debian
    sudo apt update
    sudo apt install certbot python3-certbot-nginx -y
    
    # 或者 CentOS/RHEL
    # sudo yum install certbot python3-certbot-nginx -y
fi

# 2. 获取SSL证书
echo "获取SSL证书..."
sudo certbot --nginx -d cloudgu.xyz --non-interactive --agree-tos --email your-email@example.com

# 3. 设置自动续期
echo "设置证书自动续期..."
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

echo "SSL证书设置完成！"
echo "证书位置: /etc/letsencrypt/live/cloudgu.xyz/"

# 4. 更新Nginx配置中的证书路径
echo "请更新Nginx配置文件中的证书路径："
echo "ssl_certificate /etc/letsencrypt/live/cloudgu.xyz/fullchain.pem;"
echo "ssl_certificate_key /etc/letsencrypt/live/cloudgu.xyz/privkey.pem;"

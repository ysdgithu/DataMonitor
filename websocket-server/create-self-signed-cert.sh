#!/bin/bash

# 创建自签名SSL证书 (仅用于测试)
echo "创建自签名SSL证书..."

# 创建证书目录
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# 生成私钥
sudo openssl genrsa -out /etc/ssl/private/nginx-selfsigned.key 2048

# 生成证书
sudo openssl req -new -x509 -key /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt -days 365 -subj "/C=CN/ST=State/L=City/O=Organization/CN=8.134.137.185"

# 设置权限
sudo chmod 600 /etc/ssl/private/nginx-selfsigned.key
sudo chmod 644 /etc/ssl/certs/nginx-selfsigned.crt

echo "自签名证书创建完成！"
echo "证书位置: /etc/ssl/certs/nginx-selfsigned.crt"
echo "私钥位置: /etc/ssl/private/nginx-selfsigned.key"

echo "请在Nginx配置中使用以下路径："
echo "ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;"
echo "ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;"

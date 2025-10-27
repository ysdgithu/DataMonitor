#!/bin/bash

# MySQL 数据库初始化脚本
# 用于在云服务器上快速设置 MySQL 数据库和用户

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 MySQL 是否安装
check_mysql() {
    if ! command -v mysql &> /dev/null; then
        print_error "MySQL 未安装，请先安装 MySQL"
        exit 1
    fi
    
    MYSQL_VERSION=$(mysql --version)
    print_message "检测到 MySQL: $MYSQL_VERSION"
}

# 获取用户输入
get_user_input() {
    read -p "请输入 MySQL root 密码: " -s MYSQL_ROOT_PASSWORD
    echo
    
    read -p "请输入要创建的数据库名称 (默认: monitor_db): " DB_NAME
    DB_NAME=${DB_NAME:-monitor_db}
    
    read -p "请输入要创建的数据库用户名 (默认: monitor_user): " DB_USER
    DB_USER=${DB_USER:-monitor_user}
    
    read -p "请输入数据库用户密码: " -s DB_PASSWORD
    echo
    
    read -p "请输入 MySQL 主机地址 (默认: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "请输入 MySQL 端口 (默认: 3306): " DB_PORT
    DB_PORT=${DB_PORT:-3306}
}

# 创建数据库和用户
create_database() {
    print_message "创建数据库和用户..."
    
    mysql -h "$DB_HOST" -P "$DB_PORT" -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';

GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'%';

FLUSH PRIVILEGES;

SELECT 'Database and user created successfully!' as Status;
EOF
    
    if [ $? -eq 0 ]; then
        print_message "数据库和用户创建成功"
    else
        print_error "数据库和用户创建失败"
        exit 1
    fi
}

# 更新配置文件
update_config() {
    print_message "更新配置文件..."
    
    CONFIG_FILE="config.json"
    
    # 使用 jq 更新配置（如果安装了 jq）
    if command -v jq &> /dev/null; then
        jq ".database.host = \"$DB_HOST\" | .database.port = $DB_PORT | .database.user = \"$DB_USER\" | .database.password = \"$DB_PASSWORD\" | .database.database = \"$DB_NAME\"" "$CONFIG_FILE" > "$CONFIG_FILE.tmp"
        mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
        print_message "配置文件已更新"
    else
        print_warning "未安装 jq，请手动编辑 config.json 文件"
        print_message "需要修改的配置项:"
        echo "  host: $DB_HOST"
        echo "  port: $DB_PORT"
        echo "  user: $DB_USER"
        echo "  password: $DB_PASSWORD"
        echo "  database: $DB_NAME"
    fi
}

# 测试连接
test_connection() {
    print_message "测试数据库连接..."
    
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 1" &> /dev/null; then
        print_message "数据库连接测试成功"
    else
        print_error "数据库连接测试失败"
        exit 1
    fi
}

# 主函数
main() {
    echo "=========================================="
    echo "MySQL 数据库初始化脚本"
    echo "=========================================="
    echo
    
    check_mysql
    get_user_input
    create_database
    update_config
    test_connection
    
    echo
    print_message "MySQL 数据库初始化完成！"
    echo "=========================================="
    echo "数据库信息:"
    echo "  主机: $DB_HOST"
    echo "  端口: $DB_PORT"
    echo "  数据库: $DB_NAME"
    echo "  用户: $DB_USER"
    echo "=========================================="
}

# 运行主函数
main


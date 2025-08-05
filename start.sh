#!/bin/bash

# 数据监控系统启动脚本
# 使用方法: ./start.sh [normal|high|dev]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}    数据监控系统启动脚本${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查Node.js环境
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js >= 16.0.0"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        print_error "Node.js 版本过低，当前版本: $NODE_VERSION，需要 >= 16.0.0"
        exit 1
    fi
    
    print_message "Node.js 版本检查通过: $NODE_VERSION"
}

# 检查依赖是否安装
check_dependencies() {
    print_message "检查依赖安装状态..."
    
    # 检查前端依赖
    if [ ! -d "node_modules" ]; then
        print_warning "前端依赖未安装，正在安装..."
        npm install
    fi
    
    # 检查后端依赖
    if [ ! -d "websocket-server/node_modules" ]; then
        print_warning "后端依赖未安装，正在安装..."
        cd websocket-server
        npm install
        cd ..
    fi
    
    print_message "依赖检查完成"
}

# 初始化数据库
init_database() {
    print_message "初始化数据库..."
    cd websocket-server
    
    if [ ! -f "data/monitor.db" ]; then
        npm run init-db
        print_message "数据库初始化完成"
    else
        print_message "数据库已存在，跳过初始化"
    fi
    
    cd ..
}

# 启动后端服务
start_backend() {
    local mode=$1
    print_message "启动后端服务 (模式: $mode)..."
    
    cd websocket-server
    
    if [ "$mode" = "high" ]; then
        npm start high &
    else
        npm start &
    fi
    
    BACKEND_PID=$!
    cd ..
    
    # 等待后端服务启动
    print_message "等待后端服务启动..."
    sleep 5
    
    # 检查后端服务是否正常
    if curl -s http://localhost:3002/health > /dev/null; then
        print_message "后端服务启动成功"
        print_message "WebSocket服务器: ws://localhost:8080"
        print_message "API服务器: http://localhost:3002"
    else
        print_error "后端服务启动失败"
        exit 1
    fi
}

# 启动前端服务
start_frontend() {
    print_message "启动前端服务..."
    
    npm run dev &
    FRONTEND_PID=$!
    
    # 等待前端服务启动
    print_message "等待前端服务启动..."
    sleep 3
    
    print_message "前端服务启动成功"
    print_message "前端地址: http://localhost:5173"
}

# 清理函数
cleanup() {
    print_message "正在停止服务..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # 杀死所有相关进程
    pkill -f "ts-node src/server.ts" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    print_message "服务已停止"
    exit 0
}

# 显示帮助信息
show_help() {
    echo "数据监控系统启动脚本"
    echo ""
    echo "使用方法:"
    echo "  ./start.sh [模式]"
    echo ""
    echo "模式选项:"
    echo "  normal  - 正常模式 (默认，100台设备)"
    echo "  high    - 高并发测试模式 (50000台设备)"
    echo "  dev     - 仅启动前端开发服务器"
    echo "  help    - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./start.sh          # 正常模式启动"
    echo "  ./start.sh normal   # 正常模式启动"
    echo "  ./start.sh high     # 高并发模式启动"
    echo "  ./start.sh dev      # 仅启动前端"
}

# 主函数
main() {
    local mode=${1:-normal}
    
    # 设置信号处理
    trap cleanup SIGINT SIGTERM
    
    print_header
    
    case $mode in
        help|--help|-h)
            show_help
            exit 0
            ;;
        dev)
            print_message "开发模式：仅启动前端服务"
            check_nodejs
            check_dependencies
            start_frontend
            ;;
        normal|high)
            print_message "启动完整系统 (模式: $mode)"
            check_nodejs
            check_dependencies
            init_database
            start_backend $mode
            start_frontend
            ;;
        *)
            print_error "未知模式: $mode"
            show_help
            exit 1
            ;;
    esac
    
    print_message "系统启动完成！"
    echo ""
    echo -e "${GREEN}访问地址:${NC}"
    echo -e "  前端界面: ${BLUE}http://localhost:5173${NC}"
    
    if [ "$mode" != "dev" ]; then
        echo -e "  API接口: ${BLUE}http://localhost:3002${NC}"
        echo -e "  WebSocket: ${BLUE}ws://localhost:8080${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
    
    # 保持脚本运行
    wait
}

# 检查是否有执行权限
if [ ! -x "$0" ]; then
    print_warning "脚本没有执行权限，正在添加..."
    chmod +x "$0"
fi

# 运行主函数
main "$@"

# DataMonitor

DataMonitor 是一个基于 Vue 3 + Node.js 的实时数据监控平台，集成了 WebSocket 实时推送和数据库持久化存储功能。系统支持实时监控、历史数据分析、异常检测等功能，适合 IoT 场景下的数据监控和分析需求。

## 快速开始

### 方式一：一键启动（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd DataMonitor

# 一键启动（自动安装依赖、初始化数据库、启动服务）
./start.sh

# 或者指定模式启动
./start.sh normal    # 正常模式（100台设备）
./start.sh high      # 高并发模式（50000台设备）
./start.sh dev       # 仅启动前端开发服务器
```

### 方式二：手动启动

#### 1. 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd websocket-server
npm install
cd ..
```

#### 2. 初始化数据库
```bash
cd websocket-server
npm run init-db
cd ..
```

#### 3. 启动后端服务
```bash
cd websocket-server
npm start          # 正常模式
# 或
npm start high     # 高并发测试模式
```

#### 4. 启动前端服务
```bash
# 新开终端窗口
npm run dev
```
## 项目结构

```bash
DataMonitor/
├── src/                     # 前端源码
│   ├── components/
│   │   ├── charts/         # 图表组件
│   │   ├── dashboard/      # 仪表板组件
│   │   │   ├── DashboardMain.vue
│   │   │   └── HistoryDataPanel.vue  # 历史数据查询面板
│   │   └── layout/         # 布局组件
│   ├── utils/
│   │   ├── historyApi.ts   # 历史数据API封装
│   │   └── useWebSocket.ts # WebSocket工具
│   └── views/              # 页面组件
├── websocket-server/        # 后端服务
│   ├── src/
│   │   ├── api/            # API服务器
│   │   │   └── server.ts   # Express API服务
│   │   ├── database/       # 数据库模块
│   │   │   ├── init.ts     # 数据库初始化
│   │   │   ├── connection.ts # 连接管理
│   │   │   └── models.ts   # 数据模型
│   │   ├── services/       # 业务服务
│   │   │   ├── deviceSimulator.ts  # 设备模拟器
│   │   │   └── dataProcessor.ts    # 数据处理器
│   │   └── server.ts       # 主服务器
│   ├── data/               # 数据库文件
│   │   └── monitor.db      # SQLite数据库
│   └── config.json         # 配置文件
├── db/                     # 原有数据模拟（兼容保留）
├── start.sh                # 一键启动脚本
├── README_DATABASE_INTEGRATION.md  # 数据库集成文档
└── TECHNICAL_DOCUMENTATION.md      # 技术实现文档
```

## 技术栈

### 前端
- **框架**：Vue 3 + TypeScript + Vite
- **UI组件**：Element Plus
- **图表库**：ECharts
- **状态管理**：Pinia
- **HTTP客户端**：Axios

### 后端
- **运行时**：Node.js 16+
- **语言**：TypeScript
- **WebSocket**：ws 库
- **API服务器**：Express.js
- **数据库**：SQLite（支持升级到 PostgreSQL）

### 系统架构
```bash
┌─────────────────┐    WebSocket     ┌──────────────────┐
│   Vue 3 前端    │ ←──────────────→ │  WebSocket服务器  │
│                 │                  │                  │
│  - 实时图表     │    HTTP API      │  - 设备模拟器    │
│  - 历史查询     │ ←──────────────→ │  - 数据处理器    │
│  - 异常监控     │                  │  - API服务器     │
└─────────────────┘                  └──────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │   SQLite数据库   │
                                     │                  │
                                     │  - 核心指标表    │
                                     │  - 环境数据表    │
                                     │  - 设备状态表    │
                                     │  - 通信数据表    │
                                     └──────────────────┘
```

### 架构特点
- **前后端分离**：独立开发和部署
- **实时通信**：WebSocket 双向通信
- **异步处理**：非阻塞数据库写入
- **RESTful API**：标准化接口设计
- **数据分离**：实时推送与历史存储解耦


## 💡 使用指南

### 实时监控
系统启动后，前端会自动连接WebSocket服务器，实时显示：
- 核心指标仪表板（CPU、内存、网络、在线率）
- 实时温度变化图表
- 设备地理分布地图
- 设备状态统计

### 历史数据查询
1. 点击主界面的"历史数据查询"按钮
2. 选择数据类型（核心指标、环境数据、设备状态、通信数据）
3. 选择具体指标类型（如CPU、内存等）
4. 选择时间范围（1小时到7天）
5. 点击"查询"按钮查看历史趋势

### API接口使用
```bash
# 健康检查
curl http://localhost:3002/health

# 查询核心指标
curl "http://localhost:3002/api/core-metrics?category=cpu&limit=10"

# 查询环境数据
curl "http://localhost:3002/api/environment?type=temperature&limit=10"

# 获取数据概览
curl http://localhost:3002/api/overview
```

## 数据格式说明

数据模型定义文件：`/websocket-server/src/types/index.ts`
### WebSocket 实时数据格式
```json
{
  "type": "core_metrics",
  "data": [
    {
      "deviceId": "000",
      "timestamp": 1754381472279,
      "category": "cpu",
      "value": 81.96,
      "dataStatus": "normal",
      "location": {
        "lat": 39.5,
        "lng": 116.5,
        "accuracy": 1
      }
    }
  ],
  "timestamp": 1754381472279
}
```

### API 响应格式
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "params": {
    "category": "cpu",
    "limit": 10
  }
}
```

## 配置说明

### 异常检测阈值
可在 `websocket-server/config.json` 中修改：
```json
{
  "dataProcessor": {
    "thresholds": {
      "cpu": { "warning": 90, "error": 95 },
      "memory": { "warning": 90, "error": 95 },
      "temperature": { "warning": 35, "error": 40 }
    }
  }
}
```

### 服务器端口配置
```json
{
  "server": {
    "websocket": { "port": 8080 },
    "api": { "port": 3002 }
  }
}
```

## 📚 相关文档

- [数据库集成详细说明](README_DATABASE_INTEGRATION.md)
- [技术实现文档](TECHNICAL_DOCUMENTATION.md)
- [WebSocket服务器说明](websocket-server/README.md)
- [原有数据模拟说明](db/Readme.md)



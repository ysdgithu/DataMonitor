# DataMonitor - 实时数据监控平台

<div align="center">

**基于 Vue 3 + Node.js 的企业级实时数据监控解决方案**

[![Vue 3](https://img.shields.io/badge/Vue-3.5.13-4FC08D?style=flat-square&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-FF6B6B?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

**🌐 在线预览**: [https://data-monitor-psi.vercel.app/](https://data-monitor-psi.vercel.app/) *(需科学上网)*

**☁️ 服务器**: 阿里云

## 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [API接口](#api接口)
- [部署说明](#部署说明)

## 项目概述

DataMonitor 是一个专为 IoT 和工业监控场景设计的实时数据监控平台。系统采用前后端分离架构，通过 WebSocket 实现毫秒级数据推送，结合 SQLite 数据库提供可靠的数据持久化存储。

### 应用场景
- 工业 IoT 监控、数据中心监控、智能制造、环境监测

## 技术栈

**前端**: Vue 3 + TypeScript + Vite + Element Plus + ECharts + Pinia

**后端**: Node.js + TypeScript + WebSocket + Express.js + SQLite

## 功能说明

实时监控：可以实时监控模拟工厂指标，设备位置，环境温度，通信量等指标，并通过可视化图表呈现

历史记录：可以按时间查询每项历史记录

异常报警：对于异常数据，会在可视化图表上标注

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 一键启动
```bash
git clone <repository-url>
cd DataMonitor
./start.sh                # 正常模式（100台设备）
./start.sh high           # 高并发模式（50000台设备）
```

### 手动启动
```bash
# 1. 安装依赖
npm install
cd websocket-server && npm install && cd ..

# 2. 初始化数据库
cd websocket-server && npm run init-db && cd ..

# 3. 启动服务
cd websocket-server && npm start &    # 后端服务
npm run dev                           # 前端服务
```

### 访问地址
- 前端界面: http://localhost:5173
- API接口: http://localhost:3002/health
## 项目结构

```
DataMonitor/
├── src/                    # 前端源码
│   ├── components/         # Vue组件
│   ├── stores/            # Pinia状态管理
│   ├── utils/             # 工具函数
│   └── views/             # 页面组件
├── websocket-server/       # 后端服务
│   ├── src/
│   │   ├── api/           # REST API
│   │   ├── database/      # 数据库模块
│   │   ├── services/      # 业务服务
│   │   └── types/         # 类型定义
│   └── config.json        # 配置文件
└── start.sh               # 一键启动脚本
```

## 详细文档
- **[前端文档](./src/README.md)** - Vue 3 前端项目详细说明
- **[后端文档](./websocket-server/README.md)** - Node.js 后端服务详细说明

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



## API接口

### 主要接口
```bash
GET /health                           # 健康检查
GET /api/core-metrics                 # 核心指标查询
GET /api/environment                  # 环境数据查询
GET /api/device-status               # 设备状态查询
GET /api/overview                    # 数据概览
```

### 查询参数
- `category`: cpu|memory|network|online
- `limit`: 返回记录数量
- `startTime/endTime`: 时间范围

##  部署说明

### 开发环境
```bash
git clone <repository-url>
cd DataMonitor
./start.sh
```

### 生产环境
```bash
npm run build                    # 构建前端
cd websocket-server && npm start # 启动后端
```

### 阿里云部署
- 前端: Vercel部署 ([预览地址](https://data-monitor-psi.vercel.app/))
- 后端: 阿里云ECS服务器

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**

**📚 详细文档**: [前端文档](./src/README.md) | [后端文档](./websocket-server/README.md)


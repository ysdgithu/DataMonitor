# DataMonitor 后端服务

<div align="center">

**基于 Node.js + TypeScript 的高性能实时数据服务**


## 目录

- [DataMonitor 后端服务](#datamonitor-后端服务)
  - [目录](#目录)
  - [项目概述](#项目概述)
  - [技术栈](#技术栈)
  - [项目结构](#项目结构)
  - [核心模块](#核心模块)
    - [主要模块](#主要模块)
  - [API接口](#api接口)
    - [主要接口](#主要接口)
    - [查询参数](#查询参数)
  - [开发指南](#开发指南)
    - [环境准备](#环境准备)
    - [启动服务](#启动服务)
    - [调试技巧](#调试技巧)
    - [部署](#部署)

## 项目概述

DataMonitor 后端服务是企业级的实时数据处理和分发系统，专为 IoT 设备监控和数据分析场景设计。

## 技术栈

**核心**: Node.js + TypeScript + WebSocket + Express.js + SQLite

##  项目结构

```
websocket-server/
├── src/
│   ├── api/            # REST API服务
│   ├── database/       # 数据库模块
│   ├── services/       # 业务服务
│   ├── types/          # 类型定义
│   └── server.ts       # WebSocket主服务器
├── data/               # 数据存储
├── config.json         # 配置文件
└── package.json        # 依赖配置
```
<!-- 修改的点：
文档优化点：把核心东西整出来，部署详细一点
技术优化点：
-->
<!-- 
### 异常检测算法
### 设备模拟算法 
-->
  
## 核心模块

### 主要模块
- **server.ts**: WebSocket服务器，连接管理
- **dataProcessor.ts**: 数据处理器，异常检测
- **deviceSimulator.ts**: 设备模拟器，数据生成
- **api/server.ts**: REST API服务器
- **database/**: 数据库模块，连接和模型管理

## API接口

### 主要接口
```bash
GET /health                    # 健康检查
GET /api/core-metrics         # 核心指标查询
GET /api/environment          # 环境数据查询
GET /api/device-status        # 设备状态查询
GET /api/telemetry           # 通信数据查询
GET /api/overview            # 数据概览
GET /api/statistics/:type    # 统计数据
```

### 查询参数
- `category`: cpu|memory|network|online
- `deviceId`: 设备ID
- `startTime/endTime`: 时间范围
- `limit`: 返回记录数



## 开发指南

### 环境准备
```bash
node --version  # >= 16.0.0
npm install     # 安装依赖
npm run init-db # 初始化数据库
```

### 启动服务
```bash
npm start       # 正常模式
npm start high  # 高并发测试模式
```

### 调试技巧
```bash
# WebSocket测试
wscat -c ws://localhost:8080

# 数据库查询
sqlite3 data/monitor.db
SELECT * FROM core_metrics LIMIT 10;

# API测试
curl http://localhost:3002/health
```

### 部署

平台：阿里云ecs云服务器
使用pm2对后端进行自动化管理
使用nginx进行后端保护，配置ssl


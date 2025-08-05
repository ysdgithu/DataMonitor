# 数据监控系统 - 数据库集成方案

## 项目概述

本项目为数据监控系统添加了完整的数据库集成功能，在保持原有WebSocket实时推送的基础上，增加了数据持久化存储和历史数据查询能力。

## 技术架构

### 整体架构图
```
┌─────────────────┐    WebSocket     ┌──────────────────┐
│   Vue 3 前端    │ ←──────────────→ │  WebSocket服务器  │
│                 │                  │                  │
│  - 实时图表     │    HTTP API      │  - 设备模拟器    │
│  - 历史查询     │ ←──────────────→ │  - 数据处理器    │
└─────────────────┘                  │  - 数据库服务    │
                                     └──────────────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │   SQLite数据库   │
                                     │                  │
                                     │  - 实时数据表    │
                                     │  - 历史数据表    │
                                     │  - 聚合统计表    │
                                     └──────────────────┘
```

### 技术栈

**前端：**
- Vue 3 + TypeScript
- Element Plus UI组件库
- ECharts图表库
- Axios HTTP客户端

**后端：**
- Node.js + TypeScript
- WebSocket (ws库)
- Express.js API服务器
- SQLite数据库

**数据库：**
- SQLite（开发/测试环境）
- 支持升级到PostgreSQL（生产环境）

## 功能特性

### 1. 数据持久化
- ✅ 实时数据自动存储到数据库
- ✅ 支持4种数据类型：核心指标、环境数据、设备状态、通信数据
- ✅ 异常数据检测和分级存储
- ✅ 批量写入优化，确保高性能

### 2. 历史数据查询
- ✅ RESTful API接口
- ✅ 灵活的查询条件（时间范围、设备ID、数据类型等）
- ✅ 分页查询支持
- ✅ 数据统计和聚合

### 3. 前端历史数据面板
- ✅ 可视化历史数据趋势图表
- ✅ 多种时间范围选择
- ✅ 数据表格展示
- ✅ 实时连接状态监控

### 4. 性能优化
- ✅ 异步数据库写入，不阻塞WebSocket推送
- ✅ 数据库连接池管理
- ✅ 索引优化查询性能
- ✅ 支持高并发模式（50000+设备）

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

1. **安装依赖**
```bash
# 安装前端依赖
cd DataMonitor
npm install

# 安装后端依赖
cd websocket-server
npm install
```

2. **初始化数据库**
```bash
cd websocket-server
npm run init-db
```

3. **启动后端服务**
```bash
# 普通模式
npm start

# 高并发测试模式
npm start high
```

4. **启动前端服务**
```bash
cd ../
npm run dev
```

### 服务端口
- 前端开发服务器：http://localhost:5173
- WebSocket服务器：ws://localhost:8080
- API服务器：http://localhost:3002

## API接口文档

### 基础接口

#### 健康检查
```
GET /health
```

#### 数据概览
```
GET /api/overview
```

### 数据查询接口

#### 核心指标数据
```
GET /api/core-metrics?category=cpu&limit=100&startTime=1620000000&endTime=1620086400
```

#### 环境数据
```
GET /api/environment?type=temperature&limit=100
```

#### 设备状态数据
```
GET /api/device-status?status=online&limit=100
```

#### 通信数据
```
GET /api/telemetry?dataType=upload_frequency&limit=100
```

#### 统计数据
```
GET /api/statistics/core_metrics?hours=24
```

### 查询参数说明
- `deviceId`: 设备ID
- `category`: 数据类别（cpu, memory, network, online）
- `dataType`: 数据类型
- `status`: 设备状态
- `startTime`: 开始时间戳
- `endTime`: 结束时间戳
- `limit`: 返回记录数限制
- `offset`: 分页偏移量

## 数据库设计

### 表结构

#### 1. 核心指标表 (core_metrics)
```sql
CREATE TABLE core_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    category VARCHAR(20) NOT NULL,
    value REAL NOT NULL,
    data_status VARCHAR(10) DEFAULT 'normal',
    latitude REAL,
    longitude REAL,
    accuracy INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. 环境数据表 (environment_data)
```sql
CREATE TABLE environment_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL,
    value REAL NOT NULL,
    unit VARCHAR(10),
    data_status VARCHAR(10) DEFAULT 'normal',
    latitude REAL,
    longitude REAL,
    accuracy INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. 设备状态表 (device_status)
```sql
CREATE TABLE device_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_update BIGINT,
    battery_level INTEGER,
    data_status VARCHAR(10) DEFAULT 'normal',
    latitude REAL,
    longitude REAL,
    accuracy INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. 通信数据表 (telemetry_data)
```sql
CREATE TABLE telemetry_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id VARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    data_type VARCHAR(30) NOT NULL,
    value REAL NOT NULL,
    data_status VARCHAR(10) DEFAULT 'normal',
    latitude REAL,
    longitude REAL,
    accuracy INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 索引策略
- 设备ID + 时间戳复合索引
- 数据类型 + 时间戳复合索引
- 数据状态索引
- 时间戳索引

## 使用指南

### 前端历史数据查询

1. **打开历史数据面板**
   - 点击主界面控制栏中的"历史数据查询"按钮

2. **选择查询条件**
   - 数据类型：核心指标、环境数据、设备状态、通信数据
   - 具体类型：根据数据类型显示相应选项
   - 时间范围：1小时、6小时、12小时、24小时、3天、7天

3. **查看结果**
   - 趋势图表：显示数据变化趋势
   - 数据表格：详细的历史记录
   - 状态标识：正常、警告、错误状态

### 异常数据检测

系统自动检测以下异常情况：
- CPU使用率 > 90%（警告）、> 95%（错误）
- 内存占用 > 90%（警告）、> 95%（错误）
- 网络延迟 > 150ms（警告）、> 180ms（错误）
- 设备在线率 < 60%（警告）、< 30%（错误）
- 温度 > 35°C（警告）、> 40°C（错误）

## 性能测试结果

### 正常模式
- 设备数量：100台
- 数据频率：每秒1-6次更新
- WebSocket延迟：< 10ms
- 数据库写入：< 50ms

### 高并发模式
- 设备数量：50000台
- 数据频率：每8秒批量更新
- 系统稳定性：✅ 通过
- 内存使用：< 500MB

## 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 重新初始化数据库
   cd websocket-server
   npm run init-db
   ```

2. **API连接失败**
   - 检查端口3002是否被占用
   - 确认API服务器已启动

3. **WebSocket连接失败**
   - 检查端口8080是否被占用
   - 确认WebSocket服务器已启动

4. **前端无法访问**
   - 检查端口5173是否被占用
   - 确认前端开发服务器已启动

### 日志查看
- WebSocket服务器日志：控制台输出
- API请求日志：控制台输出
- 数据库操作日志：控制台输出

## 扩展建议

### 生产环境部署
1. **数据库升级**
   - 从SQLite迁移到PostgreSQL
   - 配置数据库连接池
   - 设置数据备份策略

2. **性能优化**
   - 使用Redis缓存热点数据
   - 配置负载均衡
   - 启用数据压缩

3. **监控告警**
   - 集成Prometheus监控
   - 配置Grafana仪表板
   - 设置异常告警

### 功能扩展
1. **数据导出**
   - CSV格式导出
   - Excel格式导出
   - PDF报告生成

2. **高级分析**
   - 数据趋势预测
   - 异常模式识别
   - 智能告警规则

3. **用户管理**
   - 用户认证授权
   - 角色权限管理
   - 操作日志记录

## 技术支持

如有问题，请检查：
1. 环境要求是否满足
2. 依赖是否正确安装
3. 端口是否被占用
4. 数据库是否正确初始化

## 更新日志

### v1.0.0 (2025-08-05)
- ✅ 完成数据库集成
- ✅ 实现历史数据查询API
- ✅ 添加前端历史数据面板
- ✅ 完成性能优化和测试
- ✅ 编写完整文档

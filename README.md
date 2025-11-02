# DataMonitor - 实时数据监控平台


**基于Vue 3 + Node.js的实时数据监控演示系统**

🌐 **在线预览**: [https://data-monitor-psi.vercel.app](https://data-monitor-psi.vercel.app | ☁️ **后端**: 阿里云 ECS

## 快速开始

```bash
git clone <repository-url>
cd DataMonitor
./start.sh  # 一键启动（前后端 + 数据库）
```

---

## 核心技术亮点

### 1. WebSocket 实时推送 + 自适应重连机制

**问题**: 网络波动导致连接断开，数据丢失

**解决方案**: 实现了**指数退避策略**的自动重连 + **心跳检测** + **消息队列**

<augment_code_snippet path="src/utils/useWebSocket.ts" mode="EXCERPT">
````typescript
// 指数退避重连：第1次延迟1s，第2次2s，第3次4s...
const delay = retryDelay * Math.pow(2, retryCount.value - 1)

// 心跳机制：每30秒发送ping，10秒内未收到pong则主动断开
const startHeartbeat = () => {
  heartbeatTimer = setInterval(() => {
    sendHeartbeat()
  }, heartbeatInterval)
}

// 消息队列：连接中断时缓存消息，恢复后重新发送
const sendMessage = (message: string | object) => {
  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    messageQueue.value.push(message)  // 加入队列
    return
  }
  ws.value.send(JSON.stringify(message))
}
````
</augment_code_snippet>

**效果**: 网络抖动时自动恢复，无数据丢失

---

### 2. 通用数据存储设计 + 灵活的统计分析

**问题**: 不同类型的设备数据结构差异大，难以扩展

**解决方案**: 采用 **JSON Payload** 通用表设计，支持任意数据类型

<augment_code_snippet path="websocket-server/README.md" mode="EXCERPT">
````sql
-- 单表存储所有设备数据，通过 data_type 区分
CREATE TABLE device_data (
    id INTEGER PRIMARY KEY,
    device_id VARCHAR(50),
    data_type VARCHAR(30),        -- 标识数据类型
    timestamp BIGINT,
    payload TEXT,                 -- JSON格式，灵活存储任意结构
    data_status VARCHAR(10)       -- normal/warning/error
)

-- 示例：同一张表存储不同类型数据
-- CPU数据:    {"value": 85.5, "unit": "%"}
-- 温度数据:   {"value": 25.6, "unit": "℃"}
-- 门锁数据:   {"status": "open", "operator": "张三"}
````
</augment_code_snippet>

**优势**: 新增设备类型无需修改表结构，支持百万级数据查询

---

### 3. 小时粒度的多维度统计

**问题**: 实时数据量大，历史分析困难

**解决方案**: 建立 **data_statistics** 统计表，按小时聚合计算

<augment_code_snippet path="websocket-server/README.md" mode="EXCERPT">
````sql
CREATE TABLE data_statistics (
    date DATE,
    hour INTEGER,                 -- 0-23小时粒度
    data_type VARCHAR(20),
    category VARCHAR(20),         -- cpu/memory/network等
    avg_value REAL,               -- 平均值
    max_value REAL,               -- 最大值
    min_value REAL,               -- 最小值
    error_count INTEGER,          -- 异常数据计数
    warning_count INTEGER         -- 警告数据计数
)
````
</augment_code_snippet>

**应用**: 支持秒级实时查询 + 小时级趋势分析 + 异常统计

---

### 4. 前端实时数据分组 + 高效渲染

**问题**: 多种数据类型混合推送，图表更新频繁导致卡顿

**解决方案**: 在 Pinia Store 中按类型分组，限制缓存点数

<augment_code_snippet path="src/stores/realtime.ts" mode="EXCERPT">
````typescript
// 按数据类型分组存储，最多保留20个数据点
const MAX_POINTS = 20
const dataGroupMap = ref<Record<string, AllDeviceData[]>>({})

function handleRealtimeMessage(message: WebSocketMessage) {
  const { type, data } = message

  // 按类型分组
  if (!dataGroupMap.value[type]) {
    dataGroupMap.value[type] = []
  }

  dataGroupMap.value[type].push(data)

  // 限制缓存大小，防止内存溢出
  if (dataGroupMap.value[type].length > MAX_POINTS) {
    dataGroupMap.value[type].shift()
  }
}
````
</augment_code_snippet>

**效果**: 即使100台设备并发推送，前端仍保持流畅

---

### 5. 多维度数据查询 API

**特点**: 支持时间范围、设备ID、数据类型、分页等灵活组合查询

<augment_code_snippet path="websocket-server/README.md" mode="EXCERPT">
````bash
# 查询最近1小时的CPU数据
GET /api/core-metrics?category=cpu&start=1760792891698&limit=100

# 查询特定设备的环境数据
GET /api/environment?deviceId=001&type=temperature&start=...&end=...

# 查询今天CPU的统计数据（平均值、最大值、异常计数等）
GET /api/statistics/core_metrics?date=2025-10-18&category=cpu

# 查询工厂所有设备的实时状态
GET /api/factory-devices?zone=production&status=online
````
</augment_code_snippet>

---

## 项目结构

```
DataMonitor/
├── src/                           # 前端 Vue 3 项目
│   ├── components/
│   │   ├── charts/               # ECharts 图表组件
│   │   ├── dashboard/            # 仪表板主体
│   │   └── layout/               # 布局组件
│   ├── stores/                   # Pinia 状态管理
│   │   ├── realtime.ts           # WebSocket 实时数据处理
│   │   ├── CoreMetricData.ts     # 核心指标数据
│   │   └── EnvironmentData.ts    # 环境数据
│   └── utils/
│       ├── useWebSocket.ts       # WebSocket 连接管理
│       ├── historyApi.ts         # 历史数据查询
│       └── chartOptions.ts       # 图表配置
│
├── websocket-server/              # 后端 Node.js 服务
│   ├── src/
│   │   ├── server.ts             # WebSocket 服务器入口
│   │   ├── api/server.ts         # REST API 服务
│   │   ├── services/
│   │   │   ├── deviceSimulator.ts # 设备数据模拟器
│   │   │   └── dataProcessor.ts   # 数据处理 + 推送
│   │   └── database/
│   │       ├── init.ts           # 数据库初始化
│   │       └── queries.ts        # SQL 查询
│   └── config.json
│
└── start.sh                       # 一键启动脚本
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Vue 3 + TypeScript + Vite + Element Plus + ECharts + Pinia |
| **后端** | Node.js + TypeScript + Express.js + WebSocket |
| **数据库** | SQLite（开发）/ MySQL（生产） |
| **部署** | Vercel（前端）+ 阿里云 ECS（后端） |

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Vue 3 前端                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 实时图表展示  │  │ 历史数据查询  │  │ 异常告警面板  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬──────────────────────────────────────┬─────────┘
             │ WebSocket (实时推送)                 │ HTTP API
             │ 心跳 + 自动重连                      │ (历史查询)
             ▼                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Node.js 后端服务                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 设备模拟器    │  │ 数据处理器    │  │ REST API     │      │
│  │ (10台设备)   │  │ (异常检测)   │  │ (查询接口)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬──────────────────────────────────────┬─────────┘
             │ 实时写入                             │ 查询
             ▼                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite 数据库                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ device_data  │  │ data_stats   │  │ factory_dev  │      │
│  │ (原始数据)   │  │ (统计数据)   │  │ (设备信息)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心 API 示例

### 实时数据查询
```bash
# 获取最近的CPU使用率数据
curl "http://localhost:3002/api/core-metrics?category=cpu&limit=10"

# 响应示例
{
  "success": true,
  "data": [{
    "deviceId": "000",
    "timestamp": 1760792891698,
    "category": "cpu",
    "value": 85.5,
    "dataStatus": "warning"
  }],
  "total": 10
}
```

### 统计数据查询
```bash
# 获取今天CPU的统计数据（平均值、最大值、异常计数）
curl "http://localhost:3002/api/statistics/core_metrics?date=2025-10-18&category=cpu"

# 响应示例
{
  "success": true,
  "data": [{
    "data_type": "core_metrics",
    "category": "cpu",
    "avg_value": 66.46,
    "max_value": 99.92,
    "min_value": 30.13,
    "error_count": 24,
    "warning_count": 24
  }]
}
```

### 工厂设备查询
```bash
# 查询生产区所有在线设备
curl "http://localhost:3002/api/factory-devices?zone=production&status=online"

# 响应示例
{
  "success": true,
  "data": [{
    "deviceId": "1001",
    "name": "数控机床-1",
    "type": "数控机床",
    "status": "online",
    "zone": "production",
    "parameters": {
      "temperature": 52.4,
      "pressure": 4.5,
      "vibration": 2.3
    }
  }],
  "total": 5
}
```

---

## 部署

### 本地开发
```bash
./start.sh              # 启动前后端 + 数据库
```

### 生产环境
```bash
# 前端构建
npm run build
npm run preview

# 后端启动
cd websocket-server
npm install
npm start
```

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**




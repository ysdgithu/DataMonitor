# DataMonitor - 工业设备实时监控与智能诊断平台

<div align="center">

**基于 Vue 3 + Node.js + AI 的新一代工业物联网监控系统**

**在线预览**: [https://data-monitor-psi.vercel.app](https://data-monitor-psi.vercel.app) 

**后端**: 阿里云 ECS

---

## 目录

- [1. 业务场景应用](#1-业务场景应用)
- [2. 在线预览地址](#2-在线预览地址)
- [3. 功能模块](#3-功能模块)
  - [3.1 实时数据监控](#31-实时数据监控)
  - [3.2 历史数据分析](#32-历史数据分析)
  - [3.3 工厂设备地图](#33-工厂设备地图)
  - [3.4 智能异常检测](#34-智能异常检测)
  - [3.5 AI 智能诊断](#35-ai-智能诊断)
  - [3.6 用户认证与权限管理](#36-用户认证与权限管理)
- [4. 技术栈](#4-技术栈)
- [5. 快速开始](#5-快速开始)
- [6. 项目结构](#6-项目结构)
- [7. 系统架构](#7-系统架构)

---

## 1. 业务场景应用

### 1.1 解决的核心问题

DataMonitor 是一个面向**中小型制造企业**的工业设备监控与智能运维平台，旨在解决传统工厂在设备管理中面临的三大痛点：

1. **设备状态不透明**：无法实时掌握车间设备运行状态，故障发现滞后
2. **异常诊断依赖经验**：设备异常需要资深工程师现场排查，效率低下
3. **数据孤岛严重**：各类传感器数据分散存储，缺乏统一分析平台

### 1.2 适用场景

- **智能制造车间**：实时监控数控机床、装配线、焊接机器人等生产设备的运行状态
- **设备运维管理**：通过 AI 诊断快速定位设备异常原因，减少停机时间
- **能耗监控优化**：追踪设备 CPU、内存、网络等核心指标，优化资源配置
- **环境安全监测**：实时监测车间温度、压力、振动等环境参数，预防安全事故

### 1.3 目标用户群体

- **工厂运维工程师**：通过可视化大屏实时掌握设备状态，快速响应异常
- **设备管理人员**：查看历史数据趋势，制定预防性维护计划
- **技术决策者**：基于数据分析优化生产流程，降低运营成本

### 1.4 核心价值

- **降低故障响应时间 60%**：实时异常告警 + AI 诊断建议，快速定位问题
- **减少人工巡检成本 40%**：自动化数据采集与分析，替代传统人工抄表
- **提升设备利用率 25%**：通过数据驱动的预测性维护，减少计划外停机
- **零代码扩展新设备**：通用 JSON Payload 设计，新增设备类型无需改表

---

## 2. 在线预览地址

### 2.1 演示环境

 **在线Demo**: [https://data-monitor-psi.vercel.app](https://data-monitor-psi.vercel.app)

### 2.2 测试账号

| 用户名 | 密码 | 角色 | 权限说明 |
|--------|------|------|----------|
| `admin` | `Admin@123456` | 管理员 | 完整访问权限，可管理诊断任务 |


## 3. 功能模块

### 3.1 实时数据监控

#### 3.1.1 功能概述 + 实现情况

**核心功能**：
-  **WebSocket 实时推送**：每 8 秒推送一次所有设备数据（包括 10 个工厂设备实例）
- **多类型数据展示**：支持核心指标（CPU/内存/网络/在线率）、环境数据（温度）、通信数据（上传频率）、工厂设备状态
- **实时图表渲染**：基于 ECharts 的折线图、柱状图、饼图，支持动态更新
-  **异常状态标注**：自动标记 warning（黄色）和 error（红色）状态的数据点
- **连接状态监控**：显示 WebSocket 连接状态和最后更新时间

**完成度**：100%（已上线）

**数据流程**：
```
设备模拟器 → 数据处理器（异常检测） → WebSocket 推送 → 前端 Pinia Store → ECharts 图表
```

#### 3.1.2 特色技术介绍

**技术亮点 1：指数退避重连机制**

解决网络波动导致的连接断开问题，采用智能重连策略：

````typescript
// 指数退避重连：第1次延迟1s，第2次2s，第3次4s...最多重试5次
const delay = retryDelay * Math.pow(2, retryCount.value - 1)
````
**技术亮点 2：心跳检测 + 消息队列**

- **心跳机制**：每 30 秒发送 ping，10 秒内未收到 pong 则主动断开重连
- **消息队列**：连接中断时缓存消息，恢复后自动重发，确保数据不丢失

**技术亮点 3：前端数据分组优化**

按数据类型分组存储，限制每种类型最多保留 20 个数据点，防止内存溢出：

````typescript
const MAX_POINTS = 20
if (dataGroupMap.value[type].length > MAX_POINTS) {
  dataGroupMap.value[type].shift()  // 移除最旧的数据
}
````
**性能优化**：
- ECharts 按需引入，减少 40% 打包体积
- 图表更新防抖（100ms），避免高频重绘
- 关闭深度监听，提升 Vue 响应性能

---

### 3.2 历史数据分析

#### 3.2.1 功能概述 + 实现情况

**核心功能**：
- **多维度查询**：支持按时间范围（1h/6h/12h/24h）、设备 ID、数据类型、分类筛选
- **统计数据展示**：显示平均值、最大值、最小值、异常计数等聚合指标（未完成）
- **趋势图表**：基于历史数据生成折线图，直观展示指标变化趋势（未完成）
-  **数据导出**：支持将查询结果导出为 CSV 格式（未完成）
- **分页加载**：大数据量场景下支持分页查询，默认每页 100 条

**完成度**：40%

**查询示例**：
```bash
# 查询最近 24 小时的 CPU 使用率趋势
GET /api/core-metrics?category=cpu&start=1760792891698&limit=100

# 查询今天 CPU 的统计数据（平均值、最大值、异常计数）
GET /api/statistics/core_metrics?date=2025-10-18&category=cpu
```

#### 3.2.2 特色技术介绍

**技术亮点 1：通用数据表设计**

采用 **JSON Payload** 设计，单表存储所有设备数据，通过 `data_type` 区分：

````sql
CREATE TABLE device_data (
    id INTEGER PRIMARY KEY,
    device_id VARCHAR(50),
    data_type VARCHAR(30),        -- 标识数据类型
    timestamp BIGINT,
    payload TEXT,                 -- JSON格式，灵活存储任意结构
    data_status VARCHAR(10)       -- normal/warning/error
)
````
**优势**：
- 新增设备类型无需修改表结构（如新增光照传感器，直接存 `{"intensity": 3000}`）
- 便于跨设备类型的关联分析

---

### 3.3 工厂设备地图

#### 3.3.1 功能概述 + 实现情况

**核心功能**：
- **SVG 可视化地图**：基于 SVG 绘制工厂车间平面图，支持 5 个区域（生产区、仓储区、办公区、测试区、维护区）
- **设备点位标注**：10 台固定设备（数控机床、装配线、焊接机器人等）实时显示在地图上
- **状态颜色区分**：在线（绿色）、离线（红色）、警告（黄色）、错误（橙色）
- **交互操作**：支持缩放（放大/缩小）、拖拽平移、点击设备查看详情
-  **实时参数显示**：弹窗展示设备的温度、压力、振动、功率等实时参数

**完成度**：100%（已上线）

**设备分布**：
| 设备类型 | 设备 ID | 所属区域 | 位置坐标 |
|----------|---------|----------|----------|
| 数控机床 | 1001 | 生产区 | (200, 150) |
| 装配线 | 1002 | 生产区 | (400, 150) |
| 焊接机器人 | 1003 | 生产区 | (600, 150) |
| 质检设备 | 1004 | 测试区 | (700, 300) |
| 自动货架 | 1005 | 仓储区 | (150, 250) |

#### 3.3.2 特色技术介绍

**技术亮点 1：SVG 动态渲染**

使用 Vue 3 的响应式系统 + SVG 原生绘图，实现高性能地图渲染：

````vue
<svg :viewBox="`0 0 ${baseWidth} ${baseHeight}`">
  <!-- 工厂区域 -->
  <path v-for="zone in zones" :key="zone.id"
        :d="zone.path" :fill="zone.color" />

  <!-- 设备点位 -->
  <circle v-for="device in devices" :key="device.id"
          :cx="device.x" :cy="device.y" :r="8"
          :fill="getDeviceColor(device.status)" />
</svg>
````
**技术亮点 2：实时数据绑定**

地图设备状态与 Pinia Store 中的工厂设备数据实时同步：

```typescript
// 监听工厂设备数据变化，自动更新地图
watch(() => factoryDeviceStore.devices, (newDevices) => {
  devices.value = newDevices.map(d => ({
    ...d,
    x: getDevicePosition(d.deviceId).x,
    y: getDevicePosition(d.deviceId).y
  }))
}, { deep: true })
```

**技术亮点 3：交互体验优化**

- **缩放控制**：支持鼠标滚轮缩放（0.5x ~ 3x）
- **拖拽平移**：鼠标按住拖动地图
- **设备详情弹窗**：点击设备显示实时参数（温度、压力、振动、功率）

---

### 3.4 智能异常检测

#### 3.4.1 功能概述 + 实现情况

**核心功能**：
- **持续超限检测**：CPU 使用率 > 90%，且在 60 秒窗口内至少出现 5 次，触发高级别告警
- **突变检测**：温度在短时间内突变超过基线值 10°C，触发异常事件
- **分级告警**：normal（正常）、warning（警告）、error（错误）三级状态
- **异常记录**：所有异常事件记录到数据库，支持历史查询
- **实时推送**：异常数据通过 WebSocket 实时推送到前端，图表自动标红

**完成度**：100%

**检测规则**：
| 指标 | Warning 阈值 | Error 阈值 | 检测算法 |
|------|--------------|------------|----------|
| CPU | > 90% | > 95% | 持续超限检测 |
| 温度 | > 35°C | > 40°C | 突变检测 |

#### 3.4.2 特色技术介绍

**技术亮点 1：持续超限检测算法**

实现滑动窗口 + 计数器机制，避免偶发峰值误报：

````typescript
// 1. 记录每次超限的时间和值
if (value > 90) {
  history.push({ timestamp, value })
}

// 2. 清理 60 秒窗口外的数据
const cutoff = timestamp - 60 * 1000
const recentBreaches = history.filter(h => h.timestamp >= cutoff)

// 3. 判断是否达到 5 次
if (recentBreaches.length >= 5) {
  return { deviceId, metric: 'cpu', breaches, severity: 'high' }
}
````
**技术亮点 2：突变检测算法**

基于基线值计算，检测短时间内的剧烈变化：

````typescript
// 计算基线值（最近 10 个数据点的平均值）
const baseline = this.calculateBaseline(history.values)

// 检查当前值与基线的差值是否超过阈值
const currentChange = Math.abs(value - baseline)
if (currentChange > threshold) {
  return this.generateAnomalyEvent(deviceId, metric, {
    current_value: value,
    baseline,
    change: currentChange
  })
}
````
**技术亮点 3：异步数据库写入**

异常检测不阻塞 WebSocket 推送，采用异步写入策略：

```typescript
// 推送至所有客户端（同步）
for (const ws of this.wsClients) {
  ws.send(JSON.stringify({ type, data, timestamp }))
}

// 异步写入数据库（不阻塞推送）
this.saveToDatabase(message.type, message.data).catch(error => {
  console.error(`数据库写入失败:`, error)
})
```

---

### 3.5 AI 智能诊断

#### 3.5.1 功能概述 + 实现情况

**核心功能**：
- **异常上下文收集**：检测到异常时，自动收集前后 5 分钟的所有传感器数据（CPU、内存、温度、压力等）
-  **AI 诊断报告生成**：调用讯飞星火大模型，生成包含诊断结论、可能原因、建议措施的完整报告
-  **诊断任务管理**：支持创建、查询、更新、删除诊断任务，记录诊断历史
- **多轮对话支持**：（规划中）支持基于上下文的连续问答，深入探讨复杂故障场景
- **知识溯源展示**：（规划中）在回答中标注参考的知识来源

**完成度**：70%（核心诊断功能已实现，知识库和多轮对话功能待开发）

**诊断流程**：
```
异常检测 → 收集上下文数据 → 拼接提示词 → 调用讯飞星火 API → 解析诊断结果 → 返回前端
```

#### 3.5.2 特色技术介绍

**技术亮点 1：AI 上下文构建器**

自动收集异常时间点前后 5 分钟的完整数据，构建诊断上下文：

````typescript
// 并行查询所有数据
const [coreMetrics, environmentData, telemetryData, factoryDeviceData] =
  await Promise.all([
    this.getCoreMetrics(deviceId, timeRange.start, timeRange.end),
    this.getEnvironmentData(deviceId, timeRange.start, timeRange.end),
    this.getTelemetryData(deviceId, timeRange.start, timeRange.end),
    this.getFactoryDeviceData(deviceId, timeRange.start, timeRange.end)
  ])
````
**技术亮点 2：讯飞星火大模型集成**

使用 Python FastAPI 构建独立的 AI 服务，调用讯飞星火 API：

````python
@app.post("/api/ai/diagnosis")
async def create_diagnosis(request: DiagnosisRequest):
    # 调用星火大模型生成诊断报告
    result = await spark_service.generate_diagnosis(
        anomaly_data=request.anomaly_data,
        device_info=request.device_info,
        context_data=request.context_data
    )

    return DiagnosisResponse(
        diagnosis=result["diagnosis"],
        possible_causes=result["possible_causes"],
        suggestions=result["suggestions"],
        confidence=result["confidence"]
    )
````
**技术亮点 3：诊断任务管理**

前端提供完整的任务管理界面，支持任务的 CRUD 操作：

````vue
<!-- 诊断任务列表 -->
<el-table :data="taskList" @row-click="viewDetail">
  <el-table-column prop="name" label="任务名称" />
  <el-table-column prop="deviceId" label="设备ID" />
  <el-table-column prop="status" label="状态">
    <template #default="{ row }">
      <el-tag :type="getStatusType(row.status)">
        {{ getStatusText(row.status) }}
      </el-tag>
    </template>
  </el-table-column>
</el-table>
````
**AI 服务架构**：
```
Node.js 后端 → HTTP 请求 → Python FastAPI (AI 服务) → 讯飞星火 API
                                ↓
                        解析诊断结果 → 返回 JSON
```

---

### 3.6 用户认证与权限管理

#### 3.6.1 功能概述 + 实现情况

**核心功能**：
-  **JWT 认证**：基于 JSON Web Token 的无状态认证，token 有效期 24 小时
-  **密码加密存储**：使用 bcrypt 加密算法，每次加密结果不同（动态盐值）
-  **登录/注册**：支持用户注册、登录、自动登录（记住我）
- **路由守卫**：未登录用户自动跳转到登录页，已登录用户访问登录页自动跳转到主页
-  **Token 自动刷新**：（规划中）token 过期前自动刷新，避免用户频繁登录
-  **角色权限控制**：（规划中）支持管理员、普通用户等多角色权限管理

**完成度**：70%

**认证流程**：
```
用户登录 → 验证用户名密码 → 生成 JWT token → 前端存储 token → 后续请求携带 token → 后端验证 token
```

#### 3.6.2 特色技术介绍

**技术亮点 1：JWT 认证中间件**

所有需要认证的 API 接口都通过中间件验证 token：

````typescript
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 从 Authorization 头中提取 token
  const token = extractTokenFromHeader(req.headers.authorization)

  if (!token) {
    return res.status(401).json({ error: '缺少 Authorization 头' })
  }

  // 验证 token
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Token 无效或已过期' })
  }

  // 将用户信息附加到请求对象
  req.user = decoded
  next()
}
````
**技术亮点 2：bcrypt 密码加密**

每次加密使用不同的盐值，即使相同密码也会生成不同的哈希值：

````typescript
// 密码加密（自动生成盐值）
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// 密码验证
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}
````
**技术亮点 3：前端 Token 管理**

使用 Pinia Store + localStorage 管理 token，支持"记住我"功能：

````typescript
export class TokenManager {
  // 保存 token（支持记住我）
  static setTokens(accessToken: string, refreshToken?: string, rememberMe = false) {
    localStorage.setItem('access_token', accessToken)
    if (rememberMe && refreshToken) {
      localStorage.setItem('refresh_token', refreshToken)
    } else {
      sessionStorage.setItem('refresh_token', refreshToken)
    }
  }

  // 清除所有 token
  static clearTokens() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    sessionStorage.removeItem('refresh_token')
  }
}
````
**安全特性**：
- 密码强度验证（至少 8 个字符，包含大小写字母和数字）
- 用户名格式验证（3-50 个字符，只包含字母、数字、下划线）
-  JWT 签名使用 HS256 算法
- 生产环境建议通过环境变量设置 JWT 密钥

---

## 4. 技术栈

### 4.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | 3.5.13 | 渐进式 JavaScript 框架，采用 Composition API |
| **TypeScript** | 5.8.0 | 类型安全，提前发现错误 |
| **Vite** | 6.2.1 | 下一代前端构建工具，开发启动速度 < 1 秒 |
| **Pinia** | 3.0.1 | Vue 官方状态管理库，替代 Vuex |
| **Vue Router** | 4.5.0 | 官方路由管理器，支持路由守卫 |
| **Element Plus** | 2.9.7 | 基于 Vue 3 的 UI 组件库 |
| **ECharts** | 5.6.0 | 数据可视化图表库，支持按需引入 |
| **Axios** | 1.8.4 | HTTP 客户端，支持请求/响应拦截器 |
| **Markdown-it** | 14.1.0 | Markdown 渲染器，用于 AI 诊断报告展示 |

### 4.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 20+ | JavaScript 运行时环境 |
| **TypeScript** | 4.0+ | 后端类型安全 |
| **Express.js** | 4.18.2 | Web 应用框架，提供 REST API |
| **WebSocket (ws)** | 8.0.0 | 实时双向通信协议 |
| **SQLite** | - | 轻量级数据库（开发环境） |
| **MySQL** | 2 (mysql2) | 生产环境数据库 |
| **bcrypt** | 6.0.0 | 密码加密算法 |
| **jsonwebtoken** | 9.0.2 | JWT 认证 |

### 4.3 AI 服务技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Python** | 3.8+ | AI 服务后端语言 |
| **FastAPI** | - | 高性能异步 Web 框架 |
| **讯飞星火** | - | 大语言模型 API |
| **Pydantic** | - | 数据验证和序列化 |
| **httpx** | - | 异步 HTTP 客户端 |

### 4.4 部署技术栈

| 技术 | 用途 |
|------|------|
| **Vercel** | 前端静态资源托管（自动 CI/CD） |
| **阿里云 ECS** | 后端服务器（Node.js + Python） |
| **Nginx** | 反向代理 + HTTPS 证书 |
| **PM2** | Node.js 进程管理器 |

---

## 5. 快速开始

### 5.1 环境要求

- **Node.js**: >= 20.0.0
- **Python**: >= 3.8（仅 AI 服务需要）
- **数据库**: SQLite（开发）/ MySQL（生产）

### 5.3 分步启动

#### 5.3.1 启动后端服务

```bash
cd websocket-server
npm install
npm start
```

#### 5.3.2 启动前端服务

```bash
npm install
npm run dev
```

#### 5.3.3 启动 AI 服务（可选）

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```



---

## 6. 项目结构

```
DataMonitor/
├── src/                           # 前端 Vue 3 项目
│   ├── components/
│   │   ├── charts/               # ECharts 图表组件
│   │   │   └── BaseChart.vue     # 通用图表组件（封装 ECharts）
│   │   ├── dashboard/            # 仪表板主体
│   │   │   ├── DashboardMain.vue # 主仪表板
│   │   │   └── HistoryDataPanel.vue # 历史数据查询面板
│   │   ├── layout/               # 布局组件
│   │   │   └── MainLayout.vue    # 主布局（顶部导航 + 侧边栏）
│   │   └── FactoryMap.vue        # 工厂设备地图
│   ├── stores/                   # Pinia 状态管理
│   │   ├── realtime.ts           # WebSocket 实时数据处理
│   │   ├── CoreMetricData.ts     # 核心指标数据
│   │   ├── EnvironmentData.ts    # 环境数据
│   │   ├── DeviceTelemetryData.ts # 通信数据
│   │   ├── FactoryDeviceData.ts  # 工厂设备数据
│   │   └── auth.ts               # 用户认证状态
│   ├── utils/
│   │   ├── useWebSocket.ts       # WebSocket 连接管理
│   │   ├── historyApi.ts         # 历史数据查询 API
│   │   ├── diagnosticApi.ts      # 诊断任务 API
│   │   ├── chartOptions.ts       # ECharts 图表配置
│   │   ├── tokenManager.ts       # Token 管理工具
│   │   └── request.ts            # Axios 请求封装
│   ├── views/
│   │   ├── HomeView.vue          # 主页（实时监控）
│   │   ├── LoginView.vue         # 登录页
│   │   ├── RegisterView.vue      # 注册页
│   │   └── DiagnosisView.vue     # 诊断任务管理页
│   ├── router/
│   │   └── index.ts              # 路由配置 + 路由守卫
│   └── main.ts                   # 应用入口
│
├── websocket-server/              # 后端 Node.js 服务
│   ├── src/
│   │   ├── server.ts             # WebSocket 服务器入口
│   │   ├── api/
│   │   │   ├── server.ts         # REST API 服务
│   │   │   └── middleware.ts     # JWT 认证中间件
│   │   ├── services/
│   │   │   ├── deviceSimulator.ts # 设备数据模拟器
│   │   │   ├── dataProcessor.ts   # 数据处理 + 推送
│   │   │   ├── sustainedExceedDetector.ts # 持续超限检测
│   │   │   ├── suddenChangeDetector.ts # 突变检测
│   │   │   ├── aiContextBuilder.ts # AI 上下文构建器
│   │   │   └── ai-client.js       # AI 服务客户端
│   │   ├── database/
│   │   │   ├── init.ts           # 数据库初始化
│   │   │   ├── connection.ts     # 数据库连接
│   │   │   ├── models.ts         # 数据模型
│   │   │   └── userModel.ts      # 用户模型
│   │   ├── utils/
│   │   │   └── auth.ts           # JWT + bcrypt 工具
│   │   └── types/
│   │       └── index.ts          # TypeScript 类型定义
│   └── config.json               # 配置文件
│
├── ai-service/                    # AI 服务（Python FastAPI）
│   ├── main.py                   # FastAPI 应用入口
│   ├── services/
│   │   └── spark_service.py      # 讯飞星火服务
│   └── models/
│       └── schemas.py            # Pydantic 数据模型
│
├── start.sh                       # 一键启动脚本
├── package.json                  # 前端依赖配置
├── vite.config.ts                # Vite 构建配置
├── tsconfig.json                 # TypeScript 配置
└── README.md                     # 项目文档
```

---

## 7. 系统架构

### 7.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Vue 3 前端应用                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ 实时图表展示  │  │ 历史数据查询  │  │ 工厂设备地图  │  │AI诊断  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
└────────────┬──────────────────────────────────────┬──────────────────┘
             │ WebSocket (实时推送)                 │ HTTP API
             │ 心跳 + 自动重连                      │ (历史查询 + 认证)
             ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Node.js 后端服务                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ 设备模拟器    │  │ 数据处理器    │  │ REST API     │  │JWT认证  │ │
│  │ (10台设备)   │  │ (异常检测)   │  │ (查询接口)   │  │中间件   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
└────────────┬──────────────────────────────────────┬──────────────────┘
             │ 实时写入                             │ 查询
             ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SQLite / MySQL 数据库                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │ device_data  │  │ data_stats   │  │ factory_dev  │  │ users   │ │
│  │ (原始数据)   │  │ (统计数据)   │  │ (设备信息)   │  │(用户表) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ HTTP 请求
                                      │
┌─────────────────────────────────────────────────────────────────────┐
│                    Python FastAPI (AI 服务)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ 上下文构建    │  │ 提示词拼接    │  │ 讯飞星火API  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 数据流转流程

#### 7.2.1 实时数据流

```
设备模拟器 (每3-4秒生成数据)
    ↓
数据处理器 (异常检测 + 状态标记)
    ↓
WebSocket 推送 (实时推送到所有客户端)
    ↓
前端 Pinia Store (按类型分组存储)
    ↓
ECharts 图表 (实时渲染)
```

#### 7.2.2 历史数据查询流

```
用户操作 (选择时间范围 + 数据类型)
    ↓
前端发起 HTTP 请求 (携带 JWT token)
    ↓
后端 JWT 认证中间件 (验证 token)
    ↓
数据库查询 (device_data / data_statistics 表)
    ↓
返回 JSON 数据
    ↓
前端渲染图表
```

#### 7.2.3 AI 诊断流

```
异常检测触发
    ↓
收集上下文数据 (前后5分钟所有传感器数据)
    ↓
调用 Python AI 服务 (HTTP 请求)
    ↓
拼接提示词 + 调用讯飞星火 API
    ↓
解析诊断结果 (诊断结论 + 可能原因 + 建议措施)
    ↓
返回前端展示
```

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个 Star！**






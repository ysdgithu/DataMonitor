# DataMonitor

DataMonitor 是一个基于 Vue 3 + Node.js 的实时数据监控平台，集成了 WebSocket 实时推送和数据库持久化存储功能。系统支持实时监控、历史数据分析、异常检测等功能，适合 IoT 场景下的数据监控和分析需求。

## 🚀 核心特性

- **实时监控**：WebSocket 实时数据推送，延迟 < 10ms
- **数据持久化**：SQLite 数据库存储，支持历史数据查询
- **异常检测**：自动检测异常数据并分级标记（正常/警告/错误）
- **历史分析**：可视化历史数据趋势，支持多种时间范围查询
- **高性能**：异步数据写入，支持高并发场景（50000+ 设备）
- **易部署**：一键启动脚本，零配置数据库

## 📊 功能模块

### 实时监控
- **核心指标**：CPU 使用率、内存占用、网络延迟、设备在线率
- **环境数据**：温度、湿度等传感器数据（高频更新）
- **设备状态**：设备在线状态、电池电量、地理位置
- **通信数据**：数据上传频率、网络质量等

### 历史数据分析
- **时间范围查询**：1小时、6小时、12小时、24小时、3天、7天
- **数据类型筛选**：按设备ID、数据类型、状态等条件查询
- **可视化展示**：ECharts 趋势图表、数据表格展示
- **异常数据标记**：自动识别并标记异常数据点

### 数据管理
- **实时存储**：数据自动存储到 SQLite 数据库
- **API 接口**：RESTful API 支持历史数据查询
- **数据统计**：数据概览、统计分析、异常汇总
- **性能优化**：批量写入、异步处理、索引优化

## 🛠 技术栈

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
```
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

## 📁 项目结构

```
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

## 🚀 快速开始

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

### 访问地址
- **前端界面**：http://localhost:5173
- **API接口**：http://localhost:3002
- **WebSocket**：ws://localhost:8080

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

## 🛠 开发环境

### 推荐工具
- **编辑器**：[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- **Node.js**：16.0.0 或更高版本
- **包管理器**：npm 或 yarn

### 主要脚本
```bash
# 前端开发
npm run dev              # 启动开发服务器
npm run build            # 生产环境打包
npm run lint             # 代码风格检查
npm run type-check       # TypeScript类型检查

# 后端开发
cd websocket-server
npm start                # 启动WebSocket和API服务器
npm run init-db          # 初始化数据库
```

## 📊 数据格式说明

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

### 数据状态说明
- **normal**：正常数据
- **warning**：警告状态（如CPU > 90%）
- **error**：错误状态（如CPU > 95%）

## 🔧 配置说明

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

## ❓ 常见问题

### 启动问题
**Q: 端口被占用怎么办？**
A: 修改 `websocket-server/config.json` 中的端口配置，或关闭占用端口的程序。

**Q: 数据库初始化失败？**
A: 确保有写入权限，手动运行 `cd websocket-server && npm run init-db`。

**Q: WebSocket连接失败？**
A: 检查防火墙设置，确保8080端口可访问。

### 开发问题
**Q: TypeScript类型报错？**
A: 确保安装了Volar插件，禁用Vetur插件。

**Q: 历史数据查询无结果？**
A: 确保后端服务正常运行，检查API连接状态。

**Q: 图表不显示？**
A: 检查浏览器控制台错误，确保ECharts正确加载。

## 📈 性能指标

- **实时延迟**：< 10ms
- **支持设备数**：正常模式100台，高并发模式50000台
- **数据库写入**：批量优化，不阻塞实时推送
- **内存使用**：< 500MB
- **并发连接**：支持多客户端同时连接

## 📚 相关文档

- [数据库集成详细说明](README_DATABASE_INTEGRATION.md)
- [技术实现文档](TECHNICAL_DOCUMENTATION.md)
- [WebSocket服务器说明](websocket-server/README.md)
- [原有数据模拟说明](db/Readme.md)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 添加适当的注释和文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🎯 项目亮点

- ✅ **实时性与持久化并存**：创新的异步架构设计
- ✅ **高性能优化**：支持高并发场景，性能表现优异
- ✅ **易于部署**：一键启动脚本，零配置数据库
- ✅ **可扩展性**：支持从SQLite升级到PostgreSQL
- ✅ **完整的监控方案**：实时监控 + 历史分析 + 异常检测

适合作为学习项目、毕业设计或实际生产环境的监控系统基础框架。

# DataMonitor

DataMonitor 是一个基于 Vue 3 + Vite 的数据监控平台，支持核心指标可视化、历史数据查询、设备树管理，并集成了 WebSocket 实时数据推送模拟服务，适合 IoT 场景下的前后端开发与测试。

## 功能特性

- 实时监控 CPU、内存、延迟等核心指标
- 历史数据查询与筛选（支持时间范围、类型等多条件）
- 设备类型统计与活跃设备展示
- 设备树结构管理
- WebSocket 实时数据推送（模拟 IoT 设备）
- 前端组件化开发，支持暗黑/明亮主题切换
- 支持本地数据模拟（json-server）

## 技术栈
**后端：**
- 语言：Node.js (18+)
- WebSocket库：ws
- 模拟数据库：JSON文件 + Lodash（内存存储）
- 部署：Vercel Serverless Functions (免费方案)

## 目录结构

```
DataMonitor/
├── db/                  # 本地数据模拟与生成脚本
│   ├── db.json
│   ├── generate-data.js
│   ├── json-server.json
│   ├── routes.json
│   └── Readme.md
├── public/              # 静态资源
├── src/                 # 前端源码
│   ├── App.vue
│   ├── main.ts
│   ├── assets/
│   ├── components/
│   ├── router/
│   ├── stores/
│   ├── utils/
│   └── views/
├── websocket-server/    # WebSocket 服务器（Node.js，IoT 数据模拟）
│   ├── src/
│   ├── package.json
│   └── README.md
├── package.json
├── README.md
├── tsconfig*.json
├── vite.config.ts
└── ...
```

## 快速开始

### 1. 安装依赖

```sh
npm install
```

### 2. 启动前端开发服务器

```sh
npm run dev
```

### 3. 启动本地数据模拟（json-server）

```sh
cd db
npm install json-server
npm run generate-data   # 生成测试数据
npx json-server --watch db.json --routes routes.json --config json-server.json
```

详细接口说明见 [db/Readme.md](db/Readme.md)。

### 4. 启动 WebSocket 服务器（可选）

```sh
cd websocket-server
npm install
npm start
```

WebSocket 服务器说明详见 [websocket-server/README.md](websocket-server/README.md)。

## 推荐开发环境

- [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- 建议禁用 Vetur，使用 Volar 以获得更好的 TypeScript 支持

## 主要脚本

- `npm run dev`：本地开发热更新
- `npm run build`：生产环境打包
- `npm run lint`：代码风格检查
- `npm run type-check`：类型检查（需全局安装 vue-tsc）

## 数据模拟与接口

- 通过 [db/generate-data.js](db/generate-data.js) 生成大批量测试数据
- 支持多种查询、筛选、排序，详见 [db/Readme.md](db/Readme.md)

## WebSocket 实时数据

- WebSocket 服务端位于 [websocket-server/](websocket-server/README.md)
- 支持模拟设备数据（如温度、湿度），每秒推送一条
- 数据格式示例：

  ```json
  {
    "type": "temperature",
    "value": 25.6,
    "timestamp": 1620000000
  }
  ```

- 可用 [websocketking.com](https://websocketking.com/) 等工具测试

## 常见问题

- **端口冲突**：如 3000 端口被占用，请在 `json-server.json` 或 `vite.config.ts` 中修改端口
- **类型报错**：请确保 VSCode 已安装 Volar 插件
- **数据未刷新**：请检查 json-server 或 websocket-server 是否正常运行

## 贡献

欢迎提交 Issue、建议或 Pull Request！

---

如需详细说明，请参考各子目录下的 README 文件：

-

# websocket-server 项目文档

该项目是一个基于 Node.js 的 WebSocket 服务器，旨在模拟 IoT 设备数据（如温度、湿度），并按固定频率推送数据。

## 功能

- 创建 WebSocket 服务器，处理客户端连接和消息。
- 模拟 IoT 设备数据，按每秒 1 条的频率推送。
- 数据格式为 JSON，包含以下字段：
  - `type`: 数据类型（如 "temperature"）
  - `value`: 数据值（如 25.6）
  - `timestamp`: 时间戳

## 文件结构

```
websocket-server
├── src
│   ├── server.ts          # 应用程序入口点
│   ├── models
│   │   └── device.ts      # 设备模型定义
│   ├── services
│   │   └── deviceSimulator.ts # 设备数据模拟器
│   └── types
│       └── index.ts       # 类型定义
├── package.json            # npm 配置文件
├── tsconfig.json           # TypeScript 配置文件
└── README.md               # 项目文档
```

## 使用方法

1. 克隆项目到本地。
2. 运行 `npm install` 安装依赖。
3. 运行 `npm start` 启动 WebSocket 服务器。
4. 测试网址：https://websocketking.com/

## 贡献

欢迎提出问题和建议，或提交 Pull Request。
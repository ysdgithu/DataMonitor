# 工业设备智能运维平台 - API 服务器

基于 **Node.js + Express + Sequelize + Socket.io** 的后端服务。

## 功能特性

- ✅ **Sequelize ORM**：为 5 张核心表提供完整的模型定义
- ✅ **JWT 身份认证**：登录接口、Token 生成与验证、密码加密
- ✅ **Socket.io WebSocket**：实时双向通信，支持设备数据推送
- ✅ **统一响应格式**：标准 API 响应结构 `{ code, message, data }`
- ✅ **全局错误处理**：捕获异常，返回统一错误格式

## 项目结构

```
server/
├── src/
│   ├── app.ts                    # 服务器入口
│   ├── sequelize/
│   │   ├── config.ts             # Sequelize 配置
│   │   └── models/
│   │       ├── index.ts          # 模型统一导出
│   │       ├── SysRole.ts        # 角色表模型
│   │       ├── SysUser.ts        # 用户表模型
│   │       ├── DeviceType.ts     # 设备类型表模型
│   │       ├── KnowledgeBase.ts  # 知识库表模型
│   │       └── AlarmRule.ts      # 告警规则表模型
│   ├── middleware/
│   │   ├── jwt.ts                # JWT 认证中间件
│   │   └── errorHandler.ts       # 全局错误处理
│   ├── routes/
│   │   ├── index.ts              # 路由统一导出
│   │   └── auth.ts               # 认证相关路由
│   ├── services/
│   │   └── socketService.ts      # Socket.io 服务
│   ├── utils/
│   │   ├── jwt.ts                # JWT 工具函数
│   │   └── response.ts           # 统一响应格式
│   └── test/
│       └── dbTest.ts             # 数据库测试脚本
├── public/
│   └── socket-test.html          # WebSocket 测试页面
├── package.json
└── tsconfig.json
```

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置数据库

创建 `config.json` 文件：

```json
{
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your_password",
    "database": "industrial_iomp"
}
```

### 3. 启动服务器

```bash
npm run dev
```

访问地址：
- API: http://localhost:3000/api/health
- WebSocket 测试: http://localhost:3000/socket-test.html

## API 接口

### 认证接口

| 接口 | 方法 | 描述 | 需要认证 |
|------|------|------|----------|
| `/api/health` | GET | 健康检查 | 否 |
| `/api/auth/login` | POST | 用户登录 | 否 |
| `/api/auth/register` | POST | 用户注册 | 否 |
| `/api/auth/profile` | GET | 获取当前用户信息 | 是 |
| `/api/auth/change-password` | POST | 修改密码 | 是 |

### 请求/响应示例

**登录**
```bash
POST /api/auth/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

**响应**
```json
{
    "code": 200,
    "message": "登录成功",
    "data": {
        "user": { "id": 1, "username": "admin", ... },
        "token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

## WebSocket 事件

### 客户端发送

| 事件名 | 描述 | 数据 |
|--------|------|------|
| `ping` | 心跳检测 | `{ timestamp }` |
| `subscribe:device` | 订阅设备数据 | `deviceId` |
| `subscribe:alarm` | 订阅告警 | - |
| `message` | 发送消息 | 任意 |

### 服务器发送

| 事件名 | 描述 | 数据 |
|--------|------|------|
| `connected` | 连接确认 | `{ socketId, user }` |
| `pong` | 心跳响应 | `{ timestamp }` |
| `device:data` | 设备实时数据 | `{ deviceId, data, timestamp }` |
| `alarm:new` | 新告警 | 告警对象 |

## 数据库测试

```bash
npm run test:db
```

## 技术栈

- Node.js 20+
- TypeScript 4.0+
- Express.js
- Sequelize + sequelize-typescript
- MySQL 8.x
- Socket.io
- jsonwebtoken
- bcryptjs

# MySQL 快速开始指南

本项目已从 SQLite 迁移到 MySQL。本指南将帮助你快速配置和启动项目。

## 前置要求

- Node.js >= 16.0.0
- MySQL >= 5.7（推荐 8.0+）
- npm 或 yarn

## 快速开始（5分钟）

### 1. 配置 MySQL 连接

编辑 `websocket-server/config.json`，修改数据库配置：

```json
{
  "database": {
    "type": "mysql",
    "host": "your_mysql_host",      // 修改为你的 MySQL 主机
    "port": 3306,                    // 修改为你的 MySQL 端口
    "user": "your_mysql_user",       // 修改为你的 MySQL 用户名
    "password": "your_password",     // 修改为你的 MySQL 密码
    "database": "monitor_db"         // 修改为你的数据库名称
  }
}
```

**本地开发示例**:
```json
{
  "database": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "root",
    "database": "monitor_db"
  }
}
```

**云服务器示例**:
```json
{
  "database": {
    "type": "mysql",
    "host": "your.mysql.server.com",
    "port": 3306,
    "user": "monitor_user",
    "password": "secure_password",
    "database": "monitor_db"
  }
}
```

### 2. 安装依赖

```bash
cd websocket-server
npm install
```

### 3. 初始化数据库

```bash
npm run init-db
```

这个命令会：
- 自动创建数据库（如果不存在）
- 创建所需的表
- 创建性能优化索引

### 4. 启动服务

```bash
npm start
```

或使用启动脚本：
```bash
./start.sh
```

### 5. 验证服务

打开浏览器访问：
- 前端: http://localhost:5173
- API: http://localhost:3002
- WebSocket: ws://localhost:8080

## 常见配置场景

### 场景 1: 本地开发（MySQL 在本地）

```json
{
  "database": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "root",
    "database": "monitor_db"
  }
}
```

### 场景 2: 云服务器部署

```json
{
  "database": {
    "type": "mysql",
    "host": "your-cloud-mysql-host",
    "port": 3306,
    "user": "cloud_user",
    "password": "cloud_password",
    "database": "monitor_db"
  }
}
```

### 场景 3: Docker 容器

```json
{
  "database": {
    "type": "mysql",
    "host": "mysql-container",
    "port": 3306,
    "user": "root",
    "password": "root",
    "database": "monitor_db"
  }
}
```

## 自动化设置（Linux/Mac）

如果你在 Linux 或 Mac 上，可以使用自动化脚本：

```bash
cd websocket-server
chmod +x setup-mysql.sh
./setup-mysql.sh
```

这个脚本会：
- 检查 MySQL 是否安装
- 提示输入 MySQL 连接信息
- 自动创建数据库和用户
- 更新配置文件
- 测试连接

## 故障排除

### 问题 1: 连接被拒绝

**症状**: `Error: connect ECONNREFUSED`

**解决方案**:
1. 检查 MySQL 服务是否运行
2. 检查主机地址和端口是否正确
3. 检查防火墙设置

```bash
# 测试 MySQL 连接
mysql -h your_host -P 3306 -u your_user -p
```

### 问题 2: 认证失败

**症状**: `Error: Access denied for user`

**解决方案**:
1. 检查用户名和密码是否正确
2. 检查用户是否有访问权限

```bash
# 使用 root 用户测试
mysql -h localhost -u root -p
```

### 问题 3: 数据库初始化失败

**症状**: `Error: Database initialization failed`

**解决方案**:
1. 检查用户权限（需要 CREATE DATABASE 权限）
2. 查看初始化脚本的错误日志
3. 手动创建数据库

```bash
# 手动创建数据库
mysql -u root -p -e "CREATE DATABASE monitor_db CHARACTER SET utf8mb4;"
```

### 问题 4: 连接超时

**症状**: `Error: connect ETIMEDOUT`

**解决方案**:
1. 检查网络连接
2. 检查防火墙是否阻止了 MySQL 端口
3. 增加连接超时时间

## 性能优化

### 连接池配置

编辑 `config.json` 中的连接池设置：

```json
{
  "database": {
    "options": {
      "connectionLimit": 10,      // 最大连接数
      "waitForConnections": true, // 等待可用连接
      "queueLimit": 0             // 队列限制（0=无限）
    }
  }
}
```

**建议值**:
- 开发环境: `connectionLimit: 5`
- 生产环境: `connectionLimit: 20-50`

### 查询优化

已创建的索引：
- `idx_device_data_device_type_time` - 设备ID、数据类型、时间戳
- `idx_device_data_type_time` - 数据类型、时间戳
- `idx_device_data_status` - 数据状态
- `idx_statistics_date_type` - 日期、数据类型

## 数据备份

### 备份数据库

```bash
mysqldump -h your_host -u your_user -p your_database > backup.sql
```

### 恢复数据库

```bash
mysql -h your_host -u your_user -p your_database < backup.sql
```

## 监控和日志

### 查看应用日志

```bash
npm start 2>&1 | tee app.log
```

### 查看 MySQL 慢查询

```bash
# 启用慢查询日志
mysql -u root -p -e "SET GLOBAL slow_query_log = 'ON';"
mysql -u root -p -e "SET GLOBAL long_query_time = 2;"
```

## 回滚到 SQLite

如果需要回滚到 SQLite，请参考 `MIGRATION_GUIDE.md` 中的回滚方案。

## 获取帮助

- 查看 `MIGRATION_GUIDE.md` - 详细迁移指南
- 查看 `MIGRATION_CHECKLIST.md` - 完整检查清单
- 查看 `config.mysql.example.json` - 配置示例

## 下一步

1. ✅ 配置 MySQL 连接
2. ✅ 安装依赖
3. ✅ 初始化数据库
4. ✅ 启动服务
5. 📊 监控数据流
6. 🔧 根据需要调整配置
7. 📈 优化性能

祝你使用愉快！


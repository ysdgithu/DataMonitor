# MySQL 数据库迁移 - 部署说明

## 📋 迁移完成状态

✅ **代码迁移已完成** - 所有文件已更新，项目已准备好部署到云服务器

## 🚀 部署前检查清单

在部署到云服务器前，请确保：

- [ ] 云服务器已安装 MySQL 5.7 或更高版本
- [ ] MySQL 服务正在运行
- [ ] 已获取 MySQL 连接信息（主机、端口、用户名、密码）
- [ ] Node.js >= 16.0.0 已安装在云服务器上
- [ ] 项目代码已上传到云服务器

## 📝 部署步骤

### 第1步：配置 MySQL 连接

在云服务器上编辑 `websocket-server/config.json`：

```bash
cd /path/to/DataMonitor/websocket-server
nano config.json
```

修改数据库配置部分：

```json
{
  "database": {
    "type": "mysql",
    "host": "your_mysql_host",      // 云服务器 MySQL 地址
    "port": 3306,                    // MySQL 端口
    "user": "your_mysql_user",       // MySQL 用户名
    "password": "your_password",     // MySQL 密码
    "database": "monitor_db"         // 数据库名称
  }
}
```

**示例配置**（根据实际情况修改）：
```json
{
  "database": {
    "type": "mysql",
    "host": "192.168.1.100",
    "port": 3306,
    "user": "monitor_user",
    "password": "secure_password_123",
    "database": "monitor_db"
  }
}
```

### 第2步：安装依赖

```bash
cd websocket-server
npm install
```

这会安装所有必要的依赖，包括 `mysql2`。

### 第3步：初始化数据库

```bash
npm run init-db
```

这个命令会：
- 连接到 MySQL 服务器
- 创建数据库（如果不存在）
- 创建所需的表
- 创建性能优化索引

**预期输出**：
```
开始初始化 MySQL 数据库...
创建数据库: monitor_db
创建 device_data 表...
创建 data_statistics 表...
数据表创建完成，开始创建索引...
索引创建成功: CREATE INDEX IF NOT EXISTS idx_device_data_device_type_time...
MySQL 数据库初始化完成！
数据库连接: your_mysql_host:3306/monitor_db
```

### 第4步：启动后端服务

```bash
npm start
```

或使用 PM2 进行后台运行（推荐用于生产环境）：

```bash
npm install -g pm2
pm2 start src/server.ts --name "datamonitor-backend"
pm2 save
pm2 startup
```

### 第5步：验证服务

检查后端服务是否正常运行：

```bash
# 检查 WebSocket 服务
curl http://localhost:8080

# 检查 API 服务
curl http://localhost:3002/health

# 查看日志
pm2 logs datamonitor-backend
```

## 🔧 故障排除

### 问题 1: MySQL 连接失败

**错误信息**: `Error: connect ECONNREFUSED`

**解决步骤**:
1. 检查 MySQL 服务状态
   ```bash
   systemctl status mysql
   # 或
   service mysql status
   ```

2. 测试 MySQL 连接
   ```bash
   mysql -h your_host -P 3306 -u your_user -p
   ```

3. 检查防火墙
   ```bash
   # 允许 MySQL 端口
   sudo ufw allow 3306/tcp
   ```

### 问题 2: 认证失败

**错误信息**: `Error: Access denied for user`

**解决步骤**:
1. 验证用户名和密码
2. 检查用户权限
   ```bash
   mysql -u root -p
   SHOW GRANTS FOR 'your_user'@'%';
   ```

3. 重新创建用户（如需要）
   ```bash
   CREATE USER 'monitor_user'@'%' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON monitor_db.* TO 'monitor_user'@'%';
   FLUSH PRIVILEGES;
   ```

### 问题 3: 初始化失败

**错误信息**: `Error: Database initialization failed`

**解决步骤**:
1. 检查用户权限（需要 CREATE DATABASE 权限）
2. 查看详细错误日志
3. 手动创建数据库
   ```bash
   mysql -u root -p -e "CREATE DATABASE monitor_db CHARACTER SET utf8mb4;"
   ```

### 问题 4: 端口被占用

**错误信息**: `Error: listen EADDRINUSE`

**解决步骤**:
1. 检查占用的进程
   ```bash
   lsof -i :8080
   lsof -i :3002
   ```

2. 修改配置文件中的端口
   ```json
   {
     "server": {
       "websocket": {
         "port": 8081
       },
       "api": {
         "port": 3003
       }
     }
   }
   ```

## 📊 性能优化

### 连接池配置

根据并发需求调整 `config.json` 中的连接池设置：

```json
{
  "database": {
    "options": {
      "connectionLimit": 20,      // 增加连接数
      "waitForConnections": true,
      "queueLimit": 0
    }
  }
}
```

**建议值**:
- 低并发（< 100 设备）: `connectionLimit: 5-10`
- 中并发（100-1000 设备）: `connectionLimit: 10-20`
- 高并发（> 1000 设备）: `connectionLimit: 20-50`

### 数据库优化

1. 启用查询缓存
   ```sql
   SET GLOBAL query_cache_type = 1;
   SET GLOBAL query_cache_size = 268435456;
   ```

2. 调整 InnoDB 缓冲池
   ```sql
   SET GLOBAL innodb_buffer_pool_size = 1073741824;
   ```

## 🔐 安全建议

1. **修改默认密码**
   ```bash
   mysql -u root -p
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
   ```

2. **限制用户访问**
   ```sql
   CREATE USER 'monitor_user'@'192.168.1.0/255.255.255.0' IDENTIFIED BY 'password';
   ```

3. **启用 SSL 连接**
   ```json
   {
     "database": {
       "options": {
         "ssl": "Amazon RDS"
       }
     }
   }
   ```

## 📈 监控和维护

### 定期备份

```bash
# 每天备份
0 2 * * * mysqldump -u root -p password monitor_db > /backup/monitor_db_$(date +\%Y\%m\%d).sql
```

### 监控数据库

```bash
# 查看连接数
mysql -u root -p -e "SHOW PROCESSLIST;"

# 查看表大小
mysql -u root -p -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.tables WHERE table_schema = 'monitor_db';"
```

## 📚 相关文档

- `MIGRATION_GUIDE.md` - 详细迁移指南
- `MYSQL_QUICKSTART.md` - 快速开始指南
- `MIGRATION_CHECKLIST.md` - 完整检查清单
- `config.mysql.example.json` - 配置示例

## ✅ 部署完成

部署完成后，请验证：

- [ ] MySQL 数据库已创建
- [ ] 表和索引已创建
- [ ] 后端服务正在运行
- [ ] WebSocket 连接正常
- [ ] API 服务正常
- [ ] 数据正确写入数据库
- [ ] 前端能正常连接

## 🆘 获取帮助

如遇到问题，请：

1. 查看应用日志
   ```bash
   pm2 logs datamonitor-backend
   ```

2. 查看 MySQL 日志
   ```bash
   tail -f /var/log/mysql/error.log
   ```

3. 参考故障排除部分
4. 检查相关文档

---

**部署日期**: _______________
**部署人员**: _______________
**部署环境**: _______________


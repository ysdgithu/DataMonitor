# DataMonitor 后端服务

## 配置及说明

### JWT 密钥配置

在生产环境中，应该通过环境变量设置 JWT 密钥：

```bash
export JWT_SECRET="your-secure-secret-key"
export JWT_EXPIRY="24h"
```

**文件**: `websocket-server/src/utils/auth.ts`

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

### 异常判定机制

```js
// 分级异常判定阈值
const THRESHOLDS = {
    cpu: { warning: 90, error: 95 },
    memory: { warning: 90, error: 95 },
    network: { warning: 150, error: 180 },
    online: { warning: 60, error: 30 }, // 修正属性名
    temperature: { warning: 35, error: 40 },
    upload_frequency: { warning: 80, error: 100 }
};
```
---
## 数据表

1. 设备数据总表 (device_data)
设备数据的统一存储表，采用通用结构设计，通过 data_type 区分不同类型的数据，payload 字段使用 JSON 格式存储具体数据。

```sql
CREATE TABLE IF NOT EXISTS device_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
    device_id VARCHAR(50) NOT NULL,          -- 设备唯一标识
    data_type VARCHAR(30) NOT NULL,          -- 数据类型：标识发的啥数据
    timestamp BIGINT NOT NULL,               -- 数据采集时间戳
    data_status VARCHAR(10) DEFAULT 'normal',-- 数据状态：normal/warning/error
    payload TEXT NOT NULL,                   -- JSON格式数据
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录创建时间
)
```
`payload TEXT NOT NULL` ：
不管是什么data_type，具体数据都打包成 JSON 字符串，存到payload里。表结构不用变，新增设备类型也不用改表。
比如：
温度传感器的数据，payload可以是：{"value": 25.6, "unit": "℃"}
湿度传感器的数据，payload可以是：{"value": 60, "precision": "high"}
智能门锁的数据，payload可以是：{"status": "open", "operator": "张三"}
新增的光照传感器，payload直接存：{"intensity": 3000, "freq": "10s"}

2. 数据统计表 (data_statistics)
用于存储各类数据的统计信息，支持按小时粒度的数据分析，便于生成报表和趋势分析。

```sql
CREATE TABLE IF NOT EXISTS data_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
    date DATE NOT NULL,                      -- 统计日期
    hour INTEGER NOT NULL,                   -- 统计小时（0-23）
    data_type VARCHAR(20) NOT NULL,          -- 数据类型，对应device_data的data_type
    category VARCHAR(20),                    -- 数据类别，如core_metrics的cpu/memory等
    avg_value REAL,                          -- 平均值
    max_value REAL,                          -- 最大值
    min_value REAL,                          -- 最小值
    count INTEGER,                           -- 数据点总数
    error_count INTEGER,                     -- 错误状态的数据点数量
    warning_count INTEGER,                   -- 警告状态的数据点数量
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录创建时间
)
```
3. 用户表 (users)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```
密码使用 bcrypt 加密存储
## 接口设计

**JWT token 保护接口**
GET /api/core-metrics
GET /api/environment
GET /api/device-status
GET /api/telemetry
GET /api/factory-devices
GET /api/statistics/:dataType
GET /api/overview

**错误码**
| 错误码 | 说明 |
|--------|------|
| 200 | 成功响应 |
| 401 | 无权限（token失效，密码错误等） |

token签名使用 HS256 算法，过期时间 24 小时

**默认账号密码**
|用户名|密码|角色|
|----|----|----|
|admin	|Admin@123456	|admin
|testuser|	Test@123456	|user

### POST /api/login 用户登录 
**请求示例**:
```bash
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'
```

**成功响应** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@datamonitor.local",
      "role": "admin"
    }
  },
  "message": "登录成功"
}
```

**失败响应** (401):
```json
{
  "success": false,
  "error": "认证失败",
  "message": "用户名或密码错误"
}
```

### POST /api/register 用户注册

**请求示例**:
```bash
curl -X POST http://localhost:3002/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "NewUser@123456",
    "email": "newuser@example.com"
  }'
```

**密码要求**:
- 至少 8 个字符
- 包含大小写字母
- 包含数字

**用户名要求**:
- 3-50 个字符
- 只包含字母、数字、下划线

### GET /api/core-metrics - 获取核心指标数据
#### 调用示例
```bash
# 获取最近1小时的CPU使用率数据
# cpu传感器设备号：000
curl -X GET http://localhost:3002/api/core-metrics \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start | number | 否 | 开始时间戳 |
| end | number | 否 | 结束时间戳 |
| deviceId | string | 否 | 设备ID |
| category | string | 否 | 指标类别(cpu/memory/network/online) |
| limit | number | 否 | 返回数据条数，默认10 |

#### 响应示例
```json
{
  "success": true,
  "data": [{
    "deviceId": "000",
    "timestamp": 1760792891698,
    "category": "online",
    "value": 82.46987950196485,
    "dataStatus": "normal"
  }],
  "total": 1
}
```

### GET /api/environment - 获取环境数据
#### 调用示例
```bash
# 获取最近温度数据
curl -X GET http://localhost:3002/api/environment?type=temperature&limit=5 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MTcyMTg3NiwiZXhwIjoxNzYxODA4Mjc2fQ.pNa4rNkePNwpG9OJIfw5dO7osKJApiYeMAPT4W5-vIE" \
  -H "Content-Type: application/json"
# 获取特定设备24小时内的环境数据
curl "http://localhost:3002/api/environment?deviceId=2001&start=$(date -v-24H +%s000)&end=$(date +%s000)"
```

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start | number | 否 | 开始时间戳 |
| end | number | 否 | 结束时间戳 |
| deviceId | string | 否 | 设备ID |
| type | string | 否 | 环境数据类型(temperature等) |
| limit | number | 否 | 返回数据条数，默认10 |

#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "deviceId": "001",
            "timestamp": 1760792821936,
            "type": "temperature",
            "value": 25.220121381652532,
            "unit": "°C",
            "dataStatus": "normal"
        },
        {
            "deviceId": "001",
            "timestamp": 1760792813905,
            "type": "temperature",
            "value": 24.797518693687664,
            "unit": "°C",
            "dataStatus": "normal"
        },
        {
            "deviceId": "001",
            "timestamp": 1760792805840,
            "type": "temperature",
            "value": 24.228559265319486,
            "unit": "°C",
            "dataStatus": "normal"
        },
        {
            "deviceId": "001",
            "timestamp": 1760792797761,
            "type": "temperature",
            "value": 23.56001933862574,
            "unit": "°C",
            "dataStatus": "normal"
        },
        {
            "deviceId": "001",
            "timestamp": 1760792789704,
            "type": "temperature",
            "value": 26.596649867977504,
            "unit": "°C",
            "dataStatus": "normal"
        }
    ],
    "total": 5,
    "params": {
        "dataType": "temperature",
        "limit": 5,
        "offset": 0
    }
}
```


### GET /api/device-status - 获取设备类型统计

#### 调用示例
```bash
# 获取所有设备状态统计
curl -X GET http://localhost:3002/api/device-status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MTcyMTg3NiwiZXhwIjoxNzYxODA4Mjc2fQ.pNa4rNkePNwpG9OJIfw5dO7osKJApiYeMAPT4W5-vIE" \
  -H "Content-Type: application/json"
# 获取数控机床（typeCode=0）
curl "http://localhost:3002/api/device-status?deviceType=0"

# 获取输送带（typeCode=5）
curl "http://localhost:3002/api/device-status?deviceType=5"
```

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| deviceType | number | 否 | 设备类型 |

|代号|类型|设备id|
|----|----|----|
0	 |数控机床	|1001
1	 |装配线	|1002
2	 |焊接机器人|	1003
3	 |质检设备	|1004
4	 |自动货架	|1005
5	 |输送带	|1006
6	 |环境监控	|1007
7	 |服务器	|1008
8	 |检测设备	|1009
9	 |空压机	|1010

#### 响应示例
```json
{
  "success": true,
  "data": [
    {
      "deviceType": 0,
      "count": 1,
      "deviceIds": ["1001"]
    },
    {
      "deviceType": 1,
      "count": 1,
      "deviceIds": ["1002"]
    }
  ]
}
```

### GET /api/telemetry - 获取通信数据
#### 调用示例
```bash
# 获取最近的通信数据
curl "http://localhost:3002/api/telemetry?limit=5"

# 获取特定设备的上传频率数据
curl "http://localhost:3002/api/telemetry?deviceId=3001&dataType=upload_frequency"
```

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| start | number | 否 | 开始时间戳 |
| end | number | 否 | 结束时间戳 |
| deviceId | string | 否 | 设备ID |
| dataType | string | 否 | 数据类型(upload_frequency等) |
| limit | number | 否 | 返回数据条数，默认10 |

#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "deviceId": "002",
            "timestamp": 1760793194998,
            "dataType": "upload_frequency",
            "value": 70,
            "dataStatus": "normal"
        },
        {
            "deviceId": "002",
            "timestamp": 1760793186969,
            "dataType": "upload_frequency",
            "value": 72,
            "dataStatus": "normal"
        }
    ],
    "total": 2,
    "params": {
        "limit": 2,
        "offset": 0
    }
}
```

### GET /api/statistics/:dataType - 获取统计数据
#### 调用示例
```bash
# 获取今天CPU使用率的统计数据
curl "http://localhost:3002/api/statistics/core_metrics?date&category=cpu"

# 获取特定小时的环境数据统计
curl "http://localhost:3002/api/statistics/environment?date=2025-10-16&hour=14"
```

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dataType | string | 是 | 数据类型(core_metrics/environment/telemetry) |
| date | string | 是 | 统计日期(YYYY-MM-DD) |
| hour | number | 否 | 统计小时(0-23) |
| category | string | 否 | 数据类别 |

#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "data_type": "core_metrics",
            "category": "cpu",
            "total_count": 286,
            "avg_value": 66.4604662559724,
            "max_value": 99.92177730685204,
            "min_value": 30.134591124754333,
            "error_count": 24,
            "warning_count": 24,
            "time_group": "2025-10-18 13:01:48"
        },
        {
            "data_type": "core_metrics",
            "category": "network",
            "total_count": 286,
            "avg_value": 98.6761921073107,
            "max_value": 149.91882991805846,
            "min_value": 51.07191606061501,
            "error_count": 0,
            "warning_count": 0,
            "time_group": "2025-10-18 12:43:50"
        },
        {
            "data_type": "core_metrics",
            "category": "memory",
            "total_count": 286,
            "avg_value": 71.65590975243643,
            "max_value": 99.85599947308398,
            "min_value": 40.13891369654224,
            "error_count": 36,
            "warning_count": 20,
            "time_group": "2025-10-18 12:43:26"
        },
        {
            "data_type": "core_metrics",
            "category": "online",
            "total_count": 286,
            "avg_value": 79.52713299064253,
            "max_value": 99.33892653305689,
            "min_value": 60.02656599701012,
            "error_count": 0,
            "warning_count": 0,
            "time_group": "2025-10-18 12:37:34"
        }
    ],
    "dataType": "core_metrics",
    "hours": 24
}
```
### GET /api/overview - 获取数据概览
#### 调用示例
```bash
# 获取小时级别概览
curl "http://localhost:3002/api/overview?timeRange=hour"

# 获取天级别概览
curl "http://localhost:3002/api/overview?timeRange=day"
```

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| timeRange | string | 否 | 时间范围(hour/day/week/month) |

#### 响应示例


### GET /api/factory-devices - 工厂设备查询
获取工厂内所有设备的实时状态信息。

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| zone | string | 否 | 区域筛选(production/storage/office/testing/maintenance) |
| type | string | 否 | 设备类型筛选 |
| status | string | 否 | 状态筛选(online/offline/warning/error) |
| limit | number | 否 | 返回数据条数，默认10 |
| offset | number | 否 | 数据偏移量，用于分页 |

#### 调用示例
```bash
curl http://localhost:3002/api/factory-devices?limit=2&zone&status
```

#### 响应示例
```json
{
    "success": true,
    "data": [
        {
            "deviceId": "1010",
            "name": "空压机-1",
            "timestamp": 1760793319182,
            "typeCode": 9,
            "type": "空压机",
            "x": 150,
            "y": 400,
            "status": "online",
            "zone": "maintenance",
            "position": "5区1排",
            "parameters": {
                "temperature": 52.4,
                "pressure": 4.5,
                "vibration": 2.3,
                "power": 58
            },
            "dataStatus": "normal"
        },
        {
            "deviceId": "1009",
            "name": "检测设备-1",
            "timestamp": 1760793319182,
            "typeCode": 8,
            "type": "检测设备",
            "x": 700,
            "y": 300,
            "status": "online",
            "zone": "testing",
            "position": "4区1排",
            "parameters": {
                "temperature": 30.9,
                "pressure": 4.2,
                "vibration": 0.9,
                "power": 59
            },
            "dataStatus": "normal"
        }
    ],
    "total": 2,
    "params": {
        "status": "",
        "limit": 2,
        "offset": 0
    }
}
```


## api鉴权处理

1. **实现JWT登录**：增加一个`/api/login`接口，验证用户名密码后返回一个JWT token。
2. **保护接口**：在所有需要认证的API前面，加一个中间件，校验请求头中的`Authorization`里的JWT是否有效。
3. **前端存储Token**：登录后把token存到`localStorage`或`Pinia`里，后续每个请求都在header里带上。

## 密码存储：bcrypt
BCrpyt也是输入的字符串+盐，但是与MD5+盐的主要区别是：每次加的盐不同，导致每次生成的结果也不相同。

## SQLite换成MySQL <a id="sqlite换成mysql" />

在阿里云ECS上装个MySQL，或者用云数据库（RDS）。

把你Node.js项目里连接数据库的配置从SQLite改成MySQL。

表结构基本不用变，直接导入过去就行。

## 智能异常诊断与根因分析
是什么： 在你的监控平台上，当某个设备指标（如CPU使用率）出现异常峰值时，不仅标注出来，还能点击后让AI分析“为什么”。

如何快速实现：
在后端，当检测到异常数据点时，收集前后一段时间内该设备的所有指标数据（如内存、网络、温度等）。
将这些数据、时间戳和指标名称作为上下文，拼接成一个Prompt，调用 OpenAI GPT-4o API 或 DeepSeek免费API。
Prompt示例：“我监控的服务器设备 [设备ID] 在 [时间点] 的 [指标名] 出现了异常峰值 [异常值]。以下是该设备在异常时间点前后5分钟的所有相关指标数据：[数据表格]。请以运维专家的口吻，分析导致此异常最可能的原因，并按可能性降序列出。”

前端产出：
- 温度某时指标添加异常标注
- 点击/光标经过弹窗askai
- 弹窗显示ai分析结果
  
后端产出：
- 在识别到异常数据时（数据处理器），收集前后5min所有传感器指标数据
- 拼接提示词
- 调用大模型
- api返回前端

其他产出：
- 开通合适的llm接入api



# DataMonitor 后端服务

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
## 接口设计

### GET /api/core-metrics - 获取核心指标数据
#### 调用示例
```bash
# 获取最近1小时的CPU使用率数据
# cpu传感器设备号：000
curl "http://localhost:3002/api/core-metrics?category&start&end&limit=5"
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
curl "http://localhost:3002/api/environment?type=temperature&limit=5"

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

curl "http://localhost:3002/api/device-status"
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

## SQLite换成MySQL

在阿里云ECS上装个MySQL，或者用云数据库（RDS）。

把你Node.js项目里连接数据库的配置从SQLite改成MySQL。

表结构基本不用变，直接导入过去就行。



#### 各种想法

2025-10-14
死ai我真无语了，应该就建一张工厂设备总表就行了，剩下的都能从这查然后统计，还能展示性能

模拟器推单个设备数据（一个实例代表一个设备）->异常检测->统计->展示
同时开10个实例然后服务器定时推送10个示例的数据（模拟整个工厂设备的数据上报）
可能存在的问题：
1. 10台太少了真实情况可能有一大堆
2. 推送频率问题，不一定所有设备都是1秒推送，有的可能10秒一次
服务器单次推送数据库写入一次，设备模拟和数据库在同一服务器中 
前端服务器到底跟谁长连接？前端负责把连接数据统计加工并展示 
数据展示流程（实时和非实时）为基础功能！
进阶：报警闭环（需要实现设备报警-处理-恢复的全链路监控）
感觉越做越复杂了，想逝了


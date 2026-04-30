# 工业设备智能运维平台 - API 接口文档

## 服务信息

| 服务 | 端口 | 说明 |
|------|------|------|
| websocket-server | 3002 | 主 API 服务器（Express） |
| ai-service | 8001 | AI 服务（FastAPI） |

---

## 一、认证相关接口

### 1.1 用户登录

**POST /api/login**

用户登录获取 JWT Token。

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名（3-50字符，字母数字下划线） |
| password | string | 是 | 密码（至少8位，包含大小写字母和数字） |


**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data.token | string | JWT Token |
| data.user.id | number | 用户ID |
| data.user.username | string | 用户名 |
| data.user.email | string | 邮箱 |
| data.user.role | string | 角色 |
| message | string | 提示信息 |

**响应示例**
```json
{
    "success":true,
    "data":{
        "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTEyMTA1NCwiZXhwIjoxNzc1MjA3NDU0fQ.TDXlk6F2EwdbuyILV8TLTSjs-B7rHPc2Vz59E3mDG0A",
        "user":{
            "id":1,
            "username":"admin",
            "email":"admin@datamonitor.local",
            "role":"admin"}
        },
    "message":"登录成功"
}

```

**测试代码（curl）**
```bash
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "123456"
  }'
```
测试情况：已测试

---

### 1.2 用户注册

**POST /api/register**

注册新用户。

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| email | string | 否 | 邮箱 |


**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data.token | string | JWT Token |
| data.user | object | 用户信息 |
| message | string | 提示信息 |

**响应示例**
```json
9{"success":true,"data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywidXNlcm5hbWUiOiJ1c2VyZ3hxIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NzUxMjEzMDgsImV4cCI6MTc3NTIwNzcwOH0.sD4Wwvl39EdeGVyAx0lc9zEx1EV8KjahlBwsDsJgNwM","user":{"id":3,"username":"usergxq","email":"user@example.com","role":"user"}},"message":"注册成功"}
```

**测试代码（curl）**
```bash
curl -X POST http://localhost:3002/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "usergxq",
    "password": "Gu123456",
    "email": "user@example.com"
  }'
```
测试情况：已测试

---

## 二、数据查询接口（需要认证）

### 2.1 查询核心指标数据

**GET /api/core-metrics**

查询设备核心指标历史数据。

**请求参数（Query）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| deviceId | string | 否 | 设备ID |
| category | string | 否 | 数据分类 |
| startTime | number | 否 | 开始时间戳 |
| endTime | number | 否 | 结束时间戳 |
| limit | number | 否 | 限制条数（默认100） |
| offset | number | 否 | 偏移量（默认0） |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | array | 核心指标数据列表 |
| total | number | 总数 |
| params | object | 查询参数 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/core-metrics?deviceId=1001&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTEyMTA1NCwiZXhwIjoxNzc1MjA3NDU0fQ.TDXlk6F2EwdbuyILV8TLTSjs-B7rHPc2Vz59E3mDG0A"
```
```json
{"success":true,"data":[],"total":0,"params":{"deviceId":"1001","limit":10,"offset":0}}
```
测试情况：为什么无数据？响应参数加一个用户id吧，标明是谁查的。查询参数就不要了吧

---

### 2.2 查询环境数据

**GET /api/environment**

查询环境传感器数据（温度、湿度等）。

**请求参数（Query）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| deviceId | string | 否 | 设备ID |
| type | string | 否 | 数据类型 |
| startTime | number | 否 | 开始时间戳 |
| endTime | number | 否 | 结束时间戳 |
| limit | number | 否 | 限制条数（默认100） |
| offset | number | 否 | 偏移量（默认0） |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | array | 环境数据列表 |
| total | number | 总数 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/environment?limit=10" \
  -H "Authorization: Bearer <your_token>"
```

---

### 2.3 查询设备状态统计

**GET /api/device-status**

按设备类型统计设备状态分布。

**请求参数（Query）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| deviceType | number | 否 | 设备类型过滤（0-9） |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | array | 设备类型统计列表 |
| data[].deviceType | number | 设备类型代码 |
| data[].count | number | 该类型设备数量 |
| data[].deviceIds | array | 设备ID列表 |

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "deviceType": 1,
      "count": 5,
      "deviceIds": ["1001", "1002", "1003", "1004", "1005"]
    }
  ]
}
```

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/device-status" \
  -H "Authorization: Bearer <your_token>"
```

---

### 2.4 查询通信数据

**GET /api/telemetry**

查询设备通信/遥测数据。

**请求参数（Query）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| deviceId | string | 否 | 设备ID |
| dataType | string | 否 | 数据类型 |
| startTime | number | 否 | 开始时间戳 |
| endTime | number | 否 | 结束时间戳 |
| limit | number | 否 | 限制条数（默认100） |
| offset | number | 否 | 偏移量（默认0） |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | array | 通信数据列表 |
| total | number | 总数 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/telemetry?deviceId=1001&limit=10" \
  -H "Authorization: Bearer <your_token>"
```

---

### 2.5 查询工厂设备数据

**GET /api/factory-devices**

查询工厂设备运行数据。

**请求参数（Query）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| deviceId | string | 否 | 设备ID |
| status | string | 否 | 状态过滤 |
| startTime | number | 否 | 开始时间戳 |
| endTime | number | 否 | 结束时间戳 |
| limit | number | 否 | 限制条数（默认100） |
| offset | number | 否 | 偏移量 |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | array | 工厂设备数据列表 |
| total | number | 总数 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/factory-devices?limit=10" \
  -H "Authorization: Bearer <your_token>"
```

---

### 2.6 获取数据统计信息

**GET /api/statistics/:dataType**

获取指定数据类型的统计信息。

**请求参数（Path）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| dataType | string | 是 | 数据类型（core-metrics/environment/telemetry/factory-devices） |

**请求参数（Query）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| hours | number | 否 | 统计时间范围（小时，默认24） |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | object | 统计数据 |
| dataType | string | 数据类型 |
| hours | number | 统计时长 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/statistics/core-metrics?hours=24" \
  -H "Authorization: Bearer <your_token>"
```

---

### 2.7 获取数据概览

**GET /api/overview**

获取最近1小时内各类数据的概览。

**请求参数**

无

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data.coreMetrics | array | 核心指标数据 |
| data.environment | array | 环境数据 |
| data.deviceStatus | array | 设备状态数据 |
| data.telemetry | array | 通信数据 |
| data.factoryDevices | array | 工厂设备数据 |
| timestamp | number | 当前时间戳 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/overview" \
  -H "Authorization: Bearer <your_token>"
```

---

## 三、诊断任务管理接口（需要认证）

### 3.1 获取诊断任务列表

**GET /api/diagnosis-tasks**

分页查询诊断任务列表。

**请求参数（Query）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码（默认1） |
| pageSize | number | 否 | 每页条数（默认5） |
| status | number | 否 | 状态过滤（0-4） |
| deviceId | string | 否 | 设备ID过滤 |
| assignee | string | 否 | 负责人过滤 |
| priority | number | 否 | 优先级过滤（0低/1中/2高） |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | array | 任务列表 |
| total | number | 总数 |
| page | number | 当前页 |
| pageSize | number | 每页大小 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/diagnosis-tasks?page=1&pageSize=10" \
  -H "Authorization: Bearer <your_token>"
```

---

### 3.2 获取诊断任务详情

**GET /api/diagnosis-tasks/:id**

获取单个诊断任务详情。

**请求参数（Path）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 任务ID |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | object | 任务详情 |
| data.id | number | 任务ID |
| data.name | string | 任务名称 |
| data.deviceId | string | 设备ID |
| data.status | number | 状态（0待处理/1处理中/2已完成/3已关闭/4已取消） |
| data.priority | number | 优先级（0低/1中/2高） |
| data.assignee | string | 负责人 |
| data.detail | string | 详细描述 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/diagnosis-tasks/1" \
  -H "Authorization: Bearer <your_token>"
```

---

### 3.3 创建诊断任务

**POST /api/diagnosis-tasks**

创建新的诊断任务。

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 任务名称 |
| deviceId | string | 是 | 设备ID |
| priority | number | 是 | 优先级（0低/1中/2高） |
| assignee | string | 是 | 负责人 |
| detail | string | 否 | 详细描述 |
| status | number | 否 | 初始状态（默认0） |

**请求示例**
```json
{
  "name": "设备1001温度异常诊断",
  "deviceId": "1001",
  "priority": 2,
  "assignee": "工程师A",
  "detail": "温度超过阈值，需要检查散热系统"
}
```

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data.id | number | 创建的任务ID |
| message | string | 提示信息 |

**测试代码（curl）**
```bash
curl -X POST http://localhost:3002/api/diagnosis-tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "name": "设备1001温度异常诊断",
    "deviceId": "1001",
    "priority": 2,
    "assignee": "工程师A",
    "detail": "温度超过阈值"
  }'
```

---

### 3.4 更新诊断任务

**PUT /api/diagnosis-tasks/:id**

更新诊断任务信息。

**请求参数（Path）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 任务ID |

**请求参数（Body）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 否 | 任务名称 |
| deviceId | string | 否 | 设备ID |
| status | number | 否 | 状态（0-4） |
| priority | number | 否 | 优先级（0-2） |
| detail | string | 否 | 详细描述 |
| assignee | string | 否 | 负责人 |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 提示信息 |

**测试代码（curl）**
```bash
curl -X PUT http://localhost:3002/api/diagnosis-tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "status": 2,
    "priority": 1
  }'
```

---

### 3.5 删除诊断任务

**DELETE /api/diagnosis-tasks/:id**

删除诊断任务。

**请求参数（Path）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 任务ID |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 提示信息 |

**测试代码（curl）**
```bash
curl -X DELETE http://localhost:3002/api/diagnosis-tasks/1 \
  -H "Authorization: Bearer <your_token>"
```

---

### 3.6 获取诊断任务统计

**GET /api/diagnosis-tasks-stats**

获取诊断任务的统计信息。

**请求参数**

无

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data | object | 统计信息 |

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/diagnosis-tasks-stats" \
  -H "Authorization: Bearer <your_token>"
```

---

## 四、监控大屏接口（需要认证）

### 4.1 获取监控大屏数据

**GET /api/dashboard**

获取指定设备的监控大屏数据。

**请求参数（Query）**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| device_id | number | 是 | 设备ID |

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | number | 状态码（200成功） |
| msg | string | 提示信息 |
| data.id | number | 设备ID |
| data.device_name | string | 设备名称 |
| data.device_type | string | 设备类型 |
| data.status | number | 设备状态（0离线/1在线/2故障） |
| data.monitor_data | object | 监控数据（温度、液位、电流、pH等） |
| data.last_update | string | 最后更新时间 |

**响应示例**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 1001,
    "device_name": "1号调配罐",
    "device_type": "调配罐",
    "status": 1,
    "monitor_data": {
      "temp": { "value": 45.5, "unit": "°C", "status": "normal" },
      "level": { "value": 75.0, "unit": "%", "status": "normal" },
      "current": { "value": 8.5, "unit": "A", "status": "normal" },
      "ph": { "value": 7.2, "unit": "", "status": "normal" }
    },
    "last_update": "2026-04-02 10:30:00"
  }
}
```

**测试代码（curl）**
```bash
curl -X GET "http://localhost:3002/api/dashboard?device_id=1001" \
  -H "Authorization: Bearer <your_token>"
```

---

## 五、AI 相关接口（需要认证）

### 5.1 触发 AI 诊断

**POST /api/trigger-diagnosis**

触发 AI 诊断流程，收集异常前后数据并生成诊断报告。

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| timestamp | number | 是 | 异常发生时间戳 |
| deviceId | string | 是 | 设备ID |
| diagnosisTaskId | number | 否 | 关联的诊断任务ID |
| anomalyInfo | object | 否 | 异常信息详情 |

**请求示例**
```json
{
  "timestamp": 1712041200000,
  "deviceId": "1001",
  "diagnosisTaskId": 5,
  "anomalyInfo": {
    "param": "temp",
    "value": 85.5,
    "threshold": 70
  }
}
```

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| data.context | object | AI 上下文数据（包含前后5分钟的所有数据） |
| data.diagnosis | object | AI 诊断结果 |

**测试代码（curl）**
```bash
curl -X POST http://localhost:3002/api/trigger-diagnosis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "timestamp": 1712041200000,
    "deviceId": "1001",
    "diagnosisTaskId": 5
  }'
```

---

## 六、健康检查接口

### 6.1 服务健康检查

**GET /api/health**

检查 API 服务是否正常运行。

**请求参数**

无

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| status | string | 状态（ok） |
| timestamp | number | 当前时间戳 |

**响应示例**
```json
{
  "status": "ok",
  "timestamp": 1712041200000
}
```

**测试代码（curl）**
```bash
curl -X GET http://localhost:3002/api/health
```

---

## 七、AI 服务接口（端口 8001）

### 7.1 AI 诊断

**POST /api/ai/diagnosis**

调用星火大模型生成设备诊断报告。

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| anomaly_data | object | 是 | 异常数据 |
| device_info | object | 是 | 设备信息 |
| context_data | object | 是 | 上下文数据 |

**请求示例**
```json
{
  "anomaly_data": {
    "param": "temperature",
    "value": 85.5,
    "threshold": 70
  },
  "device_info": {
    "id": "1001",
    "name": "1号调配罐",
    "type": "调配罐"
  },
  "context_data": {
    "coreMetrics": [],
    "environment": [],
    "telemetry": []
  }
}
```

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| diagnosis | string | 诊断报告 |
| possible_causes | array | 可能原因列表 |
| suggestions | array | 建议措施列表 |
| confidence | number | 置信度（0-1） |

**测试代码（curl）**
```bash
curl -X POST http://localhost:8001/api/ai/diagnosis \
  -H "Content-Type: application/json" \
  -d '{
    "anomaly_data": {
      "param": "temperature",
      "value": 85.5
    },
    "device_info": {
      "id": "1001",
      "name": "1号调配罐"
    },
    "context_data": {}
  }'
```

---

### 7.2 AI 问答

**POST /api/ai/chat**

智能运维问答接口。

**请求参数**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| question | string | 是 | 用户问题 |
| context | string | 否 | 上下文信息 |
| history | array | 否 | 对话历史 |

**请求示例**
```json
{
  "question": "设备温度过高的可能原因有哪些？",
  "context": "设备ID: 1001, 类型: 调配罐",
  "history": []
}
```

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| answer | string | AI 回答内容 |
| references | array | 参考信息 |
| suggested_questions | array | 建议的后续问题 |

**测试代码（curl）**
```bash
curl -X POST http://localhost:8001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "设备温度过高的可能原因有哪些？",
    "context": "设备ID: 1001"
  }'
```

---

### 7.3 AI 服务健康检查

**GET /health**

检查 AI 服务是否正常运行。

**请求参数**

无

**响应参数**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| status | string | 状态（healthy） |
| service | string | 服务名称 |

**响应示例**
```json
{
  "status": "healthy",
  "service": "ai-service"
}
```

**测试代码（curl）**
```bash
curl -X GET http://localhost:8001/health
```

---

## 附录

### 认证方式

所有需要认证的接口都需要在请求头中携带 JWT Token：

```
Authorization: Bearer <your_token>
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | 未授权（Token 无效或过期） |
| 404 | 资源不存在 |
| 409 | 冲突（如用户名已存在） |
| 500 | 服务器内部错误 |

### 设备状态定义

| 状态值 | 说明 |
|--------|------|
| 0 | 离线 |
| 1 | 在线/运行中 |
| 2 | 故障/告警 |

### 诊断任务状态定义

| 状态值 | 说明 |
|--------|------|
| 0 | 待处理 |
| 1 | 处理中 |
| 2 | 已完成 |
| 3 | 已关闭 |
| 4 | 已取消 |

### 优先级定义

| 优先级值 | 说明 |
|----------|------|
| 0 | 低 |
| 1 | 中 |
| 2 | 高 |

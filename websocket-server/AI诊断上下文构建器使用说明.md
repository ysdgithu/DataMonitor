# AI 诊断上下文构建器使用说明

## 概述

`aiContextBuilder.ts` 是一个用于为 AI 诊断服务准备提示词数据的工具。它能够收集设备异常诊断所需的完整上下文信息，包括设备基本信息、异常前后5分钟的所有传感器数据、诊断任务信息等。

## 功能特点

- ✅ 自动收集异常时间点前后5分钟的所有数据
- ✅ 支持多种数据类型：核心指标、环境数据、通信数据、工厂设备数据
- ✅ 按类别分组核心指标数据（CPU、内存、网络、在线率）
- ✅ 支持关联诊断任务信息
- ✅ 提供数据统计信息
- ✅ 时间戳自动格式化为可读字符串
- ✅ 简单易用的 API 接口

## 安装和导入

```typescript
import { buildAIContext, AIContextData, BuildContextParams } from './services/aiContextBuilder';
```

## 基本使用

### 1. 最简单的用法

```typescript
const context = await buildAIContext({
    timestamp: Date.now(),      // 异常发生时间
    deviceId: '000'             // 设备ID
});

console.log(context);
```

### 2. 带异常信息的用法

```typescript
const context = await buildAIContext({
    timestamp: Date.now(),
    deviceId: '000',
    anomalyInfo: {
        type: 'cpu_sustained',      // 异常类型
        metric: 'cpu',              // 异常指标
        threshold: 90,              // 阈值
        currentValue: 95.5,         // 当前值
        severity: 'high'            // 严重程度
    }
});
```

### 3. 关联诊断任务

```typescript
const context = await buildAIContext({
    timestamp: Date.now(),
    deviceId: '000',
    diagnosisTaskId: 1,         // 诊断任务ID
    anomalyInfo: {
        type: 'cpu_sustained',
        metric: 'cpu',
        threshold: 90,
        currentValue: 95.5
    }
});

// 访问诊断任务信息
console.log(context.diagnosisTask);
```

## 参数说明

### BuildContextParams

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `timestamp` | `number` | ✅ | 异常发生的时间戳（毫秒） |
| `deviceId` | `string` | ✅ | 设备ID |
| `diagnosisTaskId` | `number` | ❌ | 诊断任务ID（可选） |
| `anomalyInfo` | `AnomalyInfo` | ❌ | 异常信息（可选） |

### AnomalyInfo

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `'cpu_sustained' \| 'temp_sudden' \| 'custom'` | ✅ | 异常类型 |
| `metric` | `string` | ✅ | 异常指标名称 |
| `threshold` | `number` | ❌ | 异常阈值 |
| `currentValue` | `number` | ❌ | 当前值 |
| `baseline` | `number` | ❌ | 基线值（用于突变检测） |
| `severity` | `string` | ❌ | 严重程度（如 'high', 'medium', 'low'） |

## 返回数据结构

### AIContextData

```typescript
{
    // 设备基本信息
    deviceInfo: {
        deviceId: string;
        deviceType?: string;
        deviceName?: string;
        zone?: string;
        position?: string;
    };
    
    // 异常信息
    anomaly: {
        timestamp: number;
        timestampReadable: string;      // 格式化的时间字符串
        type?: string;
        metric?: string;
        threshold?: number;
        currentValue?: number;
        baseline?: number;
        severity?: string;
    };
    
    // 时间范围（前后5分钟）
    timeRange: {
        start: number;
        end: number;
        startReadable: string;
        endReadable: string;
    };
    
    // 核心指标数据（按类别分组）
    coreMetrics: {
        cpu: any[];         // CPU 使用率数据
        memory: any[];      // 内存占用数据
        network: any[];     // 网络延迟数据
        online: any[];      // 在线率数据
    };
    
    // 环境数据（温度等）
    environmentData: any[];
    
    // 通信数据（上传频率）
    telemetryData: any[];
    
    // 工厂设备数据（包含设备参数）
    factoryDeviceData: any[];
    
    // 诊断任务信息（如果有）
    diagnosisTask?: {
        id: number;
        name: string;
        detail?: string;
        assignee: string;
        priority: number;
        status: number;
    };
    
    // 数据统计
    statistics: {
        totalDataPoints: number;
        coreMetricsCount: number;
        environmentDataCount: number;
        telemetryDataCount: number;
        factoryDeviceDataCount: number;
    };
}
```

## 使用场景

### 场景1：CPU 持续超限异常诊断

```typescript
// 在异常检测器中检测到 CPU 持续超限
const anomalyEvent = sustainedExceedDetector.check(dataPoint);

if (anomalyEvent) {
    // 构建 AI 上下文
    const context = await buildAIContext({
        timestamp: Date.now(),
        deviceId: anomalyEvent.deviceId,
        anomalyInfo: {
            type: 'cpu_sustained',
            metric: anomalyEvent.metric,
            threshold: 90,
            currentValue: anomalyEvent.breaches[anomalyEvent.breaches.length - 1].value,
            severity: anomalyEvent.severity
        }
    });
    
    // 转换为 AI 提示词
    const prompt = convertToPrompt(context);
    
    // 调用 AI 服务
    const diagnosis = await callAIService(prompt);
}
```

### 场景2：温度突变异常诊断

```typescript
// 在异常检测器中检测到温度突变
const anomalyEvent = suddenChangeDetector.check(dataPoint);

if (anomalyEvent) {
    // 构建 AI 上下文
    const context = await buildAIContext({
        timestamp: Date.now(),
        deviceId: anomalyEvent.deviceId,
        anomalyInfo: {
            type: 'temp_sudden',
            metric: anomalyEvent.metric,
            threshold: 10,
            currentValue: anomalyEvent.current_value,
            baseline: anomalyEvent.baseline,
            severity: anomalyEvent.severity
        }
    });
    
    // 转换为 AI 提示词并调用 AI 服务
    const prompt = convertToPrompt(context);
    const diagnosis = await callAIService(prompt);
}
```

### 场景3：手动触发诊断

```typescript
// 用户在前端点击"AI 诊断"按钮
app.post('/api/trigger-diagnosis', async (req, res) => {
    const { timestamp, deviceId, diagnosisTaskId } = req.body;
    
    // 构建 AI 上下文
    const context = await buildAIContext({
        timestamp,
        deviceId,
        diagnosisTaskId
    });
    
    // 转换为 AI 提示词
    const prompt = convertToPrompt(context);
    
    // 调用 AI 服务
    const diagnosis = await callAIService(prompt);
    
    res.json({
        success: true,
        data: {
            context,
            diagnosis
        }
    });
});
```

## 转换为 AI 提示词

使用示例中的 `convertToPrompt` 函数可以将上下文数据转换为自然语言提示词：

```typescript
import { convertToPrompt } from './examples/aiContextExample';

const context = await buildAIContext({
    timestamp: Date.now(),
    deviceId: '000',
    anomalyInfo: {
        type: 'cpu_sustained',
        metric: 'cpu',
        threshold: 90,
        currentValue: 95.5
    }
});

const prompt = convertToPrompt(context);
console.log(prompt);
```

输出示例：
```
我监控的设备 设备000（ID: 000）在 2025-11-11 14:30:25 的 cpu 指标出现了异常（持续超限），当前值为 95.5，阈值为 90。

以下是该设备在异常时间点前后5分钟（2025-11-11 14:25:25 至 2025-11-11 14:35:25）的所有相关指标数据：

CPU 使用率数据（30 个数据点）：
  - 14:25:30: 88.5%
  - 14:26:00: 91.2%
  - 14:26:30: 93.8%
  - 14:27:00: 95.5%
  - 14:27:30: 94.2%
  ... 还有 25 个数据点

内存占用数据（30 个数据点）：
  - 14:25:30: 65.3%
  - 14:26:00: 66.1%
  ...

请以运维专家的口吻，分析导致此异常最可能的原因，并按可能性降序列出。
```

## 运行示例

```bash
# 进入后端目录
cd websocket-server

# 运行示例程序
npx ts-node src/examples/aiContextExample.ts
```

示例程序会演示：
1. CPU 持续超限异常的上下文构建
2. 温度突变异常的上下文构建
3. 带诊断任务的异常上下文构建
4. 生成 AI 提示词

## 性能优化

### 并行查询
函数内部使用 `Promise.all` 并行查询所有数据，提高查询效率：

```typescript
const [
    deviceInfo,
    coreMetrics,
    environmentData,
    telemetryData,
    factoryDeviceData,
    diagnosisTask
] = await Promise.all([
    this.getDeviceInfo(deviceId, timestamp),
    this.getCoreMetrics(deviceId, timeRange.start, timeRange.end),
    // ...
]);
```

### 数据量控制
- 时间范围固定为前后5分钟，避免查询过多数据
- 核心指标数据按类别分组，便于后续处理
- 提供数据统计信息，方便了解数据规模

## 注意事项

1. **时间戳单位**：输入的 `timestamp` 必须是毫秒级时间戳
2. **设备ID**：确保设备ID存在于数据库中，否则可能查询不到数据
3. **数据可用性**：如果异常时间点前后5分钟内没有数据，相应的数组会为空
4. **诊断任务**：如果提供了 `diagnosisTaskId` 但任务不存在，`diagnosisTask` 字段会是 `undefined`

## 下一步

1. **集成 AI 服务**：将生成的提示词发送给 AI 服务（如讯飞星火、DeepSeek）
2. **保存诊断结果**：将 AI 返回的诊断结果保存到数据库
3. **前端展示**：在前端展示诊断结果和上下文数据
4. **优化提示词**：根据实际效果优化提示词模板

## 相关文件

- `websocket-server/src/services/aiContextBuilder.ts` - 核心实现
- `websocket-server/src/examples/aiContextExample.ts` - 使用示例
- `ai拓展规划书.md` - AI 功能规划文档


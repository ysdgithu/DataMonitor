//该文件为数据处理器，用于处理接收到的数据
//包含分类数据、标记出异常数据，推送至客户端，同时写入数据库

import WebSocket from 'ws';
import {
    CoreMetricData,
    EnvironmentData,
    DeviceTelemetryData,
    DeviceStatusData,
} from '../types/index';

// 添加类型定义
type DeviceDataType = CoreMetricData | EnvironmentData | DeviceTelemetryData | DeviceStatusData;

// 分级异常判定阈值
const THRESHOLDS = {
    cpu: { warning: 90, error: 95 },
    memory: { warning: 90, error: 95 },
    network: { warning: 150, error: 180 },
    online: { warning: 60, error: 30 }, // 修正属性名
    temperature: { warning: 35, error: 40 },
    upload_frequency: { warning: 80, error: 100 }
};

// 分级判断数据状态
function getDataStatus(data: DeviceDataType): 'normal' | 'warning' | 'error' {
    if ('category' in data) {
        if (data.category === 'cpu') {
            if (data.value >= THRESHOLDS.cpu.error) return 'error';
            if (data.value >= THRESHOLDS.cpu.warning) return 'warning';
            return 'normal';
        }
        if (data.category === 'memory') {
            if (data.value >= THRESHOLDS.memory.error) return 'error';
            if (data.value >= THRESHOLDS.memory.warning) return 'warning';
            return 'normal';
        }
        if (data.category === 'network') {
            if (data.value >= THRESHOLDS.network.error) return 'error';
            if (data.value >= THRESHOLDS.network.warning) return 'warning';
            return 'normal';
        }
        if (data.category === 'online') {
            if (data.value <= THRESHOLDS.online.error) return 'error';
            if (data.value <= THRESHOLDS.online.warning) return 'warning';
            return 'normal';
        }
    }
    if ('type' in data && data.type === 'temperature') {
        if (data.value >= THRESHOLDS.temperature.error) return 'error';
        if (data.value >= THRESHOLDS.temperature.warning) return 'warning';
        return 'normal';
    }
    if ('dataType' in data && data.dataType === 'upload_frequency') {
        if (data.value >= THRESHOLDS.upload_frequency.error) return 'error';
        if (data.value >= THRESHOLDS.upload_frequency.warning) return 'warning';
        return 'normal';
    }
    return 'normal';
}

// 伪数据库写入函数
function saveToDatabase(data: DeviceDataType) {
    // 实际可接入数据库
    // db.save(data);
}

// 数据处理器类
export class DataProcessor {
    private wsClients: Set<WebSocket> = new Set();

    // 注册客户端
    public addClient(ws: WebSocket) {
        this.wsClients.add(ws);
    }

    // 移除客户端
    public removeClient(ws: WebSocket) {
        this.wsClients.delete(ws);
    }

    // 处理数据并推送
    public processAndPush(dataList: DeviceDataType[]) {
        for (const data of dataList) {
            // 分级赋值 dataStatus
            data.dataStatus = getDataStatus(data);

            // 推送至所有客户端
            for (const ws of this.wsClients) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(data));
                }
            }

            // 写入数据库
            saveToDatabase(data);
        }
    }
}

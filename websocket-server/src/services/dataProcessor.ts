//该文件为数据处理器，用于处理接收到的数据
//包含分类数据、标记出异常数据，推送至客户端，同时写入数据库

import WebSocket from 'ws';
import {
    CoreMetricData,
    EnvironmentData,
    DeviceTelemetryData,
    DeviceStatusData,
    FactoryDevice,
} from '../types/index';
import { DataModel, CoreMetricRecord, EnvironmentRecord, TelemetryRecord, DeviceStatusRecord, FactoryDeviceRecord } from '../database/models';
import { SustainedExceedDetector } from './sustainedExceedDetector';
import { SuddenChangeDetector } from './suddenChangeDetector';
import type { DataPoint } from '../types/index';

// 添加类型定义
type DeviceDataType = CoreMetricData | EnvironmentData | DeviceTelemetryData | DeviceStatusData | FactoryDevice;
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
    if ('type' in data && data.type === 'temperature' && 'value' in data) {
        if (data.value >= THRESHOLDS.temperature.error) return 'error';
        if (data.value >= THRESHOLDS.temperature.warning) return 'warning';
        return 'normal';
    }
    if ('dataType' in data && data.dataType === 'upload_frequency') {
        if (data.value >= THRESHOLDS.upload_frequency.error) return 'error';
        if (data.value >= THRESHOLDS.upload_frequency.warning) return 'warning';
        return 'normal';
    }
    // 工厂设备数据根据设备状态直接映射
    if ('status' in data && 'zone' in data) {
        if (data.status === 'error') return 'error';
        if (data.status === 'warning') return 'warning';
        return 'normal';
    }
    return 'normal';
}

// 数据处理器类
export class DataProcessor {
    private wsClients: Set<WebSocket> = new Set();
    private dataModel: DataModel;
    private cpuDetector: SustainedExceedDetector;
    private tempDetector: SuddenChangeDetector;

    constructor() {
        this.dataModel = new DataModel();
        // 初始化CPU持续超限检测器
        this.cpuDetector = new SustainedExceedDetector();
        // 初始化温度突变检测器
        this.tempDetector = new SuddenChangeDetector();
    }

    // 注册客户端
    public addClient(ws: WebSocket) {
        this.wsClients.add(ws);
    }

    // 移除客户端
    public removeClient(ws: WebSocket) {
        this.wsClients.delete(ws);
    }

    // 【新增】获取客户端数量
    public getClientCount(): number {
        return this.wsClients.size;
    }

    // 【新增】获取数据库缓冲区大小
    public getDbBufferSize(): number {
        return this.dbBuffer.length;
    }

    // 处理数据并推送（优化版 - 支持高频数据）
    public async processAndPush(messages: { type: string; data: any }[]) {
        // 批量处理数据状态标记
        const processedMessages = messages.map(message => {
            if (Array.isArray(message.data)) {
                message.data = message.data.map(item => ({
                    ...item,
                    dataStatus: getDataStatus(item)
                }));
            } else {
                message.data = {
                    ...message.data,
                    dataStatus: getDataStatus(message.data)
                };
            }
            return message;
        });

        // 批量异常检测
        processedMessages.forEach(message => {
            this.detectAnomalies(message);
        });

        // 【优化1】预先序列化消息，避免重复 JSON.stringify
        const serializedMessages = processedMessages.map(message =>
            JSON.stringify({
                type: message.type,
                data: message.data,
                timestamp: Date.now()
            })
        );

        // 【优化2】批量推送给所有客户端
        for (const ws of this.wsClients) {
            if (ws.readyState === WebSocket.OPEN) {
                // 一次性发送所有消息（减少系统调用）
                serializedMessages.forEach(msg => {
                    try {
                        ws.send(msg);
                    } catch (error) {
                        console.error('WebSocket发送失败:', error);
                    }
                });
            }
        }

        // 【优化3】批量写入数据库（使用批处理缓冲区）
        this.batchSaveToDatabase(processedMessages).catch(error => {
            console.error(`批量数据库写入失败:`, error);
        });
    }

    // 数据库批处理缓冲区
    private dbBuffer: { type: string; data: any }[] = [];
    private dbFlushTimer: NodeJS.Timeout | null = null;
    private readonly DB_BATCH_SIZE = 100; // 每100条批量写入
    private readonly DB_FLUSH_INTERVAL = 1000; // 或每1秒写入一次

    // 批量数据库写入
    private async batchSaveToDatabase(messages: { type: string; data: any }[]) {
        this.dbBuffer.push(...messages);

        // 达到批量大小立即写入
        if (this.dbBuffer.length >= this.DB_BATCH_SIZE) {
            await this.flushDatabaseBuffer();
        } else {
            // 否则设置定时器
            if (!this.dbFlushTimer) {
                this.dbFlushTimer = setTimeout(() => {
                    this.flushDatabaseBuffer();
                }, this.DB_FLUSH_INTERVAL);
            }
        }
    }

    // 刷新数据库缓冲区
    private async flushDatabaseBuffer() {
        if (this.dbBuffer.length === 0) return;

        const toWrite = [...this.dbBuffer];
        this.dbBuffer = [];

        if (this.dbFlushTimer) {
            clearTimeout(this.dbFlushTimer);
            this.dbFlushTimer = null;
        }

        // 按类型分组批量写入
        const grouped = toWrite.reduce((acc, msg) => {
            if (!acc[msg.type]) acc[msg.type] = [];
            acc[msg.type].push(msg.data);
            return acc;
        }, {} as Record<string, any[]>);

        // 并行写入所有类型
        await Promise.all(
            Object.entries(grouped).map(([type, dataList]) =>
                this.saveToDatabase(type, dataList).catch(error => {
                    console.error(`数据库写入失败 [${type}]:`, error);
                })
            )
        );
    }

    // 异常检测方法
    private detectAnomalies(message: { type: string; data: any }) {
        // CPU持续超限检测
        if (message.type === 'core_metrics' && Array.isArray(message.data)) {
            const cpuData = message.data.find(item => item.category === 'cpu');
            if (cpuData) {
                const dataPoint: DataPoint = {
                    deviceId: cpuData.deviceId,
                    metric: 'cpu',
                    value: cpuData.value,
                    timestamp: cpuData.timestamp
                };
                const cpuAnomaly = this.cpuDetector.check(dataPoint);
                if (cpuAnomaly) {
                    console.log('检测到CPU持续超限异常:', cpuAnomaly);
                    // 发送异常消息给前端
                    this.sendAnomalyAlert('cpu_sustained_exceed', cpuAnomaly);
                }
            }
        }

        // 温度突变检测
        if (message.type === 'environment' && !Array.isArray(message.data)) {
            const tempData = message.data;
            if (tempData.type === 'temperature') {
                const dataPoint: DataPoint = {
                    deviceId: tempData.deviceId,
                    metric: 'temperature',
                    value: tempData.value,
                    timestamp: tempData.timestamp
                };
                const tempAnomaly = this.tempDetector.check(dataPoint);
                if (tempAnomaly) {
                    console.log('检测到温度突变异常:', tempAnomaly);
                    // 发送异常消息给前端
                    this.sendAnomalyAlert('temperature_sudden_change', tempAnomaly);
                }
            }
        }
    }

    // 发送异常告警消息给前端
    private sendAnomalyAlert(alertType: string, anomalyData: any) {
        const alertMessage = {
            type: 'anomaly_alert',
            alertType: alertType,
            data: anomalyData,
            timestamp: Date.now()
        };

        for (const ws of this.wsClients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(alertMessage));
            }
        }
    }

    // 数据库写入方法
    private async saveToDatabase(type: string, data: any): Promise<void> {
        try {
            switch (type) {
                case 'core_metrics':
                    if (Array.isArray(data)) {
                        await this.dataModel.insertCoreMetrics(data as CoreMetricRecord[]);
                    }
                    break;

                case 'environment':
                    if (!Array.isArray(data)) {
                        await this.dataModel.insertEnvironmentData(data as EnvironmentRecord);
                    }
                    break;

                case 'device_status':
                    if (Array.isArray(data)) {
                        await this.dataModel.insertDeviceStatus(data as DeviceStatusRecord[]);
                    }
                    break;

                case 'telemetry':
                    if (!Array.isArray(data)) {
                        await this.dataModel.insertTelemetryData(data as TelemetryRecord);
                    }
                    break;

                case 'factory_devices':
                    if (Array.isArray(data)) {
                        await this.dataModel.insertFactoryDevices(data as FactoryDeviceRecord[]);
                    }
                    break;

                default:
                    console.warn(`未知的数据类型: ${type}`);
            }
        } catch (error) {
            console.error(`数据库写入错误 [${type}]:`, error);
            throw error;
        }
    }
}

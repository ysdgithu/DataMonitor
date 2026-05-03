// AI 诊断上下文构建器
// 用于收集设备异常诊断所需的完整上下文信息

import { DataModel } from '../database/models';

// 异常信息接口
export interface AnomalyInfo {
    type: 'cpu_sustained' | 'temp_sudden' | 'custom';  // 异常类型
    metric: string;                                     // 异常指标名称
    threshold?: number;                                 // 异常阈值
    currentValue?: number;                              // 当前值
    baseline?: number;                                  // 基线值（用于突变检测）
    severity?: string;                                  // 严重程度
}

// 构建参数接口
export interface BuildContextParams {
    timestamp: number;           // 异常发生时间戳（毫秒）
    deviceId: string;            // 设备ID
    diagnosisTaskId?: number;    // 诊断任务ID（可选）
    anomalyInfo?: AnomalyInfo;   // 异常信息（可选）
}

// AI 上下文数据结构
export interface AIContextData {
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
        timestampReadable: string;
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
    
    // 核心指标数据（CPU、内存、网络、在线率）
    coreMetrics: {
        cpu: any[];
        memory: any[];
        network: any[];
        online: any[];
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

// AI 上下文构建器类
export class AIContextBuilder {
    private dataModel: DataModel;
    
    constructor() {
        this.dataModel = new DataModel();
    }
    
    // 主函数：构建 AI 诊断上下文
    async buildContext(params: BuildContextParams): Promise<AIContextData> {
        const { timestamp, deviceId, diagnosisTaskId, anomalyInfo } = params;
        
        // 计算时间范围（前后5分钟）
        const timeRange = this.calculateTimeRange(timestamp);
        
        // 并行查询所有数据
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
            this.getEnvironmentData(deviceId, timeRange.start, timeRange.end),
            this.getTelemetryData(deviceId, timeRange.start, timeRange.end),
            this.getFactoryDeviceData(deviceId, timeRange.start, timeRange.end),
            diagnosisTaskId ? this.getDiagnosisTask(diagnosisTaskId) : Promise.resolve(undefined)
        ]);
        
        // 构建返回数据
        const context: AIContextData = {
            deviceInfo,
            anomaly: {
                timestamp,
                timestampReadable: this.formatTimestamp(timestamp),
                type: anomalyInfo?.type,
                metric: anomalyInfo?.metric,
                threshold: anomalyInfo?.threshold,
                currentValue: anomalyInfo?.currentValue,
                baseline: anomalyInfo?.baseline,
                severity: anomalyInfo?.severity
            },
            timeRange: {
                start: timeRange.start,
                end: timeRange.end,
                startReadable: this.formatTimestamp(timeRange.start),
                endReadable: this.formatTimestamp(timeRange.end)
            },
            coreMetrics,
            environmentData,
            telemetryData,
            factoryDeviceData,
            diagnosisTask,
            statistics: {
                totalDataPoints: 0,
                coreMetricsCount: 0,
                environmentDataCount: 0,
                telemetryDataCount: 0,
                factoryDeviceDataCount: 0
            }
        };
        
        // 计算统计信息（现在返回的是摘要对象，需要从 count 字段获取）
        context.statistics.coreMetricsCount =
            coreMetrics.cpu.count +
            coreMetrics.memory.count +
            coreMetrics.network.count +
            coreMetrics.online.count;
        context.statistics.environmentDataCount = environmentData.count || 0;
        context.statistics.telemetryDataCount = telemetryData.count || 0;
        context.statistics.factoryDeviceDataCount = factoryDeviceData.count || 0;
        context.statistics.totalDataPoints =
            context.statistics.coreMetricsCount +
            context.statistics.environmentDataCount +
            context.statistics.telemetryDataCount +
            context.statistics.factoryDeviceDataCount;
        
        return context;
    }
    
    // 计算时间范围（前后5分钟）
    private calculateTimeRange(timestamp: number): { start: number; end: number } {
        const fiveMinutes = 5 * 60 * 1000; // 5分钟的毫秒数
        return {
            start: timestamp - fiveMinutes,
            end: timestamp + fiveMinutes
        };
    }
    
    // 获取设备基本信息
    private async getDeviceInfo(deviceId: string, timestamp: number): Promise<any> {
        // 查询最近的工厂设备数据，获取设备信息
        const devices = await this.dataModel.queryDeviceHistory({
            deviceId,
            startTime: timestamp - 60 * 60 * 1000, // 查询1小时内的数据
            limit: 1
        });
        
        if (devices && devices.length > 0) {
            const device = devices[0];
            return {
                deviceId,
                deviceType: device.type || `类型${device.typeCode}`,
                deviceName: device.name,
                zone: device.zone,
                position: device.position
            };
        }
        
        // 如果没有找到设备信息，返回基本信息
        return {
            deviceId,
            deviceType: '未知',
            deviceName: `设备${deviceId}`,
            zone: '未知',
            position: '未知'
        };
    }
    
    // 获取核心指标数据（按类别分组，只返回摘要）
    private async getCoreMetrics(deviceId: string, startTime: number, endTime: number): Promise<any> {
        const allMetrics = await this.dataModel.queryDeviceHistory({
            deviceId,
            startTime,
            endTime
        });

        // 按类别分组并计算统计信息
        const grouped = {
            cpu: [] as any[],
            memory: [] as any[],
            network: [] as any[],
            online: [] as any[]
        };

        for (const metric of allMetrics) {
            const category = metric.category;
            if (category && grouped[category as keyof typeof grouped]) {
                grouped[category as keyof typeof grouped].push(metric);
            }
        }

        // 只返回每个类别的统计摘要，不返回所有原始数据
        const summary = {
            cpu: this.calculateMetricSummary(grouped.cpu),
            memory: this.calculateMetricSummary(grouped.memory),
            network: this.calculateMetricSummary(grouped.network),
            online: this.calculateMetricSummary(grouped.online)
        };

        return summary;
    }

    // 计算指标摘要
    private calculateMetricSummary(metrics: any[]): any {
        if (metrics.length === 0) {
            return {
                count: 0,
                avg: 0,
                max: 0,
                min: 0,
                latest: null,
                abnormalCount: 0
            };
        }

        const values = metrics.map(m => m.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const latest = metrics[metrics.length - 1];
        const abnormalCount = metrics.filter(m => m.dataStatus !== 'normal').length;

        return {
            count: metrics.length,
            avg: Math.round(avg * 100) / 100,
            max: Math.round(max * 100) / 100,
            min: Math.round(min * 100) / 100,
            latest: {
                value: latest.value,
                timestamp: latest.timestamp,
                status: latest.dataStatus
            },
            abnormalCount,
            abnormalRate: Math.round((abnormalCount / metrics.length) * 100) + '%'
        };
    }
    
    // 获取环境数据（只返回摘要）
    private async getEnvironmentData(deviceId: string, startTime: number, endTime: number): Promise<any> {
        const data = await this.dataModel.queryDeviceHistory({
            deviceId,
            startTime,
            endTime
        });

        // 返回摘要而不是所有数据
        if (data.length === 0) {
            return { count: 0, latest: null };
        }

        return {
            count: data.length,
            latest: data[data.length - 1]
        };
    }

    // 获取通信数据（只返回摘要）
    private async getTelemetryData(deviceId: string, startTime: number, endTime: number): Promise<any> {
        const data = await this.dataModel.queryDeviceHistory({
            deviceId,
            startTime,
            endTime
        });

        // 返回摘要而不是所有数据
        if (data.length === 0) {
            return { count: 0, latest: null };
        }

        return {
            count: data.length,
            latest: data[data.length - 1]
        };
    }

    // 获取工厂设备数据（只返回摘要）
    private async getFactoryDeviceData(deviceId: string, startTime: number, endTime: number): Promise<any> {
        const data = await this.dataModel.queryDeviceHistory({
            deviceId,
            startTime,
            endTime
        });

        // 返回摘要而不是所有数据
        if (data.length === 0) {
            return { count: 0, latest: null };
        }

        return {
            count: data.length,
            latest: data[data.length - 1]
        };
    }
    
    // 获取诊断任务信息
    private async getDiagnosisTask(taskId: number): Promise<any> {
        const task = await this.dataModel.getDiagnosisTaskById(taskId);
        if (!task) {
            return undefined;
        }
        
        return {
            id: task.id,
            name: task.name,
            detail: task.detail,
            assignee: task.assignee,
            priority: task.priority,
            status: task.status
        };
    }
    
    // 格式化时间戳为可读字符串
    private formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}

// 导出便捷函数
export async function buildAIContext(params: BuildContextParams): Promise<AIContextData> {
    const builder = new AIContextBuilder();
    return await builder.buildContext(params);
}


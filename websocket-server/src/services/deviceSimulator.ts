import WebSocket from 'ws';
import {
    CoreMetricData,
    EnvironmentData,
    DeviceTelemetryData,
    DeviceStatusData,
    GeoPoint
} from '../types/index';
// 该文件为设备模拟器，用于模拟生成数据
// 包含正常数据、异常数据，模拟设备连接和断开连接（可手动控制），模拟高并发情况（5万条以上数据量）
// 设备连接断开接口：start，stop
// 高并发接口：setHighConcurrency，disableHighConcurrency

type DeviceDataType = CoreMetricData | EnvironmentData | DeviceTelemetryData | DeviceStatusData;

export class DeviceSimulator {
    private running: boolean = false; // 是否正在生成数据
    private highConcurrency: boolean = false; // 是否处于高并发模式
    private deviceCount: number = 100; // 当前模拟设备数量
    private coreMetricsIntervalId: NodeJS.Timeout | null = null; // 核心指标定时器
    private environmentIntervalId: NodeJS.Timeout | null = null; // 环境数据定时器
    private statusIntervalId: NodeJS.Timeout | null = null; // 设备状态定时器
    private telemetryIntervalId: NodeJS.Timeout | null = null; // 通信数据定时器
    private latestData: {
        coreMetrics?: CoreMetricData[];
        environment?: EnvironmentData;
        deviceStatus?: DeviceStatusData[];
        telemetry?: DeviceTelemetryData;
    } = {}; // 按类型存储最新数据
    private readonly defaultDeviceCount: number = 100; // 默认设备数量



    // 生成核心指标数据
    private generateCoreMetrics() {
        const timestamp = Date.now();
        const location: GeoPoint = {
            lat: 39.5,
            lng: 116.5,
            accuracy: 1
        };

        // 生成四个核心指标
        this.latestData.coreMetrics = [
            {
                deviceId: "000",
                timestamp,
                category: 'cpu',
                value: 30 + Math.random() * 40, // 30-70%
                location
            },
            {
                deviceId: "000",
                timestamp,
                category: 'memory',
                value: 40 + Math.random() * 30, // 40-70%
                location
            },
            {
                deviceId: "000",
                timestamp,
                category: 'network',
                value: 50 + Math.random() * 100, // 50-150
                location
            },
            {
                deviceId: "000",
                timestamp,
                category: 'online',
                value: Math.random() > 0.1 ? 1 : 0, // 90%概率在线
                location
            }
        ];
    }

    // 生成环境数据（高频单设备）
    private generateEnvironmentData() {
        this.latestData.environment = {
            deviceId: "001",
            timestamp: Date.now(),
            type: 'temperature',
            value: 22 + Math.random() * 6, // 22-28°C
            unit: '°C',
            location: {
                lat: 39.5,
                lng: 116.5,
                accuracy: 1
            }
        };
    }

    // 生成通信数据
    private generateTelemetryData() {
        this.latestData.telemetry = {
            deviceId: "002",
            timestamp: Date.now(),
            dataType: 'upload_frequency',
            value: 60 + Math.floor(Math.random() * 40), // 60-100
            location: {
                lat: 39.5,
                lng: 116.5,
                accuracy: 1
            }
        };
    }

    // 生成设备状态数据（多设备）
    private generateStatusData() {
        const timestamp = Date.now();
        this.latestData.deviceStatus = Array(this.deviceCount).fill(null).map((_, i) => ({
            deviceId: `device_${i}`,
            timestamp,
            status: ['online', 'offline', 'warning', 'error'][Math.floor(Math.random() * 4)] as DeviceStatusData['status'],
            lastUpdate: timestamp,
            batteryLevel: Math.floor(Math.random() * 100),
            location: {
                lat: 39 + Math.random(),
                lng: 116 + Math.random(),
                accuracy: Math.floor(Math.random() * 10) + 1
            }
        }));
    }

    // 手动控制开关，启动数据生成
    public start(deviceCount?: number, highConcurrency?: boolean) {
        if (this.running) return;
        this.running = true;
        if (deviceCount) this.deviceCount = deviceCount;
        if (highConcurrency !== undefined) this.highConcurrency = highConcurrency;
        if (this.highConcurrency) this.deviceCount = Math.max(this.deviceCount, 50000);

        // 核心指标 - 3秒更新一次
        this.coreMetricsIntervalId = setInterval(() => {
            this.generateCoreMetrics();
            console.log(`[DeviceSimulator] 核心指标数据已更新 - ${new Date().toLocaleString()}`);
        }, 3000);

        // 环境数据（温度） - 1秒更新一次（高频）
        this.environmentIntervalId = setInterval(() => {
            this.generateEnvironmentData();
            console.log(`[DeviceSimulator] 环境数据已更新 - ${new Date().toLocaleString()}`);
        }, 1000);

        // 设备状态 - 6秒更新一次
        this.statusIntervalId = setInterval(() => {
            this.generateStatusData();
            console.log(`[DeviceSimulator] 设备状态已更新 - ${new Date().toLocaleString()}`);
        }, 6000);

        // 通信数据 - 4秒更新一次
        this.telemetryIntervalId = setInterval(() => {
            this.generateTelemetryData();
            console.log(`[DeviceSimulator] 通信数据已更新 - ${new Date().toLocaleString()}`);
        }, 4000);
    }

    // 手动关闭数据生成
    public stop() {
        if (this.coreMetricsIntervalId) {
            clearInterval(this.coreMetricsIntervalId);
            this.coreMetricsIntervalId = null;
        }
        if (this.environmentIntervalId) {
            clearInterval(this.environmentIntervalId);
            this.environmentIntervalId = null;
        }
        if (this.statusIntervalId) {
            clearInterval(this.statusIntervalId);
            this.statusIntervalId = null;
        }
        if (this.telemetryIntervalId) {
            clearInterval(this.telemetryIntervalId);
            this.telemetryIntervalId = null;
        }
        this.running = false;
    }

    // 获取最新数据
    public getLatestData(): { type: string; data: any }[] {
        const result = [];
        
        if (this.latestData.coreMetrics) {
            result.push({ type: 'core_metrics', data: this.latestData.coreMetrics });
        }
        if (this.latestData.environment) {
            result.push({ type: 'environment', data: this.latestData.environment });
        }
        if (this.latestData.deviceStatus) {
            result.push({ type: 'device_status', data: this.latestData.deviceStatus });
        }
        if (this.latestData.telemetry) {
            result.push({ type: 'telemetry', data: this.latestData.telemetry });
        }

        return result;
    }



    // 设置高并发模式（设备数量>=50000）
    public setHighConcurrency(enabled: boolean) {
        this.highConcurrency = enabled;
        if (enabled) {
            this.deviceCount = Math.max(this.deviceCount, 50000);
        }
    }

    // 关闭高并发模式，恢复默认设备数量
    public disableHighConcurrency() {
        this.highConcurrency = false;
        this.deviceCount = this.defaultDeviceCount;
    }
}

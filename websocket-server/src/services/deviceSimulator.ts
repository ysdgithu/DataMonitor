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
    private intervalId: NodeJS.Timeout | null = null; // 定时器ID，用于定时生成数据
    private latestData: DeviceDataType[] = []; // 存储最新一批生成的数据
    private readonly defaultDeviceCount: number = 100; // 默认设备数量

    // 手动控制开关，启动数据生成
    public start(deviceCount?: number, highConcurrency?: boolean) {
        if (this.running) return;
        this.running = true;
        if (deviceCount) this.deviceCount = deviceCount;
        if (highConcurrency !== undefined) this.highConcurrency = highConcurrency;
        if (this.highConcurrency) this.deviceCount = Math.max(this.deviceCount, 50000);

        this.intervalId = setInterval(() => {
            this.latestData = [];
            for (let i = 0; i < this.deviceCount; i++) {
                const deviceId = `device_${i}`;
                const timestamp = Date.now();
                const location: GeoPoint = {
                    lat: 39 + Math.random(),
                    lng: 116 + Math.random(),
                    accuracy: Math.floor(Math.random() * 10) + 1
                };
                // 仅用于地图设备状态数据
                const statusArr: DeviceStatusData['status'][] = ['online', 'offline', 'warning', 'error'];
                const status: DeviceStatusData['status'] = statusArr[Math.floor(Math.random() * statusArr.length)];

                // 核心指标数据
                this.latestData.push({
                    deviceId,
                    timestamp,
                    category: 'cpu',
                    value: Math.random() * 100,
                    location
                });
                this.latestData.push({
                    deviceId,
                    timestamp,
                    category: 'memory',
                    value: Math.random() * 100,
                    location
                });
                this.latestData.push({
                    deviceId,
                    timestamp,
                    category: 'network',
                    value: Math.random() * 200,
                    location
                });
                this.latestData.push({
                    deviceId,
                    timestamp,
                    category: 'online',
                    value: status === 'online' ? 1 : 0,
                    location
                });

                // 环境温度数据
                this.latestData.push({
                    deviceId,
                    timestamp,
                    type: 'temperature',
                    value: 20 + Math.random() * 10,
                    unit: '°C',
                    location
                });

                // 通信数据量（上传频率）
                this.latestData.push({
                    deviceId,
                    timestamp,
                    dataType: 'upload_frequency',
                    value: Math.floor(Math.random() * 100),
                    location
                });

                // 地图设备状态数据（包含 status 字段）
                this.latestData.push({
                    deviceId,
                    timestamp,
                    status,
                    lastUpdate: timestamp,
                    batteryLevel: Math.floor(Math.random() * 100),
                    location
                });
            }
        }, 1000);
    }

    // 手动关闭数据生成
    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.running = false;
    }

    // 获取最新一批生成的数据
    public getLatestData(): DeviceDataType[] {
        return this.latestData;
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

import WebSocket from 'ws';
import {
    CoreMetricData,
    EnvironmentData,
    DeviceTelemetryData,
    DeviceStatusData,
    GeoPoint,
    FactoryDevice
} from '../types/index';
import { DataProcessor } from './dataProcessor';
// 该文件为设备模拟器，用于模拟生成数据
// 包含正常数据、异常数据，模拟设备连接和断开连接（可手动控制），模拟高并发情况（5万条以上数据量）
// 设备连接断开接口：start，stop
// 高并发接口：setHighConcurrency，disableHighConcurrency

type DeviceDataType = CoreMetricData | EnvironmentData | DeviceTelemetryData | DeviceStatusData;

export class DeviceSimulator {
    private running: boolean = false; // 是否正在生成数据
    private highConcurrency: boolean = false; // 是否处于高并发模式
    private deviceCount: number = 100; // 当前模拟设备数量
    private dataProcessor?: DataProcessor; // 数据处理器
    private coreMetricsIntervalId: NodeJS.Timeout | null = null; // 核心指标定时器
    private environmentIntervalId: NodeJS.Timeout | null = null; // 环境数据定时器
    private statusIntervalId: NodeJS.Timeout | null = null; // 设备状态定时器
    private telemetryIntervalId: NodeJS.Timeout | null = null; // 通信数据定时器
    private factoryDevicesIntervalId: NodeJS.Timeout | null = null; // 工厂设备数据定时器
    private latestData: {
        coreMetrics?: CoreMetricData[];
        environment?: EnvironmentData;
        deviceStatus?: DeviceStatusData[];
        telemetry?: DeviceTelemetryData;
        factoryDevices?: FactoryDevice[];
    } = {}; // 按类型存储最新数据
    private readonly defaultDeviceCount: number = 100; // 默认设备数量

    // 设置数据处理器
    public setDataProcessor(dataProcessor: DataProcessor) {
        this.dataProcessor = dataProcessor;
    }

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
                value: 30 + Math.random() * 70, // 30-70%
                location
            },
            {
                deviceId: "000",
                timestamp,
                category: 'memory',
                value: 40 + Math.random() * 60, // 40-70%
                location
            },
            {
                deviceId: "000",
                timestamp,
                category: 'network',
                value: 50 + Math.random() * 100, // 50-180
                location
            },
            {
                deviceId: "000",
                timestamp,
                category: 'online',
                value: 60 + Math.random() * 40, // 60-100
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



    // 生成工厂地图中的设备信息
    private async generateFactoryDevices() {
        // 定义设备类型数组
        const deviceTypes = ['数控机床', '装配线', '焊接机器人', '质检设备', '自动货架', '输送带', '充电桩', '环境监控', 
            '服务器', '网络设备', 'UPS', '检测设备', '分析设备', '空压机', '冷却设备', '电力设备', '处理设备'];
        // 定义区域数组
        const zones = ['production', 'storage', 'office', 'testing', 'maintenance'];
        // 定义位置编码数组
        const positions = [
            '1区1排', '1区2排', '1区3排', '1区4排', '1区5排',
            '2区1排', '2区2排', '2区3排', '2区4排', '2区5排',
            '3区1排', '3区2排', '3区3排',
            '4区1排', '4区2排', '4区3排',
            '5区1排', '5区2排', '5区3排', '5区4排', '5区5排'
        ];
        // 各区范围
        const zoneRanges = {
            production: {
              x: { min: 70, max: 330 },
              y: { min: 70, max: 230 }
            },
            storage: {
              x: { min: 420, max: 730 },
              y: { min: 70, max: 180 }
            },
            office: {
              x: { min: 420, max: 580 },
              y: { min: 270, max: 380 }
            },
            testing: {
              x: { min: 670, max: 730 },
              y: { min: 270, max: 380 }
            },
            maintenance: {
              x: { min: 70, max: 330 },
              y: { min: 320, max: 530 }
            }
        }

        const getRandomStatus = (): 'online' | 'offline' | 'warning' | 'error' => {
            const rand = Math.random();
            if (rand > 0.9) return 'error';
            if (rand > 0.8) return 'warning';
            if (rand > 0.95) return 'offline';
            return 'online';
        };

        // 生成10个设备的数据
        const timestamp = Date.now();
        const devices: FactoryDevice[] = Array.from({ length: 10 }, (_, index) => {
            const deviceNumber = (1001 + index).toString().padStart(4, '0');
            // 先确定区域
            const zone = zones[Math.floor(Math.random() * zones.length)];
            // 根据区域生成对应范围内的x,y坐标
            const range = zoneRanges[zone as keyof typeof zoneRanges];
            const x = Math.floor(Math.random() * (range.x.max - range.x.min)) + range.x.min;
            const y = Math.floor(Math.random() * (range.y.max - range.y.min)) + range.y.min;
            
            return {
                deviceId: deviceNumber,
                name: `设备${deviceNumber}`,
                timestamp: timestamp,
                type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
                x,
                y,
                status: getRandomStatus(),
                zone,
                position: positions[Math.floor(Math.random() * positions.length)],
                location: {
                    lat: 39.5 + (Math.random() - 0.5) * 0.1, // 添加一些随机性
                    lng: 116.5 + (Math.random() - 0.5) * 0.1,
                    accuracy: 1
                },
                parameters: {
                    temperature: Math.round((20 + Math.random() * 40) * 10) / 10, // 20-60°C
                    pressure: Math.round((1 + Math.random() * 9) * 10) / 10, // 1-10 bar
                    vibration: Math.round(Math.random() * 3 * 10) / 10, // 0-3 m/s²
                    power: Math.round((50 + Math.random() * 50)) // 50-100%
                }
            };
        });
        
        // 更新最新数据
        this.latestData.factoryDevices = devices;

        // 推送工厂设备数据
        if (this.dataProcessor) {
            await this.dataProcessor.processAndPush([{
                type: 'factory_devices',
                data: devices
            }]);
        }
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
            //console.log(`[DeviceSimulator] 核心指标数据已更新 - ${new Date().toLocaleString()}`);
        }, 3000);

        // 环境数据（温度） - 1秒更新一次（高频）
        this.environmentIntervalId = setInterval(() => {
            this.generateEnvironmentData();
            //console.log(`[DeviceSimulator] 环境数据已更新 - ${new Date().toLocaleString()}`);
        }, 1000);

        // 初始生成工厂设备数据
        this.generateFactoryDevices().catch(console.error);

        // 通信数据 - 4秒更新一次
        this.telemetryIntervalId = setInterval(() => {
            this.generateTelemetryData();
            //console.log(`[DeviceSimulator] 通信数据已更新 - ${new Date().toLocaleString()}`);
        }, 4000);

        // 工厂设备数据 - 5秒更新一次
        this.factoryDevicesIntervalId = setInterval(() => {
            this.generateFactoryDevices().catch(console.error);
            //console.log(`[DeviceSimulator] 工厂设备数据已更新 - ${new Date().toLocaleString()}`);
        }, 5000);
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
        if (this.factoryDevicesIntervalId) {
            clearInterval(this.factoryDevicesIntervalId);
            this.factoryDevicesIntervalId = null;
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
        if (this.latestData.factoryDevices) {
            result.push({ type: 'factory_devices', data: this.latestData.factoryDevices });
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

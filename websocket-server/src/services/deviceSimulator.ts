import WebSocket from 'ws';
import {
    CoreMetricData,
    EnvironmentData,
    DeviceTelemetryData,
    DeviceStatusData,
    GeoPoint,
    FactoryDevice,
    DEVICE_TYPE_MAP
} from '../types/index';
import { DataProcessor } from './dataProcessor';
// 该文件为设备模拟器，用于模拟生成数据
// 包含正常数据、异常数据，模拟设备连接和断开连接（可手动控制）
// 设备连接断开接口：start，stop

type DeviceDataType = CoreMetricData | EnvironmentData | DeviceTelemetryData | DeviceStatusData;

// 设备类型名称到代号的映射
const DEVICE_TYPE_NAME_TO_CODE: { [key: string]: number } = {
    '数控机床': 0,
    '装配线': 1,
    '焊接机器人': 2,
    '质检设备': 3,
    '自动货架': 4,
    '输送带': 5,
    '环境监控': 6,
    '服务器': 7,
    '检测设备': 8,
    '空压机': 9
};

export class DeviceSimulator {
    private running: boolean = false; // 是否正在生成数据
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

    // 测试模式标志
    private testMode: 'normal' | 'cpu_exceed' | 'temp_sudden' = 'normal';
    private testCounter: number = 0;

    // 设置数据处理器
    public setDataProcessor(dataProcessor: DataProcessor) {
        this.dataProcessor = dataProcessor;
    }

    // 设置测试模式
    public setTestMode(mode: 'normal' | 'cpu_exceed' | 'temp_sudden') {
        this.testMode = mode;
        this.testCounter = 0;
        console.log(`数据模拟器切换到测试模式: ${mode}`);
    }

    // 生成核心指标数据
    private generateCoreMetrics() {
        const timestamp = Date.now();
        let cpuValue: number;

        // 根据测试模式生成不同的CPU数据
        if (this.testMode === 'cpu_exceed') {
            // CPU持续超限测试模式：生成持续>90%的数据
            cpuValue = 91 + Math.random() * 5; // 91-96%
            console.log(`[测试模式-CPU超限] 生成CPU数据: ${cpuValue.toFixed(2)}%`);
        } else {
            // 正常模式
            cpuValue = 30 + Math.random() * 50; // 30-80%
        }

        // 生成四个核心指标
        this.latestData.coreMetrics = [
            {
                deviceId: "000",
                timestamp,
                category: 'cpu',
                value: cpuValue,
            },
            {
                deviceId: "000",
                timestamp,
                category: 'memory',
                value: 40 + Math.random() * 40, // 40-80%
            },
            {
                deviceId: "000",
                timestamp,
                category: 'network',
                value: 50 + Math.random() * 80, // 50-130
            },
            {
                deviceId: "000",
                timestamp,
                category: 'online',
                value: 70 + Math.random() * 30, // 70-100
            }
        ];
    }

    // 生成环境数据（高频单设备）
    private generateEnvironmentData() {
        let tempValue: number;

        // 根据测试模式生成不同的温度数据
        if (this.testMode === 'temp_sudden') {
            this.testCounter++;
            if (this.testCounter <= 30) {
                // 前30个数据点：基线温度（25°C左右）
                tempValue = 25 + Math.random() * 2;
            } else {
                // 后续数据点：突变温度（38°C左右，突变>10°C）
                tempValue = 38 + Math.random() * 2;
                if (this.testCounter === 31) {
                    console.log(`[测试模式-温度突变] 温度从基线25°C突变到${tempValue.toFixed(2)}°C`);
                }
            }
        } else {
            // 正常模式
            tempValue = 22 + Math.random() * 6; // 22-28°C
        }

        this.latestData.environment = {
            deviceId: "001",
            timestamp: Date.now(),
            type: 'temperature',
            value: tempValue,
            unit: '°C'
        };
    }

    // 生成通信数据
    private generateTelemetryData() {
        this.latestData.telemetry = {
            deviceId: "002",
            timestamp: Date.now(),
            dataType: 'upload_frequency',
            value: 60 + Math.floor(Math.random() * 40), // 60-100
        };
    }



    // 生成工厂地图中的设备信息 - 固定10个设备实例
    private async generateFactoryDevices() {
        // 定义固定的10个设备配置（使用设备类型代号）
        const fixedDevices = [
            { deviceId: '1001', name: '数控机床-1', typeCode: 0, zone: 'production', x: 100, y: 100, position: '1区1排' },
            { deviceId: '1002', name: '装配线-1', typeCode: 1, zone: 'production', x: 150, y: 120, position: '1区2排' },
            { deviceId: '1003', name: '焊接机器人-1', typeCode: 2, zone: 'production', x: 200, y: 140, position: '1区3排' },
            { deviceId: '1004', name: '质检设备-1', typeCode: 3, zone: 'production', x: 250, y: 160, position: '1区4排' },
            { deviceId: '1005', name: '自动货架-1', typeCode: 4, zone: 'storage', x: 450, y: 100, position: '2区1排' },
            { deviceId: '1006', name: '输送带-1', typeCode: 5, zone: 'storage', x: 500, y: 120, position: '2区2排' },
            { deviceId: '1007', name: '环境监控-1', typeCode: 6, zone: 'office', x: 450, y: 300, position: '3区1排' },
            { deviceId: '1008', name: '服务器-1', typeCode: 7, zone: 'office', x: 500, y: 320, position: '3区2排' },
            { deviceId: '1009', name: '检测设备-1', typeCode: 8, zone: 'testing', x: 700, y: 300, position: '4区1排' },
            { deviceId: '1010', name: '空压机-1', typeCode: 9, zone: 'maintenance', x: 150, y: 400, position: '5区1排' }
        ];

        const getRandomStatus = (): 'online' | 'offline' | 'warning' | 'error' => {
            const rand = Math.random();
            if (rand > 0.9) return 'error';
            if (rand > 0.8) return 'warning';
            if (rand > 0.95) return 'offline';
            return 'online';
        };

        // 生成10个固定设备的数据 - 每个设备是一个独立实例
        const timestamp = Date.now();
        const devices: FactoryDevice[] = fixedDevices.map(config => {
            return {
                deviceId: config.deviceId,
                name: config.name,
                timestamp: timestamp,
                typeCode: config.typeCode,
                type: DEVICE_TYPE_MAP[config.typeCode as keyof typeof DEVICE_TYPE_MAP], // 添加类型名称用于兼容性
                x: config.x,
                y: config.y,
                status: getRandomStatus(),
                zone: config.zone,
                position: config.position,
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

        // 推送工厂设备数据 - 一次推送10个设备实例
        if (this.dataProcessor) {
            await this.dataProcessor.processAndPush([{
                type: 'factory_devices',
                data: devices
            }]);
        }
    }


    // 手动控制开关，启动数据生成
    public start() {
        if (this.running) return;
        this.running = true;

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

}

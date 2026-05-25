import WebSocket from 'ws';
import { DataProcessor } from './dataProcessor';

// 设备配置定义
interface DeviceConfig {
    deviceId: string;
    deviceType: string;
    line: string;
}

// 设备数据接口
interface DeviceData {
    deviceId: string;
    deviceType: string;
    timestamp: number;
    payload: Record<string, any>;
}

// 保留1001和1003都推送数据：1001始终正常，1003保留闭环演示异常
const DEVICE_CONFIGS: DeviceConfig[] = [
    { deviceId: '1001', deviceType: '调配罐', line: '1' },
    { deviceId: '1003', deviceType: '灌装机', line: '1' }
];

// 数据生成状态管理 - 14秒循环，1001稳定正常，1003连发3个异常点后间隔11秒
class AlarmScenarioGenerator {
    private tickCount: number = 0; // 当前秒数计数器
    private totalTicks: number = 14; // 14秒一个循环：3个异常点 + 11秒间隔

    // 1001 始终正常，用于保持系统内仍有稳定设备数据流
    generateBlenderPayload(): Record<string, any> {
        return {
            temp: {
                value: Math.round((64 + Math.random() * 2) * 100) / 100,
                unit: '℃'
            },
            level: {
                value: Math.round((95 + Math.random() * 10) * 100) / 100,
                unit: 'L'
            },
            current: {
                value: Math.round((18 + Math.random() * 4) * 100) / 100,
                unit: 'A'
            },
            ph: {
                value: Math.round((7.0 + (Math.random() - 0.5) * 0.2) * 100) / 100,
                unit: ''
            }
        };
    }

    // 场景阶段划分（14秒一轮）：
    // 0s      第1个异常点
    // 1s      第2个异常点
    // 2s      第3个异常点
    // 3-13s   正常稳定（间隔11秒）
    private getPhase(): 'normal' | 'anomaly_1' | 'recovery_1' | 'anomaly_2' | 'recovery_2' | 'anomaly_3' {
        if (this.tickCount === 0) return 'anomaly_1';
        if (this.tickCount === 1) return 'anomaly_2';
        if (this.tickCount === 2) return 'anomaly_3';
        return 'normal';
    }

    private getFillVolume(): number {
        const phase = this.getPhase();

        if (phase === 'anomaly_1' || phase === 'anomaly_2' || phase === 'anomaly_3') {
            return 468 + Math.floor(Math.random() * 4);
        }

        return 499 + Math.floor(Math.random() * 4);
    }

    // 灌装机 1003 数据生成
    generateFillerPayload(): Record<string, any> {
        const phase = this.getPhase();

        let fillVolume: number;
        let speedValue: number;
        let pressureValue: number;
        let tempValue: number;

        fillVolume = this.getFillVolume();

        if (phase === 'anomaly_1' || phase === 'anomaly_2' || phase === 'anomaly_3') {
            speedValue = 52 + Math.random() * 2;
            pressureValue = 0.50 + Math.random() * 0.03;
            tempValue = 22 + Math.random() * 2;
        } else {
            speedValue = 50 + Math.random() * 6;
            pressureValue = 0.50 + Math.random() * 0.06;
            tempValue = 21 + Math.random() * 4;
        }

        return {
            fill_volume: {
                value: Math.round(fillVolume * 100) / 100,
                unit: 'ml'
            },
            pressure: {
                value: Math.round(pressureValue * 100) / 100,
                unit: 'MPa'
            },
            speed: {
                value: Math.round(speedValue * 100) / 100,
                unit: '瓶/分'
            },
            temp: {
                value: Math.round(tempValue * 100) / 100,
                unit: '℃'
            },
            demo_phase: phase
        };
    }

    // 获取当前tick的设备数据
    getPayload(deviceType: string): Record<string, any> {
        if (deviceType === '调配罐') {
            return this.generateBlenderPayload();
        }
        if (deviceType === '灌装机') {
            return this.generateFillerPayload();
        }
        return {};
    }

    // 推进到下一秒
    nextTick(): boolean {
        this.tickCount++;
        return this.tickCount < this.totalTicks;
    }

    // 重置计数器
    reset(): void {
        this.tickCount = 0;
    }

    // 获取当前进度
    getProgress(): string {
        return `${this.tickCount + 1}/${this.totalTicks}`;
    }

    // 获取当前tick数
    getCurrentTick(): number {
        return this.tickCount;
    }

    // 是否已完成
    isComplete(): boolean {
        return this.tickCount >= this.totalTicks;
    }
}

export class DeviceSimulator {
    private running: boolean = false;
    private dataProcessor?: DataProcessor;
    private intervalId: NodeJS.Timeout | null = null;
    private latestData: Map<string, DeviceData> = new Map();
    private scenarioGenerator: AlarmScenarioGenerator;

    constructor() {
        this.scenarioGenerator = new AlarmScenarioGenerator();
    }

    // 设置数据处理器
    public setDataProcessor(dataProcessor: DataProcessor) {
        this.dataProcessor = dataProcessor;
    }

    // 生成单台设备数据
    private generateSingleDevice(config: DeviceConfig, timestamp: number): DeviceData {
        const payload = this.scenarioGenerator.getPayload(config.deviceType);

        // 添加产线信息
        payload.line = config.line;

        return {
            deviceId: config.deviceId,
            deviceType: config.deviceType,
            timestamp,
            payload
        };
    }

    // 并发生成所有设备数据
    private async generateAllDevicesData(): Promise<DeviceData[]> {
        const timestamp = Date.now();

        // 2台设备并发生成数据
        const dataPromises = DEVICE_CONFIGS.map(config =>
            Promise.resolve(this.generateSingleDevice(config, timestamp))
        );

        return Promise.all(dataPromises);
    }

    // 批量更新本地缓存
    private updateLocalCache(dataList: DeviceData[]) {
        for (const data of dataList) {
            this.latestData.set(data.deviceId, data);
        }
    }

    // 启动数据生成
    public start() {
        if (this.running) return;
        this.running = true;

        console.log('[DeviceSimulator] 启动数据生成器...');
        console.log(`[DeviceSimulator] 监控设备数: ${DEVICE_CONFIGS.length}`);
        console.log(`[DeviceSimulator] 采集周期: 1000ms (1秒)`);
        console.log(`[DeviceSimulator] 运行模式: 1001正常 + 1003闭环演示`);
        console.log('');
        console.log('=== 数据生成规则 ===');
        console.log('循环周期: 14秒');
        console.log('  - 1001: 全程正常稳定');
        console.log('  - 1003: 异常点连发3次（0/1/2秒），然后间隔11秒再重复');
        console.log('');
        console.log('1001 调配罐:');
        console.log('  正常: 温度64-66℃, 液位95-105L, 电流18-22A, pH 6.9-7.1');
        console.log('');
        console.log('1003 灌装机:');
        console.log('  正常: 灌装量499-502ml, 速度50-56瓶/分, 压力0.50-0.56MPa, 温度21-25℃');
        console.log('  离散异常点: 0/1/2秒连续3次偏低点，之后11秒正常');
        console.log('===================');
        console.log('');

        // 重置场景生成器
        this.scenarioGenerator.reset();

        // 立即执行一次
        this.collectAndPush();

        // 每1秒执行一次批量采集
        this.intervalId = setInterval(() => {
            this.collectAndPush();
        }, 1000);
    }

    // 采集并推送数据
    private async collectAndPush() {
        try {
            // 检查是否已完成所有tick，如果完成则重置继续循环
            if (this.scenarioGenerator.isComplete()) {
                console.log('\n[DeviceSimulator] 一轮场景完成，重置并继续...\n');
                this.scenarioGenerator.reset();
            }

            const progress = this.scenarioGenerator.getProgress();
            const currentTick = this.scenarioGenerator.getCurrentTick();

            // 1. 并发生成所有设备数据（同一时间点）
            const allData = await this.generateAllDevicesData();

            // 2. 更新本地缓存
            this.updateLocalCache(allData);

            // 3. 批量推送给处理器（WebSocket + 数据库）
            if (this.dataProcessor) {
                await this.dataProcessor.processAndPushBatch(allData);
            }

            // 进度日志已关闭，避免每秒刷屏

            // 4. 推进到下一秒
            this.scenarioGenerator.nextTick();

        } catch (error) {
            console.error('[DeviceSimulator] 数据采集失败:', error);
        }
    }

    // 停止数据生成
    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.running = false;
        console.log('[DeviceSimulator] 数据生成器已停止');
    }

    // 获取最新数据（按设备ID）
    public getLatestData(): { type: string; data: any }[] {
        const result: { type: string; data: any }[] = [];

        for (const [deviceId, data] of this.latestData) {
            result.push({
                type: 'device_data',
                data
            });
        }

        return result;
    }

    // 获取指定设备的最新数据
    public getDeviceData(deviceId: string): DeviceData | undefined {
        return this.latestData.get(deviceId);
    }

    // 获取运行状态
    public isRunning(): boolean {
        return this.running;
    }
}

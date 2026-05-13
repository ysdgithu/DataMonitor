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

// 只保留2台设备：调配罐1001和灌装机1003
const DEVICE_CONFIGS: DeviceConfig[] = [
    { deviceId: '1001', deviceType: '调配罐', line: '1' },
    { deviceId: '1003', deviceType: '灌装机', line: '1' }
];

// 数据生成状态管理 - 90秒循环（前30秒正常，30-60秒异常，60-90秒缓冲期确保规则引擎有时间检测）
class AlarmScenarioGenerator {
    private tickCount: number = 0; // 当前秒数计数器
    private totalTicks: number = 90; // 总共90秒一个循环

    // 判断当前是否在异常阶段
    private isAbnormalPhase(): boolean {
        return this.tickCount >= 30 && this.tickCount < 60; // 30-60秒为异常阶段
    }

    // 调配罐 1001 数据生成
    generateBlenderPayload(): Record<string, any> {
        const isAbnormal = this.isAbnormalPhase();

        let tempValue: number;
        let levelValue: number;
        let currentValue: number;
        let phValue: number;

        if (isAbnormal) {
            // 异常阶段（30-60秒）：仅温度异常
            const abnormalTick = this.tickCount - 30; // 0-29

            // 温度：前15秒过低，后15秒过高
            if (abnormalTick < 15) {
                tempValue = 60 + Math.random() * 2; // 60-62℃，过低异常
            } else {
                tempValue = 68 + Math.random() * 2; // 68-70℃，过高异常
            }

            // 其他指标保持正常
            levelValue = 95 + Math.random() * 10; // 95-105L，正常范围
            currentValue = 18 + Math.random() * 4; // 18-22A，正常范围
            phValue = 7.0 + (Math.random() - 0.5) * 0.2; // 6.9-7.1，正常范围
        } else {
            // 正常阶段（0-30秒）
            tempValue = 64 + Math.random() * 2; // 64-66℃，正常范围 [63-67]
            levelValue = 95 + Math.random() * 10; // 95-105L，正常范围
            currentValue = 18 + Math.random() * 4; // 18-22A，正常范围
            phValue = 7.0 + (Math.random() - 0.5) * 0.2; // 6.9-7.1，正常范围
        }

        return {
            temp: {
                value: Math.round(tempValue * 100) / 100,
                unit: '℃'
            },
            level: {
                value: Math.round(levelValue * 100) / 100,
                unit: 'L'
            },
            current: {
                value: Math.round(currentValue * 100) / 100,
                unit: 'A'
            },
            ph: {
                value: Math.round(phValue * 100) / 100,
                unit: ''
            }
        };
    }

    // 灌装机 1003 数据生成
    generateFillerPayload(): Record<string, any> {
        const isAbnormal = this.isAbnormalPhase();

        let fillVolume: number;
        let speedValue: number;
        let pressureValue: number;
        let tempValue: number;

        if (isAbnormal) {
            // 异常阶段（30-60秒）：灌装量异常（对应规则2）
            const abnormalTick = this.tickCount - 30; // 0-29

            // 灌装量：超出 495-505ml 范围
            // 前15秒：偏低（390-400ml）
            // 后15秒：偏高（590-600ml）
            if (abnormalTick < 15) {
                fillVolume = 390 + Math.floor(Math.random() * 10); // 390-400ml，远低于下限
            } else {
                fillVolume = 590 + Math.floor(Math.random() * 10); // 590-600ml，远高于上限
            }

            // 其他指标保持正常
            speedValue = 50 + Math.random() * 10; // 50-60瓶/分，正常范围
            pressureValue = 0.5 + Math.random() * 0.1; // 0.5-0.6 MPa，正常范围
            tempValue = 20 + Math.random() * 5; // 20-25℃，正常范围
        } else {
            // 正常阶段（0-30秒）
            fillVolume = 495 + Math.floor(Math.random() * 10); // 495-505ml，正常范围
            speedValue = 50 + Math.random() * 10; // 50-60瓶/分，正常范围
            pressureValue = 0.5 + Math.random() * 0.1; // 0.5-0.6 MPa，正常范围
            tempValue = 20 + Math.random() * 5; // 20-25℃，正常范围
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
            }
        };
    }

    // 获取当前tick的设备数据
    getPayload(deviceType: string): Record<string, any> {
        if (deviceType === '调配罐') {
            return this.generateBlenderPayload();
        } else if (deviceType === '灌装机') {
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
        console.log(`[DeviceSimulator] 运行模式: 循环运行（60秒一轮）`);
        console.log('');
        console.log('=== 数据生成规则 ===');
        console.log('循环周期: 60秒');
        console.log('  - 0-30秒: 正常数据');
        console.log('  - 30-60秒: 异常数据');
        console.log('');
        console.log('调配罐1001:');
        console.log('  正常: 温度64-66℃, 液位95-105L, 电流18-22A, pH 6.9-7.1');
        console.log('  异常: 仅温度异常 60-62℃(前15s)/68-70℃(后15s)');
        console.log('');
        console.log('灌装机1003:');
        console.log('  正常: 灌装量495-505ml, 速度50-60瓶/分, 压力0.5-0.6MPa, 温度20-25℃');
        console.log('  异常: 仅灌装量异常 390-400ml(前15s)/590-600ml(后15s) → 触发规则2');
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
            const phase = currentTick < 30 ? '正常' : '异常';

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

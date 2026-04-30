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

// 数据生成状态管理
class AlarmScenarioGenerator {
    private tickCount: number = 0; // 当前秒数计数器
    private totalTicks: number = 5; // 总共5秒（全异常）

    // 调配罐 1001 数据生成 - 全异常
    generateBlenderPayload(): Record<string, any> {
        const tick = this.tickCount;
        
        // 温度：全部异常（前3秒过低<63，后2秒过高>67）
        let tempValue: number;
        if (tick < 3) {
            tempValue = 60 + Math.random() * 2; // 60-62℃，过低异常
        } else {
            tempValue = 68 + Math.random() * 2; // 68-70℃，过高异常
        }

        // 液位：固定80L（进料泵故障场景）
        const levelValue = 80;
        // 电流：0A（泵故障）
        const currentValue = 0;
        
        return {
            temp: {
                value: Math.round(tempValue * 100) / 100,
                unit: '℃'
            },
            level: {
                value: levelValue,
                unit: 'L'
            },
            current: {
                value: currentValue,
                unit: 'A'
            },
            ph: {
                value: Math.round((6.0 + Math.random() * 0.5) * 100) / 100, // 偏低
                unit: ''
            }
        };
    }

    // 灌装机 1003 数据生成 - 全异常
    generateFillerPayload(): Record<string, any> {
        const tick = this.tickCount;
        
        // 灌装量：全部异常（前3秒过低<495，后2秒过高>505）
        let fillVolume: number;
        if (tick < 3) {
            fillVolume = 390 + Math.floor(Math.random() * 10); // 390-400ml，过低异常
        } else {
            fillVolume = 590 + Math.floor(Math.random() * 10); // 590-600ml，过高异常
        }

        // 速度：固定40，低于阈值48
        const speedValue = 40;
        
        return {
            fill_volume: {
                value: fillVolume,
                unit: 'ml'
            },
            pressure: {
                value: Math.round((0.3 + Math.random() * 0.2) * 100) / 100, // 偏低压力
                unit: 'MPa'
            },
            speed: {
                value: speedValue,
                unit: '瓶/分'
            },
            temp: {
                value: Math.round((30 + Math.random() * 5) * 100) / 100, // 偏高温度
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

        console.log('[DeviceSimulator] 启动告警场景数据生成器...');
        console.log(`[DeviceSimulator] 监控设备数: ${DEVICE_CONFIGS.length}`);
        console.log(`[DeviceSimulator] 采集周期: 1000ms (1秒)`);
        console.log(`[DeviceSimulator] 运行时长: 5秒（全异常数据）`);
        console.log('');
        console.log('=== 告警场景说明 ===');
        console.log('调配罐1001: 全部异常数据');
        console.log('  - 温度异常: 前3秒60-62℃(过低), 后2秒68-70℃(过高)');
        console.log('  - 进料泵故障: 液位固定80L, 电流=0A');
        console.log('');
        console.log('灌装机1003: 全部异常数据');
        console.log('  - 灌装量异常: 前3秒390-400ml(过低), 后2秒590-600ml(过高)');
        console.log('  - 速度过低: 固定40瓶/分 (<48阈值)');
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

        // 5秒后自动停止
        setTimeout(() => {
            if (this.running) {
                console.log('\n[DeviceSimulator] 5秒运行完成，自动停止');
                this.stop();
            }
        }, 5500);
    }

    // 采集并推送数据
    private async collectAndPush() {
        try {
            // 检查是否已完成所有tick
            if (this.scenarioGenerator.isComplete()) {
                this.stop();
                return;
            }

            const progress = this.scenarioGenerator.getProgress();
            
            // 1. 并发生成所有设备数据（同一时间点）
            const allData = await this.generateAllDevicesData();
            
            // 2. 更新本地缓存
            this.updateLocalCache(allData);

            // 3. 批量推送给处理器（WebSocket + 数据库）
            if (this.dataProcessor) {
                await this.dataProcessor.processAndPushBatch(allData);
            }

            // 打印进度
            const blender = allData.find(d => d.deviceId === '1001');
            const filler = allData.find(d => d.deviceId === '1003');
            
            console.log(`[${progress}] 调配罐1001: temp=${blender?.payload.temp.value}℃ level=${blender?.payload.level.value}L current=${blender?.payload.current.value}A | 灌装机1003: fill=${filler?.payload.fill_volume.value}ml speed=${filler?.payload.speed.value}瓶/分`);

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

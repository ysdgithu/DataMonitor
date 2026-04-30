import DatabaseConnection from './database/connection';
import { DataModel } from './database/models';
import { initDatabase } from './database/init';
import { RuleEngine, AlarmEvent } from './services/ruleEngine';

// ==================== 设备数据接口 ====================
interface DeviceConfig {
    deviceId: string;
    deviceType: string;
    line: string;
}

interface DeviceData {
    deviceId: string;
    deviceType: string;
    timestamp: number;
    payload: Record<string, any>;
}

// ==================== 数据生成器 ====================
const DEVICE_CONFIGS: DeviceConfig[] = [
    { deviceId: '1001', deviceType: '调配罐', line: '1' },
    { deviceId: '1003', deviceType: '灌装机', line: '1' }
];

class DataGenerator {
    private tickCount: number = 0;
    private totalTicks: number = 5;
    private running: boolean = false;
    private intervalId: NodeJS.Timeout | null = null;
    private dataModel: DataModel;

    constructor() {
        this.dataModel = new DataModel();
    }

    // 生成调配罐数据 - 全异常
    private generateBlenderPayload(tick: number): Record<string, any> {
        const tempValue = tick < 3
            ? 60 + Math.random() * 2  // 60-62℃ 过低
            : 68 + Math.random() * 2; // 68-70℃ 过高

        return {
            temp: { value: Math.round(tempValue * 100) / 100, unit: '℃' },
            level: { value: 80, unit: 'L' },
            current: { value: 0, unit: 'A' },
            ph: { value: Math.round((6.0 + Math.random() * 0.5) * 100) / 100, unit: '' },
            line: '1'
        };
    }

    // 生成灌装机数据 - 全异常
    private generateFillerPayload(tick: number): Record<string, any> {
        const fillVolume = tick < 3
            ? 390 + Math.floor(Math.random() * 10)  // 390-400ml 过低
            : 590 + Math.floor(Math.random() * 10); // 590-600ml 过高

        return {
            fill_volume: { value: fillVolume, unit: 'ml' },
            pressure: { value: Math.round((0.3 + Math.random() * 0.2) * 100) / 100, unit: 'MPa' },
            speed: { value: 40, unit: '瓶/分' },
            temp: { value: Math.round((30 + Math.random() * 5) * 100) / 100, unit: '℃' },
            line: '1'
        };
    }

    private generateDeviceData(config: DeviceConfig, timestamp: number): DeviceData {
        const payload = config.deviceType === '调配罐'
            ? this.generateBlenderPayload(this.tickCount)
            : this.generateFillerPayload(this.tickCount);

        return {
            deviceId: config.deviceId,
            deviceType: config.deviceType,
            timestamp,
            payload
        };
    }

    async generateAllDevices(): Promise<DeviceData[]> {
        const timestamp = Date.now();
        return DEVICE_CONFIGS.map(config => this.generateDeviceData(config, timestamp));
    }

    // 启动数据生成
    async start(onData: (data: DeviceData[]) => void): Promise<void> {
        if (this.running) return;
        this.running = true;
        this.tickCount = 0;

        console.log('[DataGenerator] 启动数据生成器...');
        console.log('[DataGenerator] 设备: 1001(调配罐), 1003(灌装机)');
        console.log('[DataGenerator] 频率: 1秒/次, 时长: 5秒, 全部异常数据\n');

        // 立即执行第一次
        await this.tick(onData);

        // 每秒执行一次
        this.intervalId = setInterval(async () => {
            await this.tick(onData);
        }, 1000);
    }

    private async tick(onData: (data: DeviceData[]) => void): Promise<void> {
        if (this.tickCount >= this.totalTicks) {
            this.stop();
            return;
        }

        const data = await this.generateAllDevices();

        // 写入数据库
        try {
            await this.dataModel.batchInsertDeviceData(data);
        } catch (err) {
            console.error('[DataGenerator] 写入数据库失败:', err);
        }

        // 回调通知
        onData(data);

        // 打印进度
        const blender = data.find(d => d.deviceId === '1001');
        const filler = data.find(d => d.deviceId === '1003');
        console.log(`[${this.tickCount + 1}/5] 1001: temp=${blender?.payload.temp.value}℃ | 1003: fill=${filler?.payload.fill_volume.value}ml`);

        this.tickCount++;

        if (this.tickCount >= this.totalTicks) {
            setTimeout(() => this.stop(), 100);
        }
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.running = false;
        console.log('\n[DataGenerator] 数据生成器已停止');
    }

    isRunning(): boolean {
        return this.running;
    }
}

// ==================== 简化的规则引擎（用于独立运行）====================
class SimpleRuleEngine {
    private db: DatabaseConnection;
    private intervalId: NodeJS.Timeout | null = null;
    private alarmCounter: number = 0;
    private expectedAlarms: number = 10; // 预期10次异常
    private lastCheckTimestamp: number = 0; // 记录上次检测的时间点，避免重复检测

    constructor() {
        this.db = DatabaseConnection.getInstance();
    }

    // 启动规则引擎（延迟5秒后启动）
    start(): void {
        console.log('[RuleEngine] 规则引擎将在5秒后启动...');
        console.log('[RuleEngine] 预期检测: 10次异常 (5秒 × 2台设备)\n');

        // 记录启动时间，从这个时间开始检测
        const startTime = Date.now();

        setTimeout(() => {
            console.log('[RuleEngine] 规则引擎启动，开始定时检测...\n');
            // 从启动时间开始检测，避免检测到启动前的历史数据
            this.lastCheckTimestamp = startTime;
            this.executeCheck(); // 立即执行一次
            this.intervalId = setInterval(() => this.executeCheck(), 5000);
        }, 5000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        console.log('\n[RuleEngine] 规则引擎已停止');
        console.log(`\n总计检测到异常: ${this.alarmCounter} 次`);
    }

    private async executeCheck(): Promise<void> {
        const now = Date.now();

        // 只检测从上次检测到现在的新数据
        const checkStartTime = this.lastCheckTimestamp || 0;
        const checkEndTime = now;

        console.log(`[RuleEngine] 执行检测: ${new Date(checkStartTime).toLocaleTimeString()} ~ ${new Date(checkEndTime).toLocaleTimeString()}`);

        try {
            // 1. 读取生效的规则
            const rules = await this.loadRules();
            if (rules.length === 0) {
                console.log('[RuleEngine] 没有生效的规则');
                return;
            }

            // 2. 拉取新数据（只拉取上次检测后的数据）
            for (const deviceId of ['1001', '1003']) {
                const data = await this.pullDeviceData(deviceId, checkStartTime, checkEndTime);
                if (data.length === 0) {
                    console.log(`[RuleEngine]   设备${deviceId}: 无新数据`);
                    continue;
                }

                console.log(`[RuleEngine]   设备${deviceId}: ${data.length}条新数据`);
                const deviceType = deviceId === '1001' ? '调配罐' : '灌装机';

                // 3. 检查每条规则
                for (const rule of rules) {
                    if (rule.device_type !== deviceType) continue;

                    // 4. 阈值判断（只检测新数据）
                    for (const record of data) {
                        const isAlarm = this.checkThreshold(record, rule);
                        if (isAlarm) {
                            this.alarmCounter++;
                            console.log(`  [异常${this.alarmCounter}] ${deviceId} ${rule.rule_name} (时间: ${new Date(record.timestamp).toLocaleTimeString()})`);
                        }
                    }
                }
            }

            // 更新检测时间戳
            this.lastCheckTimestamp = checkEndTime;

            // 检查是否达到预期次数
            if (this.alarmCounter >= this.expectedAlarms) {
                console.log(`\n✅ 已达到预期异常次数: ${this.expectedAlarms}`);
                setTimeout(() => this.stop(), 500);
                setTimeout(() => process.exit(0), 1000);
            }

        } catch (error) {
            console.error('[RuleEngine] 检测失败:', error);
        }
    }

    private async loadRules(): Promise<any[]> {
        const sql = `
            SELECT id, rule_name, device_type, params,
                   threshold_max, threshold_min, alarm_level
            FROM alarm_rule
            WHERE status = 1 AND is_deleted = 0
        `;
        return await this.db.all(sql);
    }

    private async pullDeviceData(deviceId: string, startTime: number, endTime: number): Promise<any[]> {
        const sql = `
            SELECT device_id, data_type, timestamp, payload
            FROM device_data
            WHERE device_id = ? AND timestamp > ? AND timestamp <= ?
            ORDER BY timestamp ASC
        `;
        // 注意：使用 timestamp > startTime（不含等于）避免重复检测边界数据
        const rows = await this.db.all(sql, [deviceId, startTime, endTime]);

        return rows.map(row => {
            let payload = row.payload;
            if (typeof payload === 'string') {
                try { payload = JSON.parse(payload); } catch (e) {}
            }
            return { ...row, payload };
        });
    }

    private checkThreshold(record: any, rule: any): boolean {
        const paramName = rule.params.trim();
        const value = record.payload?.[paramName]?.value;

        if (value === undefined) return false;

        // 检查上限
        if (rule.threshold_max !== null && value > rule.threshold_max) {
            return true;
        }
        // 检查下限
        if (rule.threshold_min !== null && value < rule.threshold_min) {
            return true;
        }
        return false;
    }
}

// ==================== 主程序 ====================
async function main() {
    console.log('=== 独立运行模式：数据生成器 + 规则引擎 ===\n');

    // 1. 初始化数据库
    try {
        console.log('[System] 初始化数据库...');
        await initDatabase();
        console.log('[System] 数据库初始化完成\n');
    } catch (error) {
        console.error('[System] 数据库初始化失败:', error);
        process.exit(1);
    }

    // 2. 清空历史数据（确保干净的测试环境）
    try {
        const db = DatabaseConnection.getInstance();
        await db.run('DELETE FROM device_data');
        console.log('[System] 已清空历史数据\n');
    } catch (error) {
        console.error('[System] 清空历史数据失败:', error);
    }

    const dataGenerator = new DataGenerator();
    const ruleEngine = new SimpleRuleEngine();

    // 2. 启动规则引擎（它会自己延迟5秒）
    ruleEngine.start();

    // 3. 立即启动数据生成器
    await dataGenerator.start((data) => {
        // 数据已写入数据库，规则引擎会去拉取
    });

    // 4. 等待完成（最多15秒）
    setTimeout(() => {
        console.log('\n[System] 运行超时，强制退出');
        dataGenerator.stop();
        ruleEngine.stop();
        process.exit(0);
    }, 15000);
}

main().catch(error => {
    console.error('[System] 运行失败:', error);
    process.exit(1);
});

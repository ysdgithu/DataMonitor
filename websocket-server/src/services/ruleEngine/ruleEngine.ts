// 规则引擎主类
import DatabaseConnection from '../../database/connection';
import { DataModel } from '../../database/models';
import { AtomEvaluator } from './atomEvaluator';
import {
    AlarmRule,
    AlarmEvent,
    EvaluateContext,
    EvaluateResult,
    RuleAtom
} from './types';

/**
 * 规则引擎配置
 */
interface RuleEngineConfig {
    checkInterval: number;     // 检查间隔（毫秒），默认5000
    historyBuffer: number;     // 历史数据缓冲时间（毫秒），默认600000（10分钟）
}

/**
 * 规则引擎
 *
 * 执行流程：
 * 定时（5s）→读规则→拉历史→套原子→判异常！
 */
export class RuleEngine {
    private db: DatabaseConnection;
    private dataModel: DataModel;
    private evaluator: AtomEvaluator;
    private config: RuleEngineConfig;
    private intervalId: NodeJS.Timeout | null = null;
    private rules: AlarmRule[] = [];
    private isRunning: boolean = false;

    // 告警回调函数
    private onAlarmCallback?: (event: AlarmEvent) => void;

    // 【新增】诊断任务去重缓存 - 记录最后创建时间
    private taskCreationCache: Map<string, number> = new Map();
    private readonly TASK_DEDUP_INTERVAL = 60000; // 60秒内同一规则+设备不重复创建任务

    constructor(config?: Partial<RuleEngineConfig>) {
        this.db = DatabaseConnection.getInstance();
        this.dataModel = new DataModel();
        this.evaluator = new AtomEvaluator();
        this.config = {
            checkInterval: 5000,       // 默认5秒
            historyBuffer: 600000,     // 默认10分钟历史数据
            ...config
        };
    }

    /**
     * 设置告警回调
     */
    onAlarm(callback: (event: AlarmEvent) => void): void {
        this.onAlarmCallback = callback;
    }

    /**
     * 启动规则引擎（事件驱动模式）
     */
    async start(): Promise<void> {
        if (this.isRunning) return;

        console.log('[RuleEngine] 启动规则引擎（事件驱动模式）...');

        // 1. 加载规则
        await this.loadRules();

        this.isRunning = true;

        console.log('[RuleEngine] 规则引擎已启动');
    }

    /**
     * 停止规则引擎
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('[RuleEngine] 规则引擎已停止');
    }

    /**
     * 加载规则
     * 从数据库 alarm_rule 表加载启用的规则
     */
    private async loadRules(): Promise<void> {
        try {
            // 从 alarm_rule 表加载启用的规则
            const sql = `
                SELECT
                    id, rule_name, device_type, params,
                    threshold_max, threshold_min, duration, \`count\`,
                    alarm_level, handle_suggest, status
                FROM alarm_rule
                WHERE status = 1 AND is_deleted = 0
            `;

            const rows = await this.db.all(sql);

            // 将数据库规则转换为 RuleAtom 结构
            this.rules = rows.map(row => this.parseDbRuleToAtom(row));

            console.log(`[RuleEngine] 从数据库加载了 ${this.rules.length} 条规则`);
        } catch (error) {
            console.error('[RuleEngine] 加载规则失败:', error);
            this.rules = [];
        }
    }

    /**
     * 将数据库规则解析为 RuleAtom 结构
     */
    private parseDbRuleToAtom(row: any): AlarmRule {
        const param = row.params.trim();
        const hasDuration = row.duration > 0;
        const hasCount = row.count > 0;

        // 构建阈值原子（单参数，支持上下限）
        let rootAtom: RuleAtom;

        // 同时有上下限时，使用 threshold_range 原子（区间外触发）
        if (row.threshold_max !== null && row.threshold_max !== undefined &&
            row.threshold_min !== null && row.threshold_min !== undefined) {
            // 值在 [min, max] 范围内为正常，超出范围触发告警
            rootAtom = {
                type: 'threshold_range',
                config: {
                    param: `payload.${param}.value`,
                    min: parseFloat(row.threshold_min),
                    max: parseFloat(row.threshold_max)
                }
            };
        } else if (row.threshold_max !== null && row.threshold_max !== undefined) {
            // 只有上限
            rootAtom = {
                type: 'threshold',
                config: {
                    param: `payload.${param}.value`,
                    operator: '>',
                    value: parseFloat(row.threshold_max)
                }
            };
        } else if (row.threshold_min !== null && row.threshold_min !== undefined) {
            // 只有下限
            rootAtom = {
                type: 'threshold',
                config: {
                    param: `payload.${param}.value`,
                    operator: '<',
                    value: parseFloat(row.threshold_min)
                }
            };
        } else {
            // 没有阈值条件，返回始终为false的原子
            rootAtom = {
                type: 'threshold',
                config: {
                    param: `payload.${param}.value`,
                    operator: '>',
                    value: 999999
                }
            };
        }

        // 包装持续时间判断
        if (hasDuration) {
            rootAtom = {
                type: 'duration',
                config: {
                    duration: row.duration * 1000, // 秒转毫秒
                    minCount: hasCount ? row.count : Math.max(3, Math.floor(row.duration / 2)),
                    baseAtom: rootAtom
                }
            };
        } else if (hasCount) {
            // 只有次数没有持续时间，用duration的minCount实现
            rootAtom = {
                type: 'duration',
                config: {
                    duration: 3600000, // 默认1小时内
                    minCount: row.count,
                    baseAtom: rootAtom
                }
            };
        }

        return {
            id: row.id,
            name: row.rule_name,
            deviceId: undefined,  // 不指定具体设备，按设备类型匹配
            deviceType: row.device_type,
            enabled: row.status === 1,
            rootAtom,
            description: row.handle_suggest
        };
    }


    /**
     * 实时评估单个设备（事件驱动）
     * @param deviceId 设备ID
     * @param timestamp 数据时间戳
     */
    public async evaluateDeviceRealtime(deviceId: string, timestamp: number): Promise<void> {
        if (!this.isRunning) return;
        if (this.rules.length === 0) return;

        // 查找该设备相关的所有规则
        const relatedRules = this.rules.filter(rule => {
            if (!rule.enabled) return false;
            // 如果规则指定了设备ID，必须匹配
            if (rule.deviceId && rule.deviceId !== deviceId) return false;
            // 如果规则只指定了设备类型，需要查询设备类型（这里简化处理，假设都匹配）
            return true;
        });

        if (relatedRules.length === 0) return;

        for (const rule of relatedRules) {
            try {
                // 获取设备类型
                const deviceType = await this.getDeviceType(deviceId);
                if (!deviceType) continue;

                // 如果规则指定了设备类型，检查是否匹配
                if (rule.deviceType && rule.deviceType !== deviceType) continue;

                // 拉取历史数据
                const historyData = await this.pullHistory(deviceId, this.config.historyBuffer);
                if (historyData.length === 0) continue;

                // 构建评估上下文
                const currentData = historyData[historyData.length - 1];
                const context: EvaluateContext = {
                    deviceId,
                    deviceType,
                    currentData,
                    historyData,
                    timestamp
                };

                // 评估规则
                const result = this.evaluator.evaluate(rule.rootAtom, context);

                // 触发告警
                if (result.triggered) {
                    console.log(`[RuleEngine] 🔔 实时检测到告警: 规则[${rule.id}] ${rule.name}, 设备${deviceId}`);
                    await this.triggerAlarm(rule, { deviceId, deviceType }, result, timestamp);
                }

            } catch (error) {
                console.error(`[RuleEngine] 实时评估失败，规则 ${rule.id}, 设备 ${deviceId}:`, error);
            }
        }
    }

    /**
     * 获取设备类型
     */
    private async getDeviceType(deviceId: string): Promise<string | null> {
        try {
            const sql = `SELECT data_type FROM device_data WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1`;
            const row = await this.db.get(sql, [deviceId]);
            return row ? row.data_type : null;
        } catch (error) {
            console.error(`[RuleEngine] 获取设备类型失败:`, error);
            return null;
        }
    }

    /**
     * 执行一次检查
     * 流程：读规则 → 拉历史 → 套原子 → 判异常
     */
    private async executeCheck(): Promise<void> {
        const now = Date.now();

        if (this.rules.length === 0) {
            console.log('[RuleEngine] ⚠️ 没有加载任何规则');
            return;
        }

        for (const rule of this.rules) {
            if (!rule.enabled) continue;

            try {
                // 1. 获取该规则匹配的设备
                const devices = await this.getMatchingDevices(rule);

                for (const device of devices) {
                    // 2. 拉取历史数据
                    const historyData = await this.pullHistory(
                        device.deviceId,
                        this.config.historyBuffer
                    );

                    if (historyData.length === 0) continue;

                    // 3. 构建评估上下文（使用数据中的最新时间戳，而不是当前时间）
                    const currentData = historyData[historyData.length - 1];
                    const dataTimestamp = currentData.timestamp; // 使用数据的实际时间戳

                    const context: EvaluateContext = {
                        deviceId: device.deviceId,
                        deviceType: device.deviceType,
                        currentData,
                        historyData,
                        timestamp: dataTimestamp  // 使用数据时间戳而非当前时间
                    };

                    // 4. 评估规则
                    const result = this.evaluator.evaluate(rule.rootAtom, context);

                    // 5. 触发告警
                    if (result.triggered) {
                        await this.triggerAlarm(rule, device, result, dataTimestamp);
                    }
                }

            } catch (error) {
                console.error(`[RuleEngine] 规则 ${rule.id} 执行失败:`, error);
            }
        }
    }

    /**
     * 获取匹配规则的所有设备
     */
    private async getMatchingDevices(rule: AlarmRule): Promise<Array<{deviceId: string, deviceType: string}>> {
        // 如果规则指定了具体设备ID
        if (rule.deviceId) {
            return [{
                deviceId: rule.deviceId,
                deviceType: rule.deviceType
            }];
        }

        // 否则查询该类型的所有设备
        const sql = `
            SELECT DISTINCT device_id as deviceId, data_type as deviceType
            FROM device_data
            WHERE data_type = ?
        `;

        const rows = await this.db.all(sql, [rule.deviceType]);

        if (rows.length === 0) {
            // 如果没有数据，返回默认设备ID
            return this.getDefaultDevicesByType(rule.deviceType);
        }

        return rows;
    }

    /**
     * 根据设备类型获取默认设备列表
     */
    private getDefaultDevicesByType(deviceType: string): Array<{deviceId: string, deviceType: string}> {
        const deviceMap: Record<string, string[]> = {
            '调配罐': ['1001', '1006'],
            '洗瓶机': ['1002', '1007'],
            '灌装机': ['1003', '1008'],
            '封盖机': ['1004', '1009'],
            '贴标机': ['1005', '1010']
        };

        const deviceIds = deviceMap[deviceType] || [];
        return deviceIds.map(id => ({
            deviceId: id,
            deviceType
        }));
    }

    /**
     * 拉取设备历史数据（不按系统时间限制，按数据实际时间）
     */
    private async pullHistory(deviceId: string, _duration: number): Promise<any[]> {
        // 查询该设备所有历史数据（不按系统时间限制）
        const sql = `
            SELECT
                id,
                device_id as deviceId,
                data_type as deviceType,
                timestamp,
                payload
            FROM device_data
            WHERE device_id = ?
            ORDER BY timestamp ASC
        `;

        const rows = await this.db.all(sql, [deviceId]);

        // 解析 payload JSON
        return rows.map(row => {
            let payload = row.payload;
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch (e) {
                    console.error('[RuleEngine] payload解析失败:', e);
                }
            }
            return {
                ...row,
                payload
            };
        });
    }

    /**
     * 触发告警
     */
    private async triggerAlarm(
        rule: AlarmRule,
        device: {deviceId: string, deviceType: string},
        result: EvaluateResult,
        timestamp: number
    ): Promise<void> {
        // 提取参数名称和当前值
        let parameterName = '';
        let currentValue: number | undefined = undefined;
        let threshold = '';

        // 从规则的 rootAtom 中提取参数信息
        if (rule.rootAtom) {
            let atom = rule.rootAtom;
            let config = atom.config;

            // 【修复】如果是 duration 原子，需要提取 baseAtom
            if (atom.type === 'duration' && 'baseAtom' in config) {
                atom = config.baseAtom as RuleAtom;
                config = atom.config;
            }

            // 使用类型守卫提取参数名
            if ('param' in config && typeof config.param === 'string') {
                // 从 "payload.temp.value" 中提取 "temp"
                const match = config.param.match(/payload\.(\w+)\.value/);
                if (match) {
                    parameterName = match[1];
                }
            }

            // 构建阈值字符串
            if (atom.type === 'threshold_range' && 'min' in config && 'max' in config) {
                threshold = `${config.min}-${config.max}`;
            } else if (atom.type === 'threshold' && 'operator' in config && 'value' in config) {
                threshold = `${config.operator} ${config.value}`;
            }
        }

        // 【修复】从上下文中提取当前值
        if (result.context) {
            try {
                // 优先从 value 字段提取（threshold/threshold_range 原子返回的）
                if (typeof result.context.value === 'number') {
                    currentValue = result.context.value;
                }
                // 如果没有 value，尝试通过参数名提取
                else if (parameterName && typeof result.context[parameterName] === 'number') {
                    currentValue = result.context[parameterName];
                }
                // 尝试 paramValue 字段
                else if (typeof result.context.paramValue === 'number') {
                    currentValue = result.context.paramValue;
                }

                console.log(`[RuleEngine] 提取参数值: ${parameterName} = ${currentValue}`);
            } catch (e) {
                console.warn('[RuleEngine] 提取参数值失败:', e);
            }
        }

        // 默认告警等级为 medium
        const severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

        const event: AlarmEvent = {
            ruleId: rule.id,
            ruleName: rule.name,
            deviceId: device.deviceId,
            deviceType: device.deviceType,
            timestamp,
            message: result.message || `规则 ${rule.name} 触发`,
            details: result.context,
            // 前端展示字段
            parameterName,
            currentValue,
            threshold,
            severity,
            triggerTime: timestamp
        };

        // 打印告警
        console.log('\n🔔 [告警触发] ==========================');
        console.log(`规则: ${event.ruleName} [ID:${event.ruleId}]`);
        console.log(`设备: ${event.deviceId} (${event.deviceType})`);
        console.log(`时间: ${new Date(event.timestamp).toLocaleString()}`);
        console.log(`参数: ${parameterName} = ${currentValue} (阈值: ${threshold})`);
        console.log(`等级: ${severity}`);
        console.log(`信息: ${event.message}`);
        console.log(`详情:`, JSON.stringify(event.details, null, 2));
        console.log('========================================\n');

        // 写入诊断任务表
        try {
            await this.createDiagnosisTask(event, rule);
        } catch (error) {
            console.error('[RuleEngine] 写入诊断任务失败:', error);
        }

        // 回调通知
        if (this.onAlarmCallback) {
            this.onAlarmCallback(event);
        }
    }

    /**
     * 创建诊断任务（带去重机制）
     */
    private async createDiagnosisTask(event: AlarmEvent, rule: AlarmRule): Promise<void> {
        const now = Date.now();

        // 【去重检查】同一规则+设备在60秒内不重复创建任务
        const dedupKey = `${event.ruleId}-${event.deviceId}`;
        const lastCreateTime = this.taskCreationCache.get(dedupKey);

        if (lastCreateTime && (now - lastCreateTime) < this.TASK_DEDUP_INTERVAL) {
            const timeSinceLastCreate = Math.round((now - lastCreateTime) / 1000);
            console.log(`[RuleEngine] ⏭️  诊断任务去重: ${dedupKey} (距上次创建 ${timeSinceLastCreate}s < 60s)`);
            return; // 跳过重复创建
        }

        // 生成任务名称
        const taskName = `${event.ruleName}`;

        // 构造任务详情
        const detail = `告警规则: ${event.ruleName}\n` +
                      `触发时间: ${new Date(event.timestamp).toLocaleString()}\n` +
                      `告警信息: ${event.message}\n` +
                      `详细数据: ${JSON.stringify(event.details, null, 2)}`;

        const sql = `
            INSERT INTO diagnosis_tasks
            (name, device_id, status, priority, detail, assignee, create_time, update_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await this.db.run(sql, [
            taskName,
            event.deviceId,
            0,
            rule.description ? 2 : 1,  // priority: 有处置建议的设为2-重要，否则1-一般
            detail,
            'system',   // assignee: 系统默认分配
            now,
            now
        ]);

        // 【更新去重缓存】
        this.taskCreationCache.set(dedupKey, now);

        console.log(`[RuleEngine] ✅ 已创建诊断任务: ${taskName} (设备: ${event.deviceId})`);
    }

    /**
     * 手动重载规则（用于后台修改规则后即时生效）
     */
    async reloadRules(): Promise<void> {
        await this.loadRules();
        console.log('[RuleEngine] 🔄 规则已手动重载');
    }

    /**
     * 获取当前规则列表
     */
    getRules(): AlarmRule[] {
        return [...this.rules];
    }

    /**
     * 动态添加规则
     */
    addRule(rule: AlarmRule): void {
        this.rules.push(rule);
        console.log(`[RuleEngine] 添加规则: ${rule.name}`);
    }

    /**
     * 启用/禁用规则
     */
    setRuleEnabled(ruleId: number, enabled: boolean): void {
        const rule = this.rules.find(r => r.id === ruleId);
        if (rule) {
            rule.enabled = enabled;
            console.log(`[RuleEngine] 规则 ${ruleId} ${enabled ? '启用' : '禁用'}`);
        }
    }
}

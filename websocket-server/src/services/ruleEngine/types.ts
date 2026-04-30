// 规则引擎类型定义

/**
 * 规则原子类型
 */
export type AtomType = 'threshold' | 'threshold_range' | 'duration';

/**
 * 阈值操作符
 */
export type Operator = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'between';

/**
 * 基础规则原子
 */
export interface RuleAtom {
    type: AtomType;
    config: ThresholdConfig | ThresholdRangeConfig | DurationConfig;
}

/**
 * 单参数阈值配置
 * 示例: { param: 'temp.value', operator: '>', value: 70 }
 */
export interface ThresholdConfig {
    param: string;        // 参数路径，如 'temp.value' 或 'payload.temp.value'
    operator: Operator;   // 比较操作符
    value: number;        // 比较值
    value2?: number;      // 用于 between 的第二个值
}

/**
 * 范围阈值配置（同时判断上下限）
 * 示例: { param: 'temp.value', min: 63, max: 67 }
 * 触发条件: value < min || value > max
 */
export interface ThresholdRangeConfig {
    param: string;        // 参数路径
    min: number;          // 下限值
    max: number;          // 上限值
}

/**
 * 时序持续配置
 * 示例: { baseAtom: {...}, duration: 300000 }  // 持续5分钟
 */
export interface DurationConfig {
    baseAtom: RuleAtom;   // 基于哪个原子判断
    duration: number;     // 持续时间（毫秒）
    minCount?: number;    // 最少数据条数（可选，用于低频数据）
}

/**
 * 告警规则
 */
export interface AlarmRule {
    id: number;
    name: string;              // 规则名称
    deviceType: string;        // 设备类型，如 '调配罐'
    deviceId?: string;         // 特定设备ID（可选）
    rootAtom: RuleAtom;        // 规则根原子
    enabled: boolean;          // 是否启用
    description?: string;      // 规则描述
}

/**
 * 评估上下文
 */
export interface EvaluateContext {
    deviceId: string;
    deviceType: string;
    currentData: any;          // 当前数据点
    historyData: any[];        // 历史数据数组
    timestamp: number;         // 当前时间戳
}

/**
 * 评估结果
 */
export interface EvaluateResult {
    triggered: boolean;        // 是否触发
    context?: any;             // 触发上下文（用于日志）
    message?: string;          // 触发信息
}

/**
 * 异常告警
 */
export interface AlarmEvent {
    ruleId: number;
    ruleName: string;
    deviceId: string;
    deviceType: string;
    timestamp: number;
    message: string;
    details: any;
    // 前端展示需要的额外字段
    parameterName?: string;
    currentValue?: number;
    threshold?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    triggerTime?: number; // 触发时间(与timestamp相同,为了兼容)
}

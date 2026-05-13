// 原子评估器 - 实现规则原子的评估逻辑
import {
    RuleAtom,
    ThresholdConfig,
    ThresholdRangeConfig,
    DurationConfig,
    EvaluateContext,
    EvaluateResult,
    Operator
} from './types';

/**
 * 从对象中获取嵌套属性值
 * 例如: getNestedValue({payload: {temp: {value: 65}}}, 'payload.temp.value') => 65
 */
function getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
        if (value === null || value === undefined) return undefined;
        value = value[key];
    }
    return value;
}

/**
 * 执行数值比较
 */
function compare(value: number, operator: Operator, target: number, target2?: number): boolean {
    switch (operator) {
        case '>': return value > target;
        case '<': return value < target;
        case '>=': return value >= target;
        case '<=': return value <= target;
        case '==': return value === target;
        case '!=': return value !== target;
        case 'between':
            if (target2 === undefined) throw new Error('between operator requires value2');
            return value >= target && value <= target2;
        default:
            throw new Error(`Unknown operator: ${operator}`);
    }
}

/**
 * 原子评估器类
 */
export class AtomEvaluator {

    /**
     * 评估入口
     */
    evaluate(atom: RuleAtom, context: EvaluateContext): EvaluateResult {
        switch (atom.type) {
            case 'threshold':
                return this.evaluateThreshold(atom.config as ThresholdConfig, context);
            case 'threshold_range':
                return this.evaluateThresholdRange(atom.config as ThresholdRangeConfig, context);
            case 'duration':
                return this.evaluateDuration(atom.config as DurationConfig, context);
            default:
                throw new Error(`Unknown atom type: ${(atom as any).type}`);
        }
    }

    /**
     * 单参数阈值评估（原子1）
     * 判断当前数据是否满足阈值条件
     */
    private evaluateThreshold(config: ThresholdConfig, context: EvaluateContext): EvaluateResult {
        const { param, operator, value, value2 } = config;
        const { currentData } = context;

        // 获取参数值
        const paramValue = getNestedValue(currentData, param);

        if (paramValue === undefined) {
            return {
                triggered: false,
                message: `参数 ${param} 不存在`
            };
        }

        if (typeof paramValue !== 'number') {
            return {
                triggered: false,
                message: `参数 ${param} 不是数值类型`
            };
        }

        // 执行比较
        const triggered = compare(paramValue, operator, value, value2);

        return {
            triggered,
            context: { param, value: paramValue, operator, threshold: value },
            message: triggered
                ? `参数 ${param} = ${paramValue} 满足条件 ${operator} ${value}`
                : `参数 ${param} = ${paramValue} 不满足条件`
        };
    }

    /**
     * 范围阈值评估（同时判断上下限）
     * 规则：value < min || value > max 时触发
     *
     * @param config 范围阈值配置
     * @param context 评估上下文
     */
    private evaluateThresholdRange(config: ThresholdRangeConfig, context: EvaluateContext): EvaluateResult {
        const { param, min, max } = config;
        const { currentData } = context;

        // 获取参数值
        const paramValue = getNestedValue(currentData, param);

        if (paramValue === undefined) {
            return {
                triggered: false,
                message: `参数 ${param} 不存在`
            };
        }

        if (typeof paramValue !== 'number') {
            return {
                triggered: false,
                message: `参数 ${param} 不是数值类型`
            };
        }

        // 判断是否超出范围
        const triggered = paramValue < min || paramValue > max;

        return {
            triggered,
            context: { param, value: paramValue, min, max },
            message: triggered
                ? `参数 ${param} = ${paramValue} 超出范围 [${min}, ${max}]`
                : `参数 ${param} = ${paramValue} 在范围 [${min}, ${max}] 内，正常`
        };
    }

    /**
     * 时序持续评估（原子2）- 优化版
     *
     * 新逻辑：
     * 1. 在时间窗口内收集所有异常数据点
     * 2. 检查异常次数是否达标（minCount）
     * 3. 检查首尾时间跨度是否 ≤ duration（允许中间有正常数据）
     *
     * 优点：更宽松，更符合实际监控场景
     */
    private evaluateDuration(config: DurationConfig, context: EvaluateContext): EvaluateResult {
        const { baseAtom, duration, minCount } = config;
        const { historyData, timestamp } = context;


        if (historyData.length === 0) {
            return {
                triggered: false,
                message: '无历史数据'
            };
        }

        // 计算时间窗口
        const windowStart = timestamp - duration;
        // 筛选时间窗口内的数据
        const windowData = historyData.filter(d => d.timestamp >= windowStart && d.timestamp <= timestamp);

        if (windowData.length === 0) {
            return {
                triggered: false,
                message: '时间窗口内无数据'
            };
        }

        // 【新逻辑】遍历窗口内所有数据，收集满足条件的异常点
        const anomalyPoints: Array<{ timestamp: number; data: any; result: EvaluateResult }> = [];

        for (const data of windowData) {
            const evalContext: EvaluateContext = {
                ...context,
                currentData: data
            };

            const result = this.evaluate(baseAtom, evalContext);

            if (result.triggered) {
                anomalyPoints.push({
                    timestamp: data.timestamp,
                    data,
                    result  // 【新增】保存评估结果，包含参数值信息
                });
            }
        }

        const anomalyCount = anomalyPoints.length;

        // 如果没有异常点，直接返回
        if (anomalyCount === 0) {
            return {
                triggered: false,
                message: '窗口内无异常点'
            };
        }

        // 如果设置了 minCount，检查是否达标
        if (minCount && anomalyCount < minCount) {
            return {
                triggered: false,
                message: `异常次数不足，需要 ${minCount} 次，实际 ${anomalyCount} 次`
            };
        }

        // 【新增】计算首尾异常点的时间跨度
        const firstAnomalyTime = anomalyPoints[0].timestamp;
        const lastAnomalyTime = anomalyPoints[anomalyCount - 1].timestamp;
        const timeSpan = lastAnomalyTime - firstAnomalyTime;

        // 【关键判断】首尾时间跨度 ≤ duration（允许跨度小于duration，说明异常密集）
        const timeSpanValid = timeSpan <= duration;

        // 触发条件：异常次数达标 && 时间跨度有效
        const triggered = anomalyCount >= (minCount || 1) && timeSpanValid;

        // 【新增】提取最新异常点的上下文信息（用于前端显示）
        const latestAnomalyContext = anomalyPoints.length > 0
            ? anomalyPoints[anomalyPoints.length - 1].result.context
            : {};

        return {
            triggered,
            context: {
                duration,
                anomalyCount,
                windowDataCount: windowData.length,
                timeSpan,
                firstAnomalyTime,
                lastAnomalyTime,
                // 【新增】传递最新异常点的参数值信息
                ...latestAnomalyContext
            },
            message: triggered
                ? `在${(duration / 1000).toFixed(1)}s窗口内检测到${anomalyCount}次异常 (首尾跨度${(timeSpan / 1000).toFixed(1)}s)`
                : `异常不满足条件: ${anomalyCount}次异常 (需要≥${minCount || 1}次), 首尾跨度${(timeSpan / 1000).toFixed(1)}s (需要≤${(duration / 1000).toFixed(1)}s)`
        };
    }

}

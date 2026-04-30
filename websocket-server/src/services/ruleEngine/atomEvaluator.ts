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
            console.log(`      [Threshold] ❌ 参数 ${param} 不存在`);
            return {
                triggered: false,
                message: `参数 ${param} 不存在`
            };
        }

        if (typeof paramValue !== 'number') {
            console.log(`      [Threshold] ❌ 参数 ${param} 不是数值类型: ${typeof paramValue}`);
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
            console.log(`      [ThresholdRange] ❌ 参数 ${param} 不存在`);
            return {
                triggered: false,
                message: `参数 ${param} 不存在`
            };
        }

        if (typeof paramValue !== 'number') {
            console.log(`      [ThresholdRange] ❌ 参数 ${param} 不是数值类型: ${typeof paramValue}`);
            return {
                triggered: false,
                message: `参数 ${param} 不是数值类型`
            };
        }

        // 判断是否超出范围
        const triggered = paramValue < min || paramValue > max;

        console.log(`      [ThresholdRange] 参数 ${param} = ${paramValue}, 范围 [${min}, ${max}], 触发=${triggered}`);

        return {
            triggered,
            context: { param, value: paramValue, min, max },
            message: triggered
                ? `参数 ${param} = ${paramValue} 超出范围 [${min}, ${max}]`
                : `参数 ${param} = ${paramValue} 在范围 [${min}, ${max}] 内，正常`
        };
    }

    /**
     * 时序持续评估（原子2）
     * 检查条件是否持续满足指定时间
     */
    private evaluateDuration(config: DurationConfig, context: EvaluateContext): EvaluateResult {
        const { baseAtom, duration, minCount } = config;
        const { historyData, timestamp } = context;

        console.log(`    [Duration] 检查开始: timestamp=${new Date(timestamp).toLocaleTimeString()}, duration=${duration}ms, minCount=${minCount}`);
        console.log(`    [Duration] 历史数据共 ${historyData.length} 条`);

        if (historyData.length === 0) {
            return {
                triggered: false,
                message: '无历史数据'
            };
        }

        // 计算时间窗口
        const windowStart = timestamp - duration;
        console.log(`    [Duration] 时间窗口: ${new Date(windowStart).toLocaleTimeString()} ~ ${new Date(timestamp).toLocaleTimeString()}`);

        // 筛选时间窗口内的数据
        const windowData = historyData.filter(d => d.timestamp >= windowStart && d.timestamp <= timestamp);
        console.log(`    [Duration] 窗口内数据: ${windowData.length} 条`);

        if (minCount && windowData.length < minCount) {
            console.log(`    [Duration] ❌ 数据量不足，需要 ${minCount} 条，实际 ${windowData.length} 条`);
            return {
                triggered: false,
                message: `数据量不足，需要 ${minCount} 条，实际 ${windowData.length} 条`
            };
        }

        // 从最新数据开始，往前找连续满足条件的数据（逆序遍历）
        let continuousCount = 0;
        let firstTriggeredTime: number | null = null;  // 最早满足条件的时间
        let lastTriggeredTime: number | null = null;   // 最新满足条件的时间

        // 逆序遍历（从最新数据开始）
        for (let i = windowData.length - 1; i >= 0; i--) {
            const data = windowData[i];
            const evalContext: EvaluateContext = {
                ...context,
                currentData: data
            };

            const result = this.evaluate(baseAtom, evalContext);

            if (result.triggered) {
                continuousCount++;
                // 第一次赋值时，这是最新的数据
                if (lastTriggeredTime === null) {
                    lastTriggeredTime = data.timestamp;
                }
                // 持续往前遍历，不断更新最早时间
                firstTriggeredTime = data.timestamp;
            } else {
                // 不连续则中断
                break;
            }
        }

        // 检查是否满足持续条件
        const timeSpan = firstTriggeredTime && lastTriggeredTime ? lastTriggeredTime - firstTriggeredTime : 0;
        const triggered = continuousCount >= (minCount || 0) && timeSpan >= duration;

        console.log(`    [Duration] 结果: continuousCount=${continuousCount}, timeSpan=${timeSpan}ms, triggered=${triggered}`);

        return {
            triggered,
            context: {
                duration,
                continuousCount,
                windowDataCount: windowData.length,
                firstTriggeredTime,
                lastTriggeredTime
            },
            message: triggered
                ? `条件持续 ${duration}ms 满足，连续 ${continuousCount} 条数据`
                : `条件未持续满足，仅连续 ${continuousCount} 条数据，时间跨度 ${timeSpan}ms`
        };
    }

}

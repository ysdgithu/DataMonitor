import { SuddenChangeRule,DataPoint } from '../types/index';

// 定义设备历史数据的类型
interface DeviceHistory {
  values: number[]; // 历史指标值数组
  timestamps: number[]; // 对应时间戳数组
}

// 定义异常事件的返回类型
interface AnomalyEvent {
  deviceId: string;
  metric: string;
  ruleId: string;
  current_value: number;
  baseline: number;
  change: number;
  severity: string;
}

export class SuddenChangeDetector {
  private rule: SuddenChangeRule;
  private dataHistory: Map<string, DeviceHistory>; // deviceId -> 历史数据

  constructor(rule?: SuddenChangeRule) {
    // 如果没有传入规则，使用默认的温度突变规则
    this.rule = rule || {
      id: 'temp_sudden_rise',
      metric: 'temperature',
      condition: 'increase>10',
      time_range: 60, // 1分钟内的变化
      baseline_period: 300, // 5分钟的基线周期
      severity: 'medium'
    };
    this.dataHistory = new Map();
  }

  // 检查数据点是否触发突变异常
  check(dataPoint: DataPoint): AnomalyEvent | null {
    const { deviceId, metric, value, timestamp } = dataPoint;

    // 初始化设备历史数据（若不存在）
    if (!this.dataHistory.has(deviceId)) {
      this.dataHistory.set(deviceId, { values: [], timestamps: [] });
    }

    const history = this.dataHistory.get(deviceId)!; // 非空断言（已确保存在）

    // 记录当前数据
    history.values.push(value);
    history.timestamps.push(timestamp);

    // 清理过期数据（只保留基线周期+检测周期内的数据）
    const maxHistoryDuration = this.rule.baseline_period + this.rule.time_range; // 秒
    const cutoffTimestamp = timestamp - maxHistoryDuration * 1000; // 转换为毫秒

    // 筛选有效数据的索引
    const validIndices = history.timestamps
      .map((ts, idx) => ts >= cutoffTimestamp ? idx : -1)
      .filter(idx => idx !== -1);

    // 更新历史数据为有效数据
    history.values = validIndices.map(idx => history.values[idx]);
    history.timestamps = validIndices.map(idx => history.timestamps[idx]);

    // 数据点数量足够时才进行检测（至少10个）
    if (history.values.length >= 10) {
      try {
        const baseline = this.calculateBaseline(history.values);
        const currentChange = Math.abs(value - baseline);
        const threshold = this.parseConditionThreshold();

        // 检查是否超过突变阈值
        if (currentChange > threshold) {
          return this.generateAnomalyEvent(deviceId, metric, {
            current_value: value,
            baseline,
            change: currentChange
          });
        }
      } catch (error) {
        console.error('突变检测计算失败:', error);
      }
    }

    return null;
  }

  // 计算基线值（基于历史数据的滑动窗口平均值）
  private calculateBaseline(values: number[]): number {
    // 计算需要排除的检测窗口内的数据点数量（假设10秒一个数据点）
    const excludeCount = Math.ceil(this.rule.time_range / 10);
    if (excludeCount <= 0 || excludeCount >= values.length) {
      throw new Error('无效的基线计算窗口（检测窗口过大或数据不足）');
    }

    // 截取基线周期的数据（排除最近的检测窗口数据）
    const baselineValues = values.slice(0, -excludeCount);
    if (baselineValues.length === 0) {
      throw new Error('基线数据为空，无法计算基线值');
    }

    // 计算平均值作为基线
    return baselineValues.reduce((sum, val) => sum + val, 0) / baselineValues.length;
  }

  // 解析条件中的阈值（如从 "increase>10" 中提取 10）
  private parseConditionThreshold(): number {
    const match = this.rule.condition.match(/^(\w+)>(\d+)$/);
    if (!match) {
      throw new Error(`无效的条件格式: ${this.rule.condition}，应为 "increase>数字" 或 "decrease>数字"`);
    }

    const threshold = parseFloat(match[2]);
    if (isNaN(threshold) || threshold <= 0) {
      throw new Error(`无效的阈值: ${match[2]}，必须是正数`);
    }

    return threshold;
  }

  // 生成异常事件
  private generateAnomalyEvent(
    deviceId: string,
    metric: string,
    details: { current_value: number; baseline: number; change: number }
  ): AnomalyEvent {
    return {
      deviceId,
      metric,
      ruleId: this.rule.id,
      ...details,
      severity: this.rule.severity
    };
  }
}

// 导出异常事件类型供外部使用
export type { AnomalyEvent };
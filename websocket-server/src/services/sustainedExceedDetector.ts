import { SustainedExceedRule,DataPoint } from '../types/index';

// 定义超限历史记录的类型
export interface BreachRecord {
  timestamp: number;
  value: number;
}

// 定义异常事件的返回类型
export interface CPUAnomalyEvent {
  deviceId: string;
  metric: string;
  ruleId: string;
  breaches: BreachRecord[]; // 历史记录
  severity: string;
  // 可根据需要补充其他字段
}

export class SustainedExceedDetector {

  private rule: SustainedExceedRule;
  private breachHistory: Map<string, BreachRecord[]>;

  // 示例规则定义（符合 SustainedExceedRule 类型）
  private cpuRule: SustainedExceedRule = {
    id: 'cpu_sustained_90',
    metric: 'cpu',
    condition: '>90',
    duration: 300,
    window_size: 60,
    min_breaches: 5,
    severity: 'high'
  };

  constructor(rule?: SustainedExceedRule) {
    // 如果没有传入规则，使用默认的CPU规则
    this.rule = rule || this.cpuRule;
    this.breachHistory = new Map(); // deviceId -> 超限记录数组
  }

  check(dataPoint: DataPoint): CPUAnomalyEvent | null {
    const { deviceId, metric, value, timestamp } = dataPoint;

    // 初始化设备的超限历史（如果不存在）
    if (!this.breachHistory.has(deviceId)) {
      this.breachHistory.set(deviceId, []);
    }

    const history = this.breachHistory.get(deviceId)!; // 非空断言（已确保存在）

    // 检查当前值是否超限
    if (this.evaluateCondition(value)) {
      history.push({ timestamp, value });

      // 清理过期数据（超出检测窗口的记录）
      const cutoff = timestamp - this.rule.window_size * 1000;
      const recentBreaches = history.filter(h => h.timestamp >= cutoff);

      // 检查是否达到连续超限次数阈值
      if (recentBreaches.length >= this.rule.min_breaches) {
        // 只保留最近的 min_breaches 条记录（优化内存）
        this.breachHistory.set(deviceId, recentBreaches.slice(-this.rule.min_breaches));
        return this.generateAnomalyEvent(deviceId, metric, recentBreaches);
      }
    } else {
      // 未超限则重置该设备的历史记录
      this.breachHistory.set(deviceId, []);
    }

    return null;
  }

  // 为评估方法定义参数和返回类型
  private evaluateCondition(value: number): boolean {
    const threshold = parseFloat(this.rule.condition.slice(1));
    if (isNaN(threshold)) {
      throw new Error(`无效的阈值条件: ${this.rule.condition}`);
    }
    return this.rule.condition.startsWith('>') 
      ? value > threshold 
      : value < threshold;
  }

  // 为异常事件生成方法定义参数和返回类型
  private generateAnomalyEvent(
    deviceId: string,
    metric: string,
    breaches: BreachRecord[]
  ): CPUAnomalyEvent {
    return {
      deviceId,
      metric,
      ruleId: this.rule.id,
      breaches,
      severity: this.rule.severity,
      // 可根据需要添加更多字段（如事件时间、持续时间等）
    };
  }
}

// 使用示例
//const detector = new SustainedExceedDetector();
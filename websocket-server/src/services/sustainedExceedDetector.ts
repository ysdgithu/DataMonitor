import { SustainedExceedRule } from '../types/index';
const r:SustainedExceedRule = {
  id: 'cpu_sustained_90',
  metric: 'cpu',
  condition: '>90', // 阈值
  duration: 300, // 持续5分钟（300秒）
  window_size: 60, // 检测窗口60秒
  min_breaches: 5, // 5次连续超限
  severity: 'high'
}
class SustainedExceedDetector {
  constructor(rule:SustainedExceedRule) {
    this.rule = rule;
    this.breachHistory = new Map(); // deviceId -> [timestamp, value]
  }
  
  check(dataPoint) {
    const { deviceId, metric, value, timestamp } = dataPoint;
    
    if (!this.breachHistory.has(deviceId)) {
      this.breachHistory.set(deviceId, []);
    }
    
    const history = this.breachHistory.get(deviceId);
    
    // 检查当前值是否超限
    if (this.evaluateCondition(value)) {
      history.push({ timestamp, value });
      
      // 清理过期数据
      const cutoff = timestamp - this.rule.window_size * 1000;
      const recentBreaches = history.filter(h => h.timestamp >= cutoff);
      
      // 检查是否达到连续超限次数
      if (recentBreaches.length >= this.rule.min_breaches) {
        this.breachHistory.set(deviceId, recentBreaches.slice(-this.rule.min_breaches));
        return this.generateAnomalyEvent(deviceId, recentBreaches);
      }
    } else {
      // 重置连续计数
      this.breachHistory.set(deviceId, []);
    }
    
    return null;
  }
  
  evaluateCondition(value) {
    const threshold = parseFloat(this.rule.condition.slice(1));
    return this.rule.condition.startsWith('>') ? value > threshold : value < threshold;
  }
}
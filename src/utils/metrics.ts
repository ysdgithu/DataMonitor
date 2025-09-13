export interface MetricData {
  timestamp: number;
  value: number;
  type: string;
}

export function processMetrics(data: MetricData[]) {
  // 指标处理逻辑
  return data;
}

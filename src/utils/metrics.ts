export interface BaseMetric {
  id: number
  type: string
  timestamp: number
}

export interface ValueMetric extends BaseMetric {
  value: number
}

export interface DeviceTypeMetric extends BaseMetric {
  deviceType: string
  count: number
}

export interface RequestCountMetric extends BaseMetric {
  count: number
}

export const METRIC_TYPES = {
  CPU_USAGE: 'cpu_usage',
  MEMORY_USAGE: 'memory_usage',
  LATENCY: 'latency',
  ACTIVE_DEVICES: 'active_devices',
  DEVICE_TYPE: 'device_type',
  REQUEST_COUNT: 'request_count'
} as const

export default {
  METRIC_TYPES
}
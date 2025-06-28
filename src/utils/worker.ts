import type { MetricData } from './metrics'

// 数据聚合函数
function heavyCalculation(rawData: MetricData[]) {
  const groupedData = rawData.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = []
    acc[curr.type].push(curr)
    return acc
  }, {} as Record<string, MetricData[]>)

  const result: Record<string, any> = {}

  for (const [type, data] of Object.entries(groupedData)) {
    switch (type) {
      case 'device_type':
        result[type] = aggregateDeviceData(data)
        break
      case 'request_count':
        result[type] = aggregateRequestData(data)
        break
      default:
        result[type] = aggregateMetricData(data)
    }
  }
  return result
}

function aggregateDeviceData(data: MetricData[]) {
  const latestData = data.reduce((acc, curr) => {
    if (!curr.deviceType) return acc
    if (!acc[curr.deviceType] || curr.timestamp > acc[curr.deviceType].timestamp) {
      acc[curr.deviceType] = curr
    }
    return acc
  }, {} as Record<string, MetricData>)
  return Object.values(latestData)
}

function aggregateRequestData(data: MetricData[]) {
  const HOUR = 3600
  return data.reduce((acc, curr) => {
    const timeGroup = Math.floor(curr.timestamp / HOUR) * HOUR
    if (!acc[timeGroup]) acc[timeGroup] = 0
    acc[timeGroup] += curr.count || 0
    return acc
  }, {} as Record<number, number>)
}

function aggregateMetricData(data: MetricData[]) {
  const sum = data.reduce((acc, curr) => acc + (curr.value || 0), 0)
  return {
    average: data.length ? sum / data.length : 0,
    max: Math.max(...data.map(d => d.value || 0)),
    min: Math.min(...data.map(d => d.value || 0))
  }
}

// 监听主线程消息
self.onmessage = (e: MessageEvent) => {
  const rawData = e.data as MetricData[]
  const result = heavyCalculation(rawData)
  self.postMessage(result)
}

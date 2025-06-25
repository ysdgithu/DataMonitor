interface MetricData {
  type: string
  timestamp: number
  value?: number
  deviceType?: string
  count?: number
}

// 数据聚合函数
function heavyCalculation(rawData: MetricData[]) {
  // 按类型分组
  const groupedData = rawData.reduce((acc, curr) => {
    if (!acc[curr.type]) {
      acc[curr.type] = []
    }
    acc[curr.type].push(curr)
    return acc
  }, {} as Record<string, MetricData[]>)

  // 处理不同类型的数据
  const result: Record<string, any> = {}
  
  for (const [type, data] of Object.entries(groupedData)) {
    switch (type) {
      case 'device_type':
        // 设备类型数据聚合 - 统计最新的设备数量
        result[type] = aggregateDeviceData(data)
        break
      
      case 'request_count':
        // 请求量数据聚合 - 计算时间段内的请求总量
        result[type] = aggregateRequestData(data)
        break
      
      default:
        // 其他指标数据 - 计算平均值
        result[type] = aggregateMetricData(data)
    }
  }

  return result
}

// 设备类型数据聚合
function aggregateDeviceData(data: MetricData[]) {
  // 按设备类型分组并获取最新数据
  const latestData = data.reduce((acc, curr) => {
    if (!curr.deviceType) return acc
    
    if (!acc[curr.deviceType] || curr.timestamp > acc[curr.deviceType].timestamp) {
      acc[curr.deviceType] = curr
    }
    return acc
  }, {} as Record<string, MetricData>)

  return Object.values(latestData)
}

// 请求量数据聚合
function aggregateRequestData(data: MetricData[]) {
  // 按时间间隔分组（例如每小时）
  const HOUR = 3600
  return data.reduce((acc, curr) => {
    const timeGroup = Math.floor(curr.timestamp / HOUR) * HOUR
    if (!acc[timeGroup]) {
      acc[timeGroup] = 0
    }
    acc[timeGroup] += curr.count || 0
    return acc
  }, {} as Record<number, number>)
}

// 普通指标数据聚合
function aggregateMetricData(data: MetricData[]) {
  // 计算平均值
  const sum = data.reduce((acc, curr) => acc + (curr.value || 0), 0)
  return {
    average: data.length > 0 ? sum / data.length : 0,
    max: Math.max(...data.map(d => d.value || 0)),
    min: Math.min(...data.map(d => d.value || 0))
  }
}

// 监听主线程消息
self.onmessage = (e: MessageEvent) => {
  try {
    const rawData = e.data as MetricData[]
    const result = heavyCalculation(rawData)
    self.postMessage({
      success: true,
      data: result
    })
  } catch (error) {
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : '数据处理失败'
    })
  }
}
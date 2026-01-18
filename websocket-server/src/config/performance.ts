// 性能配置文件 - 控制不同模式下的数据推送频率

export interface PerformanceMode {
  name: string
  description: string
  pushInterval: number // 推送间隔（毫秒）
  dataPerPush: number // 每次推送的数据条数
  throughput: number // 理论吞吐量（条/秒）
  dbBatchSize: number // 数据库批量写入大小
  dbFlushInterval: number // 数据库刷新间隔（毫秒）
}

export const PERFORMANCE_MODES: Record<string, PerformanceMode> = {
  // 正常模式 - 适合演示和开发
  NORMAL: {
    name: '正常模式',
    description: '每8秒推送一次，适合演示',
    pushInterval: 8000,
    dataPerPush: 15, // 4个核心指标 + 1个温度 + 10个设备
    throughput: 2, // 约2条/秒
    dbBatchSize: 50,
    dbFlushInterval: 5000
  },

  // 低频模式 - 每秒10条
  LOW_FREQUENCY: {
    name: '低频模式',
    description: '每秒推送1次，10条数据/秒',
    pushInterval: 1000,
    dataPerPush: 10,
    throughput: 10,
    dbBatchSize: 100,
    dbFlushInterval: 2000
  },

  // 中频模式 - 每秒50条
  MEDIUM_FREQUENCY: {
    name: '中频模式',
    description: '每200ms推送一次，50条数据/秒',
    pushInterval: 200,
    dataPerPush: 10,
    throughput: 50,
    dbBatchSize: 200,
    dbFlushInterval: 1000
  },

  // 高频模式 - 每秒100条
  HIGH_FREQUENCY: {
    name: '高频模式',
    description: '每100ms推送一次，100条数据/秒',
    pushInterval: 100,
    dataPerPush: 10,
    throughput: 100,
    dbBatchSize: 500,
    dbFlushInterval: 500
  },

  // 极限模式 - 每秒500条
  EXTREME: {
    name: '极限模式',
    description: '每20ms推送一次，500条数据/秒',
    pushInterval: 20,
    dataPerPush: 10,
    throughput: 500,
    dbBatchSize: 1000,
    dbFlushInterval: 200
  },

  // 压测模式 - 每秒1000条
  STRESS_TEST: {
    name: '压测模式',
    description: '每10ms推送一次，1000条数据/秒',
    pushInterval: 10,
    dataPerPush: 10,
    throughput: 1000,
    dbBatchSize: 2000,
    dbFlushInterval: 100
  }
}

// 获取当前模式（从环境变量读取）
export function getCurrentMode(): PerformanceMode {
  const modeName = process.env.PERFORMANCE_MODE || 'NORMAL'
  return PERFORMANCE_MODES[modeName] || PERFORMANCE_MODES.NORMAL
}

// 性能监控指标
export interface PerformanceMetrics {
  messagesSent: number // 已发送消息数
  messagesPerSecond: number // 每秒消息数
  dbWritesPending: number // 待写入数据库的数据量
  clientCount: number // 客户端数量
  memoryUsage: number // 内存使用（MB）
  cpuUsage: number // CPU使用率
}

// 性能监控类
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    messagesSent: 0,
    messagesPerSecond: 0,
    dbWritesPending: 0,
    clientCount: 0,
    memoryUsage: 0,
    cpuUsage: 0
  }

  private lastMessageCount = 0
  private monitorInterval: NodeJS.Timeout | null = null

  start() {
    this.monitorInterval = setInterval(() => {
      this.updateMetrics()
      this.logMetrics()
    }, 5000) // 每5秒输出一次
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
  }

  incrementMessageCount(count: number = 1) {
    this.metrics.messagesSent += count
  }

  setDbPending(count: number) {
    this.metrics.dbWritesPending = count
  }

  setClientCount(count: number) {
    this.metrics.clientCount = count
  }

  private updateMetrics() {
    // 计算每秒消息数
    const currentCount = this.metrics.messagesSent
    this.metrics.messagesPerSecond = (currentCount - this.lastMessageCount) / 5
    this.lastMessageCount = currentCount

    // 获取内存使用
    const memUsage = process.memoryUsage()
    this.metrics.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024)
  }

  private logMetrics() {
    console.log('=== 性能监控 ===')
    console.log(`总消息数: ${this.metrics.messagesSent}`)
    console.log(`消息速率: ${this.metrics.messagesPerSecond.toFixed(2)} 条/秒`)
    console.log(`待写入DB: ${this.metrics.dbWritesPending}`)
    console.log(`客户端数: ${this.metrics.clientCount}`)
    console.log(`内存使用: ${this.metrics.memoryUsage} MB`)
    console.log('================')
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
}


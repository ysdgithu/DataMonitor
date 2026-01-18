/**
 * 前端性能监控工具
 * 用于监控实时数据处理性能，及时发现问题
 */

export interface PerformanceMetrics {
  messageRate: number // 消息速率（条/秒）
  bufferSize: number // 缓冲区大小
  fps: number // 帧率
  memoryUsage: number // 内存占用（MB）
  droppedMessages: number // 丢弃的消息数
  processingTime: number // 平均处理时间（ms）
}

export interface PerformanceThresholds {
  maxMessageRate: number // 最大消息速率
  maxBufferSize: number // 最大缓冲区大小
  minFps: number // 最小帧率
  maxMemoryUsage: number // 最大内存占用（MB）
  maxProcessingTime: number // 最大处理时间（ms）
}

export class PerformanceMonitor {
  private messageCount = 0
  private droppedCount = 0
  private lastCheckTime = Date.now()
  private processingTimes: number[] = []
  private fpsHistory: number[] = []
  private lastFrameTime = performance.now()
  private frameCount = 0

  private thresholds: PerformanceThresholds = {
    maxMessageRate: 500, // 超过 500 条/秒告警
    maxBufferSize: 800, // 缓冲区超过 800 告警
    minFps: 30, // 帧率低于 30 告警
    maxMemoryUsage: 200, // 内存超过 200MB 告警
    maxProcessingTime: 50 // 处理时间超过 50ms 告警
  }

  private listeners: Array<(metrics: PerformanceMetrics) => void> = []

  constructor(customThresholds?: Partial<PerformanceThresholds>) {
    if (customThresholds) {
      this.thresholds = { ...this.thresholds, ...customThresholds }
    }

    // 启动 FPS 监控
    this.startFpsMonitoring()

    // 每 5 秒检查一次性能
    setInterval(() => this.checkPerformance(), 5000)
  }

  /**
   * 记录收到的消息
   */
  recordMessage() {
    this.messageCount++
  }

  /**
   * 记录丢弃的消息
   */
  recordDroppedMessage() {
    this.droppedCount++
  }

  /**
   * 记录处理时间
   */
  recordProcessingTime(time: number) {
    this.processingTimes.push(time)
    // 只保留最近 100 条记录
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift()
    }
  }

  /**
   * 启动 FPS 监控
   */
  private startFpsMonitoring() {
    const measureFps = () => {
      const now = performance.now()
      const delta = now - this.lastFrameTime
      this.lastFrameTime = now
      this.frameCount++

      const fps = 1000 / delta
      this.fpsHistory.push(fps)

      // 只保留最近 60 帧
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift()
      }

      requestAnimationFrame(measureFps)
    }

    requestAnimationFrame(measureFps)
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(bufferSize: number): PerformanceMetrics {
    const now = Date.now()
    const elapsed = (now - this.lastCheckTime) / 1000 // 秒

    const messageRate = this.messageCount / elapsed
    const avgProcessingTime =
      this.processingTimes.length > 0
        ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
        : 0

    const avgFps =
      this.fpsHistory.length > 0
        ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
        : 60

    // 获取内存占用（如果浏览器支持）
    const memoryUsage = (performance as any).memory
      ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
      : 0

    return {
      messageRate: Math.round(messageRate * 100) / 100,
      bufferSize,
      fps: Math.round(avgFps),
      memoryUsage: Math.round(memoryUsage),
      droppedMessages: this.droppedCount,
      processingTime: Math.round(avgProcessingTime * 100) / 100
    }
  }

  /**
   * 检查性能并触发告警
   */
  private checkPerformance() {
    const metrics = this.getMetrics(0) // bufferSize 需要外部传入

    // 重置计数器
    this.messageCount = 0
    this.lastCheckTime = Date.now()

    // 检查阈值
    const warnings: string[] = []

    if (metrics.messageRate > this.thresholds.maxMessageRate) {
      warnings.push(`⚠️ 消息速率过高: ${metrics.messageRate} 条/秒 (阈值: ${this.thresholds.maxMessageRate})`)
    }

    if (metrics.bufferSize > this.thresholds.maxBufferSize) {
      warnings.push(`⚠️ 缓冲区积压: ${metrics.bufferSize} 条 (阈值: ${this.thresholds.maxBufferSize})`)
    }

    if (metrics.fps < this.thresholds.minFps) {
      warnings.push(`⚠️ 帧率过低: ${metrics.fps} FPS (阈值: ${this.thresholds.minFps})`)
    }

    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      warnings.push(`⚠️ 内存占用过高: ${metrics.memoryUsage} MB (阈值: ${this.thresholds.maxMemoryUsage})`)
    }

    if (metrics.processingTime > this.thresholds.maxProcessingTime) {
      warnings.push(`⚠️ 处理时间过长: ${metrics.processingTime} ms (阈值: ${this.thresholds.maxProcessingTime})`)
    }

    if (metrics.droppedMessages > 0) {
      warnings.push(`⚠️ 丢弃消息: ${metrics.droppedMessages} 条`)
    }

    // 输出告警
    if (warnings.length > 0) {
      console.warn('=== 性能告警 ===')
      warnings.forEach(w => console.warn(w))
      console.warn('================')
    }

    // 通知监听器
    this.listeners.forEach(listener => listener(metrics))
  }

  /**
   * 添加性能监听器
   */
  onMetrics(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.push(listener)
  }

  /**
   * 重置统计
   */
  reset() {
    this.messageCount = 0
    this.droppedCount = 0
    this.processingTimes = []
    this.lastCheckTime = Date.now()
  }
}

// 导出单例
export const performanceMonitor = new PerformanceMonitor()


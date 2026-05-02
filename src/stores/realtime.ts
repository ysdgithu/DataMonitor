// 该文件用于开启WebSocket实例化，并对接收到的数据按类型分组过滤
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useWebSocket } from '../utils/useWebSocket'
import type {
  CoreMetricData,
  EnvironmentData,
  DeviceTelemetryData,
  DeviceStatusData,
  FactoryDevice,
  WebSocketMessage
} from '../utils/type'
import { useCoreMetricStore } from './CoreMetricData'
import { useEnvironmentDataStore } from './EnvironmentData'
import { useDeviceTelemetryDataStore } from './DeviceTelemetryData'
import { useFactoryDeviceDataStore } from './FactoryDeviceData'
import { useDeviceDataStore } from './deviceData' // 【新增】设备数据 Store
import { useAlarmStore } from './alarm' // 【新增】告警 Store
import { performanceMonitor } from '../utils/performanceMonitor' // 【新增】性能监控



// 【高频优化】数据批处理配置
const BATCH_SIZE = 50 // 批量处理50条数据
const BATCH_INTERVAL = 16 // 16ms ≈ 60fps
const MAX_BUFFER_SIZE = 1000 // 【修复】缓冲区最大长度，防止内存溢出
const CRITICAL_TYPES = ['anomaly_alert', 'critical_alarm', 'ALARM_EVENT'] // 【修复】关键消息类型，立即处理

export const useRealtimeStore = defineStore('realtime', () => {
  // 监控开关
  const isMonitoring = ref(false)

  // 获取WebSocket URL并添加调试信息
  const getWebSocketUrl = () => {
    const envUrl = import.meta.env.VITE_WS_URL

    // 开发环境下打印环境变量信息
    if (import.meta.env.DEV) {
      console.log('[Realtime Store] 环境变量配置:', {
        VITE_WS_URL: import.meta.env.VITE_WS_URL,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        MODE: import.meta.env.MODE
      })
    }

    if (envUrl) {
      console.log('[Realtime Store] 使用环境变量 WebSocket URL:', envUrl)
      return envUrl
    }

    // 根据当前协议自动选择WebSocket协议（后备方案）
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const defaultUrl = `${protocol}//localhost:8080`

    console.log('[Realtime Store] 使用默认 WebSocket URL:', defaultUrl)
    console.log('[Realtime Store] 自动选择协议:', protocol)
    return defaultUrl
  }

  const wsUrl = getWebSocketUrl()
  console.log('[Realtime Store] 最终 WebSocket URL:', wsUrl)
  console.log('[Realtime Store] 当前页面协议:', window.location.protocol)

  // WebSocket 相关状态
  const {
    isConnected,
    retryCount,
    lastMessage,
    connect,
    disconnect
  } = useWebSocket({
    url: wsUrl,
    maxRetries: 5,
    retryDelay: 2000
  })

  // 【高频优化】消息缓冲区
  const messageBuffer = ref<WebSocketMessage[]>([])
  let rafId: number | null = null
  let isProcessing = false // 【修复】防止 RAF 回调堆积

  // 【高频优化】批量处理缓冲区数据
  function flushMessageBuffer() {
    //console.log('[Buffer] 当前积压:', messageBuffer.value.length)
    if (messageBuffer.value.length === 0) {
      rafId = null
      isProcessing = false
      return
    }

    // 【修复】如果正在处理，跳过本帧
    if (isProcessing) {
      rafId = requestAnimationFrame(flushMessageBuffer)
      return
    }

    isProcessing = true
    const startTime = performance.now() // 【性能监控】记录开始时间

    // 【修复】按时间戳排序，保证数据时序性
    messageBuffer.value.sort((a, b) => {
      const timeA = (a.data as any).timestamp || 0
      const timeB = (b.data as any).timestamp || 0
      return timeA - timeB
    })

    const batch = messageBuffer.value.splice(0, BATCH_SIZE)

    // 【优化】按类型分组消息，实现真正的批量处理
    const groupedMessages: Record<string, any[]> = {}
    const anomalyAlerts: any[] = []

    batch.forEach(message => {
      if (message.type === 'anomaly_alert') {
        anomalyAlerts.push(message)
      } else {
        if (!groupedMessages[message.type]) {
          groupedMessages[message.type] = []
        }
        groupedMessages[message.type].push(message.data)
      }
    })

    // 批量处理各类型消息
    //console.time('批处理耗时')
    processBatchMessages(groupedMessages)
    //console.timeEnd('批处理耗时')

    // 处理异常告警
    anomalyAlerts.forEach(alert => handleAnomalyAlert(alert))

    const endTime = performance.now() // 【性能监控】记录结束时间
    performanceMonitor.recordProcessingTime(endTime - startTime)

    isProcessing = false

    // 如果还有数据，继续处理
    if (messageBuffer.value.length > 0) {
      rafId = requestAnimationFrame(flushMessageBuffer)
    } else {
      rafId = null
    }
  }

  // 【高频优化】调度批处理
  function scheduleFlush() {
    if (rafId === null) {
      rafId = requestAnimationFrame(flushMessageBuffer)
    }
  }

  // 【优化】批量处理分组后的消息
  function processBatchMessages(groupedMessages: Record<string, any[]>) {
    // 处理核心指标数据
    if (groupedMessages['core_metrics'] && groupedMessages['core_metrics'].length > 0) {
      const coreMetricStore = useCoreMetricStore()
      // 将所有批次的数据合并成一个数组
      const allMetrics: CoreMetricData[] = []
      groupedMessages['core_metrics'].forEach(dataArray => {
        if (Array.isArray(dataArray)) {
          allMetrics.push(...dataArray)
        }
      })
      if (allMetrics.length > 0) {
        coreMetricStore.batchPushMetricData(allMetrics)
      }
    }

    // 处理环境数据
    if (groupedMessages['environment'] && groupedMessages['environment'].length > 0) {
      const environmentDataStore = useEnvironmentDataStore()
      environmentDataStore.batchPushEnvironmentData(groupedMessages['environment'])
    }

    // 处理工厂设备数据
    if (groupedMessages['factory_devices'] && groupedMessages['factory_devices'].length > 0) {
      const factoryDeviceDataStore = useFactoryDeviceDataStore()
      // 将所有批次的数据合并成一个数组
      const allDevices: any[] = []
      groupedMessages['factory_devices'].forEach(dataArray => {
        if (Array.isArray(dataArray)) {
          allDevices.push(...dataArray)
        }
      })
      if (allDevices.length > 0) {
        factoryDeviceDataStore.batchPushFactoryDeviceData(allDevices)
      }
    }

    // 处理通信数据
    if (groupedMessages['telemetry'] && groupedMessages['telemetry'].length > 0) {
      const deviceStatusStore = useDeviceTelemetryDataStore()
      deviceStatusStore.batchPushDeviceTelemetryData(groupedMessages['telemetry'])
    }

    // 【新增】处理设备批量更新数据 (DEVICE_BATCH_UPDATE)
    if (groupedMessages['DEVICE_BATCH_UPDATE'] && groupedMessages['DEVICE_BATCH_UPDATE'].length > 0) {
      const deviceDataStore = useDeviceDataStore()
      // 将所有批次的数据合并成一个数组
      const allDeviceData: any[] = []
      groupedMessages['DEVICE_BATCH_UPDATE'].forEach(dataArray => {
        if (Array.isArray(dataArray)) {
          allDeviceData.push(...dataArray)
        }
      })
      if (allDeviceData.length > 0) {
        deviceDataStore.batchUpdateDeviceData(allDeviceData)
      }
    }

    // 【新增】处理告警事件 (ALARM_EVENT) - 立即处理，不批量
    if (groupedMessages['ALARM_EVENT'] && groupedMessages['ALARM_EVENT'].length > 0) {
      const alarmStore = useAlarmStore()
      let addedCount = 0
      groupedMessages['ALARM_EVENT'].forEach(alarmData => {
        if (alarmData) {
          const added = alarmStore.addAlarmEvent(alarmData)
          if (added) addedCount++
        }
      })
      if (addedCount > 0) {
        console.log(`[Realtime] 新增 ${addedCount} 条告警 (去重后)`)
      }
    }
  }

  // 处理并分组数据（入口函数 - 高频优化版）
  function handleRealtimeMessage(message: WebSocketMessage) {
    if (!isMonitoring.value) return

    // 【性能监控】记录收到的消息
    performanceMonitor.recordMessage()

    // 【修复】关键消息立即处理，不走批处理
    if (CRITICAL_TYPES.includes(message.type)) {
      console.warn('[realtime] 关键消息立即处理:', message.type)
      processMessage(message)
      return
    }

    // 【修复】缓冲区溢出保护
    if (messageBuffer.value.length >= MAX_BUFFER_SIZE) {
      console.error('[realtime] 缓冲区溢出，丢弃最旧的数据')
      // 【性能监控】记录丢弃的消息数
      const droppedCount = messageBuffer.value.length - MAX_BUFFER_SIZE / 2
      for (let i = 0; i < droppedCount; i++) {
        performanceMonitor.recordDroppedMessage()
      }
      // 保留最新的数据，丢弃最旧的
      messageBuffer.value = messageBuffer.value.slice(-MAX_BUFFER_SIZE / 2)
    }

    // 【优化】将消息加入缓冲区，而不是立即处理
    messageBuffer.value.push(message)

    // 达到批量大小立即处理
    if (messageBuffer.value.length >= BATCH_SIZE) {
      flushMessageBuffer()
    } else {
      // 否则调度下一帧处理
      scheduleFlush()
    }
  }

  // 实际处理单条消息的逻辑
  function processMessage(message: WebSocketMessage) {
    const { type, data } = message;

    // 处理异常告警消息
    if (type === 'anomaly_alert') {
      handleAnomalyAlert(message);
      return;
    }

    // 【修复】处理规则引擎告警事件
    if (type === 'ALARM_EVENT') {
      const alarmStore = useAlarmStore();
      const added = alarmStore.addAlarmEvent(data);
      if (added) {
        console.log('[Realtime] ✅ 告警已添加到 alarmStore:', data);
      } else {
        console.log('[Realtime] ⚠️ 告警被去重:', data);
      }
      return;
    }

    // 根据消息类型处理数据
    switch (type) {
      case 'core_metrics':
        // 核心指标数据是数组
        if (Array.isArray(data)) {
          // 【优化】使用批量更新，减少响应式触发次数
          const coreMetricStore = useCoreMetricStore();
          coreMetricStore.batchPushMetricData(data as CoreMetricData[]);
        }
        break;

      case 'environment':
        // 环境数据是单个对象
        const environmentDataStore = useEnvironmentDataStore();
        environmentDataStore.pushEnvironmentData(data);
        break;

      case 'factory_devices':
        // 设备状态数据是数组
        if (Array.isArray(data)) {
          // 【优化】使用批量更新，减少响应式触发次数
          const factoryDeviceDataStore = useFactoryDeviceDataStore();
          factoryDeviceDataStore.batchPushFactoryDeviceData(data);
        }
        break;

      case 'telemetry':
        // 通信数据是单个对象
        const deviceStatusStore = useDeviceTelemetryDataStore();
        deviceStatusStore.pushDeviceTelemetryData(data);
        break;
    }

    //console.log(`[realtime] 处理${type}数据 时间:`, message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'unknown');
  }

  // 处理异常告警消息
  function handleAnomalyAlert(message: any) {
    console.log('收到异常告警:', message);

    const { alertType, data, timestamp } = message;

    // 根据告警类型显示不同的提示
    if (alertType === 'cpu_sustained_exceed') {
      console.warn(`CPU持续超限告警 - 设备${data.deviceId}的CPU使用率持续超过90%`);
      console.warn('超限记录:', data.breaches);

      // 可以在这里触发UI通知
      // 例如：ElMessage.error({ message: 'CPU持续超限告警', duration: 5000 })

    } else if (alertType === 'temperature_sudden_change') {
      console.warn(`温度突变告警 - 设备${data.deviceId}的温度突然升高${data.change.toFixed(1)}°C`);
      console.warn(`当前温度: ${data.current_value.toFixed(1)}°C, 基线温度: ${data.baseline.toFixed(1)}°C`);

      // 可以在这里触发UI通知
      // 例如：ElMessage.warning({ message: '温度异常告警', duration: 5000 })
    }

    // 可以将告警数据存储到store中，供UI显示
    // 例如：anomalyAlerts.value.push({ alertType, data, timestamp })
  }

  // 监听 WebSocket 消息
  watch(lastMessage, (msg) => {
    if (msg) {
      handleRealtimeMessage(msg);
    }
  })

  // 切换监控状态
  function setMonitoring(val: boolean) {
    isMonitoring.value = val
    if (val && !isConnected.value) {
      connect()
    }
    if (!val) {
      disconnect()
    }
  }

  return {
    isMonitoring,
    isConnected,
    retryCount,
    setMonitoring,
    connect,
    disconnect
  }
})






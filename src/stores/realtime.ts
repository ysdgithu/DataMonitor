// 该文件用于开启WebSocket实例化，并对接收到的数据按类型分组过滤
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useWebSocket } from '../utils/useWebSocket'
import type { DeviceData, CoreMetricData } from '../utils/type'
import { useCoreMetricStore } from './CoreMetricData'

const MAX_POINTS = 20

// 按类型分组的数据结构
type DataGroupMap = Record<string, DeviceData[]>

export const useRealtimeStore = defineStore('realtime', () => {
  // 监控开关
  const isMonitoring = ref(false)
  // 按类型分组的数据
  const dataGroupMap = ref<DataGroupMap>({})

  // WebSocket 相关状态
  const {
    isConnected,
    retryCount,
    lastMessage,
    connect,
    disconnect
  } = useWebSocket({
    url: 'ws://localhost:8080',
    maxRetries: 3,
    retryDelay: 1000
  })

  // 处理并分组数据
  function handleRealtimeMessage(data: DeviceData) {
    if (!isMonitoring.value) return

    const key =
      (data as any).category ||
      (data as any).type ||
      (data as any).dataType ||
      (data as any).status ||
      'unknown'

    if (!dataGroupMap.value[key]) dataGroupMap.value[key] = []
    dataGroupMap.value[key].push(data)
    if (dataGroupMap.value[key].length > MAX_POINTS) {
      dataGroupMap.value[key].shift()
    }

    console.log(`[realtime] 分组:${key} 当前数量:${dataGroupMap.value[key].length}`)

    // 如果是核心指标数据，推送到核心指标store
    if ('category' in data && ['cpu', 'memory', 'network', 'online'].includes((data as any).category)) {
      const coreMetricStore = useCoreMetricStore()
      coreMetricStore.pushMetricData(data as CoreMetricData)
    }
  }

  // 监听 WebSocket 消息（改为批量处理）
  watch(lastMessage, (msg) => {
    if (msg && msg.version === 2) {
      console.log('[realtime] 收到v2数据 时间:', new Date(msg.timestamp).toLocaleTimeString(), '数量:', msg.data.length)
      msg.data.forEach(handleRealtimeMessage)
    } else if (msg) {
      console.warn('[realtime] 丢弃旧格式数据', msg)
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
      clearData()
    }
  }

  // 清空所有分组数据
  function clearData() {
    dataGroupMap.value = {}
  }

  // 获取某一类型分组数据
  function getGroupData(type: string) {
    return dataGroupMap.value[type] || []
  }

  return {
    isMonitoring,
    isConnected,
    retryCount,
    dataGroupMap,
    setMonitoring,
    clearData,
    connect,
    disconnect,
    getGroupData
  }
})


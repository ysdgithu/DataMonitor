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
  function handleRealtimeMessage(message: { type: string; data: any; timestamp: number }) {
    if (!isMonitoring.value) return

    const { type, data } = message;

    // 根据消息类型处理数据
    switch (type) {
      case 'core_metrics':
        // 核心指标数据是数组
        if (Array.isArray(data)) {
          data.forEach(metric => {
            const key = metric.category;
            if (!dataGroupMap.value[key]) dataGroupMap.value[key] = [];
            dataGroupMap.value[key].push(metric);
            if (dataGroupMap.value[key].length > MAX_POINTS) {
              dataGroupMap.value[key].shift();
            }

            // 推送到核心指标store
            const coreMetricStore = useCoreMetricStore();
            coreMetricStore.pushMetricData(metric as CoreMetricData);
          });
        }
        break;

      case 'environment':
        // 环境数据是单个对象
        const envKey = data.type;
        if (!dataGroupMap.value[envKey]) dataGroupMap.value[envKey] = [];
        dataGroupMap.value[envKey].push(data);
        if (dataGroupMap.value[envKey].length > MAX_POINTS) {
          dataGroupMap.value[envKey].shift();
        }
        break;

      case 'device_status':
        // 设备状态数据是数组
        if (Array.isArray(data)) {
          data.forEach(status => {
            const key = 'device_status';
            if (!dataGroupMap.value[key]) dataGroupMap.value[key] = [];
            dataGroupMap.value[key].push(status);
            if (dataGroupMap.value[key].length > MAX_POINTS) {
              dataGroupMap.value[key].shift();
            }
          });
        }
        break;

      case 'telemetry':
        // 通信数据是单个对象
        const telemetryKey = data.dataType;
        if (!dataGroupMap.value[telemetryKey]) dataGroupMap.value[telemetryKey] = [];
        dataGroupMap.value[telemetryKey].push(data);
        if (dataGroupMap.value[telemetryKey].length > MAX_POINTS) {
          dataGroupMap.value[telemetryKey].shift();
        }
        break;
    }

    console.log(`[realtime] 处理${type}数据 时间:`, new Date(message.timestamp).toLocaleTimeString());
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


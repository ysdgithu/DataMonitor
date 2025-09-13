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

const MAX_POINTS = 20

// 所有可能的设备数据类型
type AllDeviceData = CoreMetricData | EnvironmentData | DeviceTelemetryData | DeviceStatusData | FactoryDevice

// 按类型分组的数据结构
type DataGroupMap = Record<string, AllDeviceData[]>

export const useRealtimeStore = defineStore('realtime', () => {
  // 监控开关
  const isMonitoring = ref(false)
  // 按类型分组的数据
  const dataGroupMap = ref<DataGroupMap>({})

  // 获取WebSocket URL并添加调试信息
  const getWebSocketUrl = () => {
    const envUrl = import.meta.env.VITE_WS_URL
    if (envUrl) {
      return envUrl
    }

    // 根据当前协议自动选择WebSocket协议
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const defaultUrl = `${protocol}//8.134.137.185:8080`

    console.log('[Realtime Store] 自动选择协议:', protocol)
    return defaultUrl
  }

  const wsUrl = getWebSocketUrl()
  console.log('[Realtime Store] WebSocket URL:', wsUrl)
  console.log('[Realtime Store] 当前页面协议:', window.location.protocol)
  console.log('[Realtime Store] 环境变量:', import.meta.env)

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

  // 处理并分组数据
  function handleRealtimeMessage(message: WebSocketMessage) {
    if (!isMonitoring.value) return

    const { type, data } = message;
    console.log('收到WebSocket消息:', type, data);  // 添加调试日志

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
        //推送store
        const environmentDataStore = useEnvironmentDataStore();
        environmentDataStore.pushEnvironmentData(data);
        break;

      case 'factory_devices':
        // 设备状态数据是数组
        if (Array.isArray(data)) {
          data.forEach(device => {
            const key = 'factory_devices';
            if (!dataGroupMap.value[key]) dataGroupMap.value[key] = [];
            dataGroupMap.value[key].push(device);
            if (dataGroupMap.value[key].length > MAX_POINTS) {
              dataGroupMap.value[key].shift();
            }
            const factoryDeviceDataStore=useFactoryDeviceDataStore()
            factoryDeviceDataStore.pushFactoryDeviceData(device);
            //console.log('factory_devices'+JSON.stringify(dataGroupMap.value[key]));
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
        const deviceStatusStore = useDeviceTelemetryDataStore();
        deviceStatusStore.pushDeviceTelemetryData(data);
        console.log('1111'+JSON.stringify(data));
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






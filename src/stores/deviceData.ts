import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 设备数据接口 (后端推送的格式)
export interface DeviceDataPayload {
  deviceId: string
  deviceType: string
  timestamp: number
  payload: Record<string, {
    value: number
    unit: string
  }>
}

// 前端展示用的设备数据格式
export interface DeviceDisplayData {
  id: string
  device_name: string
  device_type: string
  status: number  // 0-离线 1-在线 2-故障
  monitor_data: Record<string, {
    value: number
    unit: string
    status: 'normal' | 'alarm'
  }>
  timestamp: number
  lastUpdateTime: number
}

// 设备阈值配置 (用于前端实时判断告警)
const DEVICE_THRESHOLDS: Record<string, Record<string, { min?: number, max?: number }>> = {
  '调配罐': {
    temp: { min: 63, max: 67 },
    level: { min: 90, max: 150 },
    current: { min: 10, max: 20 },
    ph: { min: 6.5, max: 7.5 }
  },
  '灌装机': {
    fill_volume: { min: 495, max: 505 },
    pressure: { min: 0.7, max: 1.0 },
    speed: { min: 48, max: 65 },
    temp: { min: 20, max: 28 }
  }
}

// 设备离线超时时间 (毫秒)
const OFFLINE_TIMEOUT = 10000 // 10秒没有数据认为离线

export const useDeviceDataStore = defineStore('deviceData', () => {
  // 设备数据 Map (key: deviceId, value: DeviceDisplayData)
  const deviceDataMap = ref<Map<string, DeviceDisplayData>>(new Map())
  
  // 温度历史数据 (用于趋势图)
  const temperatureHistory = ref<Map<string, Array<{ timestamp: number, value: number }>>>(new Map())
  
  // 最大历史数据条数
  const MAX_HISTORY_SIZE = 20

  /**
   * 判断参数是否告警
   */
  function isParamAlarm(deviceType: string, paramKey: string, value: number): boolean {
    const threshold = DEVICE_THRESHOLDS[deviceType]?.[paramKey]
    if (!threshold) return false
    
    if (threshold.min !== undefined && value < threshold.min) return true
    if (threshold.max !== undefined && value > threshold.max) return true
    
    return false
  }

  /**
   * 批量更新设备数据
   */
  function batchUpdateDeviceData(dataList: DeviceDataPayload[]) {
    const now = Date.now()
    
    dataList.forEach(data => {
      const { deviceId, deviceType, timestamp, payload } = data
      
      // 转换为前端展示格式
      const monitor_data: Record<string, any> = {}
      let hasAlarm = false
      
      Object.entries(payload).forEach(([key, item]) => {
        if (key === 'line') return // 跳过产线字段
        
        const isAlarm = isParamAlarm(deviceType, key, item.value)
        monitor_data[key] = {
          value: item.value,
          unit: item.unit,
          status: isAlarm ? 'alarm' : 'normal'
        }
        
        if (isAlarm) hasAlarm = true
      })
      
      // 设备状态: 有告警 → 2(故障), 正常 → 1(在线)
      const status = hasAlarm ? 2 : 1
      
      const displayData: DeviceDisplayData = {
        id: deviceId,
        device_name: getDeviceName(deviceId, deviceType),
        device_type: deviceType,
        status,
        monitor_data,
        timestamp,
        lastUpdateTime: now
      }
      
      deviceDataMap.value.set(deviceId, displayData)
      
      // 更新温度历史数据
      updateTemperatureHistory(deviceId, timestamp, payload.temp?.value)
    })
  }

  /**
   * 更新温度历史数据
   */
  function updateTemperatureHistory(deviceId: string, timestamp: number, tempValue?: number) {
    if (tempValue === undefined) return
    
    if (!temperatureHistory.value.has(deviceId)) {
      temperatureHistory.value.set(deviceId, [])
    }
    
    const history = temperatureHistory.value.get(deviceId)!
    history.push({ timestamp, value: tempValue })
    
    // 保持最新的 N 条数据
    if (history.length > MAX_HISTORY_SIZE) {
      history.shift()
    }
  }

  /**
   * 获取设备名称
   */
  function getDeviceName(deviceId: string, deviceType: string): string {
    const nameMap: Record<string, string> = {
      '1001': '调配罐',
      '1002': '洗瓶机',
      '1003': '灌装机',
      '1004': '封盖机',
      '1005': '贴标机'
    }
    return nameMap[deviceId] || `${deviceType}-${deviceId}`
  }

  /**
   * 检查设备是否离线
   */
  function checkDeviceOffline() {
    const now = Date.now()
    deviceDataMap.value.forEach((device, deviceId) => {
      if (now - device.lastUpdateTime > OFFLINE_TIMEOUT) {
        device.status = 0 // 离线
      }
    })
  }

  // 定时检查设备离线状态
  setInterval(checkDeviceOffline, 5000)

  // 计算属性: 设备列表
  const deviceList = computed(() => {
    return Array.from(deviceDataMap.value.values())
  })

  return {
    deviceDataMap,
    deviceList,
    temperatureHistory,
    batchUpdateDeviceData
  }
})


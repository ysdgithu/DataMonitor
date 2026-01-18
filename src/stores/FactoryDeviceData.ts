//该文件用于工厂地图和设备状态
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FactoryDevice } from '../utils/type'

export const useFactoryDeviceDataStore = defineStore('factoryDevice', () => {
  // 使用Map存储所有设备数据，key为deviceId，value为设备数据
  const deviceMap = ref<Map<string, FactoryDevice>>(new Map())

  // 推送新数据
  function pushFactoryDeviceData(data: FactoryDevice) {
    // 使用deviceId作为key，确保每个设备只保留最新状态
    deviceMap.value.set(data.deviceId, data)
    //console.log('设备更新', allDevices)
  }

  // 【优化】批量推送数据
  function batchPushFactoryDeviceData(dataList: FactoryDevice[]) {
    // 批量更新设备状态，减少响应式触发次数
    dataList.forEach(device => {
      deviceMap.value.set(device.deviceId, device)
    })
  }

  // 获取所有设备列表
  const allDevices = computed(() => Array.from(deviceMap.value.values()))

  // 按区域分组的设备
  const devicesByZone = computed(() => {
    const grouped = new Map<string, FactoryDevice[]>()
    deviceMap.value.forEach(device => {
      if (!grouped.has(device.zone)) {
        grouped.set(device.zone, [])
      }
      grouped.get(device.zone)?.push(device)
    })
    return grouped
  })

  // 获取特定状态的设备
  const getDevicesByStatus = computed(() => (status: 'online' | 'offline' | 'warning' | 'error') => {
    return Array.from(deviceMap.value.values()).filter(device => device.status === status)
  })

  // 获取特定区域的设备
  // eg：获取生产区设备
  //const productionDevices = store.getDevicesByZone.value('production')
  const getDevicesByZone = computed(() => (zone: string) => {
    return Array.from(deviceMap.value.values()).filter(device => device.zone === zone)
  })

  // 获取设备统计信息
  const statistics = computed(() => {
    const stats = {
      total: deviceMap.value.size,
      online: 0,
      offline: 0,
      warning: 0,
      error: 0,
      zoneCount: new Map<string, number>()
    }

    deviceMap.value.forEach(device => {
      // 统计状态
      stats[device.status]++
      // 统计区域
      const zoneCount = stats.zoneCount.get(device.zone) || 0
      stats.zoneCount.set(device.zone, zoneCount + 1)
    })

    return stats
  })

  // 清空所有数据
  function clearAll() {
    deviceMap.value.clear()
  }

  // 删除特定设备
  function removeDevice(deviceId: string) {
    deviceMap.value.delete(deviceId)
  }

  // 获取特定设备
  function getDevice(deviceId: string) {
    return deviceMap.value.get(deviceId)
  }

  return {
    allDevices,
    devicesByZone,
    statistics,
    getDevicesByStatus,
    getDevicesByZone,
    pushFactoryDeviceData,
    batchPushFactoryDeviceData, // 【新增】批量推送接口
    clearAll,
    removeDevice,
    getDevice
  }
})

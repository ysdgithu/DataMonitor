import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 告警事件接口 (与后端保持一致)
export interface AlarmEvent {
  id?: number
  ruleId: number
  ruleName: string
  deviceId: string
  deviceType: string
  parameterName: string
  currentValue: number
  threshold: string
  triggerTime: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  status?: 'pending' | 'processing' | 'resolved'
}

// 前端展示用的告警记录
export interface AlarmRecord {
  id: number
  content: string
  time: string
  deviceId: string
  deviceName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  isRead: boolean
  alarmEvent: AlarmEvent
}

// 设备名称映射
const DEVICE_NAME_MAP: Record<string, string> = {
  '1001': '调配罐',
  '1002': '洗瓶机',
  '1003': '灌装机',
  '1004': '封盖机',
  '1005': '贴标机'
}

// 参数名称映射
const PARAM_NAME_MAP: Record<string, string> = {
  temp: '温度',
  level: '液位',
  current: '电流',
  ph: 'pH值',
  fill_volume: '灌装量',
  pressure: '压力',
  speed: '速度'
}

export const useAlarmStore = defineStore('alarm', () => {
  // 告警记录列表 (最新的在前)
  const alarmRecords = ref<AlarmRecord[]>([])

  // 最大缓存数量
  const MAX_RECORDS = 100

  // 自增 ID
  let nextId = 1

  // 告警去重配置
  const DEDUP_INTERVAL = 60000 // 60秒内相同告警只记录一次
  const lastAlarmTime = new Map<string, number>() // key: deviceId-parameterName, value: timestamp

  /**
   * 添加告警事件
   */
  function addAlarmEvent(event: AlarmEvent) {
    // 告警去重检查
    const dedupKey = `${event.deviceId}-${event.parameterName}`
    const now = Date.now()
    const lastTime = lastAlarmTime.get(dedupKey)

    if (lastTime && (now - lastTime) < DEDUP_INTERVAL) {
      console.log(`[AlarmStore] 告警去重: ${dedupKey}, 距上次 ${Math.round((now - lastTime) / 1000)}秒`)
      return false // 返回 false 表示告警被去重
    }

    // 更新最后告警时间
    lastAlarmTime.set(dedupKey, now)

    const deviceName = DEVICE_NAME_MAP[event.deviceId] || event.deviceType
    const paramName = PARAM_NAME_MAP[event.parameterName] || event.parameterName

    // 构建告警内容
    const content = `${deviceName} ${paramName}异常: ${event.currentValue} (阈值: ${event.threshold})`

    // 格式化时间
    const time = new Date(event.triggerTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const record: AlarmRecord = {
      id: nextId++,
      content,
      time,
      deviceId: event.deviceId,
      deviceName,
      severity: event.severity,
      isRead: false,
      alarmEvent: event
    }

    // 添加到列表头部 (最新的在前)
    alarmRecords.value.unshift(record)

    // 限制最大数量
    if (alarmRecords.value.length > MAX_RECORDS) {
      alarmRecords.value = alarmRecords.value.slice(0, MAX_RECORDS)
    }

    console.log('[AlarmStore] 新增告警:', record)
    return true // 返回 true 表示告警已添加
  }

  /**
   * 标记告警为已读
   */
  function markAsRead(alarmId: number) {
    const record = alarmRecords.value.find(r => r.id === alarmId)
    if (record) {
      record.isRead = true
    }
  }

  /**
   * 清空所有告警
   */
  function clearAll() {
    alarmRecords.value = []
  }

  /**
   * 获取未读告警数量
   */
  const unreadCount = computed(() => {
    return alarmRecords.value.filter(r => !r.isRead).length
  })

  /**
   * 获取今日告警数量
   */
  const todayCount = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    return alarmRecords.value.filter(r => {
      const recordTime = new Date(r.alarmEvent.triggerTime).getTime()
      return recordTime >= todayTimestamp
    }).length
  })

  /**
   * 获取最近 N 条告警
   */
  function getRecentAlarms(count: number = 10): AlarmRecord[] {
    return alarmRecords.value.slice(0, count)
  }

  /**
   * 按严重程度统计
   */
  const severityStats = computed(() => {
    const stats = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    alarmRecords.value.forEach(r => {
      stats[r.severity]++
    })

    return stats
  })

  return {
    alarmRecords,
    unreadCount,
    todayCount,
    severityStats,
    addAlarmEvent,
    markAsRead,
    clearAll,
    getRecentAlarms
  }
})


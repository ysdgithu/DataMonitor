<template>
  <el-main class="dashboard-main-new">
    <!-- WebSocket 连接状态指示器 -->
    <div class="connection-indicator" :class="connectionStatusClass">
      <span class="indicator-dot"></span>
      <span class="indicator-text">{{ connectionStatusText }}</span>
      <span v-if="realtimeStore.retryCount > 0" class="retry-count">(重连: {{ realtimeStore.retryCount }})</span>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="dashboard-stat-header">
      <div class="stat-card">
        <div class="value" :class="getStatusClass(productionLineStatus)">{{ productionLineStatusText }}</div>
        <div class="label">生产线整体状态</div>
      </div>
      <div class="stat-card">
        <div class="value">{{ deviceOnlineRate }}</div>
        <div class="label">设备在线率</div>
      </div>
      <div class="stat-card">
        <div class="value status-alarm">{{ totalAnomalyCount }}</div>
        <div class="label">当日异常总数</div>
      </div>
      <div class="stat-card">
        <div class="value status-normal">{{ normalDeviceCount }}</div>
        <div class="label">正常运行设备数</div>
      </div>
    </div>

    <!-- 中间设备卡片 -->
    <div class="device-cards">
      <div v-for="device in deviceList" :key="device.id" class="device-card"
        :class="{ 'device-offline': device.status === 'stop' }" @click="handleDeviceClick(device)">
        <div class="name">
          {{ device.name }}
          <span v-if="device.status === 'stop'" class="offline-badge">离线</span>
        </div>
        <div class="status" :class="getStatusClass(device.status)">
          运行状态：{{ device.statusText }}
        </div>
        <div v-for="(metric, idx) in device.metrics" :key="idx" class="metric">
          <span>{{ metric.label }}</span>
          <span class="metric-value" :class="{ error: metric.isError }">
            {{ metric.value }}
          </span>
        </div>
      </div>
    </div>

    <!-- 设备温度趋势图 -->
    <div class="trend-chart-section">
      <div class="chart-header">
        <div class="title">温度趋势图</div>
        <div class="chart-date">{{ trendDate }}</div>
      </div>
      <div class="chart-container">
        <BaseChart :options="trendChartOptions" />
      </div>
    </div>

    <!-- 告警详情弹窗 -->
    <div v-if="alarmPopupVisible" class="alarm-popup">
      <div class="popup-title">新告警提醒</div>
      <div class="popup-content">{{ currentAlarm?.content }}</div>
      <div class="popup-btns">
        <button class="popup-btn popup-btn-close" @click="closeAlarmPopup">关闭</button>
        <button class="popup-btn popup-btn-primary" @click="gotoAlarmDetail">查看详情</button>
      </div>
    </div>

    <!-- 底部告警流水 -->
    <div class="alarm-stream">
      <div class="title">实时告警流水</div>
      <div class="alarm-list">
        <div v-for="(alarm, idx) in alarmList" :key="idx" class="alarm-item">
          <span>{{ alarm.content }}</span>
          <span class="time">{{ alarm.time }}</span>
          <span class="link" @click.stop="handleAlarmClick(alarm)">查看详情</span>
        </div>
      </div>
    </div>
  </el-main>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { ElNotification } from 'element-plus'
import type { EChartsOption } from 'echarts'
import { useDeviceDataStore } from '../../stores/deviceData'
import { useRealtimeStore } from '../../stores/realtime'
import { useAlarmStore } from '../../stores/alarm'
import { audioNotification } from '../../utils/audioNotification'
import BaseChart from '../charts/BaseChart.vue'

interface Metric {
  label: string
  value: string | number
  isError?: boolean
}

interface Device {
  id: string
  name: string
  status: 'normal' | 'alarm' | 'stop'
  statusText: string
  metrics: Metric[]
}

interface Alarm {
  content: string
  time: string
  deviceId: string
}

// 初始化 Store
const deviceDataStore = useDeviceDataStore()
const realtimeStore = useRealtimeStore()
const alarmStore = useAlarmStore()

// 参数标签映射
const paramLabelMap: Record<string, string> = {
  temp: '温度',
  level: '液位',
  current: '搅拌电机电流',
  ph: 'pH值',
  fill_volume: '灌装量',
  pressure: '压力',
  speed: '速度'
}

// 从 Store 获取设备列表并转换格式
const deviceList = computed<Device[]>(() => {
  return deviceDataStore.deviceList.map(device => {
    // 转换状态文本
    let statusText = '正常'
    let statusType: 'normal' | 'alarm' | 'stop' = 'normal'

    if (device.status === 0) {
      statusText = '离线'
      statusType = 'stop'
    } else if (device.status === 2) {
      statusText = '告警'
      statusType = 'alarm'
    }

    // 转换监控数据为 metrics 格式
    const metrics: Metric[] = []
    Object.entries(device.monitor_data).forEach(([key, item]) => {
      const label = paramLabelMap[key] || key
      const unit = item.unit
      const displayLabel = unit ? `${label}(${unit})` : label

      metrics.push({
        label: displayLabel,
        value: typeof item.value === 'number' ? item.value.toFixed(2) : item.value,
        isError: item.status === 'alarm'
      })
    })

    return {
      id: device.id,
      name: device.device_name,
      status: statusType,
      statusText,
      metrics
    }
  })
})

// 从告警 Store 获取最近 10 条告警
const alarmList = computed<Alarm[]>(() => {
  return alarmStore.getRecentAlarms(10).map(record => ({
    content: record.content,
    time: record.time,
    deviceId: record.deviceId
  }))
})

// 设备颜色映射
const deviceColors: Record<string, string> = {
  '1001': '#5470c6',
  '1002': '#ee6666',
  '1003': '#91cc75',
  '1004': '#fac858',
  '1005': '#73c0de'
}

const trendDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

// 温度趋势图配置 (从 Store 获取实时数据)
const trendChartOptions = computed<EChartsOption>(() => {
  const tempHistory = deviceDataStore.temperatureHistory

  // 构建时间轴
  const timeLabels: string[] = []
  const seriesData: Record<string, number[]> = {}

  // 遍历所有设备的温度历史
  tempHistory.forEach((history, deviceId) => {
    if (history.length === 0) return

    // 初始化设备的数据数组
    seriesData[deviceId] = []

    // 提取数据
    history.forEach(point => {
      const time = new Date(point.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      // 收集时间标签(去重)
      if (!timeLabels.includes(time)) {
        timeLabels.push(time)
      }

      seriesData[deviceId].push(point.value)
    })
  })

  // 如果没有数据,显示空图表
  if (timeLabels.length === 0) {
    timeLabels.push('00:00:00')
  }

  // 构建图表系列
  const series = Object.entries(seriesData).map(([deviceId, data]) => {
    const device = deviceList.value.find(d => d.id === deviceId)
    return {
      name: device ? device.name : deviceId,
      type: 'line' as const,
      data: data,
      smooth: true,
      itemStyle: { color: deviceColors[deviceId] || '#999' },
      showSymbol: false, // 不显示数据点
      lineStyle: { width: 2 }
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: series.map(s => s.name),
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: timeLabels
    },
    yAxis: {
      type: 'value' as const,
      name: '温度(℃)',
      axisLine: { show: true, lineStyle: { color: '#333' } }
    },
    series
  }
})

// WebSocket 连接状态
const connectionStatusClass = computed(() => {
  if (realtimeStore.isConnected) {
    return 'status-connected'
  } else if (realtimeStore.retryCount > 0) {
    return 'status-reconnecting'
  } else {
    return 'status-disconnected'
  }
})

const connectionStatusText = computed(() => {
  if (realtimeStore.isConnected) {
    return '已连接'
  } else if (realtimeStore.retryCount > 0) {
    return '重连中'
  } else {
    return '未连接'
  }
})

// 计算顶部统计数据
const productionLineStatus = computed(() => {
  // 有任何设备告警,则生产线状态为告警
  const hasAlarm = deviceList.value.some(d => d.status === 'alarm')
  return hasAlarm ? 'alarm' : 'normal'
})

const productionLineStatusText = computed(() => {
  return productionLineStatus.value === 'alarm' ? '告警' : '正常'
})

const deviceOnlineRate = computed(() => {
  const totalDevices = deviceList.value.length
  if (totalDevices === 0) return '0%'

  const onlineDevices = deviceList.value.filter(d => d.status !== 'stop').length
  const rate = (onlineDevices / totalDevices * 100).toFixed(1)
  return `${rate}%`
})

const totalAnomalyCount = computed(() => {
  return alarmStore.todayCount
})

const normalDeviceCount = computed(() => {
  return deviceList.value.filter(d => d.status === 'normal').length
})

const getStatusClass = (status: string) => {
  switch (status) {
    case 'normal':
      return 'status-normal'
    case 'alarm':
      return 'status-alarm'
    case 'stop':
      return 'status-stop'
    default:
      return ''
  }
}

const handleDeviceClick = (device: Device) => {
  ElNotification.info({
    title: '设备点击',
    message: `点击了 ${device.name}`,
    duration: 2000
  })
}

const alarmPopupVisible = ref(false)
const currentAlarm = ref<Alarm | null>(null)

const handleAlarmClick = (alarm: Alarm) => {
  currentAlarm.value = alarm
  alarmPopupVisible.value = true
}

const closeAlarmPopup = () => {
  alarmPopupVisible.value = false
  currentAlarm.value = null
}

const gotoAlarmDetail = () => {
  alarmPopupVisible.value = false
  ElNotification.info({
    title: '告警详情',
    message: `查看 ${currentAlarm.value?.deviceId} 的告警详情`,
    duration: 2000
  })
}

// 通知限制配置
const MAX_NOTIFICATIONS = 3 // 最多同时显示3条通知
let activeNotifications = 0

// 监听告警记录变化,自动弹窗
watch(() => alarmStore.alarmRecords.length, (newLen, oldLen) => {
  // 有新告警时
  if (newLen > oldLen) {
    const latestAlarm = alarmStore.alarmRecords[0]

    // 播放告警提示音
    audioNotification.playAlarmSound()

    // 限制通知数量
    if (activeNotifications < MAX_NOTIFICATIONS) {
      activeNotifications++

      // ElNotification 弹窗
      ElNotification({
        title: '🚨 新告警提醒',
        message: latestAlarm.content,
        type: 'error',
        duration: 5000,
        onClose: () => {
          activeNotifications--
        },
        onClick: () => {
          // 点击通知时显示详情弹窗
          currentAlarm.value = {
            content: latestAlarm.content,
            time: latestAlarm.time,
            deviceId: latestAlarm.deviceId
          }
          alarmPopupVisible.value = true
        }
      })
    } else {
      console.log('[Dashboard] 通知数量已达上限,跳过弹窗')
    }

    // 同时显示自定义弹窗
    currentAlarm.value = {
      content: latestAlarm.content,
      time: latestAlarm.time,
      deviceId: latestAlarm.deviceId
    }
    alarmPopupVisible.value = true

    // 3秒后自动关闭弹窗
    setTimeout(() => {
      alarmPopupVisible.value = false
    }, 3000)
  }
})

// 生命周期: 组件挂载时启动 WebSocket
onMounted(() => {
  console.log('[DashboardMain] 组件挂载,启动 WebSocket 监控')
  realtimeStore.setMonitoring(true)
})

// 生命周期: 组件卸载时停止 WebSocket
onUnmounted(() => {
  console.log('[DashboardMain] 组件卸载,停止 WebSocket 监控')
  realtimeStore.setMonitoring(false)
})
</script>

<style scoped>
.dashboard-main-new {
  padding: 16px;
  background-color: #f0f2f5;
  min-height: 100vh;
  position: relative;
}

/* WebSocket 连接状态指示器 */
.connection-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  z-index: 1000;
  transition: all 0.3s;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-connected .indicator-dot {
  background-color: #52c41a;
}

.status-connected .indicator-text {
  color: #52c41a;
}

.status-disconnected .indicator-dot {
  background-color: #ff4d4f;
  animation: none;
}

.status-disconnected .indicator-text {
  color: #ff4d4f;
}

.status-reconnecting .indicator-dot {
  background-color: #faad14;
}

.status-reconnecting .indicator-text {
  color: #faad14;
}

.retry-count {
  font-size: 12px;
  color: #999;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* 顶部统计卡片 */
.dashboard-stat-header {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.stat-card .value {
  font-size: 24px;
  font-weight: bold;
  margin: 8px 0;
}

.stat-card .label {
  font-size: 14px;
  color: #666;
}

.status-normal {
  color: #52c41a;
}

.status-alarm {
  color: #faad14;
}

.status-stop {
  color: #f5222d;
}

/* 设备卡片 */
.device-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.device-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s;
}

.device-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #1890ff;
}

/* 离线设备样式 */
.device-offline {
  opacity: 0.6;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border-color: #d9d9d9;
}

.device-offline:hover {
  opacity: 0.8;
  border-color: #ff4d4f;
}

.device-card .name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.offline-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #ff4d4f;
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
  animation: blink 1.5s infinite;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.device-card .status {
  font-size: 14px;
  margin-bottom: 12px;
}

.device-card .metric {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.metric-value.error {
  color: #f5222d;
  font-weight: bold;
}

/* 趋势图 */
.trend-chart-section {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.trend-chart-section .title {
  font-size: 16px;
  font-weight: bold;
}

.chart-date {
  font-size: 13px;
  color: #666;
  background-color: #f5f5f5;
  padding: 4px 10px;
  border-radius: 4px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

/* 告警流水 */
.alarm-stream {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.alarm-stream .title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
}

.alarm-list {
  max-height: 200px;
  overflow-y: auto;
}

.alarm-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  gap: 12px;
}

.alarm-item .time {
  color: #999;
  white-space: nowrap;
}

.alarm-item .link {
  color: #1890ff;
  cursor: pointer;
  white-space: nowrap;
}

.alarm-item .link:hover {
  text-decoration: underline;
}

/* 告警弹窗 */
.alarm-popup {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  background: #fff;
  border-left: 4px solid #f5222d;
  border-radius: 4px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.alarm-popup .popup-title {
  font-weight: bold;
  color: #f5222d;
  margin-bottom: 8px;
}

.alarm-popup .popup-content {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.alarm-popup .popup-btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.popup-btn {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 2px;
  border: none;
  cursor: pointer;
}

.popup-btn-primary {
  background: #1890ff;
  color: #fff;
}

.popup-btn-close {
  background: #f5f5f5;
  color: #666;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .dashboard-stat-header {
    grid-template-columns: repeat(2, 1fr);
  }

  .device-cards {
    grid-template-columns: 1fr;
  }

  .alarm-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>

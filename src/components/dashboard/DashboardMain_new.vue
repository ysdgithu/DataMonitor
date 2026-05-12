<template>
  <div class="dashboard-main-new">
    <div class="dashboard-shell">
      <header class="hero-panel">
        <div class="hero-copy">
          <div class="eyebrow">实时监控中心</div>
          <h1>DataMonitor</h1>
          <p>
            让设备状态、趋势波动、告警事件在同一屏幕上按优先级展开，先看到风险，再看到细节。
          </p>
        </div>

        <div class="hero-status">
          <div class="connection-indicator" :class="connectionStatusClass">
            <span class="indicator-dot"></span>
            <span class="indicator-text">{{ connectionStatusText }}</span>
            <span v-if="realtimeStore.retryCount > 0" class="retry-count">重连 {{ realtimeStore.retryCount }}</span>
          </div>

          <div class="hero-metrics">
            <div class="metric-pill metric-pill-primary">
              <span class="metric-label">生产线状态</span>
              <span class="metric-value" :class="getStatusClass(productionLineStatus)">{{ productionLineStatusText }}</span>
            </div>
            <div class="metric-pill metric-pill-small">
              <span class="metric-label">在线率</span>
              <span class="metric-value">{{ deviceOnlineRate }}</span>
            </div>
            <div class="metric-pill metric-pill-small">
              <span class="metric-label">今日异常</span>
              <span class="metric-value status-alarm">{{ totalAnomalyCount }}</span>
            </div>
            <div class="metric-pill metric-pill-small">
              <span class="metric-label">正常设备</span>
              <span class="metric-value status-normal">{{ normalDeviceCount }}</span>
            </div>
          </div>
        </div>
      </header>

      <section class="section-block">
        <div class="section-header">
          <div>
            <div class="section-kicker">设备总览</div>
            <h2>设备运行态势</h2>
          </div>
          <div class="section-note">点击设备查看状态提示</div>
        </div>

        <div class="device-cards">
          <div
            v-for="device in deviceList"
            :key="device.id"
            class="device-card"
            :class="{ 'device-offline': device.status === 'stop' }"
            @click="handleDeviceClick(device)"
          >
            <div class="device-card__top">
              <div class="name">{{ device.name }}</div>
              <span v-if="device.status === 'stop'" class="offline-badge">离线</span>
            </div>
            <div class="status" :class="getStatusClass(device.status)">运行状态：{{ device.statusText }}</div>
            <div class="metric-list">
              <div v-for="(metric, idx) in device.metrics" :key="idx" class="metric">
                <span>{{ metric.label }}</span>
                <span class="metric-value" :class="{ error: metric.isError }">{{ metric.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-grid">
        <div class="trend-chart-section panel-surface">
          <div class="section-header compact">
            <div>
              <div class="section-kicker">趋势分析</div>
              <h2>温度趋势图</h2>
            </div>
            <div class="chart-date">{{ trendDate }}</div>
          </div>
          <div class="chart-container">
            <BaseChart :options="trendChartOptions" />
          </div>
        </div>

        <div class="alarm-stream panel-surface">
          <div class="section-header compact">
            <div>
              <div class="section-kicker">告警流</div>
              <h2>实时告警流水</h2>
            </div>
          </div>
          <div v-if="hasAlarmList" class="alarm-list">
            <div v-for="(alarm, idx) in alarmList" :key="idx" class="alarm-item">
              <div class="alarm-main">
                <span class="alarm-dot"></span>
                <span class="alarm-text">{{ alarm.content }}</span>
              </div>
              <span class="time">{{ alarm.time }}</span>
              <span class="link" @click.stop="handleAlarmClick(alarm)">查看详情</span>
            </div>
          </div>
          <div v-else class="alarm-empty">
            <div class="alarm-empty__icon">✓</div>
            <div class="alarm-empty__title">当前没有新的告警</div>
            <div class="alarm-empty__text">系统会在产生异常时自动推送到这里。</div>
          </div>
        </div>
      </section>
    </div>

    <!-- <div v-if="alarmPopupVisible" class="alarm-popup">
      <div class="popup-title">新告警提醒</div>
      <div class="popup-content">
        <div class="popup-summary">{{ currentAlarm?.content }}</div>
      </div>
      <div class="popup-btns">
        <button class="popup-btn popup-btn-close" @click="closeAlarmPopup">关闭</button>
        <button class="popup-btn popup-btn-primary" @click="gotoAlarmDetail">查看详情</button>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { ElNotification } from 'element-plus'
import type { EChartsOption } from 'echarts'
import { useDeviceDataStore } from '../../stores/deviceData'
import { useRealtimeStore } from '../../stores/realtime'
import { useAlarmStore, type AlarmEvent } from '../../stores/alarm'
import { audioNotification } from '../../utils/audioNotification'
import { deviceApi, type DeviceItem } from '../../utils/deviceApi'
const BaseChart = defineAsyncComponent(() => import('../charts/BaseChart.vue'))

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
  alarmEvent: AlarmEvent
}

const deviceDataStore = useDeviceDataStore()
const realtimeStore = useRealtimeStore()
const alarmStore = useAlarmStore()

const paramLabelMap: Record<string, string> = {
  temp: '温度',
  level: '液位',
  current: '搅拌电机电流',
  ph: 'pH值',
  fill_volume: '灌装量',
  pressure: '压力',
  speed: '速度'
}

const DYNAMIC_DEVICE_IDS = new Set(['1001', '1003'])
const managedDevices = ref<DeviceItem[]>([])

function getPlaceholderMetrics(deviceType: string): Metric[] {
  if (deviceType === '调配罐') {
    return [
      { label: '温度(℃)', value: '65.00' },
      { label: '液位(L)', value: '120.00' },
      { label: '搅拌电机电流(A)', value: '16.00' },
      { label: 'pH值', value: '7.00' }
    ]
  }

  return [
    { label: '灌装量(ml)', value: '500.00' },
    { label: '压力(MPa)', value: '0.90' },
    { label: '速度(瓶/分)', value: '56.00' },
    { label: '温度(℃)', value: '24.00' }
  ]
}

function toMetrics(monitorData: Record<string, { value: number; unit: string; status: 'normal' | 'alarm' }>): Metric[] {
  return Object.entries(monitorData).map(([key, item]) => {
    const label = paramLabelMap[key] || key
    const displayLabel = item.unit ? `${label}(${item.unit})` : label
    return {
      label: displayLabel,
      value: typeof item.value === 'number' ? item.value.toFixed(2) : item.value,
      isError: item.status === 'alarm'
    }
  })
}

const deviceList = computed<Device[]>(() => {
  const realtimeMap = new Map(deviceDataStore.deviceList.map(d => [d.id, d]))

  return managedDevices.value.map(device => {
    const deviceId = device.device_code
    const realtimeDevice = realtimeMap.get(deviceId)
    const isDynamic = DYNAMIC_DEVICE_IDS.has(deviceId)

    if (isDynamic && realtimeDevice) {
      const statusType: 'normal' | 'stop' = realtimeStore.isConnected ? 'normal' : 'stop'
      return {
        id: deviceId,
        name: `${device.device_name}（${deviceId}）`,
        status: statusType,
        statusText: realtimeStore.isConnected ? '在线' : '离线',
        metrics: toMetrics(realtimeDevice.monitor_data)
      }
    }

    return {
      id: deviceId,
      name: `${device.device_name}（${deviceId}）`,
      status: 'stop',
      statusText: '离线',
      metrics: getPlaceholderMetrics(device.device_type)
    }
  })
})

const alarmList = computed<Alarm[]>(() => {
  return alarmStore.getRecentAlarms(10).map(record => ({
    content: record.content,
    time: record.time,
    deviceId: record.deviceId,
    alarmEvent: record.alarmEvent
  }))
})

const hasAlarmList = computed(() => alarmList.value.length > 0)

const deviceColors: Record<string, string> = {
  '1001': '#4f7cff',
  '1002': '#ff6b6b',
  '1003': '#67d39d',
  '1004': '#f5b84b',
  '1005': '#73c0de'
}

const trendDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

const trendChartOptions = computed<EChartsOption>(() => {
  const tempHistory = deviceDataStore.temperatureHistory
  const timeLabels: string[] = []
  const seriesData: Record<string, number[]> = {}

  tempHistory.forEach((history, deviceId) => {
    if (history.length === 0) return
    seriesData[deviceId] = []

    history.forEach(point => {
      const time = new Date(point.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      if (!timeLabels.includes(time)) {
        timeLabels.push(time)
      }

      seriesData[deviceId].push(point.value)
    })
  })

  if (timeLabels.length === 0) {
    timeLabels.push('00:00:00')
  }

  const series = Object.entries(seriesData).map(([deviceId, data]) => {
    const device = deviceList.value.find(d => d.id === deviceId)
    return {
      name: device ? device.name : deviceId,
      type: 'line' as const,
      data,
      smooth: true,
      itemStyle: { color: deviceColors[deviceId] || '#7c8aa5' },
      showSymbol: false,
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
      top: 8,
      textStyle: {
        color: '#74839a'
      }
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
      data: timeLabels,
      axisLine: { lineStyle: { color: '#d6dde8' } },
      axisLabel: { color: '#6c7a90' }
    },
    yAxis: {
      type: 'value' as const,
      name: '温度(℃)',
      axisLine: { show: true, lineStyle: { color: '#d6dde8' } },
      splitLine: { lineStyle: { color: '#eef2f7' } },
      axisLabel: { color: '#6c7a90' }
    },
    series
  }
})

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

const productionLineStatus = computed(() => {
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
  return `${(onlineDevices / totalDevices * 100).toFixed(1)}%`
})

const totalAnomalyCount = computed(() => alarmStore.todayCount)

const normalDeviceCount = computed(() => deviceList.value.filter(d => d.status === 'normal').length)

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

const MAX_NOTIFICATIONS = 3
let activeNotifications = 0

watch(() => alarmStore.alarmRecords.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    const latestAlarm = alarmStore.alarmRecords[0]

    try {
      audioNotification.playAlarmSound()
    } catch (e) {
      console.error('[Dashboard] 播放提示音失败:', e)
    }

    if (activeNotifications < MAX_NOTIFICATIONS) {
      activeNotifications++
      ElNotification({
        title: '新告警提醒',
        message: latestAlarm.content,
        type: 'error',
        duration: 5000,
        onClose: () => {
          activeNotifications--
        },
        onClick: () => {
          currentAlarm.value = {
            content: latestAlarm.content,
            time: latestAlarm.time,
            deviceId: latestAlarm.deviceId,
            alarmEvent: latestAlarm.alarmEvent
          }
          alarmPopupVisible.value = true
        }
      })
    }

    currentAlarm.value = {
      content: latestAlarm.content,
      time: latestAlarm.time,
      deviceId: latestAlarm.deviceId,
      alarmEvent: latestAlarm.alarmEvent
    }
    alarmPopupVisible.value = true

    setTimeout(() => {
      alarmPopupVisible.value = false
    }, 3000)
  }
})

const loadManagedDevices = async () => {
  try {
    const res = await deviceApi.getList()
    if (res.success) {
      managedDevices.value = res.data || []
    } else {
      managedDevices.value = []
    }
  } catch (error) {
    console.error('[Dashboard] 加载设备列表失败:', error)
    managedDevices.value = []
  }
}

onMounted(async () => {
  realtimeStore.setMonitoring(true)
  await loadManagedDevices()
})

onUnmounted(() => {
  realtimeStore.setMonitoring(false)
})
</script>

<style scoped>
.dashboard-main-new {
  min-height: 100%;
  padding: 0;
  background: transparent;
  position: relative;
  z-index: 1;
}

.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-panel,
.panel-surface,
.device-card {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(128, 144, 168, 0.16);
  box-shadow: 0 18px 50px rgba(31, 45, 61, 0.08);
  backdrop-filter: blur(10px);
}

.dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-panel {
  border-radius: 24px;
  padding: 20px 22px;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  align-items: center;
}

.hero-copy .eyebrow,
.section-kicker {
  color: #5d6b82;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 8px 0 10px;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.12;
  color: #162033;
}

.hero-copy p {
  max-width: 60ch;
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #536177;
}

.hero-status {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: stretch;
}

.connection-indicator {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  align-self: flex-end;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(247, 249, 252, 0.9);
  color: #334155;
  font-size: 13px;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-connected .indicator-dot,
.status-normal { color: #2ea65a; }
.status-connected .indicator-dot { background-color: #2ea65a; }
.status-connected .indicator-text { color: #2ea65a; }
.status-disconnected .indicator-dot { background-color: #e24b4b; animation: none; }
.status-disconnected .indicator-text { color: #e24b4b; }
.status-reconnecting .indicator-dot { background-color: #e7a22d; }
.status-reconnecting .indicator-text { color: #e7a22d; }
.retry-count { font-size: 12px; color: #8a97ac; }

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-pill {
  border-radius: 16px;
  padding: 14px 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,249,253,0.92));
  border: 1px solid rgba(131, 146, 170, 0.14);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-pill-small .metric-value {
  font-size: 18px;
}

.metric-pill {
  min-height: 84px;
}

.metric-pill-primary {
  grid-column: auto;
}

.metric-label {
  font-size: 13px;
  color: #6f7d92;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: #182235;
}

.section-block,
.section-grid {
  display: grid;
  gap: 18px;
}

.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.section-header h2 {
  margin: 6px 0 0;
  font-size: 20px;
  color: #172033;
}

.section-note,
.chart-date {
  color: #74839a;
  font-size: 13px;
}

.device-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.device-card {
  border-radius: 20px;
  padding: 18px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.device-card:hover {
  transform: translateY(-2px);
  border-color: rgba(79, 124, 255, 0.32);
  box-shadow: 0 20px 40px rgba(31, 45, 61, 0.12);
}

.device-offline {
  opacity: 0.72;
  background: linear-gradient(180deg, rgba(255,255,255,0.68), rgba(236,240,245,0.86));
}

.device-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.device-card .name {
  font-size: 16px;
  font-weight: 700;
  color: #162033;
}

.offline-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(226, 75, 75, 0.12);
  color: #e24b4b;
  font-size: 12px;
}

.device-card .status {
  margin-bottom: 12px;
  font-size: 13px;
  color: #5e6b80;
}

.metric-list {
  display: grid;
  gap: 10px;
}

.device-card .metric {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #4d5a70;
}

.metric-value.error,
.status-alarm {
  color: #e24b4b;
}

.status-stop {
  color: #9a4c4c;
}

.status-normal {
  color: #2ea65a;
}

.section-grid {
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
  align-items: stretch;
}

.trend-chart-section,
.alarm-stream {
  border-radius: 24px;
  padding: 20px;
}

.compact {
  margin-bottom: 14px;
}

.chart-container {
  height: 340px;
  width: 100%;
}

.alarm-list {
  display: grid;
  gap: 10px;
  max-height: 340px;
  overflow: auto;
  padding-right: 4px;
}

.alarm-empty {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(246, 249, 253, 0.9), rgba(240, 244, 250, 0.9));
  border: 1px dashed rgba(131, 146, 170, 0.22);
  color: #6f7d92;
  text-align: center;
  padding: 20px;
}

.alarm-empty__icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(46, 166, 90, 0.12);
  color: #2ea65a;
  font-weight: 700;
}

.alarm-empty__title {
  font-weight: 600;
  color: #263245;
}

.alarm-empty__text {
  font-size: 13px;
  line-height: 1.6;
}

.alarm-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(246, 249, 253, 0.9);
  border: 1px solid rgba(131, 146, 170, 0.12);
}

.alarm-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.alarm-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e24b4b;
  box-shadow: 0 0 0 6px rgba(226, 75, 75, 0.12);
  flex: none;
}

.alarm-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1e2a3d;
}

.alarm-item .time {
  color: #8b98ab;
  font-size: 12px;
  white-space: nowrap;
}

.alarm-item .link {
  color: #4f7cff;
  cursor: pointer;
  white-space: nowrap;
  font-size: 13px;
}

.alarm-item .link:hover {
  text-decoration: underline;
}

.alarm-popup {
  position: fixed;
  top: 20px;
  right: 20px;
  width: min(360px, calc(100vw - 32px));
  border-radius: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(226, 75, 75, 0.18);
  box-shadow: 0 24px 60px rgba(31, 45, 61, 0.16);
  z-index: 9999;
  animation: slideIn 0.28s ease-out;
}

.popup-title {
  font-weight: 700;
  color: #e24b4b;
  margin-bottom: 10px;
}

.popup-content {
  font-size: 14px;
  color: #536177;
  margin-bottom: 12px;
}

.popup-summary {
  font-weight: 500;
  color: #1e2a3d;
  line-height: 1.7;
}

.popup-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.popup-btn {
  border: 0;
  border-radius: 999px;
  padding: 9px 14px;
  cursor: pointer;
}

.popup-btn-close {
  background: #eef2f7;
  color: #415067;
}

.popup-btn-primary {
  background: #4f7cff;
  color: #fff;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}

@keyframes slideIn {
  from {
    transform: translateX(16px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 1100px) {
  .hero-panel,
  .section-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-main-new {
    padding: 14px;
  }

  .hero-panel,
  .trend-chart-section,
  .alarm-stream {
    padding: 16px;
    border-radius: 18px;
  }

  .hero-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .connection-indicator {
    align-self: flex-start;
  }

  .alarm-item {
    grid-template-columns: 1fr;
    align-items: start;
  }
}
</style>

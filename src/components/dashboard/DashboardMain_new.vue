<template>
  <el-main class="dashboard-main-new">
    <!-- 顶部统计卡片 -->
    <div class="dashboard-stat-header">
      <div class="stat-card">
        <div class="value status-alarm">告警</div>
        <div class="label">生产线整体状态</div>
      </div>
      <div class="stat-card">
        <div class="value">98.2%</div>
        <div class="label">设备在线率</div>
      </div>
      <div class="stat-card">
        <div class="value status-alarm">12</div>
        <div class="label">当日异常总数</div>
      </div>
      <div class="stat-card">
        <div class="value status-normal">4</div>
        <div class="label">正常运行设备数</div>
      </div>
    </div>

    <!-- 中间设备卡片 -->
    <div class="device-cards">
      <div v-for="device in deviceList" :key="device.id" class="device-card" @click="handleDeviceClick(device)">
        <div class="name">{{ device.name }}</div>
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
import { computed, ref } from 'vue'
import { ElNotification } from 'element-plus'
import BaseChart from '../charts/BaseChart.vue'
import type { EChartsOption } from 'echarts'

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

// 假数据：设备列表
const deviceList: Device[] = [
  {
    id: '1001',
    name: '调配罐',
    status: 'normal',
    statusText: '正常',
    metrics: [
      { label: '温度(℃)', value: 60.19 },
      { label: '液位(L)', value: 120 },
      { label: '搅拌电机电流(A)', value: 13.49 },
      { label: 'ph值', value: 7.36 },
      { label: '生产线', value: 1 },
    ]
  },
  {
    id: '1002',
    name: '洗瓶机',
    status: 'alarm',
    statusText: '告警',
    metrics: [
      { label: '温度(℃)', value: 100, isError: true },
      { label: '压力(MPa)', value: 0.52 },
      { label: '速度(r/min)', value: 1179 },
      { label: '运行状态', value: 1 }
    ]
  },
  {
    id: '1003',
    name: '灌装机',
    status: 'normal',
    statusText: '正常',
    metrics: [
      { label: '灌装量(ml)', value: 512 },
      { label: '温度(℃)', value: 100, isError: true },
      { label: '压力(MPa)', value: 0.52 },
      { label: '速度(r/min)', value: 1179 },
    ]
  },
  {
    id: '1004',
    name: '封盖机',
    status: 'stop',
    statusText: '停机',
    metrics: [
      { label: '旋盖扭矩(N・m)', value: 0.05, isError: true },
      { label: '压力(MPa)', value: 0.52 },
      { label: '温度(℃)', value: 100, isError: true },
      { label: '缺盖检测个数(个)', value: '1', isError: true }
    ]
  },
  {
    id: '1005',
    name: '贴标机',
    status: 'normal',
    statusText: '正常',
    metrics: [
      { label: '贴标速度(张/分)', value: 80 },
      { label: '温度(℃)', value: 28.5 },
      { label: '标签余量(%)', value: 1.8 }
    ]
  }
]

// 假数据：告警流水
const alarmList: Alarm[] = [
  {
    content: '洗瓶机 温度超过阈值(100℃)',
    time: '2026-02-24 14:25',
    deviceId: '1002'
  },
  {
    content: '封盖机 旋盖扭矩异常(0.05N·m)',
    time: '2026-02-24 14:10',
    deviceId: '1004'
  },
  {
    content: '灌装机 温度超过阈值(100℃)',
    time: '2026-02-24 13:50',
    deviceId: '1003'
  },
  {
    content: '封盖机 缺盖检测个数异常(1个)',
    time: '2026-02-24 13:20',
    deviceId: '1004'
  }
]

// 假数据：5个设备24小时温度趋势
const hours = Array.from({ length: 12 }, (_, i) => `${String(i * 2).padStart(2, '0')}:00`)

const tempData: Record<string, number[]> = {
  '1001': [58.2, 57.5, 58.8, 59.5, 60.1, 61.3, 62.5, 63.8, 62.1, 61.5, 60.8, 60.19],
  '1002': [98.5, 99.2, 100.5, 101.8, 102.3, 101.5, 100.2, 99.8, 100.5, 101.2, 100.8, 100],
  '1003': [97.8, 98.5, 99.2, 100.5, 101.2, 100.8, 99.5, 100.2, 101.5, 100.8, 100.2, 100],
  '1004': [99.2, 100.5, 101.8, 102.5, 101.2, 100.5, 99.8, 100.5, 101.8, 100.5, 100.2, 100],
  '1005': [26.5, 25.8, 26.2, 27.5, 28.2, 29.5, 30.2, 29.8, 28.5, 27.8, 28.2, 28.5]
}

const deviceColors: Record<string, string> = {
  '1001': '#5470c6',
  '1002': '#ee6666',
  '1003': '#91cc75',
  '1004': '#fac858',
  '1005': '#73c0de'
}

const trendDate = '2026-02-24'

const trendChartOptions = computed<EChartsOption>(() => {
  const series = Object.keys(tempData).map(deviceId => {
    const device = deviceList.find(d => d.id === deviceId)
    return {
      name: device ? device.name : deviceId,
      type: 'line' as const,
      data: tempData[deviceId],
      smooth: true,
      itemStyle: { color: deviceColors[deviceId] }
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
      data: hours
    },
    yAxis: {
      type: 'value' as const,
      name: '温度(℃)',
      axisLine: { show: true, lineStyle: { color: '#333' } }
    },
    series
  }
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
</script>

<style scoped>
.dashboard-main-new {
  padding: 16px;
  background-color: #f0f2f5;
  min-height: 100vh;
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

.device-card .name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
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

<template>
  <el-main class="dashboard-main">
    <!-- 控制栏 -->
    <el-card class="control-bar">
      <el-button type="primary" plain @click="showHistoryPanel = true">历史数据查询</el-button>
      <el-select v-model="timeRange" class="time-range">
        <el-option label="最近1小时" value="1h" />
        <el-option label="最近24小时" value="24h" />
        <el-option label="自定义" value="custom" />
      </el-select>
      <el-button-group>
      </el-button-group>
    </el-card>

    <!-- 主要内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧核心指标 -->
      <el-col :span="6">
        <el-card style="margin-bottom: 10px;" class="metrics-panel">
          <template #header>
            <div class="panel-header">核心指标</div>
          </template>
          <el-row :gutter="20" class="metrics-grid">
            <el-col :span="12" v-for="metric in coreMetricStore.boardList" :key="metric.name">
              <div class="metric-item">
                <div class="metric-header">
                  {{ metric.name }}
                </div>
                <div class="metric-value" :class="metric.status">{{ metric.value }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
        <el-card class="chart-card metrics-panel" @click="openHistory('device_type')">
          <template #header>
            <div class="panel-header">设备类型分布</div>
          </template>
          <BaseChart :options="deviceTypeDataChartOptions" style="height: 220px;" />
        </el-card>
      </el-col>

      <!-- 中间地图区域 -->
      <el-col :span="12">
        <el-card class="map-card panel-header">
          <template #header>
            <div class="panel-header">工厂车间地图</div>
          </template>
          <FactoryMap></FactoryMap>
        </el-card>
      </el-col>

      <!-- 右侧图表 -->
      <el-col :span="6">
        <el-card class="chart-card panel-header" style="margin-bottom: 10px;">
          <template #header>实时环境温度</template>
          <BaseChart :options="environmentDataChartOptions" :highFrequency="true" :dataOnly="true"
            style="height: 220px;" />
        </el-card>
        <el-card class="chart-card" @click="openHistory('request_count')">
          <template #header>
            <div class="panel-header">实时通信数据</div>
          </template>
          <BaseChart :options="requestCountChartOptions" :highFrequency="true" :dataOnly="true"
            style="height: 220px;" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加历史数据弹窗 -->
    <HistoryDataDialog v-model="showHistory" :type="currentType" />

    <!-- 历史数据查询面板弹窗 -->
    <el-dialog v-model="showHistoryPanel" title="历史数据查询" width="90%" :before-close="handleCloseHistoryPanel">
      <HistoryDataPanel />
    </el-dialog>
  </el-main>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, shallowRef } from 'vue'
import BaseChart from '../charts/BaseChart.vue'
import HistoryDataPanel from './HistoryDataPanel.vue'
import { createLineChart, createBarChart, createPieChart } from '../../utils/chartOptions'
import { useCoreMetricStore } from '../../stores/CoreMetricData'
import { useEnvironmentDataStore } from '../../stores/EnvironmentData'
import { useDeviceTelemetryDataStore } from '../../stores/DeviceTelemetryData'
import { historyApi, DEVICE_TYPE_NAMES, type DeviceTypeData } from '../../utils/historyApi'
import { useRealtimeStore } from '../../stores/realtime'
import type { EChartsOption } from 'echarts'
import FactoryMap from '../FactoryMap.vue'
const realtimeStore = useRealtimeStore()  // 实时监控
const coreMetricStore = useCoreMetricStore()   // 核心指标
const environmentDataStore = useEnvironmentDataStore()  //环境数据
const telemetryData = useDeviceTelemetryDataStore()  //通信数据
const timeRange = ref('1h')
const showHistoryPanel = ref(false)



// 1. 定义缓存的配置对象和数据指纹
const chartOptionsCache = shallowRef<EChartsOption | null>(null)
const dataFingerprint = ref('')

// 2. 只计算数据和指纹
const recentData = computed(() => {
  const boardList = environmentDataStore.boardList;
  const data = boardList.slice(-10);
  // 生成数据指纹：timestamp+value+status的拼接
  const fingerprint = data.map(item => `${item.timestamp}-${item.value}-${item.status}`).join('|');
  dataFingerprint.value = fingerprint;
  return data;
})

// 3. 缓存配置对象的 computed
const environmentDataChartOptions = computed(() => {
  const data = recentData.value;
  // 如果缓存存在且指纹未变，直接返回缓存
  if (chartOptionsCache.value && dataFingerprint.value === (chartOptionsCache.value as any).__fingerprint) {
    return chartOptionsCache.value;
  }
  // 指纹变化时，重新创建配置对象
  const options = createLineChart({
    series: data.map(item => item.value),
    xAxis: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
    status: data.map(item => item.status)
  }) as EChartsOption;
  // 给配置对象添加指纹标识
  (options as any).__fingerprint = dataFingerprint.value;
  // 更新缓存
  chartOptionsCache.value = options;
  return options;
})


// 请求量统计图表配置缓存优化
const requestChartOptionsCache = shallowRef<EChartsOption | null>(null)
const requestDataFingerprint = ref('')
const recentRequestData = computed(() => {
  const data = telemetryData.boardData.slice(-10)
  // 生成数据指纹：timestamp+value的拼接
  const fingerprint = data.map(item => `${item.timestamp}-${item.value}`).join('|')
  requestDataFingerprint.value = fingerprint
  return data
})
const requestCountChartOptions = computed(() => {
  const data = recentRequestData.value
  if (requestChartOptionsCache.value && requestDataFingerprint.value === (requestChartOptionsCache.value as any).__fingerprint) {
    return requestChartOptionsCache.value
  }
  const options = createBarChart({
    series: data.map(item => item.value),
    xAxis: {
      type: 'category',
      data: data.map(item => new Date(item.timestamp).toLocaleTimeString())
    },
    maxPoints: 10
  }) as EChartsOption
    ; (options as any).__fingerprint = requestDataFingerprint.value
  requestChartOptionsCache.value = options
  return options
})


// 存储设备类型数据
const deviceTypeData = ref<DeviceTypeData[]>([])

// 获取设备类型数据
const fetchDeviceTypeData = async () => {
  const response = await historyApi.getDeviceStatus()
  console.log('设备类型数据响应:', response)
  console.log('设备类型数据:', response.data)
  deviceTypeData.value = response.data
}

// 设备类型分布图表配置
const deviceTypeDataChartOptions = computed(() => {
  const pieData = deviceTypeData.value.map(item => ({
    name: DEVICE_TYPE_NAMES[item.deviceType],
    value: item.count
  }))

  return createPieChart({
    series: pieData
  }) as EChartsOption;
})


onMounted(() => {
  // 启动实时监控
  realtimeStore.setMonitoring(true)
  fetchDeviceTypeData()
})

const showHistory = ref(false)
const currentType = ref('')

const openHistory = (type: string) => {
  currentType.value = type
  showHistory.value = true
}

const handleCloseHistoryPanel = () => {
  showHistoryPanel.value = false
}
</script>

<style scoped>
.dashboard-main {
  padding: var(--spacing-base);
  background-color: var(--bg-secondary);
  min-height: 100vh;
  color: var(--text-main);
}

/* 控制栏样式 */
.control-bar {
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-light);
  border-radius: var(--radius-lg);
}

.control-bar :deep(.el-button--primary) {
  background-color: var(--primary);
  border-color: var(--primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.control-bar :deep(.el-button--primary)::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent);
  transition: 0.5s;
}

.control-bar :deep(.el-button--primary.is-active) {
  background-color: var(--primary-active);
  border-color: var(--primary-active);
  color: var(--text-white);
  box-shadow: 0 0 10px rgba(29, 78, 216, 0.4);
}

.control-bar :deep(.el-button--primary.is-active)::before {
  left: 100%;
}

.control-bar :deep(.el-button--primary.is-plain) {
  color: var(--primary);
  background: var(--primary-light);
  border-color: var(--primary);
}

/* 卡片通用样式 */
:deep(.el-card) {
  background-color: var(--bg-main);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-light);
  border-radius: var(--radius-lg);
}

:deep(.el-card__header) {
  border-bottom: 1px solid var(--border-light);
  padding: var(--spacing-sm) var(--spacing-base);
}


.metric-item:hover {
  border-color: var(--primary);
  box-shadow: 0 0 12px rgba(74, 144, 226, 0.2);
}

.metric-header {
  color: var(--text-tertiary);
  font-size: var(--font-sm);
}

.metric-value {
  color: var(--text-main);
  font-size: var(--font-xl);
  font-weight: 600;
}

/* Tag样式调整 */
:deep(.el-tag--success) {
  background: linear-gradient(45deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.2));
  border: 1px solid rgba(0, 255, 136, 0.5);
  color: #00FF88;
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
}

:deep(.el-tag--danger) {
  background-color: rgba(255, 86, 86, 0.1);
  border-color: var(--alert-danger);
  color: var(--alert-danger);
}

/* 加载状态样式 */
.loading-placeholder {
  color: var(--text-tertiary);
}

/* 图表容器样式 */
.chart-card {
  background-color: var(--bg-main);
}

.chart-card :deep(.el-card__body) {
  padding: var(--spacing-sm);
}

/* 地图卡片特殊样式 */
.map-card {
  background: var(--bg-main);
  border: 1px solid var(--border-light);
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg-hover);
}

::-webkit-scrollbar-thumb {
  background: var(--border-dark);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}


.metric-card {
  height: 150px;
  margin-bottom: var(--spacing-base);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-value {
  font-size: 80%;
  font-weight: bold;
  text-align: center;
  margin-top: var(--spacing-sm);
  text-shadow: 0 0 10px rgba(74, 144, 226, 0.3);
}

.chart-card {
  height: 300px;
  position: relative;
}

.el-card__body {
  padding: 0;
}

.chart-placeholder {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.control-bar {
  height: 50px;
  margin-bottom: var(--spacing-sm);
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.time-range {
  width: 150px;
  margin-right: var(--spacing-sm);
  margin-left: var(--spacing-sm);
}

.metrics-panel {
  height: 300px;
  /* 减小面板高度 */
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.3s;
}

.metrics-panel:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-dark);
}

.metrics-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-base);
}

.metrics-grid {
  padding: 0;
  /* 减小内边距 */
}

.metric-item {
  background-color: var(--bg-main);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs);
  /* 减小内边距 */
  margin-bottom: var(--spacing-sm);
  /* 减小底部间距 */
  transition: all 0.3s;
  height: 95px;
  /* 限制每个卡片的高度 */
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-light);
}

/* .metric-item::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(74, 144, 226, 0.1) 50%,
    transparent 75%
  );
  animation: shine 3s infinite linear;
}
@keyframes shine {
  100% { transform: translate(50%, 50%); }
} */

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-sm);
  /* 稍微减小字体 */
  margin-bottom: var(--spacing-xs);
  /* 减小间距 */
}

.metric-value {
  font-size: var(--font-lg);
  /* 减小数值字体大小 */
  font-weight: bold;
  text-align: center;
  margin-top: var(--spacing-xs);
  /* 减小上边距 */
}

/* 状态颜色 */
.metric-value.normal {
  color: var(--alert-success);
  /* 绿色 */
}

.metric-value.warning {
  color: var(--alert-warning);
  /* 黄色 */
}

.metric-value.error {
  color: var(--alert-danger);
  /* 红色 */
}

.panel-header {
  font-size: var(--font-base);
  font-weight: bold;
  color: var(--text-main);
  letter-spacing: 1px;
  text-transform: uppercase;
  opacity: 0.9;
}

.map-card {
  height: 610px;
}

/* .loading-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
} */
</style>
